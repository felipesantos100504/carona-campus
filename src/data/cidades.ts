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
