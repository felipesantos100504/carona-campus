import { CIDADES, normalizar } from './cidades';
import type { ViagemExtraida } from './ia';

// Extração por regras (sem IA), usada como plano B quando o Gemini falha ou
// responde fora do formato esperado (RF-16). Reconhece só as cidades do
// catálogo e padrões simples ("18h", "3 vagas", "R$ 90", "toda sexta").

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

/** Devolve o que conseguir reconhecer no texto, ou null se não reconhecer nada. */
export function extrairViagemLocal(texto: string): Omit<ViagemExtraida, 'fonte'> | null {
  const t = normalizar(texto);

  // Cidades na ordem em que aparecem no texto, com a palavra que vem antes.
  const cidades = CIDADES.map((nome) => ({ nome, pos: t.indexOf(normalizar(nome)) }))
    .filter((c) => c.pos !== -1)
    .sort((a, b) => a.pos - b.pos)
    .map((c) => ({ nome: c.nome, antes: t.slice(Math.max(0, c.pos - 20), c.pos) }));

  // "passo por X", "passando por X", "via X" marcam paradas;
  // "pra X", "para X", "até X" marcam o destino.
  const ehParada = (antes: string) => /(passo por|passando por|via|parada em)\s*(?:\w+\s+)?$/.test(antes);
  const ehDestino = (antes: string) => /\b(pra|para|ate|destino)\s+(?:a\s+|o\s+)?$/.test(antes);

  const resto = cidades.filter((c) => !ehParada(c.antes));
  const destinoMarcado = resto.find((c) => ehDestino(c.antes))?.nome;
  const origem = resto.find((c) => c.nome !== destinoMarcado)?.nome;
  const destino = destinoMarcado ?? (resto.length > 1 ? resto[resto.length - 1].nome : undefined);
  // Paradas: todas as outras cidades, na ordem em que aparecem no texto.
  const paradas = cidades.map((c) => c.nome).filter((n) => n !== origem && n !== destino);

  const resultado = {
    origem,
    destino,
    paradas,
    horario: extrairHorario(t),
    vagas: extrairVagas(t),
    valorPorVaga: extrairValor(t),
    ...extrairData(t),
  };

  if (!resultado.origem && !resultado.destino && !resultado.horario) return null;
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

function extrairData(t: string): { data?: string; diasSemana?: number[] } {
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
