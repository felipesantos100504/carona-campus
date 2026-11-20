// Testes das regras de acesso (firestore.rules) no emulador do Firestore.
// Rodar com:  npm run test:regras   (precisa de Java instalado)
//
// O emulador é local e começa vazio: nada aqui toca o banco de verdade.
import { readFileSync } from 'node:fs';
import { after, before, beforeEach, describe, test } from 'node:test';

import { assertFails, assertSucceeds, initializeTestEnvironment } from '@firebase/rules-unit-testing';
import { doc, getDoc, getDocs, collection, query, where, setDoc, updateDoc, writeBatch } from 'firebase/firestore';

let ambiente;

const ANA = 'ana'; // motorista
const BRUNO = 'bruno'; // passageiro
const CARLA = 'carla'; // outra pessoa
const CARONA = 'carona1';
const RESERVA = `${CARONA}_${BRUNO}`;

const verificado = (uid) => ambiente.authenticatedContext(uid, { email_verified: true }).firestore();

const caronaValida = (extra = {}) => ({
  motoristaId: ANA,
  origem: 'Pato Branco',
  destino: 'Curitiba',
  paradas: ['Guarapuava'],
  trajeto: ['pato branco', 'guarapuava', 'curitiba'],
  primeiraSaida: '2026-11-20T21:00:00.000Z',
  validaAte: '2026-11-20T21:00:00.000Z',
  vagasTotais: 3,
  vagasDisponiveis: 3,
  valorPorVaga: 90,
  criadaEm: '2026-11-15T12:00:00.000Z',
  ...extra,
});

const reserva = (status) => ({
  caronaId: CARONA,
  passageiroId: BRUNO,
  motoristaId: ANA,
  status,
  criadaEm: '2026-11-15T12:00:00.000Z',
});

/** Grava dados iniciais ignorando as regras. */
async function preparar(dados) {
  await ambiente.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    for (const [caminho, valor] of Object.entries(dados)) await setDoc(doc(db, caminho), valor);
  });
}

before(async () => {
  ambiente = await initializeTestEnvironment({
    projectId: 'demo-carona-campus',
    firestore: { rules: readFileSync('firestore.rules', 'utf8') },
  });
});

beforeEach(() => ambiente.clearFirestore());
after(() => ambiente.cleanup());

describe('acesso sem verificação (RNF-02)', () => {
  test('visitante sem login não lê caronas', async () => {
    await preparar({ [`caronas/${CARONA}`]: caronaValida() });
    await assertFails(getDoc(doc(ambiente.unauthenticatedContext().firestore(), 'caronas', CARONA)));
  });

  test('conta com e-mail não verificado não lê caronas', async () => {
    await preparar({ [`caronas/${CARONA}`]: caronaValida() });
    const db = ambiente.authenticatedContext(BRUNO, { email_verified: false }).firestore();
    await assertFails(getDoc(doc(db, 'caronas', CARONA)));
  });

  test('conta verificada lê caronas', async () => {
    await preparar({ [`caronas/${CARONA}`]: caronaValida() });
    await assertSucceeds(getDoc(doc(verificado(BRUNO), 'caronas', CARONA)));
  });
});

describe('perfis', () => {
  test('cria o próprio perfil', async () => {
    await assertSucceeds(
      setDoc(doc(verificado(ANA), 'usuarios', ANA), { nome: 'Ana', cidade: 'Pato Branco', membroDesde: 'x' }),
    );
  });

  test('não altera o perfil de outra pessoa', async () => {
    await preparar({ [`usuarios/${ANA}`]: { nome: 'Ana', cidade: 'Pato Branco', membroDesde: 'x' } });
    await assertFails(updateDoc(doc(verificado(CARLA), 'usuarios', ANA), { nome: 'Hackeado' }));
  });

  test('não grava campos fora do perfil (ex.: média de avaliações)', async () => {
    await preparar({ [`usuarios/${ANA}`]: { nome: 'Ana', cidade: 'Pato Branco', membroDesde: 'x' } });
    await assertFails(updateDoc(doc(verificado(ANA), 'usuarios', ANA), { avaliacaoMedia: 5 }));
  });
});

describe('caronas', () => {
  test('motorista publica a própria carona', async () => {
    await assertSucceeds(setDoc(doc(verificado(ANA), 'caronas', CARONA), caronaValida()));
  });

  test('não publica carona em nome de outra pessoa', async () => {
    await assertFails(setDoc(doc(verificado(CARLA), 'caronas', CARONA), caronaValida()));
  });

  test('recusa carona com dados inválidos (20 vagas)', async () => {
    await assertFails(
      setDoc(doc(verificado(ANA), 'caronas', CARONA), caronaValida({ vagasTotais: 20, vagasDisponiveis: 20 })),
    );
  });

  test('passageiro não mexe no contador de vagas sem cancelar uma vaga', async () => {
    await preparar({ [`caronas/${CARONA}`]: caronaValida({ vagasDisponiveis: 2 }) });
    await assertFails(updateDoc(doc(verificado(BRUNO), 'caronas', CARONA), { vagasDisponiveis: 3 }));
  });
});

describe('reservas', () => {
  test('passageiro pede vaga como pendente (RF-07)', async () => {
    await preparar({ [`caronas/${CARONA}`]: caronaValida() });
    await assertSucceeds(setDoc(doc(verificado(BRUNO), 'reservas', RESERVA), reserva('pendente')));
  });

  test('passageiro não cria reserva já confirmada', async () => {
    await preparar({ [`caronas/${CARONA}`]: caronaValida() });
    await assertFails(setDoc(doc(verificado(BRUNO), 'reservas', RESERVA), reserva('confirmada')));
  });

  test('não pede vaga em carona lotada', async () => {
    await preparar({ [`caronas/${CARONA}`]: caronaValida({ vagasDisponiveis: 0 }) });
    await assertFails(setDoc(doc(verificado(BRUNO), 'reservas', RESERVA), reserva('pendente')));
  });

  test('motorista confirma descontando uma vaga na mesma operação (RF-08 / RNF-05)', async () => {
    await preparar({ [`caronas/${CARONA}`]: caronaValida(), [`reservas/${RESERVA}`]: reserva('pendente') });
    const db = verificado(ANA);
    const lote = writeBatch(db);
    lote.update(doc(db, 'caronas', CARONA), { vagasDisponiveis: 2 });
    lote.update(doc(db, 'reservas', RESERVA), { status: 'confirmada' });
    await assertSucceeds(lote.commit());
  });

  test('motorista não confirma sem descontar a vaga', async () => {
    await preparar({ [`caronas/${CARONA}`]: caronaValida(), [`reservas/${RESERVA}`]: reserva('pendente') });
    await assertFails(updateDoc(doc(verificado(ANA), 'reservas', RESERVA), { status: 'confirmada' }));
  });

  test('passageiro não confirma a própria reserva', async () => {
    await preparar({ [`caronas/${CARONA}`]: caronaValida(), [`reservas/${RESERVA}`]: reserva('pendente') });
    await assertFails(updateDoc(doc(verificado(BRUNO), 'reservas', RESERVA), { status: 'confirmada' }));
  });

  test('passageiro cancela vaga confirmada e devolve a vaga (RF-12)', async () => {
    await preparar({
      [`caronas/${CARONA}`]: caronaValida({ vagasDisponiveis: 2 }),
      [`reservas/${RESERVA}`]: reserva('confirmada'),
    });
    const db = verificado(BRUNO);
    const lote = writeBatch(db);
    lote.update(doc(db, 'caronas', CARONA), { vagasDisponiveis: 3 });
    lote.update(doc(db, 'reservas', RESERVA), { status: 'cancelada' });
    await assertSucceeds(lote.commit());
  });

  test('outra pessoa não lê a reserva', async () => {
    await preparar({ [`reservas/${RESERVA}`]: reserva('pendente') });
    await assertFails(getDoc(doc(verificado(CARLA), 'reservas', RESERVA)));
  });

  test('passageiro lista as próprias reservas, mas não todas', async () => {
    await preparar({ [`reservas/${RESERVA}`]: reserva('pendente') });
    const db = verificado(BRUNO);
    await assertSucceeds(getDocs(query(collection(db, 'reservas'), where('passageiroId', '==', BRUNO))));
    await assertFails(getDocs(collection(db, 'reservas')));
  });
});

describe('avaliações (RF-10)', () => {
  const avaliacao = (autor, avaliado, nota = 5) => ({
    reservaId: RESERVA,
    caronaId: CARONA,
    autorId: autor,
    avaliadoId: avaliado,
    nota,
    criadaEm: '2026-11-21T12:00:00.000Z',
  });

  test('passageiro avalia o motorista de uma viagem confirmada', async () => {
    await preparar({ [`reservas/${RESERVA}`]: reserva('confirmada') });
    await assertSucceeds(setDoc(doc(verificado(BRUNO), 'avaliacoes', `${RESERVA}_${BRUNO}`), avaliacao(BRUNO, ANA)));
  });

  test('motorista avalia o passageiro', async () => {
    await preparar({ [`reservas/${RESERVA}`]: reserva('confirmada') });
    await assertSucceeds(setDoc(doc(verificado(ANA), 'avaliacoes', `${RESERVA}_${ANA}`), avaliacao(ANA, BRUNO)));
  });

  test('quem não participou não avalia', async () => {
    await preparar({ [`reservas/${RESERVA}`]: reserva('confirmada') });
    await assertFails(setDoc(doc(verificado(CARLA), 'avaliacoes', `${RESERVA}_${CARLA}`), avaliacao(CARLA, ANA)));
  });

  test('não avalia pedido que não foi confirmado', async () => {
    await preparar({ [`reservas/${RESERVA}`]: reserva('pendente') });
    await assertFails(setDoc(doc(verificado(BRUNO), 'avaliacoes', `${RESERVA}_${BRUNO}`), avaliacao(BRUNO, ANA)));
  });

  test('nota fora de 1 a 5 é recusada', async () => {
    await preparar({ [`reservas/${RESERVA}`]: reserva('confirmada') });
    await assertFails(setDoc(doc(verificado(BRUNO), 'avaliacoes', `${RESERVA}_${BRUNO}`), avaliacao(BRUNO, ANA, 7)));
  });

  test('não altera uma avaliação já enviada', async () => {
    await preparar({
      [`reservas/${RESERVA}`]: reserva('confirmada'),
      [`avaliacoes/${RESERVA}_${BRUNO}`]: avaliacao(BRUNO, ANA, 2),
    });
    await assertFails(updateDoc(doc(verificado(BRUNO), 'avaliacoes', `${RESERVA}_${BRUNO}`), { nota: 5 }));
  });
});
