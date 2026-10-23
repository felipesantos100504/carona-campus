import { Carona, Reserva, Usuario } from './tipos';

// Dados de exemplo gravados no aparelho na primeira abertura do app.
// As datas são calculadas a partir de "agora" para a lista nunca ficar vazia.

export const ID_USUARIO_ATUAL = 'u0';

function emDias(dias: number, hora: number, minuto = 0) {
  const d = new Date();
  d.setDate(d.getDate() + dias);
  d.setHours(hora, minuto, 0, 0);
  return d.toISOString();
}

/** Próxima ocorrência (a partir de amanhã) de um dia da semana. */
function proximo(diaSemana: number, hora: number, minuto = 0) {
  const hoje = new Date().getDay();
  return emDias(((diaSemana - hoje + 7) % 7) || 7, hora, minuto);
}

export function gerarDadosIniciais() {
  const agora = new Date().toISOString();

  const usuarios: Usuario[] = [
    {
      id: ID_USUARIO_ATUAL,
      nome: 'Você',
      cidade: 'Pato Branco',
      bio: 'Edite seu perfil para aparecer com seu nome.',
      avaliacaoMedia: 4.8,
      totalAvaliacoes: 6,
      totalViagens: 9,
      membroDesde: emDias(-120, 10),
    },
    { id: 'u1', nome: 'Camila Silveira', cidade: 'Pato Branco', bio: 'Engenharia Ambiental. Viajo para Curitiba quase toda sexta.', avaliacaoMedia: 4.9, totalAvaliacoes: 38, totalViagens: 52, membroDesde: emDias(-400, 10) },
    { id: 'u2', nome: 'Lucas Andrade', cidade: 'Francisco Beltrão', bio: 'Trabalho em Pato Branco, volto pra casa todo dia.', avaliacaoMedia: 4.7, totalAvaliacoes: 21, totalViagens: 30, membroDesde: emDias(-250, 10) },
    { id: 'u3', nome: 'Mariana Costa', cidade: 'Cascavel', avaliacaoMedia: 5, totalAvaliacoes: 9, totalViagens: 11, membroDesde: emDias(-90, 10) },
    { id: 'u4', nome: 'Gabriel Moretti', cidade: 'Guarapuava', bio: 'Carro com ar, sem fumantes.', avaliacaoMedia: 4.5, totalAvaliacoes: 14, totalViagens: 19, membroDesde: emDias(-300, 10) },
    { id: 'u5', nome: 'Beatriz Lima', cidade: 'Curitiba', avaliacaoMedia: 4.8, totalAvaliacoes: 27, totalViagens: 33, membroDesde: emDias(-500, 10) },
    { id: 'u6', nome: 'Thiago Ferreira', cidade: 'Toledo', bio: 'Saio cedo, pontualidade é tudo.', avaliacaoMedia: 4.6, totalAvaliacoes: 12, totalViagens: 15, membroDesde: emDias(-60, 10) },
  ];

  const base = { criadaEm: agora };

  const caronas: Carona[] = [
    { ...base, id: 'c1', motoristaId: 'u1', origem: 'Pato Branco', destino: 'Curitiba', paradas: ['Guarapuava', 'Ponta Grossa'], dataHora: proximo(5, 18), vagasTotais: 3, vagasDisponiveis: 2, valorPorVaga: 90, observacoes: 'Saio da frente da rodoviária. Uma mala média por pessoa.', recorrencia: { diasSemana: [5] } },
    { ...base, id: 'c2', motoristaId: 'u2', origem: 'Pato Branco', destino: 'Francisco Beltrão', paradas: [], dataHora: emDias(0, 18, 30), vagasTotais: 4, vagasDisponiveis: 3, valorPorVaga: 15, recorrencia: { diasSemana: [1, 2, 3, 4, 5] } },
    { ...base, id: 'c3', motoristaId: 'u3', origem: 'Cascavel', destino: 'Foz do Iguaçu', paradas: ['Medianeira'], dataHora: emDias(2, 7, 30), vagasTotais: 3, vagasDisponiveis: 3, valorPorVaga: 40 },
    { ...base, id: 'c4', motoristaId: 'u4', origem: 'Guarapuava', destino: 'Ponta Grossa', paradas: [], dataHora: emDias(1, 14), vagasTotais: 2, vagasDisponiveis: 1, valorPorVaga: 50 },
    { ...base, id: 'c5', motoristaId: 'u5', origem: 'Curitiba', destino: 'Pato Branco', paradas: ['Ponta Grossa', 'Guarapuava'], dataHora: proximo(0, 9), vagasTotais: 4, vagasDisponiveis: 4, valorPorVaga: 95, observacoes: 'Volto domingo de manhã.', recorrencia: { diasSemana: [0] } },
    { ...base, id: 'c6', motoristaId: 'u6', origem: 'Toledo', destino: 'Cascavel', paradas: [], dataHora: emDias(1, 6, 45), vagasTotais: 3, vagasDisponiveis: 2, valorPorVaga: 15, recorrencia: { diasSemana: [1, 2, 3, 4, 5] } },
    { ...base, id: 'c7', motoristaId: 'u2', origem: 'Francisco Beltrão', destino: 'Pato Branco', paradas: [], dataHora: emDias(1, 7), vagasTotais: 4, vagasDisponiveis: 1, valorPorVaga: 15, recorrencia: { diasSemana: [1, 2, 3, 4, 5] } },
    { ...base, id: 'c8', motoristaId: 'u1', origem: 'Pato Branco', destino: 'Cascavel', paradas: ['Dois Vizinhos'], dataHora: emDias(4, 13), vagasTotais: 3, vagasDisponiveis: 0, valorPorVaga: 55 },
    { ...base, id: 'c9', motoristaId: 'u4', origem: 'Guarapuava', destino: 'Curitiba', paradas: ['Ponta Grossa'], dataHora: emDias(2, 17, 30), vagasTotais: 3, vagasDisponiveis: 2, valorPorVaga: 70 },
    { ...base, id: 'c10', motoristaId: 'u3', origem: 'Cascavel', destino: 'Toledo', paradas: [], dataHora: emDias(0, 19), vagasTotais: 2, vagasDisponiveis: 2, valorPorVaga: 15 },
    // Viagem já realizada, usada pelo histórico do usuário atual.
    { ...base, id: 'c11', motoristaId: 'u1', origem: 'Curitiba', destino: 'Pato Branco', paradas: ['Ponta Grossa'], dataHora: emDias(-5, 9), vagasTotais: 3, vagasDisponiveis: 0, valorPorVaga: 90 },
    { ...base, id: 'c12', motoristaId: 'u2', origem: 'Pato Branco', destino: 'Francisco Beltrão', paradas: [], dataHora: emDias(-12, 18, 30), vagasTotais: 4, vagasDisponiveis: 2, valorPorVaga: 15 },
  ];

  const reservas: Reserva[] = [
    { id: 'r1', caronaId: 'c11', passageiroId: ID_USUARIO_ATUAL, status: 'concluida', criadaEm: emDias(-7, 10) },
    { id: 'r2', caronaId: 'c12', passageiroId: ID_USUARIO_ATUAL, status: 'concluida', avaliacao: 5, criadaEm: emDias(-13, 10) },
    { id: 'r3', caronaId: 'c4', passageiroId: ID_USUARIO_ATUAL, status: 'confirmada', criadaEm: agora },
  ];

  return { usuarios, caronas, reservas };
}
