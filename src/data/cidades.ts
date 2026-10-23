// Catálogo de cidades conhecidas. Serve para sugestões na busca e para a
// extração simulada da IA reconhecer cidades no texto livre.
export const CIDADES = [
  'Apucarana',
  'Campo Mourão',
  'Cascavel',
  'Cornélio Procópio',
  'Curitiba',
  'Dois Vizinhos',
  'Foz do Iguaçu',
  'Francisco Beltrão',
  'Guarapuava',
  'Londrina',
  'Maringá',
  'Medianeira',
  'Pato Branco',
  'Ponta Grossa',
  'Santa Helena',
  'Toledo',
  'Laranjeiras do Sul',
  'Marechal Cândido Rondon',
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
