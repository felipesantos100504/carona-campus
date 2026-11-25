import { getAI, getGenerativeModel, GoogleAIBackend } from 'firebase/ai';

import { APELIDOS, CIDADES, mesmoPonto, normalizar, PONTOS_CONHECIDOS, pontoConhecido } from './cidades';
import { extrairViagemLocal, revisarTextoLocal } from './extracao-local';
import { app } from './firebase';
import type { Ponto } from './tipos';

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
  /** Outros lugares por onde o motorista passa, na ordem (RF-20). */
  pontos?: Ponto[];
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
  /** Onde o passageiro quer descer, dentro da cidade de destino (ex.: "UTFPR"). */
  pontoChegada?: string;
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
    pontos: {
      type: 'ARRAY',
      description:
        'Outros lugares dentro das cidades por onde o motorista passa ou onde deixa passageiros (ex.: mercado, posto, universidade), na ordem do trajeto, sem repetir o ponto de embarque',
      items: {
        type: 'OBJECT',
        properties: {
          nome: texto('Nome do lugar, como citado'),
          cidade: texto('CIDADE onde fica o lugar'),
        },
        required: ['nome', 'cidade'],
      },
    },
    observacoes: texto(
      'Outras informações para o passageiro que o texto cita (bagagem, regras do carro, pontualidade), como escritas. Não repita rota, data, horário, vagas nem valor.',
    ),
  },
  required: ['paradas'],
};

const ESQUEMA_BUSCA: Esquema = {
  type: 'OBJECT',
  properties: {
    ...CAMPOS_COMUNS,
    pontoChegada: texto('Local dentro da cidade de destino aonde o passageiro quer chegar, como citado (ex.: "UTFPR")'),
  },
};

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
    '- Lugares dentro de uma cidade (universidade, posto, rodoviária, mercado, bairro, rua) nunca vão em origem/destino. O local de saída vai em "pontoEmbarque".',
    `- Lugares conhecidos e suas cidades: ${PONTOS_CONHECIDOS.map((p) => `${p.nome} (${p.cidade})`).join(', ')}.`,
    '- Se o texto só citar lugares de uma mesma cidade, sem citar cidades (ex.: "do Posto Fênix até a UTFPR"), a viagem é dentro dessa cidade: "origem" e "destino" são essa mesma cidade.',
    '- Horários como "18h", "6 da tarde" ou "por volta das sete da noite" viram "18:00", "18:00" e "19:00".',
    '- Não invente informações: omita os campos que o texto não informa.',
  ];
}

function instrucoesPublicacao(textoLivre: string) {
  return [
    'Você organiza anúncios de carona entre cidades brasileiras ou dentro de uma cidade, escritos pelo motorista.',
    ...cabecalho(),
    '- Os outros lugares por onde o motorista passa ou onde deixa passageiros vão em "pontos", na ordem, cada um com a sua cidade.',
    '- "data" é a próxima saída. Se a viagem se repete ("toda sexta", "todos os dias", "de segunda a sexta"), preencha também "diasSemana".',
    '',
    `Anúncio: """${textoLivre}"""`,
  ].join('\n');
}

function instrucoesBusca(textoLivre: string) {
  return [
    'Você interpreta o pedido de um passageiro que procura carona entre cidades brasileiras ou dentro de uma cidade.',
    ...cabecalho(),
    '- O lugar aonde o passageiro quer chegar (ex.: "UTFPR") vai em "pontoChegada".',
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

/** Lugares do catálogo ficam com o nome oficial ("posto fenix" → "Posto Fênix"). */
function nomeDoPonto(v: unknown) {
  const nome = textoValido(v, 120);
  return nome ? (pontoConhecido(nome)?.nome ?? nome) : undefined;
}

/** Cidade do primeiro lugar do catálogo citado, para quando o texto não cita cidades. */
function cidadeDosPontos(nomes: (string | undefined)[]) {
  for (const nome of nomes) {
    const conhecido = nome ? pontoConhecido(nome) : undefined;
    if (conhecido) return conhecido.cidade;
  }
  return undefined;
}

/**
 * "do Posto Fênix até a UTFPR": a cidade que faltar vem dos lugares do
 * catálogo (a de saída, do primeiro lugar; a de chegada, do último).
 */
function completarCidades<T extends { origem?: string; destino?: string }>(r: T, pontos: (string | undefined)[]): T {
  if (r.origem && r.destino) return r;
  const origem = r.origem ?? cidadeDosPontos(pontos) ?? r.destino;
  const destino = r.destino ?? cidadeDosPontos([...pontos].reverse()) ?? origem;
  return { ...r, origem, destino };
}

function validarComuns(r: Record<string, unknown>) {
  const data = textoValido(r.data);
  const horario = textoValido(r.horario);
  return {
    origem: cidade(textoValido(r.origem)),
    destino: cidade(textoValido(r.destino)),
    pontoEmbarque: nomeDoPonto(r.pontoEmbarque),
    data: data && /^\d{4}-\d{2}-\d{2}$/.test(data) && !isNaN(Date.parse(data)) ? data : undefined,
    horario: horario && /^([01]\d|2[0-3]):[0-5]\d$/.test(horario) ? horario : undefined,
  };
}

/** Pontos da publicação: nome e cidade válidos, sem repetir o embarque, no máximo 10. */
function validarPontos(bruto: unknown, embarque: string | undefined, destino: string | undefined): Ponto[] {
  if (!Array.isArray(bruto)) return [];
  const pontos: Ponto[] = [];
  for (const item of bruto) {
    if (!item || typeof item !== 'object') continue;
    const nome = nomeDoPonto((item as Record<string, unknown>).nome);
    if (!nome || (embarque && mesmoPonto(nome, embarque)) || pontos.some((p) => mesmoPonto(p.nome, nome))) continue;
    const daCidade = cidade(textoValido((item as Record<string, unknown>).cidade)) ?? pontoConhecido(nome)?.cidade ?? destino;
    if (daCidade) pontos.push({ nome, cidade: daCidade });
  }
  return pontos.slice(0, 10);
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
  const comuns = validarComuns(r);
  const pontos = validarPontos(r.pontos, comuns.pontoEmbarque, comuns.destino);
  const resultado = completarCidades(
    {
      ...comuns,
      paradas: Array.isArray(r.paradas) ? r.paradas.map((p) => cidade(textoValido(p))).filter((p): p is string => !!p) : [],
      pontos,
      vagas,
      valorPorVaga: valor,
      diasSemana: dias.length ? dias.sort() : undefined,
      observacoes: textoValido(r.observacoes, 500),
    },
    [comuns.pontoEmbarque, ...pontos.map((p) => p.nome)],
  );
  return resultado.origem || resultado.destino ? resultado : null;
}

function validarBusca(bruto: unknown): Omit<BuscaExtraida, 'fonte'> | null {
  if (!bruto || typeof bruto !== 'object') return null;
  const comuns = validarComuns(bruto as Record<string, unknown>);
  const pontoChegada = nomeDoPonto((bruto as Record<string, unknown>).pontoChegada);
  const resultado = completarCidades({ ...comuns, pontoChegada }, [comuns.pontoEmbarque, pontoChegada]);
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

/** Busca (passageiro): texto livre → origem, destino, data, horário e pontos de saída e de chegada. */
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
    const { origem, destino, pontoEmbarque, data, horario, pontos } = local;
    // Na busca, o último lugar citado é aonde o passageiro quer chegar.
    const pontoChegada = pontos?.length ? pontos[pontos.length - 1].nome : undefined;
    return { origem, destino, pontoEmbarque, pontoChegada, data, horario, fonte: 'regras' };
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
