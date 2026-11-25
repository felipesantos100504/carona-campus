// Catálogo de cidades conhecidas. Serve para sugestões na busca e para a
// extração simulada da IA reconhecer cidades no texto livre.
export const CIDADES = [
  'Apucarana',
  'Campo Mourão',
  'Capitão Leônidas Marques',
  'Cascavel',
  'Catanduvas',
  'Cornélio Procópio',
  'Curitiba',
  'Dois Vizinhos',
  'Espigão Alto do Iguaçu',
  'Foz do Iguaçu',
  'Francisco Beltrão',
  'Guarapuava',
  'Laranjeiras do Sul',
  'Londrina',
  'Marechal Cândido Rondon',
  'Maringá',
  'Medianeira',
  'Nova Laranjeiras',
  'Palmas',
  'Pato Branco',
  'Ponta Grossa',
  'Quedas do Iguaçu',
  'Realeza',
  'Rio Bonito do Iguaçu',
  'Santa Helena',
  "São Jorge d'Oeste",
  'Toledo',
  'Três Barras do Paraná',
  'União da Vitória',
];

/** Nomes curtos que as pessoas costumam escrever no lugar do nome completo. */
export const APELIDOS: Record<string, string> = {
  'sao jorge': "São Jorge d'Oeste",
  'beltrao': 'Francisco Beltrão',
  'foz': 'Foz do Iguaçu',
  'quedas': 'Quedas do Iguaçu',
};

/**
 * Lugares conhecidos dentro das cidades (RF-20). Servem para sugerir pontos na
 * publicação e na busca, para reconhecer o lugar no texto livre e para
 * descobrir a cidade quando a pessoa só cita o lugar ("do Posto Fênix até a
 * UTFPR"). Outros lugares podem ser digitados livremente.
 */
export const PONTOS_CONHECIDOS: { nome: string; cidade: string; apelidos: string[] }[] = [
  { nome: 'UTFPR', cidade: 'Dois Vizinhos', apelidos: ['utf', 'universidade tecnologica'] },
  { nome: 'Posto Fênix', cidade: 'Dois Vizinhos', apelidos: ['fenix'] },
  { nome: 'Mercado Ítalo', cidade: 'Dois Vizinhos', apelidos: ['italo'] },
  { nome: 'Posto Stop', cidade: 'Dois Vizinhos', apelidos: ['stop'] },
];

/** Minúsculas e sem acentos, para comparar nomes digitados de jeitos diferentes. */
export function normalizar(texto: string) {
  return texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();
}

export function mesmaCidade(a: string, b: string) {
  return normalizar(a) === normalizar(b);
}

export function sugerirCidades(prefixo: string, limite = 5) {
  const p = normalizar(prefixo);
  if (!p) return [];
  return CIDADES.filter((c) => normalizar(c).includes(p)).slice(0, limite);
}

/** O termo aparece como palavra inteira ("utf" não casa com "utfpr"). */
const palavra = (termo: string) => new RegExp(`(^|[^a-z0-9])${termo}([^a-z0-9]|$)`);

/** Lugar do catálogo citado pelo nome ou apelido ("fenix" → Posto Fênix). */
export function pontoConhecido(texto: string) {
  const t = normalizar(texto);
  if (!t) return undefined;
  return PONTOS_CONHECIDOS.find((p) => [normalizar(p.nome), ...p.apelidos].some((termo) => palavra(termo).test(t)));
}

/**
 * "fenix", "posto fênix" e "Posto Fênix do centro" contam como o mesmo lugar.
 * Lugares do catálogo são comparados pelo nome oficial; os outros, por trecho.
 */
export function mesmoPonto(a: string, b: string) {
  const conhecidoA = pontoConhecido(a);
  const conhecidoB = pontoConhecido(b);
  if (conhecidoA && conhecidoB) return conhecidoA.nome === conhecidoB.nome;
  const x = normalizar(a);
  const y = normalizar(b);
  return !!x && !!y && (x.includes(y) || y.includes(x));
}

/** Lugares do catálogo citados num texto, na ordem em que aparecem. */
export function pontosNoTexto(texto: string) {
  const t = normalizar(texto);
  return PONTOS_CONHECIDOS.map((p) => {
    const termos = [normalizar(p.nome), ...p.apelidos];
    const posicoes = termos.map((termo) => t.search(palavra(termo))).filter((i) => i !== -1);
    return { ...p, pos: posicoes.length ? Math.min(...posicoes) : -1 };
  })
    .filter((p) => p.pos !== -1)
    .sort((a, b) => a.pos - b.pos);
}

/** Pontos do catálogo nessas cidades, para sugerir na publicação e na busca. */
export function sugerirPontos(cidades: string[]) {
  return PONTOS_CONHECIDOS.filter((p) => cidades.some((c) => mesmaCidade(c, p.cidade)));
}
