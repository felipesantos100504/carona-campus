import { mesmaCidade, mesmoPonto } from './cidades';
import type { Carona, FiltroBusca } from './tipos';

// Roteiro de uma carona: as cidades do trajeto e, dentro de cada uma, os
// lugares por onde o motorista passa (RF-20). É a mesma estrutura para a busca
// e para as telas, sem mapa: a ordem dos lugares é a ordem informada pelo
// motorista.

type DadosRota = Pick<Carona, 'origem' | 'paradas' | 'destino' | 'pontoEmbarque' | 'pontos'>;

export type TrechoCidade = {
  cidade: string;
  pontos: { nome: string; embarque?: boolean }[];
};

/** Cidades do trajeto, cada uma com os pontos que ficam nela, na ordem. */
export function roteiro(c: DadosRota): TrechoCidade[] {
  const trechos: TrechoCidade[] = [c.origem, ...c.paradas, c.destino].map((cidade) => ({ cidade, pontos: [] }));
  if (c.pontoEmbarque) trechos[0].pontos.push({ nome: c.pontoEmbarque, embarque: true });

  let cursor = 0;
  for (const ponto of c.pontos ?? []) {
    const candidatos = trechos
      .map((_, i) => i)
      .filter((i) => i >= cursor && mesmaCidade(trechos[i].cidade, ponto.cidade));
    // Na carona dentro da mesma cidade (origem = destino), os pontos depois do
    // embarque ficam no trecho do destino; nas outras, na cidade do ponto.
    const indice = candidatos.find((i) => i > 0) ?? candidatos[0] ?? trechos.length - 1;
    trechos[indice].pontos.push({ nome: ponto.nome });
    cursor = indice;
  }
  return trechos;
}

/** A carona começa e termina na mesma cidade, sem passar por outras. */
export function dentroDaCidade(c: DadosRota) {
  return c.paradas.length === 0 && mesmaCidade(c.origem, c.destino);
}

type Etapa = { cidade: string; ponto?: string; embarque?: boolean };

function ultimoIndice<T>(lista: T[], teste: (item: T) => boolean) {
  for (let i = lista.length - 1; i >= 0; i--) if (teste(lista[i])) return i;
  return -1;
}

/**
 * A carona serve para a busca se passa pelo lugar de saída e depois pelo de
 * chegada. Cada lugar pode ser um ponto (ex.: "Mercado Ítalo") ou só a
 * cidade. Quando o ponto pedido não está no roteiro, vale a cidade, e a carona
 * aparece depois das que passam pelo ponto (ver `pontosEncontrados`).
 */
export function atendeBusca(c: DadosRota, filtro: FiltroBusca) {
  const etapas: Etapa[] = roteiro(c).flatMap((t) => [
    { cidade: t.cidade },
    ...t.pontos.map((p) => ({ cidade: t.cidade, ponto: p.nome, embarque: p.embarque })),
  ]);
  const naCidade = (e: Etapa, cidade?: string) => !cidade || mesmaCidade(e.cidade, cidade);
  let pontosEncontrados = 0;

  let saida = filtro.pontoEmbarque
    ? etapas.findIndex((e) => e.ponto && naCidade(e, filtro.origem) && mesmoPonto(e.ponto, filtro.pontoEmbarque!))
    : -1;
  if (saida !== -1) pontosEncontrados++;
  else saida = filtro.origem ? etapas.findIndex((e) => naCidade(e, filtro.origem)) : 0;

  // O ponto de embarque nunca conta como chegada: uma carona que só embarca em
  // Dois Vizinhos e vai para outra cidade não serve para andar dentro de Dois Vizinhos.
  let chegada = filtro.pontoChegada
    ? ultimoIndice(
        etapas,
        (e) => !!e.ponto && !e.embarque && naCidade(e, filtro.destino) && mesmoPonto(e.ponto, filtro.pontoChegada!),
      )
    : -1;
  if (chegada !== -1 && chegada > saida) pontosEncontrados++;
  else {
    chegada = filtro.destino
      ? ultimoIndice(etapas, (e) => naCidade(e, filtro.destino) && !e.embarque)
      : etapas.length - 1;
  }

  // Dentro da mesma cidade, a cidade sozinha não diz nada sobre o caminho: se o
  // passageiro informou lugares, a carona precisa passar por pelo menos um deles.
  const buscaNaCidade = !!filtro.origem && !!filtro.destino && mesmaCidade(filtro.origem, filtro.destino);
  const pediuLugar = !!(filtro.pontoEmbarque || filtro.pontoChegada);
  if (buscaNaCidade && pediuLugar && pontosEncontrados === 0) return { atende: false, pontosEncontrados };

  return { atende: saida !== -1 && chegada !== -1 && saida < chegada, pontosEncontrados };
}

/** "Pato Branco → Curitiba" ou, dentro da cidade, "Posto Fênix → UTFPR". */
export function rotuloRota(c: DadosRota) {
  const { de, para } = resumoRota(c);
  return `${de} → ${para}`;
}

/** Resumo para os cartões: de onde para onde, e por onde passa. */
export function resumoRota(c: DadosRota) {
  const trechos = roteiro(c);
  if (dentroDaCidade(c)) {
    const pontos = trechos.flatMap((t) => t.pontos.map((p) => p.nome));
    if (pontos.length >= 2) {
      return { de: pontos[0], para: pontos[pontos.length - 1], cidade: c.origem, passaPor: pontos.slice(1, -1) };
    }
  }
  const pontos = (c.pontos ?? []).map((p) => p.nome);
  return { de: c.origem, para: c.destino, cidade: undefined, passaPor: [...c.paradas, ...pontos] };
}
