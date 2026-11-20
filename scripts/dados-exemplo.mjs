// Dados de exemplo para a demonstração do app (usados por popular-banco.mjs).
//
// As contas abaixo são de TESTE: e-mails no domínio reservado ".test" (não
// recebem mensagens) já marcados como verificados pelo script. Use-as para
// entrar no app durante a apresentação, por exemplo uma como motorista num
// celular e outra como passageiro em outro.
export const SENHA_DEMO = 'CaronaDemo2026';

export const usuarios = [
  { id: 'demo-camila', email: 'camila@carona-campus.test', nome: 'Camila Silveira', cidade: 'Pato Branco', bio: 'Engenharia Ambiental. Viajo para Curitiba quase toda sexta.' },
  { id: 'demo-lucas', email: 'lucas@carona-campus.test', nome: 'Lucas Andrade', cidade: 'Francisco Beltrão', bio: 'Trabalho em Pato Branco e volto para casa todo dia.' },
  { id: 'demo-mariana', email: 'mariana@carona-campus.test', nome: 'Mariana Costa', cidade: 'Cascavel' },
  { id: 'demo-gabriel', email: 'gabriel@carona-campus.test', nome: 'Gabriel Moretti', cidade: 'Guarapuava', bio: 'Carro com ar-condicionado, sem fumantes.' },
  { id: 'demo-beatriz', email: 'beatriz@carona-campus.test', nome: 'Beatriz Lima', cidade: 'Curitiba' },
];

/** Data/hora ISO daqui a `dias` dias, no horário indicado (fuso de Brasília). */
function emDias(dias, hora, minuto = 0) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + dias);
  d.setUTCHours(hora + 3, minuto, 0, 0); // UTC-3
  return d.toISOString();
}

/** Próxima ocorrência de um dia da semana (0 = domingo), a partir de amanhã. */
function proximo(diaSemana, hora, minuto = 0) {
  const hoje = new Date().getUTCDay();
  return emDias((diaSemana - hoje + 7) % 7 || 7, hora, minuto);
}

export const caronas = [
  { id: 'demo-c1', motoristaId: 'demo-camila', origem: 'Pato Branco', destino: 'Curitiba', paradas: ['Guarapuava', 'Ponta Grossa'], primeiraSaida: proximo(5, 18), vagasTotais: 3, valorPorVaga: 90, observacoes: 'Saio da frente da rodoviária. Uma mala média por pessoa.', diasSemana: [5], textoOriginal: 'saio de Pato Branco toda sexta às 18h pra Curitiba, passo por Guarapuava e Ponta Grossa, 3 vagas, R$ 90' },
  { id: 'demo-c2', motoristaId: 'demo-lucas', origem: 'Pato Branco', destino: 'Francisco Beltrão', paradas: [], primeiraSaida: emDias(1, 18, 30), vagasTotais: 4, valorPorVaga: 15, diasSemana: [1, 2, 3, 4, 5] },
  { id: 'demo-c3', motoristaId: 'demo-mariana', origem: 'Cascavel', destino: 'Foz do Iguaçu', paradas: ['Medianeira'], primeiraSaida: emDias(2, 7, 30), vagasTotais: 3, valorPorVaga: 40 },
  { id: 'demo-c4', motoristaId: 'demo-gabriel', origem: 'Guarapuava', destino: 'Ponta Grossa', paradas: [], primeiraSaida: emDias(1, 14), vagasTotais: 2, valorPorVaga: 50 },
  { id: 'demo-c5', motoristaId: 'demo-beatriz', origem: 'Curitiba', destino: 'Pato Branco', paradas: ['Ponta Grossa', 'Guarapuava'], primeiraSaida: proximo(0, 9), vagasTotais: 4, valorPorVaga: 95, observacoes: 'Volto domingo de manhã.', diasSemana: [0] },
  { id: 'demo-c6', motoristaId: 'demo-gabriel', origem: 'Guarapuava', destino: 'Curitiba', paradas: ['Ponta Grossa'], primeiraSaida: emDias(3, 17, 30), vagasTotais: 3, valorPorVaga: 70 },
  // Viagem que já aconteceu: aparece no histórico e permite avaliar.
  { id: 'demo-c7', motoristaId: 'demo-camila', origem: 'Curitiba', destino: 'Pato Branco', paradas: ['Ponta Grossa'], primeiraSaida: emDias(-5, 9), vagasTotais: 3, valorPorVaga: 90 },
];

// Pedidos de vaga: id = {caronaId}_{passageiroId}.
export const reservas = [
  { caronaId: 'demo-c1', passageiroId: 'demo-lucas', status: 'confirmada' },
  { caronaId: 'demo-c1', passageiroId: 'demo-mariana', status: 'pendente' },
  { caronaId: 'demo-c4', passageiroId: 'demo-beatriz', status: 'confirmada' },
  { caronaId: 'demo-c7', passageiroId: 'demo-gabriel', status: 'confirmada' },
  { caronaId: 'demo-c7', passageiroId: 'demo-beatriz', status: 'confirmada' },
];

// Avaliações da viagem passada (demo-c7): id = {reservaId}_{autorId}.
export const avaliacoes = [
  { reservaId: 'demo-c7_demo-gabriel', autorId: 'demo-gabriel', avaliadoId: 'demo-camila', nota: 5 },
  { reservaId: 'demo-c7_demo-gabriel', autorId: 'demo-camila', avaliadoId: 'demo-gabriel', nota: 4 },
  { reservaId: 'demo-c7_demo-beatriz', autorId: 'demo-beatriz', avaliadoId: 'demo-camila', nota: 5 },
];
