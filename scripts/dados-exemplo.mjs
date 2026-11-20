// Dados de exemplo para a demonstração do app (usados por popular-banco.mjs).
//
// As contas abaixo são de TESTE: e-mails no domínio reservado ".test" (não
// recebem mensagens) já marcados como verificados pelo script. Use-as para
// entrar no app durante a apresentação, por exemplo uma como motorista num
// celular e outra como passageiro em outro.
export const SENHA_DEMO = 'CaronaDemo2026';

import { deflateSync } from 'node:zlib';

/**
 * Foto de perfil de exemplo: um PNG pequeno (64 × 64, degradê) em base64,
 * no mesmo formato data URI que o app grava no campo fotoUri.
 */
function fotoExemplo([r1, g1, b1], [r2, g2, b2]) {
  const tamanho = 64;
  const linhas = [];
  for (let y = 0; y < tamanho; y++) {
    const t = y / (tamanho - 1);
    const pixel = [r1 + (r2 - r1) * t, g1 + (g2 - g1) * t, b1 + (b2 - b1) * t].map(Math.round);
    linhas.push(Buffer.from([0, ...Array.from({ length: tamanho }, () => pixel).flat()]));
  }
  const crcTabela = Array.from({ length: 256 }, (_, n) => {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    return c >>> 0;
  });
  const crc = (buf) => {
    let c = 0xffffffff;
    for (const byte of buf) c = crcTabela[(c ^ byte) & 0xff] ^ (c >>> 8);
    return (c ^ 0xffffffff) >>> 0;
  };
  const bloco = (tipo, dados) => {
    const tamanhoBuf = Buffer.alloc(4);
    tamanhoBuf.writeUInt32BE(dados.length);
    const corpo = Buffer.concat([Buffer.from(tipo), dados]);
    const crcBuf = Buffer.alloc(4);
    crcBuf.writeUInt32BE(crc(corpo));
    return Buffer.concat([tamanhoBuf, corpo, crcBuf]);
  };
  const cabecalho = Buffer.alloc(13);
  cabecalho.writeUInt32BE(tamanho, 0);
  cabecalho.writeUInt32BE(tamanho, 4);
  cabecalho.set([8, 2, 0, 0, 0], 8); // 8 bits, RGB
  const png = Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    bloco('IHDR', cabecalho),
    bloco('IDAT', deflateSync(Buffer.concat(linhas))),
    bloco('IEND', Buffer.alloc(0)),
  ]);
  return `data:image/png;base64,${png.toString('base64')}`;
}

export const usuarios = [
  { id: 'demo-camila', email: 'camila@carona-campus.test', nome: 'Camila Silveira', cidade: 'Pato Branco', bio: 'Engenharia Ambiental. Viajo para Curitiba quase toda sexta.' },
  { id: 'demo-lucas', email: 'lucas@carona-campus.test', nome: 'Lucas Andrade', cidade: 'Francisco Beltrão', bio: 'Trabalho em Pato Branco e volto para casa todo dia.' },
  { id: 'demo-mariana', email: 'mariana@carona-campus.test', nome: 'Mariana Costa', cidade: 'Cascavel' },
  { id: 'demo-gabriel', email: 'gabriel@carona-campus.test', nome: 'Gabriel Moretti', cidade: 'Guarapuava', bio: 'Carro com ar-condicionado, sem fumantes.' },
  { id: 'demo-beatriz', email: 'beatriz@carona-campus.test', nome: 'Beatriz Lima', cidade: 'Curitiba', fotoUri: fotoExemplo([99, 102, 241], [5, 150, 105]) },
  // Contas principais para a apresentação e os testes:
  { id: 'demo-motorista', email: 'motorista@carona-campus.test', nome: 'Rafael Moreira', cidade: 'Quedas do Iguaçu', bio: 'Motorista da demonstração. Vou para Cascavel todo dia útil.' },
  { id: 'demo-passageiro', email: 'passageiro@carona-campus.test', nome: 'Júlia Andrade', cidade: 'Quedas do Iguaçu', bio: 'Passageira da demonstração. Estudo em Cascavel.' },
];

// As datas são calculadas no horário de Brasília (UTC-3), independentemente
// do fuso do computador que roda o script.
const FUSO_HORAS = 3;

/** Dia de hoje (ano, mês, dia e dia da semana) em Brasília. */
function hojeBrasilia() {
  const d = new Date(Date.now() - FUSO_HORAS * 60 * 60 * 1000);
  return { ano: d.getUTCFullYear(), mes: d.getUTCMonth(), dia: d.getUTCDate(), semana: d.getUTCDay() };
}

/** Data/hora ISO daqui a `dias` dias, no horário indicado (de Brasília). */
function emDias(dias, hora, minuto = 0) {
  const h = hojeBrasilia();
  return new Date(Date.UTC(h.ano, h.mes, h.dia + dias, hora + FUSO_HORAS, minuto)).toISOString();
}

/** Próxima ocorrência de um dia da semana (0 = domingo), a partir de amanhã. */
function proximo(diaSemana, hora, minuto = 0) {
  return emDias((diaSemana - hojeBrasilia().semana + 7) % 7 || 7, hora, minuto);
}

export const caronas = [
  { id: 'demo-c1', motoristaId: 'demo-camila', origem: 'Pato Branco', destino: 'Curitiba', paradas: ['Guarapuava', 'Ponta Grossa'], pontoEmbarque: 'Rodoviária', primeiraSaida: proximo(5, 18), vagasTotais: 3, valorPorVaga: 90, observacoes: 'Uma mala média por pessoa.', diasSemana: [5], textoOriginal: 'saio de Pato Branco toda sexta às 18h pra Curitiba, passo por Guarapuava e Ponta Grossa, 3 vagas, R$ 90' },
  { id: 'demo-c2', motoristaId: 'demo-lucas', origem: 'Pato Branco', destino: 'Francisco Beltrão', paradas: [], pontoEmbarque: 'UTFPR, portão principal', primeiraSaida: emDias(1, 18, 30), vagasTotais: 4, valorPorVaga: 15, diasSemana: [1, 2, 3, 4, 5] },
  { id: 'demo-c3', motoristaId: 'demo-mariana', origem: 'Cascavel', destino: 'Foz do Iguaçu', paradas: ['Medianeira'], primeiraSaida: emDias(2, 7, 30), vagasTotais: 3, valorPorVaga: 40 },
  { id: 'demo-c4', motoristaId: 'demo-gabriel', origem: 'Guarapuava', destino: 'Ponta Grossa', paradas: [], primeiraSaida: emDias(1, 14), vagasTotais: 1, valorPorVaga: 50 },
  { id: 'demo-c5', motoristaId: 'demo-beatriz', origem: 'Curitiba', destino: 'Pato Branco', paradas: ['Ponta Grossa', 'Guarapuava'], primeiraSaida: proximo(0, 9), vagasTotais: 4, valorPorVaga: 95, observacoes: 'Volto domingo de manhã.', diasSemana: [0] },
  { id: 'demo-c6', motoristaId: 'demo-gabriel', origem: 'Guarapuava', destino: 'Curitiba', paradas: ['Ponta Grossa'], primeiraSaida: emDias(3, 17, 30), vagasTotais: 3, valorPorVaga: 70 },
  // Viagem que já aconteceu: aparece no histórico e permite avaliar.
  { id: 'demo-c7', motoristaId: 'demo-camila', origem: 'Curitiba', destino: 'Pato Branco', paradas: ['Ponta Grossa'], primeiraSaida: emDias(-5, 9), vagasTotais: 3, valorPorVaga: 90 },
  // Caronas do motorista principal da demonstração.
  { id: 'demo-m1', motoristaId: 'demo-motorista', origem: 'Quedas do Iguaçu', destino: 'Cascavel', paradas: ['Catanduvas'], pontoEmbarque: 'Posto Fênix', primeiraSaida: emDias(1, 7), vagasTotais: 3, valorPorVaga: 35, diasSemana: [1, 2, 3, 4, 5], observacoes: 'Saio pontualmente às 7h.', textoOriginal: 'saio do Posto Fênix em Quedas do Iguaçu de segunda a sexta às 7h pra Cascavel, passo por Catanduvas, 3 vagas, R$ 35' },
  { id: 'demo-m2', motoristaId: 'demo-motorista', origem: 'Quedas do Iguaçu', destino: 'Dois Vizinhos', paradas: ["São Jorge d'Oeste"], pontoEmbarque: 'Rodoviária', primeiraSaida: proximo(5, 17), vagasTotais: 2, valorPorVaga: 40, diasSemana: [5] },
  // Viagem que já aconteceu, com o passageiro principal confirmado.
  { id: 'demo-m3', motoristaId: 'demo-motorista', origem: 'Quedas do Iguaçu', destino: 'Cascavel', paradas: [], pontoEmbarque: 'Posto Fênix', primeiraSaida: emDias(-3, 7), vagasTotais: 3, valorPorVaga: 35 },
];

// Pedidos de vaga: id = {caronaId}_{passageiroId}.
// Mostra todos os status que o app grava: pendente, confirmada, recusada
// (pelo motorista, ou automaticamente com motivo "lotada") e cancelada.
export const reservas = [
  { caronaId: 'demo-c1', passageiroId: 'demo-lucas', status: 'confirmada' },
  { caronaId: 'demo-c1', passageiroId: 'demo-mariana', status: 'pendente' },
  // Passageiro cancelou a vaga que estava confirmada (a vaga voltou para a carona).
  { caronaId: 'demo-c1', passageiroId: 'demo-gabriel', status: 'cancelada' },
  // A carona demo-c4 tem 1 vaga: a Beatriz foi confirmada e o pedido da Mariana
  // foi recusado automaticamente porque a carona lotou.
  { caronaId: 'demo-c4', passageiroId: 'demo-beatriz', status: 'confirmada' },
  { caronaId: 'demo-c4', passageiroId: 'demo-mariana', status: 'recusada', motivo: 'lotada' },
  // O motorista recusou o pedido.
  { caronaId: 'demo-c3', passageiroId: 'demo-lucas', status: 'recusada' },
  { caronaId: 'demo-c7', passageiroId: 'demo-gabriel', status: 'confirmada' },
  { caronaId: 'demo-c7', passageiroId: 'demo-beatriz', status: 'confirmada' },
  // Contas principais da demonstração: o passageiro já pediu vaga na carona
  // diária do motorista (para aceitar ao vivo) e viajou com ele na semana passada
  // (para mostrar a avaliação).
  { caronaId: 'demo-m1', passageiroId: 'demo-passageiro', status: 'pendente' },
  { caronaId: 'demo-m3', passageiroId: 'demo-passageiro', status: 'confirmada' },
];

// Avaliações da viagem passada (demo-c7): id = {reservaId}_{autorId}.
export const avaliacoes = [
  { reservaId: 'demo-c7_demo-gabriel', autorId: 'demo-gabriel', avaliadoId: 'demo-camila', nota: 5 },
  { reservaId: 'demo-c7_demo-gabriel', autorId: 'demo-camila', avaliadoId: 'demo-gabriel', nota: 4 },
  { reservaId: 'demo-c7_demo-beatriz', autorId: 'demo-beatriz', avaliadoId: 'demo-camila', nota: 5 },
];
