import { CIDADES, normalizar } from './cidades';

// Extração SIMULADA da IA (etapa 2). Na etapa com regras de negócio esta
// função passa a chamar o Gemini, mantendo a mesma assinatura e o mesmo
// formato de retorno — as telas não precisam mudar.

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
  diasSemana?: number[];
};

export class ErroExtracao extends Error {
  constructor(mensagem = 'Não conseguimos entender a viagem. Preencha os campos manualmente.') {
    super(mensagem);
    this.name = 'ErroExtracao';
  }
}

const DIAS: Record<string, number> = {
  domingo: 0,
  segunda: 1,
  terca: 2,
  quarta: 3,
  quinta: 4,
  sexta: 5,
  sabado: 6,
};

const NUMEROS: Record<string, number> = {
  uma: 1, um: 1, duas: 2, dois: 2, tres: 3, quatro: 4, cinco: 5, seis: 6,
  sete: 7, oito: 8, nove: 9, dez: 10, onze: 11, doze: 12,
};

export async function extrairViagem(texto: string): Promise<ViagemExtraida> {
  await new Promise((r) => setTimeout(r, 1200));
  const t = normalizar(texto);
  if (t.length < 8) throw new ErroExtracao('Descreva a viagem com um pouco mais de detalhes.');

  // Cidades na ordem em que aparecem no texto.
  const cidades = CIDADES.map((nome) => ({ nome, pos: t.indexOf(normalizar(nome)) }))
    .filter((c) => c.pos !== -1)
    .sort((a, b) => a.pos - b.pos)
    .map((c) => c.nome);

  const resultado: ViagemExtraida = {
    origem: cidades[0],
    destino: cidades.length > 1 ? cidades[cidades.length - 1] : undefined,
    paradas: cidades.slice(1, -1),
    horario: extrairHorario(t),
    vagas: extrairVagas(t),
    valorPorVaga: extrairValor(t),
    ...extrairData(t),
  };

  if (!resultado.origem && !resultado.destino && !resultado.horario) {
    throw new ErroExtracao();
  }
  return resultado;
}

function extrairHorario(t: string) {
  const numerico = t.match(/\b(\d{1,2})\s*(?:h|:|horas?)\s*(\d{2})?\b/);
  if (numerico) {
    let hora = Number(numerico[1]);
    const minuto = Number(numerico[2] ?? 0);
    if (hora < 12 && /\b(tarde|noite)\b/.test(t)) hora += 12;
    if (hora <= 23 && minuto <= 59) return formatarHora(hora, minuto);
  }
  const porExtenso = t.match(/\b(?:as|umas|la pelas|pelas|por volta das)\s+(\w+)/);
  const hora = porExtenso && NUMEROS[porExtenso[1]];
  if (hora) return formatarHora(hora < 12 && /\b(tarde|noite)\b/.test(t) ? hora + 12 : hora, 0);
  return undefined;
}

function extrairVagas(t: string) {
  const m = t.match(/\b(\d|uma|um|duas|dois|tres|quatro)\s+(?:vagas?|lugar(?:es)?)\b/);
  if (!m) return undefined;
  return Number(m[1]) || NUMEROS[m[1]];
}

function extrairValor(t: string) {
  const m = t.match(/r\$\s*(\d+(?:[.,]\d{1,2})?)/) ?? t.match(/\b(\d+)\s*reais\b/);
  return m ? Number(m[1].replace(',', '.')) : undefined;
}

function extrairData(t: string): Pick<ViagemExtraida, 'data' | 'diasSemana'> {
  const hoje = new Date();
  if (/\bamanha\b/.test(t)) return { data: paraISO(somarDias(hoje, 1)) };
  if (/\bhoje\b/.test(t)) return { data: paraISO(hoje) };

  const recorrente = /\b(toda|todo|todas|todos)\b/.test(t);
  const dias = Object.entries(DIAS)
    .filter(([nome]) => new RegExp(`\\b${nome}`).test(t))
    .map(([, n]) => n);
  if (dias.length === 0) return {};

  const proximo = somarDias(hoje, ((dias[0] - hoje.getDay() + 7) % 7) || 7);
  return { data: paraISO(proximo), diasSemana: recorrente ? dias : undefined };
}

function somarDias(d: Date, n: number) {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

function paraISO(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function formatarHora(h: number, m: number) {
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}
