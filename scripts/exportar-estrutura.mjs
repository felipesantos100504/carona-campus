// Exporta o conteúdo do Firestore para docs/estrutura-firestore.json,
// mostrando a estrutura real das coleções a partir dos itens cadastrados
// (entrega: "Arquivo JSON com a estrutura demonstrada a partir do cadastro de alguns itens").
//
// Rodar:  npm run exportar
// Usa a mesma chave de conta de serviço do popular-banco.mjs (./chave-servico.json).
// Fotos em base64 são abreviadas para o arquivo continuar legível.
import { existsSync, readFileSync, writeFileSync } from 'node:fs';

import { cert, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const COLECOES = ['usuarios', 'caronas', 'reservas', 'avaliacoes'];
const DESTINO = 'docs/estrutura-firestore.json';

function iniciar() {
  if (process.env.FIRESTORE_EMULATOR_HOST) {
    return initializeApp({ projectId: process.env.GCLOUD_PROJECT || 'demo-carona-campus' });
  }
  if (!existsSync('chave-servico.json')) {
    console.error('Arquivo chave-servico.json não encontrado. Veja as instruções em scripts/popular-banco.mjs.');
    process.exit(1);
  }
  return initializeApp({ credential: cert(JSON.parse(readFileSync('chave-servico.json', 'utf8'))) });
}

function abreviar(valor) {
  if (typeof valor === 'string' && valor.startsWith('data:image')) {
    return `${valor.slice(0, 40)}… (foto em base64, ${Math.round(valor.length / 1024)} KB)`;
  }
  if (Array.isArray(valor)) return valor.map(abreviar);
  if (valor && typeof valor === 'object') {
    return Object.fromEntries(Object.entries(valor).map(([k, v]) => [k, abreviar(v)]));
  }
  return valor;
}

const db = getFirestore(iniciar());
const saida = {
  _sobre:
    'Estrutura do Cloud Firestore do Carona Campus, exportada a partir dos itens cadastrados. ' +
    'Cada coleção é um objeto { idDoDocumento: campos }. Regras de acesso em firestore.rules.',
  _exportadoEm: new Date().toISOString(),
};

for (const nome of COLECOES) {
  const snap = await db.collection(nome).get();
  saida[nome] = Object.fromEntries(snap.docs.map((d) => [d.id, abreviar(d.data())]));
  console.log(`✔ ${nome}: ${snap.size} documentos`);
}

writeFileSync(DESTINO, JSON.stringify(saida, null, 2) + '\n');
console.log(`Arquivo gerado: ${DESTINO}`);
process.exit(0);
