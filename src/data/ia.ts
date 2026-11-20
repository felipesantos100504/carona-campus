import { getAI, getGenerativeModel, GoogleAIBackend, Schema } from 'firebase/ai';

import { extrairViagemLocal } from './extracao-local';
import { app } from './firebase';

// Funcionalidade de IA (PRD, seção 6): o Gemini, via Firebase AI Logic,
// transforma o texto livre do motorista nos campos da viagem. A chave da API
// fica no Firebase, não no app. Só o texto digitado é enviado ao modelo.
//
// Se a API falhar, demorar ou responder fora do formato esperado, o app usa a
// extração por regras (extracao-local.ts) e, se nem ela reconhecer nada,
// libera todos os campos para preenchimento manual (RF-16).

export type ViagemExtraida = {
  origem?: string;
  destino?: string;
  paradas: string[];
  /** AAAA-MM-DD */
  data?: string;
  /** HH:MM */
  horario?: string;
  vagas?: number;
  valorPorVaga?: number;
  /** 0 = domingo ... 6 = sábado. Só vem preenchido em viagens recorrentes. */
  diasSemana?: number[];
  /** De onde vieram os dados: do Gemini ou da extração por regras (plano B). */
  fonte: 'ia' | 'regras';
};

export class ErroExtracao extends Error {
  constructor(mensagem = 'Não conseguimos entender a viagem. Preencha os campos manualmente.') {
    super(mensagem);
    this.name = 'ErroExtracao';
  }
}

const MODELO = process.env.EXPO_PUBLIC_GEMINI_MODEL || 'gemini-3.5-flash-lite';
const TEMPO_LIMITE_MS = 15000;
const DIAS = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];

// Formato obrigatório da resposta (structured output): o modelo só pode
// devolver um JSON com estes campos.
const esquema = Schema.object({
  properties: {
    origem: Schema.string({ description: 'Cidade de partida' }),
    destino: Schema.string({ description: 'Cidade final da viagem' }),
    paradas: Schema.array({
      items: Schema.string(),
      description: 'Cidades intermediárias citadas, na ordem do trajeto',
    }),
    data: Schema.string({ description: 'Data da (primeira) saída no formato AAAA-MM-DD' }),
    horario: Schema.string({ description: 'Horário de saída no formato HH:MM (24h)' }),
    vagas: Schema.integer({ description: 'Quantidade de vagas oferecidas' }),
    valorPorVaga: Schema.number({ description: 'Valor em reais por vaga' }),
    diasSemana: Schema.array({
      items: Schema.integer(),
      description: 'Dias da semana em que a viagem se repete (0=domingo...6=sábado). Vazio se não for recorrente.',
    }),
  },
  optionalProperties: ['origem', 'destino', 'data', 'horario', 'vagas', 'valorPorVaga', 'diasSemana'],
});

const modelo = getGenerativeModel(getAI(app, { backend: new GoogleAIBackend() }), {
  model: MODELO,
  generationConfig: { responseMimeType: 'application/json', responseSchema: esquema, temperature: 0 },
});

function instrucoes(texto: string) {
  const hoje = new Date();
  const dataHoje = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}-${String(hoje.getDate()).padStart(2, '0')}`;
  return [
    'Você organiza anúncios de carona entre cidades brasileiras.',
    `Hoje é ${DIAS[hoje.getDay()]}, ${dataHoje}. Converta "hoje", "amanhã" e dias da semana em datas a partir de hoje.`,
    'Regras:',
    '- Escreva os nomes das cidades por extenso, com acentos e iniciais maiúsculas (ex.: "Francisco Beltrão").',
    '- "data" é a próxima saída. Se a viagem se repete ("toda sexta", "de segunda a sexta"), preencha também "diasSemana".',
    '- Horários como "18h", "6 da tarde" ou "por volta das sete da noite" viram "18:00", "18:00" e "19:00".',
    '- Não invente informações: omita os campos que o texto não informa.',
    '',
    `Anúncio: """${texto}"""`,
  ].join('\n');
}

/** Confere cada campo da resposta; o que vier fora do formato é descartado. */
function validar(bruto: unknown): Omit<ViagemExtraida, 'fonte'> | null {
  if (!bruto || typeof bruto !== 'object') return null;
  const r = bruto as Record<string, unknown>;
  const texto = (v: unknown) => (typeof v === 'string' && v.trim() ? v.trim() : undefined);
  const data = texto(r.data);
  const horario = texto(r.horario);
  const vagas = typeof r.vagas === 'number' && Number.isInteger(r.vagas) && r.vagas >= 1 && r.vagas <= 8 ? r.vagas : undefined;
  const valor = typeof r.valorPorVaga === 'number' && r.valorPorVaga >= 0 && r.valorPorVaga < 10000 ? r.valorPorVaga : undefined;
  const dias = Array.isArray(r.diasSemana)
    ? [...new Set(r.diasSemana.filter((d): d is number => Number.isInteger(d) && d >= 0 && d <= 6))]
    : [];
  const resultado = {
    origem: texto(r.origem),
    destino: texto(r.destino),
    paradas: Array.isArray(r.paradas) ? r.paradas.map(texto).filter((p): p is string => !!p) : [],
    data: data && /^\d{4}-\d{2}-\d{2}$/.test(data) && !isNaN(Date.parse(data)) ? data : undefined,
    horario: horario && /^([01]\d|2[0-3]):[0-5]\d$/.test(horario) ? horario : undefined,
    vagas,
    valorPorVaga: valor,
    diasSemana: dias.length ? dias.sort() : undefined,
  };
  return resultado.origem || resultado.destino ? resultado : null;
}

async function perguntarAoGemini(texto: string) {
  let temporizador: ReturnType<typeof setTimeout> | undefined;
  const limite = new Promise<never>((_, rejeitar) => {
    temporizador = setTimeout(() => rejeitar(new Error('A IA demorou demais para responder.')), TEMPO_LIMITE_MS);
  });
  try {
    const resposta = await Promise.race([modelo.generateContent(instrucoes(texto)), limite]);
    return validar(JSON.parse(resposta.response.text()));
  } finally {
    clearTimeout(temporizador);
  }
}

export async function extrairViagem(texto: string): Promise<ViagemExtraida> {
  if (texto.trim().length < 8) throw new ErroExtracao('Descreva a viagem com um pouco mais de detalhes.');

  try {
    const viagem = await perguntarAoGemini(texto);
    if (viagem) return { ...viagem, fonte: 'ia' };
  } catch (e) {
    // Falha de rede, cota, chave ou JSON inválido: segue para o plano B.
    console.warn('[IA] Gemini indisponível, usando extração por regras:', e);
  }

  const local = extrairViagemLocal(texto);
  if (local) return { ...local, fonte: 'regras' };
  throw new ErroExtracao();
}
