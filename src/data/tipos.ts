export type Usuario = {
  id: string;
  nome: string;
  /** URL da foto (conta Google) ou imagem pequena em base64 (data URI). */
  fotoUri?: string;
  cidade: string;
  bio?: string;
  /** Calculados a partir da coleção "avaliacoes" (não ficam gravados no perfil). */
  avaliacaoMedia: number; // 0 a 5
  totalAvaliacoes: number;
  /** Quantidade de caronas oferecidas como motorista. */
  totalViagens: number;
  membroDesde: string; // ISO
};

export type Recorrencia = {
  /** 0 = domingo ... 6 = sábado */
  diasSemana: number[];
};

/** Lugar conhecido dentro de uma cidade (ex.: "Mercado Ítalo", em Dois Vizinhos). */
export type Ponto = {
  nome: string;
  cidade: string;
};

export type Carona = {
  id: string;
  motoristaId: string;
  /** Cidade de saída. Igual ao destino nas caronas dentro da mesma cidade. */
  origem: string;
  destino: string;
  /** Cidades por onde o motorista passa, na ordem do trajeto. */
  paradas: string[];
  /** Local de embarque dentro da cidade de origem (ex.: "Posto Fênix"). */
  pontoEmbarque?: string;
  /**
   * Outros lugares por onde o motorista passa ou onde deixa passageiros, na
   * ordem (ex.: Mercado Ítalo → Posto Stop → UTFPR). Vazio se não informou (RF-20).
   */
  pontos: Ponto[];
  /** Próxima saída (ISO). Nas viagens recorrentes é calculada a partir da primeira saída. */
  dataHora: string;
  /** Primeira saída cadastrada pelo motorista (ISO). */
  primeiraSaida: string;
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

/**
 * Situação gravada no banco: pendente → confirmada | recusada, e cancelada.
 * "concluida" não é gravada: é como a tela mostra uma reserva confirmada de
 * uma viagem única que já aconteceu.
 */
export type StatusReserva = 'pendente' | 'confirmada' | 'recusada' | 'cancelada' | 'concluida';

export type Reserva = {
  /** Sempre `${caronaId}_${passageiroId}`: uma reserva por passageiro em cada carona. */
  id: string;
  caronaId: string;
  passageiroId: string;
  motoristaId: string;
  status: StatusReserva;
  /** Preenchido quando o pedido foi recusado automaticamente porque a carona lotou. */
  motivo?: 'lotada';
  /** Nota que o usuário atual deu nesta viagem, se já avaliou. */
  avaliacao?: number;
  criadaEm: string;
};

export type FiltroBusca = {
  origem?: string;
  destino?: string;
  /** Data no formato AAAA-MM-DD. */
  data?: string;
  /** Horário aproximado (HH:MM): mostra saídas até 1h30 antes ou depois. */
  horario?: string;
  /** Onde o passageiro quer embarcar: caronas que passam por esse ponto aparecem primeiro. */
  pontoEmbarque?: string;
  /** Onde o passageiro quer descer (ex.: "UTFPR"). */
  pontoChegada?: string;
};

export type CaronaComMotorista = { carona: Carona; motorista: Usuario };

export type ReservaDetalhada = { reserva: Reserva; carona: Carona; motorista: Usuario };

/** Pedido de vaga visto pelo motorista. */
export type Solicitacao = { reserva: Reserva; passageiro: Usuario };

/** Dados para a tela de avaliação: quem avalia quem, em qual viagem. */
export type ViagemParaAvaliar = {
  reserva: Reserva;
  carona: Carona;
  avaliado: Usuario;
  papel: 'passageiro' | 'motorista';
};

export type NovaCarona = Omit<
  Carona,
  'id' | 'motoristaId' | 'vagasDisponiveis' | 'criadaEm' | 'dataHora' | 'primeiraSaida'
> & { dataHora: string };
