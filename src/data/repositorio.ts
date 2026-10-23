import { apagarTudo, gravar, ler } from './armazenamento';
import { normalizar } from './cidades';
import { gerarDadosIniciais, ID_USUARIO_ATUAL } from './seed';
import {
  Carona,
  CaronaComMotorista,
  FiltroBusca,
  NovaCarona,
  Reserva,
  ReservaDetalhada,
  Usuario,
} from './tipos';

// Único ponto de acesso a dados das telas. Todas as funções são assíncronas e
// têm um atraso artificial para que os estados de carregamento apareçam.
// As regras de negócio aqui são propositalmente simples (etapa 2).

const ATRASO_MS = 700;

export class ErroDeRede extends Error {
  constructor() {
    super('Sem conexão com a internet (erro simulado).');
    this.name = 'ErroDeRede';
  }
}

type Config = { simularErro: boolean };

// ---------- infraestrutura ----------

let inicializacao: Promise<void> | null = null;

function garantirDados() {
  inicializacao ??= (async () => {
    const pronto = await ler('inicializado', false);
    if (pronto) return;
    const { usuarios, caronas, reservas } = gerarDadosIniciais();
    await Promise.all([
      gravar('usuarios', usuarios),
      gravar('caronas', caronas),
      gravar('reservas', reservas),
    ]);
    await gravar('inicializado', true);
  })();
  return inicializacao;
}

async function simularRede() {
  await garantirDados();
  await new Promise((r) => setTimeout(r, ATRASO_MS));
  const config = await obterConfig();
  if (config.simularErro) throw new ErroDeRede();
}

function gerarId(prefixo: string) {
  return `${prefixo}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

const lerUsuarios = () => ler<Usuario[]>('usuarios', []);
const lerCaronas = () => ler<Carona[]>('caronas', []);
const lerReservas = () => ler<Reserva[]>('reservas', []);

async function anexarMotoristas(caronas: Carona[]): Promise<CaronaComMotorista[]> {
  const usuarios = await lerUsuarios();
  return caronas.flatMap((carona) => {
    const motorista = usuarios.find((u) => u.id === carona.motoristaId);
    return motorista ? [{ carona, motorista }] : [];
  });
}

function dataLocal(iso: string) {
  const d = new Date(iso);
  const mes = String(d.getMonth() + 1).padStart(2, '0');
  const dia = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mes}-${dia}`;
}

/** A carona serve se passa pela origem e depois pelo destino buscados. */
function atendeTrajeto(carona: Carona, origem?: string, destino?: string) {
  const trajeto = [carona.origem, ...carona.paradas, carona.destino].map(normalizar);
  const iOrigem = origem ? trajeto.indexOf(normalizar(origem)) : 0;
  const iDestino = destino ? trajeto.lastIndexOf(normalizar(destino)) : trajeto.length - 1;
  return iOrigem !== -1 && iDestino !== -1 && iOrigem < iDestino;
}

// ---------- sessão (apenas local, sem autenticação nesta etapa) ----------

export const sessao = {
  estaAtiva: () => ler('sessao', false),
  entrar: () => gravar('sessao', true),
  sair: () => gravar('sessao', false),
};

// ---------- configuração de desenvolvimento ----------

export function obterConfig() {
  return ler<Config>('config', { simularErro: false });
}

export async function definirSimularErro(simularErro: boolean) {
  await gravar('config', { ...(await obterConfig()), simularErro });
}

export async function restaurarDadosDeExemplo() {
  await apagarTudo();
  inicializacao = null;
  await garantirDados();
  await sessao.entrar();
}

// ---------- caronas ----------

export async function buscarCaronas(filtro: FiltroBusca = {}): Promise<CaronaComMotorista[]> {
  await simularRede();
  const agora = Date.now();
  const caronas = (await lerCaronas())
    .filter((c) => new Date(c.dataHora).getTime() >= agora - 60 * 60 * 1000)
    .filter((c) => c.motoristaId !== ID_USUARIO_ATUAL)
    .filter((c) => atendeTrajeto(c, filtro.origem, filtro.destino))
    .filter((c) => !filtro.data || dataLocal(c.dataHora) === filtro.data)
    .sort((a, b) => a.dataHora.localeCompare(b.dataHora));
  return anexarMotoristas(caronas);
}

export async function obterCarona(id: string): Promise<CaronaComMotorista | null> {
  await simularRede();
  const carona = (await lerCaronas()).find((c) => c.id === id);
  if (!carona) return null;
  const [resultado] = await anexarMotoristas([carona]);
  return resultado ?? null;
}

export async function publicarCarona(dados: NovaCarona): Promise<Carona> {
  await simularRede();
  const nova: Carona = {
    ...dados,
    id: gerarId('c'),
    motoristaId: ID_USUARIO_ATUAL,
    vagasDisponiveis: dados.vagasTotais,
    criadaEm: new Date().toISOString(),
  };
  await gravar('caronas', [...(await lerCaronas()), nova]);
  return nova;
}

export async function listarMinhasCaronas(): Promise<Carona[]> {
  await simularRede();
  return (await lerCaronas())
    .filter((c) => c.motoristaId === ID_USUARIO_ATUAL)
    .sort((a, b) => b.dataHora.localeCompare(a.dataHora));
}

// ---------- reservas ----------

export async function solicitarVaga(caronaId: string): Promise<Reserva> {
  await simularRede();
  const reservas = await lerReservas();
  const existente = reservas.find(
    (r) => r.caronaId === caronaId && r.passageiroId === ID_USUARIO_ATUAL && r.status !== 'cancelada',
  );
  if (existente) return existente;

  // Simplificação da etapa 2: a vaga já sai confirmada. O fluxo
  // pendente → confirmada pelo motorista (RF-08) entra com o Firestore.
  const caronas = await lerCaronas();
  const carona = caronas.find((c) => c.id === caronaId);
  if (!carona || carona.vagasDisponiveis <= 0) {
    throw new Error('Esta carona não tem mais vagas disponíveis.');
  }
  carona.vagasDisponiveis -= 1;

  const reserva: Reserva = {
    id: gerarId('r'),
    caronaId,
    passageiroId: ID_USUARIO_ATUAL,
    status: 'confirmada',
    criadaEm: new Date().toISOString(),
  };
  await Promise.all([gravar('caronas', caronas), gravar('reservas', [...reservas, reserva])]);
  return reserva;
}

export async function cancelarReserva(reservaId: string) {
  await simularRede();
  const [reservas, caronas] = await Promise.all([lerReservas(), lerCaronas()]);
  const reserva = reservas.find((r) => r.id === reservaId);
  if (!reserva || reserva.status === 'cancelada') return;
  reserva.status = 'cancelada';
  const carona = caronas.find((c) => c.id === reserva.caronaId);
  if (carona) carona.vagasDisponiveis = Math.min(carona.vagasTotais, carona.vagasDisponiveis + 1);
  await Promise.all([gravar('reservas', reservas), gravar('caronas', caronas)]);
}

export async function obterMinhaReserva(caronaId: string): Promise<Reserva | null> {
  await garantirDados();
  const reservas = await lerReservas();
  return (
    reservas.find(
      (r) => r.caronaId === caronaId && r.passageiroId === ID_USUARIO_ATUAL && r.status !== 'cancelada',
    ) ?? null
  );
}

export async function listarMinhasReservas(): Promise<ReservaDetalhada[]> {
  await simularRede();
  const [reservas, caronas, usuarios] = await Promise.all([
    lerReservas(),
    lerCaronas(),
    lerUsuarios(),
  ]);
  return reservas
    .filter((r) => r.passageiroId === ID_USUARIO_ATUAL)
    .flatMap((reserva) => {
      const carona = caronas.find((c) => c.id === reserva.caronaId);
      const motorista = carona && usuarios.find((u) => u.id === carona.motoristaId);
      return carona && motorista ? [{ reserva, carona, motorista }] : [];
    })
    .sort((a, b) => b.carona.dataHora.localeCompare(a.carona.dataHora));
}

export async function avaliarViagem(reservaId: string, nota: number) {
  await simularRede();
  const reservas = await lerReservas();
  const reserva = reservas.find((r) => r.id === reservaId);
  if (!reserva) return;
  reserva.avaliacao = nota;
  await gravar('reservas', reservas);
}

// ---------- usuários ----------

export async function obterUsuario(id: string): Promise<Usuario | null> {
  await simularRede();
  return (await lerUsuarios()).find((u) => u.id === id) ?? null;
}

export function obterMeuPerfil() {
  return obterUsuario(ID_USUARIO_ATUAL);
}

export async function salvarMeuPerfil(dados: Partial<Pick<Usuario, 'nome' | 'cidade' | 'bio' | 'fotoUri'>>) {
  await simularRede();
  const usuarios = await lerUsuarios();
  const eu = usuarios.find((u) => u.id === ID_USUARIO_ATUAL);
  if (eu) Object.assign(eu, dados);
  await gravar('usuarios', usuarios);
}
