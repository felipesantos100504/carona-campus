// Cadastra os dados de exemplo (scripts/dados-exemplo.mjs) no Firebase:
// contas de demonstração no Authentication (já verificadas), perfis, caronas,
// pedidos de vaga e avaliações no Firestore.
//
// Rodar:  npm run popular
// Requer a chave de conta de serviço em ./chave-servico.json
// (Console > Configurações do projeto > Contas de serviço > Gerar nova chave privada).
// A chave dá acesso total ao projeto: ela está no .gitignore e não deve ir para o GitHub.
//
// Pode ser rodado de novo: os documentos de exemplo são sobrescritos.
import { existsSync, readFileSync } from 'node:fs';

import { cert, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

import { avaliacoes, caronas, reservas, SENHA_DEMO, usuarios } from './dados-exemplo.mjs';

const SEM_DATA_FINAL = '9999-12-31T23:59:59.999Z';

function iniciar() {
  const emulador = process.env.FIRESTORE_EMULATOR_HOST;
  if (emulador) return initializeApp({ projectId: process.env.GCLOUD_PROJECT || 'demo-carona-campus' });
  if (!existsSync('chave-servico.json')) {
    console.error('Arquivo chave-servico.json não encontrado. Veja as instruções no topo deste script.');
    process.exit(1);
  }
  return initializeApp({ credential: cert(JSON.parse(readFileSync('chave-servico.json', 'utf8'))) });
}

/** Mesma normalização do app (src/data/cidades.ts): sem acentos e em minúsculas. */
const normalizar = (t) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();

const app = iniciar();
const auth = getAuth(app);
const db = getFirestore(app);
const agora = new Date().toISOString();

// 1. Contas de demonstração (e-mail já verificado).
for (const u of usuarios) {
  const dados = { email: u.email, password: SENHA_DEMO, displayName: u.nome, emailVerified: true };
  try {
    await auth.updateUser(u.id, dados);
  } catch {
    await auth.createUser({ uid: u.id, ...dados });
  }
}
console.log(`✔ ${usuarios.length} contas de demonstração`);

const lote = db.batch();

// 2. Perfis públicos.
for (const u of usuarios) {
  lote.set(db.doc(`usuarios/${u.id}`), {
    nome: u.nome,
    cidade: u.cidade,
    ...(u.bio ? { bio: u.bio } : {}),
    membroDesde: agora,
  });
}

// 3. Caronas, já com as vagas ocupadas pelas reservas confirmadas.
for (const c of caronas) {
  const confirmadas = reservas.filter((r) => r.caronaId === c.id && r.status === 'confirmada').length;
  const recorrente = !!c.diasSemana?.length;
  lote.set(db.doc(`caronas/${c.id}`), {
    motoristaId: c.motoristaId,
    origem: c.origem,
    destino: c.destino,
    paradas: c.paradas,
    ...(c.pontoEmbarque ? { pontoEmbarque: c.pontoEmbarque } : {}),
    trajeto: [c.origem, ...c.paradas, c.destino].map(normalizar),
    primeiraSaida: c.primeiraSaida,
    validaAte: recorrente ? SEM_DATA_FINAL : c.primeiraSaida,
    vagasTotais: c.vagasTotais,
    vagasDisponiveis: c.vagasTotais - confirmadas,
    valorPorVaga: c.valorPorVaga,
    ...(c.observacoes ? { observacoes: c.observacoes } : {}),
    ...(recorrente ? { recorrencia: { diasSemana: c.diasSemana } } : {}),
    ...(c.textoOriginal ? { textoOriginal: c.textoOriginal } : {}),
    criadaEm: agora,
  });
}

// 4. Pedidos de vaga.
for (const r of reservas) {
  const carona = caronas.find((c) => c.id === r.caronaId);
  lote.set(db.doc(`reservas/${r.caronaId}_${r.passageiroId}`), {
    caronaId: r.caronaId,
    passageiroId: r.passageiroId,
    motoristaId: carona.motoristaId,
    status: r.status,
    criadaEm: agora,
  });
}

// 5. Avaliações.
for (const a of avaliacoes) {
  lote.set(db.doc(`avaliacoes/${a.reservaId}_${a.autorId}`), {
    reservaId: a.reservaId,
    caronaId: a.reservaId.split('_')[0],
    autorId: a.autorId,
    avaliadoId: a.avaliadoId,
    nota: a.nota,
    criadaEm: agora,
  });
}

await lote.commit();
console.log(`✔ ${usuarios.length} perfis, ${caronas.length} caronas, ${reservas.length} reservas, ${avaliacoes.length} avaliações`);
console.log('Senha das contas de demonstração: veja SENHA_DEMO em scripts/dados-exemplo.mjs');
process.exit(0);
