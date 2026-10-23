export type Usuario = {
  id: string;
  nome: string;
  fotoUri?: string;
  cidade: string;
  bio?: string;
  avaliacaoMedia: number; // 0 a 5
  totalAvaliacoes: number;
  totalViagens: number;
  membroDesde: string; // ISO
};

export type Recorrencia = {
  /** 0 = domingo ... 6 = sábado */
  diasSemana: number[];
};

export type Carona = {
  id: string;
  motoristaId: string;
  origem: string;
  destino: string;
  /** Cidades por onde o motorista passa, na ordem do trajeto. */
  paradas: string[];
  dataHora: string; // ISO da próxima saída
  vagasTotais: number;
  vagasDisponiveis: number;
  /** Valor apenas informativo: o pagamento é combinado fora do app. */
  valorPorVaga: number;
  observacoes?: string;
  recorrencia?: Recorrencia;
  /** Texto livre que o motorista digitou (entrada da IA). */
  textoOriginal?: string;
  criadaEm: string;
};

export type StatusReserva = 'pendente' | 'confirmada' | 'cancelada' | 'concluida';

export type Reserva = {
  id: string;
  caronaId: string;
  passageiroId: string;
  status: StatusReserva;
  /** Nota dada pelo passageiro ao motorista depois da viagem. */
  avaliacao?: number;
  criadaEm: string;
};

export type FiltroBusca = {
  origem?: string;
  destino?: string;
  /** Data no formato AAAA-MM-DD. */
  data?: string;
};

export type CaronaComMotorista = { carona: Carona; motorista: Usuario };

export type ReservaDetalhada = { reserva: Reserva; carona: Carona; motorista: Usuario };

export type NovaCarona = Omit<Carona, 'id' | 'motoristaId' | 'vagasDisponiveis' | 'criadaEm'>;
