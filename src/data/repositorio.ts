import * as Network from 'expo-network';
import { FirebaseError } from 'firebase/app';
import {
  addDoc,
  collection,
  count,
  doc,
  DocumentData,
  getAggregateFromServer,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  runTransaction,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';

import { gravar, ler } from './armazenamento';
import { lerPerfilPendente, limparPerfilPendente, usuarioAtual } from './auth';
import { normalizar } from './cidades';
import { auth, db } from './firebase';
import { atendeBusca } from './roteiro';
import {
  Carona,
  CaronaComMotorista,
  FiltroBusca,
  NovaCarona,
  Ponto,
  Reserva,
  ReservaDetalhada,
  Solicitacao,
  StatusReserva,
  Usuario,
  ViagemParaAvaliar,
} from './tipos';

// Único ponto de acesso a dados das telas. Lê e grava no Cloud Firestore.
//
// Coleções (estrutura completa em docs/estrutura-firestore.json):
//   usuarios/{uid}                       perfil público
//   caronas/{id}                         viagens publicadas
//   reservas/{caronaId}_{passageiroId}   pedidos de vaga (um por passageiro e carona)
//   avaliacoes/{reservaId}_{autorId}     notas pós-viagem (uma por pessoa e viagem)
//
// As permissões ficam em firestore.rules.

const TEMPO_LIMITE_MS = 15000;
/** Viagens recorrentes não têm data final: ficam válidas em todas as buscas. */
const SEM_DATA_FINAL = '9999-12-31T23:59:59.999Z';

export class ErroDeRede extends Error {
  constructor(mensagem = 'Sem conexão com a internet. Verifique sua rede e tente de novo.') {
    super(mensagem);
    this.name = 'ErroDeRede';
  }
}

// ---------- infraestrutura ----------

type Config = { simularErro: boolean };

export function obterConfig() {
  return ler<Config>('config', { simularErro: false });
}

/** Modo demonstração: força o comportamento de "sem conexão" sem desligar a rede. */
export async function definirSimularErro(simularErro: boolean) {
  await gravar('config', { ...(await obterConfig()), simularErro });
}

/** RF-14: antes de falar com o servidor, confere se há internet. */
async function verificarConexao() {
  if ((await obterConfig()).simularErro) throw new ErroDeRede('Sem conexão com a internet (simulado).');
  try {
    const rede = await Network.getNetworkStateAsync();
    if (rede.isConnected === false || rede.isInternetReachable === false) throw new ErroDeRede();
  } catch (e) {
    if (e instanceof ErroDeRede) throw e;
    // Se o aparelho não informar o estado da rede, segue e deixa o Firestore decidir.
  }
}

function traduzirErro(e: unknown): Error {
  if (e instanceof ErroDeRede) return e;
  if (e instanceof FirebaseError) {
    if (e.code === 'unavailable' || e.code === 'deadline-exceeded') return new ErroDeRede();
    if (e.code === 'permission-denied') {
      return new Error('Você não tem permissão para esta ação. Confirme seu e-mail e entre novamente.');
    }
  }
  return e instanceof Error ? e : new Error(String(e));
}

/** Executa uma operação no Firestore com checagem de rede, tempo limite e mensagens em português. */
async function executar<T>(operacao: () => Promise<T>): Promise<T> {
  await verificarConexao();
  let temporizador: ReturnType<typeof setTimeout> | undefined;
  const limite = new Promise<never>((_, rejeitar) => {
    temporizador = setTimeout(() => rejeitar(new ErroDeRede()), TEMPO_LIMITE_MS);
  });
  try {
    return await Promise.race([operacao(), limite]);
  } catch (e) {
    throw traduzirErro(e);
  } finally {
    clearTimeout(temporizador);
  }
}

/**
 * RNF-04: listas do próprio usuário ficam salvas no aparelho. Sem conexão,
 * a tela mostra a última versão carregada em vez do erro.
 */
async function comCache<T>(chave: string, operacao: () => Promise<T>): Promise<T> {
  const chaveCache = `cache:${usuarioAtual().uid}:${chave}`;
  try {
    const dados = await executar(operacao);
    await gravar(chaveCache, dados);
    return dados;
  } catch (e) {
    if (e instanceof ErroDeRede) {
      const salvo = await ler<T | null>(chaveCache, null);
      if (salvo) return salvo;
    }
    throw e;
  }
}

const agoraISO = () => new Date().toISOString();

// ---------- datas das viagens recorrentes ----------

function dataLocal(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Saída da carona num dia específico (AAAA-MM-DD), ou null se ela não acontece nesse dia. */
function saidaNaData(primeiraSaida: string, dias: number[] | undefined, data: string): string | null {
  const primeira = new Date(primeiraSaida);
  if (!dias?.length) return dataLocal(primeira) === data ? primeiraSaida : null;
  const [a, m, d] = data.split('-').map(Number);
  const candidata = new Date(a, m - 1, d, primeira.getHours(), primeira.getMinutes());
  if (!dias.includes(candidata.getDay()) || candidata < primeira) return null;
  return candidata.toISOString();
}

/** Próxima saída a partir de agora (com 1 hora de tolerância). */
function proximaSaida(primeiraSaida: string, dias: number[] | undefined): string {
  if (!dias?.length) return primeiraSaida;
  const inicio = Math.max(new Date(primeiraSaida).getTime(), Date.now() - 60 * 60 * 1000);
  for (let i = 0; i <= 7; i++) {
    const dia = new Date(inicio);
    dia.setDate(dia.getDate() + i);
    const saida = saidaNaData(primeiraSaida, dias, dataLocal(dia));
    if (saida && new Date(saida).getTime() >= inicio) return saida;
  }
  return primeiraSaida;
}

// ---------- conversão dos documentos ----------

function paraCarona(id: string, d: DocumentData, data?: string): Carona | null {
  const dias = d.recorrencia?.diasSemana as number[] | undefined;
  const dataHora = data ? saidaNaData(d.primeiraSaida, dias, data) : proximaSaida(d.primeiraSaida, dias);
  if (!dataHora) return null;
  return {
    id,
    motoristaId: d.motoristaId,
    origem: d.origem,
    destino: d.destino,
    paradas: d.paradas ?? [],
    pontoEmbarque: d.pontoEmbarque,
    pontos: lerPontos(d.pontos),
    dataHora,
    primeiraSaida: d.primeiraSaida,
    vagasTotais: d.vagasTotais,
    vagasDisponiveis: d.vagasDisponiveis,
    valorPorVaga: d.valorPorVaga,
    observacoes: d.observacoes,
    recorrencia: dias?.length ? { diasSemana: dias } : undefined,
    textoOriginal: d.textoOriginal,
    criadaEm: d.criadaEm,
  };
}

function paraReserva(id: string, d: DocumentData, carona?: Carona): Reserva {
  let status = d.status as StatusReserva;
  // Viagem única que já aconteceu: a vaga confirmada aparece como "realizada".
  if (status === 'confirmada' && carona && !carona.recorrencia && new Date(carona.primeiraSaida).getTime() < Date.now()) {
    status = 'concluida';
  }
  return {
    id,
    caronaId: d.caronaId,
    passageiroId: d.passageiroId,
    motoristaId: d.motoristaId,
    status,
    motivo: d.motivo,
    criadaEm: d.criadaEm,
  };
}

/** Pode avaliar quem teve vaga confirmada depois que a (primeira) viagem aconteceu. */
export function podeAvaliar(reserva: Reserva, carona: Carona) {
  return (
    (reserva.status === 'confirmada' || reserva.status === 'concluida') &&
    new Date(carona.primeiraSaida).getTime() < Date.now() &&
    !reserva.avaliacao
  );
}

const JANELA_HORARIO_MIN = 90;

/** A saída está a até 1h30 do horário pedido (HH:MM), no mesmo dia. */
function pertoDoHorario(iso: string, horario: string) {
  const d = new Date(iso);
  const [h, m] = horario.split(':').map(Number);
  return Math.abs(d.getHours() * 60 + d.getMinutes() - (h * 60 + m)) <= JANELA_HORARIO_MIN;
}

/** Pontos gravados no documento, descartando itens fora do formato. */
function lerPontos(valor: unknown): Ponto[] {
  if (!Array.isArray(valor)) return [];
  return valor.filter(
    (p): p is Ponto => !!p && typeof p.nome === 'string' && typeof p.cidade === 'string',
  );
}

// ---------- usuários ----------

// Perfis já lidos nesta sessão, para não buscar o mesmo motorista várias vezes numa lista.
const perfis = new Map<string, Promise<Usuario | null>>();

async function lerUsuario(id: string): Promise<Usuario | null> {
  const snap = await getDoc(doc(db, 'usuarios', id));
  if (!snap.exists()) return null;
  const d = snap.data();
  // A média vem das notas recebidas (a agregação average() no servidor exigiria
  // um índice composto); o total de caronas usa a contagem do servidor.
  const [notas, caronas] = await Promise.all([
    getDocs(query(collection(db, 'avaliacoes'), where('avaliadoId', '==', id)))
      .then((r) => r.docs.map((a) => a.data().nota as number))
      .catch(() => [] as number[]),
    getAggregateFromServer(query(collection(db, 'caronas'), where('motoristaId', '==', id)), {
      total: count(),
    }).catch(() => null),
  ]);
  return {
    id,
    nome: d.nome,
    cidade: d.cidade ?? '',
    bio: d.bio,
    fotoUri: d.fotoUri,
    membroDesde: d.membroDesde,
    avaliacaoMedia: notas.length ? notas.reduce((soma, n) => soma + n, 0) / notas.length : 0,
    totalAvaliacoes: notas.length,
    totalViagens: caronas?.data().total ?? 0,
  };
}

function usuarioEmCache(id: string) {
  let perfil = perfis.get(id);
  if (!perfil) {
    perfil = lerUsuario(id);
    perfil.catch(() => perfis.delete(id));
    perfis.set(id, perfil);
  }
  return perfil;
}

/** Usado quando o perfil de alguém não existe mais. */
function usuarioDesconhecido(id: string): Usuario {
  return { id, nome: 'Usuário', cidade: '', avaliacaoMedia: 0, totalAvaliacoes: 0, totalViagens: 0, membroDesde: '' };
}

async function usuarioOuDesconhecido(id: string) {
  return (await usuarioEmCache(id)) ?? usuarioDesconhecido(id);
}

async function anexarMotoristas(caronas: Carona[]): Promise<CaronaComMotorista[]> {
  return Promise.all(
    caronas.map(async (carona) => ({ carona, motorista: await usuarioOuDesconhecido(carona.motoristaId) })),
  );
}

/**
 * Cria o perfil público na primeira entrada com o e-mail já verificado,
 * usando os dados informados no cadastro (ou os da conta Google).
 */
export async function garantirMeuPerfil() {
  const usuario = auth.currentUser;
  if (!usuario?.emailVerified) return;
  const ref = doc(db, 'usuarios', usuario.uid);
  if ((await getDoc(ref)).exists()) return;
  const pendente = await lerPerfilPendente();
  await setDoc(ref, {
    nome: pendente?.nome || usuario.displayName || usuario.email?.split('@')[0] || 'Usuário',
    cidade: pendente?.cidade ?? '',
    fotoUri: pendente?.fotoUri ?? usuario.photoURL ?? undefined,
    membroDesde: agoraISO(),
  });
  await limparPerfilPendente();
  perfis.delete(usuario.uid);
}

export function obterUsuario(id: string): Promise<Usuario | null> {
  return executar(() => usuarioEmCache(id));
}

export function obterMeuPerfil() {
  const uid = usuarioAtual().uid;
  perfis.delete(uid);
  return obterUsuario(uid);
}

export function salvarMeuPerfil(dados: Partial<Pick<Usuario, 'nome' | 'cidade' | 'bio' | 'fotoUri'>>) {
  const uid = usuarioAtual().uid;
  return executar(async () => {
    // Bio apagada vira null (o Firestore ignora campos undefined).
    const campos = 'bio' in dados ? { ...dados, bio: dados.bio ?? null } : dados;
    await updateDoc(doc(db, 'usuarios', uid), campos);
    perfis.delete(uid);
  });
}

// ---------- caronas ----------

export function buscarCaronas(filtro: FiltroBusca = {}): Promise<CaronaComMotorista[]> {
  return executar(async () => {
    const uid = auth.currentUser?.uid;
    const tolerancia = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    // Uma consulta simples (campo único, sem índice composto); os filtros de
    // trajeto e data são aplicados aqui, com as regras da busca (RNF-06: sem IA).
    const snap = await getDocs(query(collection(db, 'caronas'), where('validaAte', '>=', tolerancia)));
    const encontradas = snap.docs
      .map((d) => paraCarona(d.id, d.data(), filtro.data))
      .filter((c): c is Carona => c !== null)
      .filter((c) => new Date(c.dataHora).getTime() >= Date.now() - 60 * 60 * 1000)
      .filter((c) => c.motoristaId !== uid)
      .filter((c) => !filtro.horario || pertoDoHorario(c.dataHora, filtro.horario))
      // Trajeto: passa pela cidade (ou ponto) de saída e depois pela de chegada (RF-06 e RF-20).
      .map((carona) => ({ carona, ...atendeBusca(carona, filtro) }))
      .filter((r) => r.atende);
    // Primeiro as que passam pelos pontos pedidos; depois, por horário de saída.
    encontradas.sort(
      (a, b) => b.pontosEncontrados - a.pontosEncontrados || a.carona.dataHora.localeCompare(b.carona.dataHora),
    );
    return anexarMotoristas(encontradas.map((r) => r.carona));
  });
}

export function obterCarona(id: string): Promise<CaronaComMotorista | null> {
  return executar(async () => {
    const snap = await getDoc(doc(db, 'caronas', id));
    const carona = snap.exists() ? paraCarona(snap.id, snap.data()) : null;
    if (!carona) return null;
    return { carona, motorista: await usuarioOuDesconhecido(carona.motoristaId) };
  });
}

export function publicarCarona(dados: NovaCarona): Promise<Carona> {
  const uid = usuarioAtual().uid;
  return executar(async () => {
    const recorrente = !!dados.recorrencia?.diasSemana.length;
    const documento = {
      motoristaId: uid,
      origem: dados.origem,
      destino: dados.destino,
      paradas: dados.paradas,
      pontoEmbarque: dados.pontoEmbarque?.trim() || undefined,
      // Lugares por onde passa dentro das cidades, na ordem (RF-20).
      pontos: dados.pontos.length ? dados.pontos : undefined,
      // Trajeto normalizado (sem acento, minúsculo) para a busca por paradas.
      trajeto: [dados.origem, ...dados.paradas, dados.destino].map(normalizar),
      primeiraSaida: dados.dataHora,
      validaAte: recorrente ? SEM_DATA_FINAL : dados.dataHora,
      vagasTotais: dados.vagasTotais,
      vagasDisponiveis: dados.vagasTotais,
      valorPorVaga: dados.valorPorVaga,
      observacoes: dados.observacoes || undefined,
      recorrencia: recorrente ? { diasSemana: [...dados.recorrencia!.diasSemana].sort() } : undefined,
      textoOriginal: dados.textoOriginal || undefined,
      criadaEm: agoraISO(),
    };
    const ref = await addDoc(collection(db, 'caronas'), documento);
    perfis.delete(uid);
    return paraCarona(ref.id, documento)!;
  });
}

export function listarMinhasCaronas(): Promise<Carona[]> {
  const uid = usuarioAtual().uid;
  return comCache('minhas-caronas', async () => {
    const snap = await getDocs(query(collection(db, 'caronas'), where('motoristaId', '==', uid)));
    return snap.docs
      .map((d) => paraCarona(d.id, d.data()))
      .filter((c): c is Carona => c !== null)
      .sort((a, b) => b.dataHora.localeCompare(a.dataHora));
  });
}

// ---------- reservas ----------

const idReserva = (caronaId: string, passageiroId: string) => `${caronaId}_${passageiroId}`;

/** RF-07: o passageiro pede a vaga; ela só é ocupada quando o motorista confirma. */
export function solicitarVaga(caronaId: string): Promise<void> {
  const uid = usuarioAtual().uid;
  return executar(() =>
    runTransaction(db, async (tx) => {
      const refCarona = doc(db, 'caronas', caronaId);
      const refReserva = doc(db, 'reservas', idReserva(caronaId, uid));
      const [carona, reserva] = await Promise.all([tx.get(refCarona), tx.get(refReserva)]);
      if (!carona.exists()) throw new Error('Esta carona não existe mais.');
      const c = carona.data();
      if (c.motoristaId === uid) throw new Error('Você é o motorista desta carona.');
      if (reserva.exists() && ['pendente', 'confirmada'].includes(reserva.data().status)) return;
      if (c.vagasDisponiveis <= 0) throw new Error('Esta carona não tem mais vagas disponíveis.');
      tx.set(refReserva, {
        caronaId,
        passageiroId: uid,
        motoristaId: c.motoristaId,
        status: 'pendente',
        criadaEm: agoraISO(),
      });
    }),
  );
}

/**
 * RF-08 / RF-15 / RNF-05: o motorista aceita ou recusa um pedido. A vaga é
 * descontada numa transação: se dois pedidos disputarem a última vaga, só o
 * primeiro aceito é confirmado. Quando a carona lota, os pedidos que ainda
 * estavam pendentes são recusados com o motivo "lotada".
 */
export function responderSolicitacao(reservaId: string, aceitar: boolean): Promise<void> {
  const uid = usuarioAtual().uid;
  return executar(async () => {
    const refReserva = doc(db, 'reservas', reservaId);
    const lotou = await runTransaction(db, async (tx) => {
      const reserva = await tx.get(refReserva);
      if (!reserva.exists()) throw new Error('Este pedido não existe mais.');
      const r = reserva.data();
      const refCarona = doc(db, 'caronas', r.caronaId);
      const carona = await tx.get(refCarona);
      if (r.status !== 'pendente') throw new Error('Este pedido já foi respondido ou cancelado.');
      if (!aceitar) {
        tx.update(refReserva, { status: 'recusada', respondidaEm: agoraISO() });
        return false;
      }
      const vagas = carona.data()?.vagasDisponiveis ?? 0;
      if (vagas <= 0) throw new Error('A carona já está lotada. Não há vaga para este pedido.');
      tx.update(refCarona, { vagasDisponiveis: vagas - 1 });
      tx.update(refReserva, { status: 'confirmada', respondidaEm: agoraISO() });
      return vagas - 1 === 0 ? (r.caronaId as string) : false;
    });

    if (lotou) {
      const pendentes = await getDocs(
        query(
          collection(db, 'reservas'),
          where('motoristaId', '==', uid),
          where('caronaId', '==', lotou),
          where('status', '==', 'pendente'),
        ),
      );
      const lote = writeBatch(db);
      pendentes.forEach((p) => lote.update(p.ref, { status: 'recusada', motivo: 'lotada', respondidaEm: agoraISO() }));
      await lote.commit();
    }
  });
}

/** RF-12: cancela o pedido ou a vaga confirmada; a vaga volta a ficar disponível. */
export function cancelarReserva(reservaId: string): Promise<void> {
  return executar(() =>
    runTransaction(db, async (tx) => {
      const refReserva = doc(db, 'reservas', reservaId);
      const reserva = await tx.get(refReserva);
      if (!reserva.exists()) return;
      const r = reserva.data();
      const refCarona = doc(db, 'caronas', r.caronaId);
      const carona = await tx.get(refCarona);
      if (r.status !== 'pendente' && r.status !== 'confirmada') return;
      if (r.status === 'confirmada' && carona.exists()) {
        tx.update(refCarona, { vagasDisponiveis: carona.data().vagasDisponiveis + 1 });
      }
      tx.update(refReserva, { status: 'cancelada', canceladaEm: agoraISO() });
    }),
  );
}

/** Reserva do usuário atual numa carona (inclusive recusada), ou null. */
export async function obterMinhaReserva(caronaId: string): Promise<Reserva | null> {
  const uid = auth.currentUser?.uid;
  if (!uid) return null;
  return executar(async () => {
    const snap = await getDoc(doc(db, 'reservas', idReserva(caronaId, uid)));
    if (!snap.exists() || snap.data().status === 'cancelada') return null;
    return paraReserva(snap.id, snap.data());
  });
}

async function minhaNota(reservaId: string, uid: string) {
  const snap = await getDoc(doc(db, 'avaliacoes', `${reservaId}_${uid}`)).catch(() => null);
  return snap?.exists() ? (snap.data().nota as number) : undefined;
}

export function listarMinhasReservas(): Promise<ReservaDetalhada[]> {
  const uid = usuarioAtual().uid;
  return comCache('minhas-reservas', async () => {
    const snap = await getDocs(query(collection(db, 'reservas'), where('passageiroId', '==', uid)));
    const itens = await Promise.all(
      snap.docs.map(async (r): Promise<ReservaDetalhada | null> => {
        const caronaSnap = await getDoc(doc(db, 'caronas', r.data().caronaId)).catch(() => null);
        const carona = caronaSnap?.exists() ? paraCarona(caronaSnap.id, caronaSnap.data()) : null;
        if (!carona) return null;
        const reserva = { ...paraReserva(r.id, r.data(), carona), avaliacao: await minhaNota(r.id, uid) };
        return { reserva, carona, motorista: await usuarioOuDesconhecido(carona.motoristaId) };
      }),
    );
    return itens
      .filter((i): i is ReservaDetalhada => i !== null)
      .sort((a, b) => b.carona.dataHora.localeCompare(a.carona.dataHora));
  });
}

/** Pedidos de vaga de uma carona do usuário atual (motorista). */
export function listarSolicitacoes(caronaId: string): Promise<Solicitacao[]> {
  const uid = usuarioAtual().uid;
  return executar(async () => {
    const [caronaSnap, snap] = await Promise.all([
      getDoc(doc(db, 'caronas', caronaId)),
      getDocs(query(collection(db, 'reservas'), where('motoristaId', '==', uid), where('caronaId', '==', caronaId))),
    ]);
    const carona = caronaSnap.exists() ? paraCarona(caronaSnap.id, caronaSnap.data()) : null;
    const ordem: Record<string, number> = { pendente: 0, confirmada: 1, concluida: 1 };
    const itens = await Promise.all(
      snap.docs
        .filter((r) => r.data().status === 'pendente' || r.data().status === 'confirmada')
        .map(async (r) => ({
          reserva: { ...paraReserva(r.id, r.data(), carona ?? undefined), avaliacao: await minhaNota(r.id, uid) },
          passageiro: await usuarioOuDesconhecido(r.data().passageiroId),
        })),
    );
    return itens.sort((a, b) => (ordem[a.reserva.status] ?? 2) - (ordem[b.reserva.status] ?? 2));
  });
}

/**
 * Aviso dentro do app (em vez de notificação push): acompanha em tempo real
 * quantos pedidos de vaga aguardam resposta do motorista.
 */
export function observarPedidosPendentes(aoMudar: (quantidade: number) => void) {
  const uid = auth.currentUser?.uid;
  if (!uid) return () => undefined;
  return onSnapshot(
    query(collection(db, 'reservas'), where('motoristaId', '==', uid), where('status', '==', 'pendente')),
    (snap) => aoMudar(snap.size),
    () => aoMudar(0),
  );
}

// ---------- avaliações ----------

export function obterViagemParaAvaliar(reservaId: string): Promise<ViagemParaAvaliar | null> {
  const uid = usuarioAtual().uid;
  return executar(async () => {
    const snap = await getDoc(doc(db, 'reservas', reservaId));
    if (!snap.exists()) return null;
    const r = snap.data();
    const caronaSnap = await getDoc(doc(db, 'caronas', r.caronaId));
    const carona = caronaSnap.exists() ? paraCarona(caronaSnap.id, caronaSnap.data()) : null;
    if (!carona) return null;
    const papel = r.passageiroId === uid ? 'passageiro' : 'motorista';
    const avaliado = await usuarioOuDesconhecido(papel === 'passageiro' ? r.motoristaId : r.passageiroId);
    const reserva = { ...paraReserva(snap.id, r, carona), avaliacao: await minhaNota(snap.id, uid) };
    return { reserva, carona, avaliado, papel };
  });
}

/** RF-10: motorista e passageiro se avaliam; a média é recalculada a partir das notas. */
export function avaliarViagem(reservaId: string, nota: number): Promise<void> {
  const uid = usuarioAtual().uid;
  return executar(async () => {
    const snap = await getDoc(doc(db, 'reservas', reservaId));
    if (!snap.exists()) throw new Error('Viagem não encontrada.');
    const r = snap.data();
    const avaliadoId = r.passageiroId === uid ? r.motoristaId : r.passageiroId;
    const ref = doc(db, 'avaliacoes', `${reservaId}_${uid}`);
    if ((await getDoc(ref)).exists()) throw new Error('Você já avaliou esta viagem.');
    await setDoc(ref, {
      reservaId,
      caronaId: r.caronaId,
      autorId: uid,
      avaliadoId,
      nota,
      criadaEm: agoraISO(),
    });
    perfis.delete(avaliadoId);
  });
}
