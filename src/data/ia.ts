import { getAI, getGenerativeModel, GoogleAIBackend } from 'firebase/ai';

import { APELIDOS, CIDADES, normalizar } from './cidades';
import { extrairViagemLocal, revisarTextoLocal } from './extracao-local';
import { app } from './firebase';

// Funcionalidade de IA (PRD, seção 6): o Gemini trabalha com texto livre em
// três pontos do app:
// - publicação: o motorista descreve a viagem e a IA preenche os campos;
// - busca: o passageiro diz para onde quer ir e a IA preenche a busca;
// - revisão: antes de publicar observações ou a bio, a IA aponta dados de
//   contato, documentos e linguagem ofensiva (RF-19).
// Só o texto digitado é enviado ao modelo.
//
// Duas formas de chamar o Gemini (ADR-0007):
// - Com EXPO_PUBLIC_GEMINI_API_KEY no .env: chamada direta à Gemini API com a
//   chave do Google AI Studio (restrita à Gemini API no Google Cloud).
// - Sem a chave: Firebase AI Logic, que guarda a chave no próprio Firebase.
//
// Se a API falhar, demorar ou responder fora do formato esperado, o app usa a
// extração por regras (extracao-local.ts) e, se nem ela reconhecer nada,
// libera todos os campos para preenchimento manual (RF-16).

export type ViagemExtraida = {
  origem?: string;
  destino?: string;
  paradas: string[];
  /** Local de embarque dentro da cidade de origem (ex.: "Posto Fênix"). */
  pontoEmbarque?: string;
  /** AAAA-MM-DD */
  data?: string;
  /** HH:MM */
  horario?: string;
  vagas?: number;
  valorPorVaga?: number;
  /** 0 = domingo ... 6 = sábado. Só vem preenchido em viagens recorrentes. */
  diasSemana?: number[];
  /** Outras informações para o passageiro (bagagem, regras do carro...). */
  observacoes?: string;
  /** De onde vieram os dados: do Gemini ou da extração por regras (plano B). */
  fonte: 'ia' | 'regras';
};

/** Resultado da revisão de um texto que vai ficar público. */
export type RevisaoTexto = {
  /** Avisos para a pessoa, em frases curtas. Vazio quando está tudo certo. */
  problemas: string[];
  fonte: 'ia' | 'regras';
};

/** O que o passageiro pediu na busca em texto livre. */
export type BuscaExtraida = {
  origem?: string;
  destino?: string;
  /** Onde o passageiro quer embarcar, dentro da cidade (ex.: "Posto Fênix"). */
  pontoEmbarque?: string;
  /** AAAA-MM-DD */
  data?: string;
  /** HH:MM */
  horario?: string;
  fonte: 'ia' | 'regras';
};

export class ErroExtracao extends Error {
  constructor(mensagem = 'Não conseguimos entender a viagem. Preencha os campos manualmente.') {
    super(mensagem);
    this.name = 'ErroExtracao';
  }
}

const MODELO = process.env.EXPO_PUBLIC_GEMINI_MODEL || 'gemini-3.5-flash-lite';
const CHAVE_GEMINI = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
const TEMPO_LIMITE_MS = 15000;
// A revisão acontece ao tocar em Publicar/Salvar: espera menos e, se a IA
// não responder, segue com a conferência por regras.
const TEMPO_LIMITE_REVISAO_MS = 8000;
const DIAS = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];

// ---------- formatos de resposta (structured output) ----------
// O modelo só pode devolver um JSON com estes campos.

type Esquema = { type: string; description?: string; properties?: Record<string, Esquema>; items?: Esquema; required?: string[] };

const texto = (description: string): Esquema => ({ type: 'STRING', description });

const CAMPOS_COMUNS: Record<string, Esquema> = {
  origem: texto('CIDADE de partida (nunca um bairro, rua ou estabelecimento)'),
  destino: texto('CIDADE de chegada (nunca um bairro, rua ou estabelecimento)'),
  pontoEmbarque: texto('Local de embarque dentro da cidade de origem, como citado (ex.: "Posto Fênix", "rodoviária")'),
  data: texto('Data da (primeira) saída no formato AAAA-MM-DD'),
  horario: texto('Horário de saída no formato HH:MM (24h)'),
};

const ESQUEMA_PUBLICACAO: Esquema = {
  type: 'OBJECT',
  properties: {
    ...CAMPOS_COMUNS,
    paradas: { type: 'ARRAY', items: { type: 'STRING' }, description: 'Cidades intermediárias citadas, na ordem do trajeto' },
    vagas: { type: 'INTEGER', description: 'Quantidade de vagas oferecidas' },
    valorPorVaga: { type: 'NUMBER', description: 'Valor em reais por vaga' },
    diasSemana: {
      type: 'ARRAY',
      items: { type: 'INTEGER' },
      description: 'Dias da semana em que a viagem se repete (0=domingo...6=sábado). Vazio se não for recorrente.',
    },
    observacoes: texto(
      'Outras informações para o passageiro que o texto cita (bagagem, regras do carro, pontualidade), como escritas. Não repita rota, data, horário, vagas nem valor.',
    ),
  },
  required: ['paradas'],
};

const ESQUEMA_BUSCA: Esquema = { type: 'OBJECT', properties: CAMPOS_COMUNS };

const ESQUEMA_REVISAO: Esquema = {
  type: 'OBJECT',
  properties: {
    problemas: {
      type: 'ARRAY',
      items: { type: 'STRING' },
      description: 'Um aviso curto para cada problema encontrado. Lista vazia se o texto estiver adequado.',
    },
  },
  required: ['problemas'],
};

/** O SDK do Firebase AI Logic usa os mesmos esquemas, com os tipos em minúsculas. */
function paraAiLogic(e: Esquema): Esquema {
  return {
    ...e,
    type: e.type.toLowerCase(),
    items: e.items && paraAiLogic(e.items),
    properties: e.properties && Object.fromEntries(Object.entries(e.properties).map(([k, v]) => [k, paraAiLogic(v)])),
  };
}

// ---------- instruções ----------

function cabecalho() {
  const hoje = new Date();
  const dataHoje = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}-${String(hoje.getDate()).padStart(2, '0')}`;
  return [
    `Hoje é ${DIAS[hoje.getDay()]}, ${dataHoje}. Converta "hoje", "amanhã" e dias da semana em datas a partir de hoje.`,
    'Regras:',
    '- "origem", "destino" e "paradas" são sempre CIDADES, escritas por extenso, com acentos e iniciais maiúsculas (ex.: "Francisco Beltrão").',
    '- Lugares dentro de uma cidade (universidade, posto, rodoviária, mercado, bairro) nunca vão em origem/destino. Se for o local de saída, vai em "pontoEmbarque"; senão, ignore.',
    '- Horários como "18h", "6 da tarde" ou "por volta das sete da noite" viram "18:00", "18:00" e "19:00".',
    '- Não invente informações: omita os campos que o texto não informa.',
  ];
}

function instrucoesPublicacao(textoLivre: string) {
  return [
    'Você organiza anúncios de carona entre cidades brasileiras, escritos pelo motorista.',
    ...cabecalho(),
    '- "data" é a próxima saída. Se a viagem se repete ("toda sexta", "todos os dias", "de segunda a sexta"), preencha também "diasSemana".',
    '',
    `Anúncio: """${textoLivre}"""`,
  ].join('\n');
}

function instrucoesBusca(textoLivre: string) {
  return [
    'Você interpreta o pedido de um passageiro que procura carona entre cidades brasileiras.',
    ...cabecalho(),
    '- "data" é o dia em que o passageiro quer viajar; "horario" é o horário aproximado de saída que ele pediu.',
    '',
    `Pedido: """${textoLivre}"""`,
  ].join('\n');
}

function instrucoesRevisao(textoLivre: string) {
  return [
    'Você revisa textos que ficarão visíveis para todos os usuários de um app de caronas entre cidades (observações de uma carona ou a apresentação do perfil).',
    'Aponte somente estes problemas:',
    '- dados de contato: telefone, e-mail, perfil de rede social ou link;',
    '- dados pessoais sensíveis: CPF, RG, chave Pix, endereço residencial completo;',
    '- linguagem ofensiva, discriminatória ou preconceituosa.',
    'Informações normais de viagem (bagagem, horário, regras do carro, ponto de encontro em lugar público) estão adequadas.',
    'Escreva cada aviso em português, em uma frase curta dirigida à pessoa, dizendo o que mudar. Se o texto estiver adequado, devolva a lista vazia.',
    '',
    `Texto: """${textoLivre}"""`,
  ].join('\n');
}

// ---------- validação ----------

/** Usa a grafia do catálogo quando a cidade é conhecida ("São Jorge" → "São Jorge d'Oeste"). */
function cidade(nome?: string) {
  if (!nome) return undefined;
  const n = normalizar(nome);
  return CIDADES.find((c) => normalizar(c) === n) ?? APELIDOS[n] ?? nome;
}

const textoValido = (v: unknown, maximo = 80) =>
  typeof v === 'string' && v.trim() && v.trim().length <= maximo ? v.trim() : undefined;

function validarComuns(r: Record<string, unknown>) {
  const data = textoValido(r.data);
  const horario = textoValido(r.horario);
  return {
    origem: cidade(textoValido(r.origem)),
    destino: cidade(textoValido(r.destino)),
    pontoEmbarque: textoValido(r.pontoEmbarque, 120),
    data: data && /^\d{4}-\d{2}-\d{2}$/.test(data) && !isNaN(Date.parse(data)) ? data : undefined,
    horario: horario && /^([01]\d|2[0-3]):[0-5]\d$/.test(horario) ? horario : undefined,
  };
}

/** Confere cada campo da resposta; o que vier fora do formato é descartado. */
function validarPublicacao(bruto: unknown): Omit<ViagemExtraida, 'fonte'> | null {
  if (!bruto || typeof bruto !== 'object') return null;
  const r = bruto as Record<string, unknown>;
  const vagas = typeof r.vagas === 'number' && Number.isInteger(r.vagas) && r.vagas >= 1 && r.vagas <= 8 ? r.vagas : undefined;
  const valor = typeof r.valorPorVaga === 'number' && r.valorPorVaga >= 0 && r.valorPorVaga < 10000 ? r.valorPorVaga : undefined;
  const dias = Array.isArray(r.diasSemana)
    ? [...new Set(r.diasSemana.filter((d): d is number => Number.isInteger(d) && d >= 0 && d <= 6))]
    : [];
  const resultado = {
    ...validarComuns(r),
    paradas: Array.isArray(r.paradas) ? r.paradas.map((p) => cidade(textoValido(p))).filter((p): p is string => !!p) : [],
    vagas,
    valorPorVaga: valor,
    diasSemana: dias.length ? dias.sort() : undefined,
    observacoes: textoValido(r.observacoes, 500),
  };
  return resultado.origem || resultado.destino ? resultado : null;
}

function validarBusca(bruto: unknown): Omit<BuscaExtraida, 'fonte'> | null {
  if (!bruto || typeof bruto !== 'object') return null;
  const resultado = validarComuns(bruto as Record<string, unknown>);
  return Object.values(resultado).some(Boolean) ? resultado : null;
}

/** No máximo 3 avisos, cada um com até 200 caracteres. */
function validarRevisao(bruto: unknown): string[] | null {
  if (!bruto || typeof bruto !== 'object') return null;
  const problemas = (bruto as Record<string, unknown>).problemas;
  if (!Array.isArray(problemas)) return null;
  return problemas
    .map((p) => textoValido(p, 200))
    .filter((p): p is string => !!p)
    .slice(0, 3);
}

// ---------- chamada ao Gemini ----------

const ai = getAI(app, { backend: new GoogleAIBackend() });

async function perguntarAoGemini(prompt: string, esquema: Esquema, tempoLimite = TEMPO_LIMITE_MS): Promise<unknown> {
  let temporizador: ReturnType<typeof setTimeout> | undefined;
  const limite = new Promise<never>((_, rejeitar) => {
    temporizador = setTimeout(() => rejeitar(new Error('A IA demorou demais para responder.')), tempoLimite);
  });
  try {
    const chamada = CHAVE_GEMINI ? viaGeminiApi(prompt, esquema, CHAVE_GEMINI) : viaAiLogic(prompt, esquema);
    return JSON.parse(await Promise.race([chamada, limite]));
  } finally {
    clearTimeout(temporizador);
  }
}

async function viaAiLogic(prompt: string, esquema: Esquema) {
  const modelo = getGenerativeModel(ai, {
    model: MODELO,
    generationConfig: {
      responseMimeType: 'application/json',
      // O formato é o mesmo do SDK; o tipo do SDK não aceita o objeto literal.
      responseSchema: paraAiLogic(esquema) as never,
      temperature: 0,
    },
  });
  const resposta = await modelo.generateContent(prompt);
  return resposta.response.text();
}

/** Chamada direta à Gemini API (REST), com a mesma saída estruturada. */
async function viaGeminiApi(prompt: string, esquema: Esquema, chave: string) {
  const resposta = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODELO}:generateContent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': chave },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: 'application/json', responseSchema: esquema, temperature: 0 },
    }),
  });
  if (!resposta.ok) throw new Error(`Gemini API respondeu ${resposta.status}`);
  const corpo = await resposta.json();
  const parte = corpo?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (typeof parte !== 'string') throw new Error('Resposta da Gemini API sem texto.');
  return parte;
}

// ---------- funções usadas pelas telas ----------

/** Publicação (motorista): texto livre → campos da viagem. */
export async function extrairViagem(textoLivre: string): Promise<ViagemExtraida> {
  if (textoLivre.trim().length < 8) throw new ErroExtracao('Descreva a viagem com um pouco mais de detalhes.');

  try {
    const viagem = validarPublicacao(await perguntarAoGemini(instrucoesPublicacao(textoLivre), ESQUEMA_PUBLICACAO));
    if (viagem) return { ...viagem, fonte: 'ia' };
  } catch (e) {
    // Falha de rede, cota, chave ou JSON inválido: segue para o plano B.
    console.warn('[IA] Gemini indisponível, usando extração por regras:', e);
  }

  const local = extrairViagemLocal(textoLivre);
  if (local) return { ...local, fonte: 'regras' };
  throw new ErroExtracao();
}

/** Busca (passageiro): texto livre → origem, destino, data, horário e ponto de embarque. */
export async function interpretarBusca(textoLivre: string): Promise<BuscaExtraida> {
  if (textoLivre.trim().length < 5) throw new ErroExtracao('Diga para onde você quer ir.');

  try {
    const busca = validarBusca(await perguntarAoGemini(instrucoesBusca(textoLivre), ESQUEMA_BUSCA));
    if (busca) return { ...busca, fonte: 'ia' };
  } catch (e) {
    console.warn('[IA] Gemini indisponível, usando extração por regras:', e);
  }

  const local = extrairViagemLocal(textoLivre);
  if (local) {
    const { origem, destino, pontoEmbarque, data, horario } = local;
    return { origem, destino, pontoEmbarque, data, horario, fonte: 'regras' };
  }
  throw new ErroExtracao('Não entendemos o pedido. Preencha as cidades nos campos da busca.');
}

/**
 * Revisão (motorista e perfil): confere um texto que vai ficar público antes
 * de gravar. Nunca lança erro: se a IA falhar, usa a conferência por regras,
 * que pega telefone, e-mail, CPF, chave Pix e links (RF-19).
 */
export async function revisarTexto(textoLivre: string): Promise<RevisaoTexto> {
  if (!textoLivre.trim()) return { problemas: [], fonte: 'regras' };

  try {
    const problemas = validarRevisao(
      await perguntarAoGemini(instrucoesRevisao(textoLivre), ESQUEMA_REVISAO, TEMPO_LIMITE_REVISAO_MS),
    );
    if (problemas) return { problemas, fonte: 'ia' };
  } catch (e) {
    console.warn('[IA] Gemini indisponível, revisando o texto por regras:', e);
  }

  return { problemas: revisarTextoLocal(textoLivre), fonte: 'regras' };
}
