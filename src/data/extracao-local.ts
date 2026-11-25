import { APELIDOS, CIDADES, normalizar } from './cidades';
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
  const encontradas = CIDADES.map((nome) => ({ nome, pos: t.indexOf(normalizar(nome)) })).filter((c) => c.pos !== -1);
  // Apelidos ("São Jorge", "Beltrão") só valem se o nome completo não apareceu.
  for (const [apelido, nome] of Object.entries(APELIDOS)) {
    const pos = t.search(new RegExp(`\\b${apelido}\\b`));
    if (pos !== -1 && !encontradas.some((c) => c.nome === nome || (pos >= c.pos && pos < c.pos + normalizar(c.nome).length))) {
      encontradas.push({ nome, pos });
    }
  }
  const cidades = encontradas
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
    pontoEmbarque: extrairPontoEmbarque(texto),
    horario: extrairHorario(t),
    vagas: extrairVagas(t),
    valorPorVaga: extrairValor(t),
    ...extrairData(t),
  };

  if (!resultado.origem && !resultado.destino && !resultado.horario) return null;
  return resultado;
}

/**
 * "saindo do posto Fênix", "embarque na rodoviária": local dentro da cidade.
 * Usa o texto original para manter maiúsculas e acentos como a pessoa escreveu.
 */
function extrairPontoEmbarque(original: string) {
  const m = original.match(
    /\b(?:saio|saindo|embarque|embarco|pego|pegar)\s+(?:d[oa]s?|n[oa]s?|em|perto d[oa]|na frente d[oa])\s+([^,.;!?]+)/i,
  );
  if (!m) return undefined;
  const ponto = m[1]
    .split(/\s+(?:em|às|as|para|pra|até|ate|hoje|amanhã|amanha|toda|todo|todos|de manhã|à noite|a noite)\b/i)[0]
    .trim();
  const n = normalizar(ponto);
  // "saio de Pato Branco" é a cidade de origem, não um ponto de embarque.
  if (!ponto || CIDADES.some((c) => n.includes(normalizar(c))) || APELIDOS[n]) return undefined;
  return ponto;
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

  // "todos os dias" e "de segunda a sexta": recorrência com a próxima saída amanhã.
  if (/\btodos os dias\b|\btodo dia\b|\bdiariamente\b/.test(t)) {
    return { data: paraISO(somarDias(hoje, 1)), diasSemana: [0, 1, 2, 3, 4, 5, 6] };
  }
  if (/\b(de )?segunda a sexta\b|\bdias uteis\b/.test(t)) {
    const amanha = somarDias(hoje, 1);
    const ate = (amanha.getDay() + 7 - 1) % 7 < 5 ? 0 : (8 - amanha.getDay()) % 7;
    return { data: paraISO(somarDias(amanha, ate)), diasSemana: [1, 2, 3, 4, 5] };
  }

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

// ---------- revisão de texto público (plano B da revisão com IA) ----------

const PADROES_SENSIVEIS: { padrao: RegExp; aviso: string }[] = [
  {
    padrao: /(?:\+?55\s?)?(?:\(?\d{2}\)?[\s-]?)?9?\s?\d{4}[-.\s]?\d{4}\b/,
    aviso: 'O texto tem um número de telefone, que ficaria visível para todos os usuários. Combine o contato depois que a vaga for confirmada.',
  },
  {
    padrao: /[\w.+-]+@[\w-]+\.[\w.]+/,
    aviso: 'O texto tem um e-mail, que ficaria visível para todos os usuários.',
  },
  {
    padrao: /\b\d{3}\.\d{3}\.\d{3}-\d{2}\b/,
    aviso: 'O texto parece ter um CPF. Não publique documentos pessoais.',
  },
  {
    padrao: /chave\s+(do\s+)?pix/i,
    aviso: 'Evite publicar sua chave Pix: o pagamento é combinado diretamente com quem tiver a vaga confirmada.',
  },
  {
    padrao: /(^|\s)@[\w.]{3,}|https?:\/\/|www\./i,
    aviso: 'O texto tem um perfil de rede social ou um link, que ficaria visível para todos os usuários.',
  },
];

/**
 * Confere por padrões se um texto que vai ficar público (observações da
 * carona, bio do perfil) tem dados de contato ou documentos. Não reconhece
 * linguagem ofensiva: isso fica só com a IA.
 */
export function revisarTextoLocal(texto: string): string[] {
  return PADROES_SENSIVEIS.filter(({ padrao }) => padrao.test(texto)).map(({ aviso }) => aviso);
}
