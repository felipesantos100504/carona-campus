import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Avatar } from '@/components/avatar';
import { Aviso } from '@/components/aviso';
import { Botao } from '@/components/botao';
import { SeloVagas } from '@/components/card-carona';
import { Cartao } from '@/components/cartao';
import { EstadoCarregando, EstadoErro, EstadoVazio } from '@/components/estados';
import { Selo } from '@/components/selo';
import { Tela } from '@/components/tela';
import { auth } from '@/data/firebase';
import {
  cancelarReserva,
  listarSolicitacoes,
  obterCarona,
  obterMinhaReserva,
  podeAvaliar,
  responderSolicitacao,
  solicitarVaga,
} from '@/data/repositorio';
import { dentroDaCidade, roteiro } from '@/data/roteiro';
import { Reserva, Solicitacao } from '@/data/tipos';
import { useCarregamento } from '@/hooks/use-carregamento';
import { cores, espaco, tipografia } from '@/theme';
import {
  contar,
  formatarDataExtensa,
  formatarDiasSemana,
  formatarHora,
  formatarMoeda,
  formatarNota,
  jaPassou,
} from '@/utils/formato';

export default function DetalhesCarona() {
  // Parâmetro recebido da lista: /carona/c1
  const { id } = useLocalSearchParams<{ id: string }>();
  const detalhe = useCarregamento(async () => {
    const resultado = await obterCarona(id);
    if (!resultado) return null;
    // O motorista vê os pedidos de vaga; o passageiro vê a própria reserva.
    const minha = resultado.carona.motoristaId === auth.currentUser?.uid;
    const [reserva, solicitacoes] = await Promise.all([
      minha ? null : obterMinhaReserva(id),
      minha ? listarSolicitacoes(id) : ([] as Solicitacao[]),
    ]);
    return { ...resultado, reserva, solicitacoes, minha };
  }, [id]);

  const [enviando, setEnviando] = useState(false);
  const [mensagem, setMensagem] = useState<{ tipo: 'ok' | 'erro'; texto: string } | null>(null);

  if (detalhe.status === 'carregando' && !detalhe.dados) {
    return (
      <Tela bordas={['bottom']}>
        <EstadoCarregando itens={2} />
      </Tela>
    );
  }
  if (detalhe.status === 'erro') {
    return (
      <Tela bordas={['bottom']}>
        <EstadoErro mensagem={detalhe.erro.message} onTentarNovamente={detalhe.recarregar} />
      </Tela>
    );
  }
  if (!detalhe.dados) {
    return (
      <Tela bordas={['bottom']}>
        <EstadoVazio titulo="Carona não encontrada" mensagem="Ela pode ter sido removida pelo motorista." icone="car-outline" />
      </Tela>
    );
  }

  const { carona, motorista, reserva, solicitacoes, minha: minhaCarona } = detalhe.dados;
  const itinerario = linhasDoItinerario(carona);
  const lotada = carona.vagasDisponiveis <= 0;
  const viagemPassada = jaPassou(carona.dataHora);

  async function executar(acao: () => Promise<unknown>, sucesso: string) {
    setEnviando(true);
    setMensagem(null);
    try {
      await acao();
      setMensagem({ tipo: 'ok', texto: sucesso });
      await detalhe.recarregar();
    } catch (e) {
      setMensagem({ tipo: 'erro', texto: e instanceof Error ? e.message : 'Erro inesperado.' });
    } finally {
      setEnviando(false);
    }
  }

  function rodapePassageiro() {
    if (minhaCarona) return null;
    if (reserva && podeAvaliar(reserva, carona)) {
      return (
        <Botao
          titulo="Avaliar motorista"
          icone="star"
          variante="verde"
          onPress={() => router.push({ pathname: '/avaliar/[reservaId]', params: { reservaId: reserva.id } })}
        />
      );
    }
    if (viagemPassada && !carona.recorrencia) return null;
    if (reserva?.status === 'pendente' || reserva?.status === 'confirmada') {
      const pendente = reserva.status === 'pendente';
      return (
        <Botao
          titulo={pendente ? 'Cancelar pedido' : 'Cancelar minha vaga'}
          variante="perigo"
          icone="close-circle-outline"
          carregando={enviando}
          onPress={() =>
            executar(() => cancelarReserva(reserva.id), pendente ? 'Seu pedido foi cancelado.' : 'Sua vaga foi cancelada.')
          }
        />
      );
    }
    if (reserva?.status === 'recusada') return null;
    return (
      <Botao
        titulo={lotada ? 'Carona lotada' : 'Solicitar vaga'}
        icone="person-add-outline"
        desabilitado={lotada}
        carregando={enviando}
        onPress={() => executar(() => solicitarVaga(carona.id), 'Pedido enviado! O motorista vai confirmar sua vaga.')}
      />
    );
  }


  return (
    <Tela bordas={['bottom']} rodape={rodapePassageiro()}>
      <View style={styles.topo}>
        {carona.recorrencia ? (
          <Selo rotulo={`Toda semana: ${formatarDiasSemana(carona.recorrencia.diasSemana)}`} icone="repeat" />
        ) : null}
        <Text style={styles.quando}>{formatarDataExtensa(carona.dataHora)}</Text>
      </View>

      {mensagem ? (
        <Aviso tipo={mensagem.tipo === 'ok' ? 'sucesso' : 'erro'}>{mensagem.texto}</Aviso>
      ) : reserva ? (
        <AvisoReserva reserva={reserva} />
      ) : minhaCarona ? (
        <Aviso icone="car-outline">Esta é uma carona publicada por você.</Aviso>
      ) : null}

      {minhaCarona ? (
        <PedidosDeVaga
          solicitacoes={solicitacoes}
          viagemAconteceu={jaPassou(carona.primeiraSaida)}
          enviando={enviando}
          responder={(s, aceitar) =>
            executar(
              () => responderSolicitacao(s.reserva.id, aceitar),
              aceitar ? `Vaga confirmada para ${s.passageiro.nome}.` : 'Pedido recusado.',
            )
          }
        />
      ) : null}

      <Cartao titulo="Itinerário planejado" icone="map-outline">
        <View>
          {itinerario.map((linha, i) => {
            const ultima = i === itinerario.length - 1;
            return (
              <View key={`${linha.titulo}-${i}`} style={styles.parada}>
                <View style={styles.marcadorColuna}>
                  <View style={linha.ponta ? styles.marcadorPonta : styles.marcadorParada} />
                  {ultima ? null : <View style={styles.linhaTrajeto} />}
                </View>
                <View style={styles.textosParada}>
                  <Text style={linha.ponta ? styles.cidadePonta : styles.cidadeParada}>{linha.titulo}</Text>
                  <Text style={styles.legenda}>{linha.legenda}</Text>
                </View>
                {i === 0 ? <Text style={styles.horario}>{formatarHora(carona.dataHora)}</Text> : null}
              </View>
            );
          })}
        </View>
      </Cartao>

      <Cartao>
        <View style={styles.linhaValores}>
          <View>
            <Text style={styles.legenda}>Contribuição</Text>
            <Text style={styles.valor}>
              {formatarMoeda(carona.valorPorVaga)} <Text style={styles.legenda}>/ vaga</Text>
            </Text>
          </View>
          <View style={styles.disponibilidade}>
            <Text style={styles.legenda}>Disponibilidade</Text>
            <View>
              <SeloVagas carona={carona} />
            </View>
            <Text style={styles.legenda}>de {carona.vagasTotais} no total</Text>
          </View>
        </View>
        <Aviso>O pagamento é combinado diretamente com o motorista. Não intermediamos cobranças no app.</Aviso>
      </Cartao>

      <Cartao>
        <View style={styles.motorista}>
          <Avatar nome={motorista.nome} fotoUri={motorista.fotoUri} tamanho={56} verificado />
          <View style={styles.dadosMotorista}>
            <View style={styles.linhaNome}>
              <Text style={styles.nome}>{motorista.nome}</Text>
              <Selo rotulo={formatarNota(motorista.avaliacaoMedia, motorista.totalAvaliacoes)} icone="star" tom="aviso" />
            </View>
            <Text style={styles.legenda}>
              {contar(motorista.totalAvaliacoes, 'avaliação', 'avaliações')} ·{' '}
              {contar(motorista.totalViagens, 'carona oferecida', 'caronas oferecidas')}
            </Text>
            <Selo rotulo="E-mail verificado" icone="shield-checkmark-outline" />
          </View>
        </View>
        {motorista.bio ? <Text style={styles.bio}>{motorista.bio}</Text> : null}
      </Cartao>

      {carona.observacoes ? (
        <Cartao titulo="Observações do motorista" icone="document-text-outline">
          <View style={styles.observacao}>
            <Ionicons name="location-outline" size={18} color={cores.primaria} />
            <Text style={styles.bio}>{carona.observacoes}</Text>
          </View>
        </Cartao>
      ) : null}
    </Tela>
  );
}

type LinhaItinerario = { titulo: string; legenda: string; ponta: boolean };

/**
 * Linhas do "Itinerário planejado" (RF-18 e RF-20). Entre cidades: cada cidade
 * e, abaixo dela, os pontos de passagem. Dentro da cidade: só os lugares, do
 * embarque até o último ponto.
 */
function linhasDoItinerario(carona: Parameters<typeof roteiro>[0]): LinhaItinerario[] {
  const trechos = roteiro(carona);
  if (dentroDaCidade(carona)) {
    const lugares = trechos.flatMap((t) => t.pontos.map((p) => ({ ...p, cidade: t.cidade })));
    if (lugares.length >= 2) {
      return lugares.map((p, i) => ({
        titulo: p.nome,
        legenda: `${p.cidade} · ${i === 0 ? 'Embarque' : i === lugares.length - 1 ? 'Destino final' : 'Ponto de passagem'}`,
        ponta: i === 0 || i === lugares.length - 1,
      }));
    }
  }
  return trechos.flatMap((t, i) => {
    const primeira = i === 0;
    const ultima = i === trechos.length - 1;
    const embarque = t.pontos.find((p) => p.embarque);
    const cidade: LinhaItinerario = {
      titulo: t.cidade,
      legenda: primeira
        ? embarque
          ? `Embarque: ${embarque.nome}`
          : 'Ponto de partida'
        : ultima
          ? 'Destino final'
          : 'Parada intermediária',
      ponta: primeira || ultima,
    };
    const pontos = t.pontos
      .filter((p) => !p.embarque)
      .map((p) => ({ titulo: p.nome, legenda: `Ponto de passagem em ${t.cidade}`, ponta: false }));
    return [cidade, ...pontos];
  });
}

function AvisoReserva({ reserva }: { reserva: Reserva }) {
  switch (reserva.status) {
    case 'pendente':
      return <Aviso icone="time-outline">Pedido enviado. Aguardando o motorista confirmar sua vaga.</Aviso>;
    case 'confirmada':
      return <Aviso tipo="sucesso">Sua vaga está confirmada. Combine os detalhes com o motorista.</Aviso>;
    case 'concluida':
      return <Aviso tipo="sucesso">Você viajou nesta carona.</Aviso>;
    case 'recusada':
      return (
        <Aviso tipo="erro">
          {reserva.motivo === 'lotada'
            ? 'A vaga não está mais disponível: a carona lotou antes de o seu pedido ser aceito.'
            : 'O motorista não aceitou seu pedido nesta carona.'}
        </Aviso>
      );
    default:
      return null;
  }
}

type PropsPedidos = {
  solicitacoes: Solicitacao[];
  viagemAconteceu: boolean;
  enviando: boolean;
  responder: (s: Solicitacao, aceitar: boolean) => void;
};

/** RF-08: o motorista confirma ou recusa cada pedido de vaga. */
function PedidosDeVaga({ solicitacoes, viagemAconteceu, enviando, responder }: PropsPedidos) {
  return (
    <Cartao titulo="Pedidos de vaga" icone="people-outline">
      {solicitacoes.length === 0 ? (
        <Text style={styles.legenda}>Nenhum pedido ainda. Eles aparecem aqui assim que alguém solicitar uma vaga.</Text>
      ) : null}
      {solicitacoes.map((s) => {
        const pendente = s.reserva.status === 'pendente';
        const avaliavel = !pendente && viagemAconteceu && !s.reserva.avaliacao;
        return (
          <View key={s.reserva.id} style={styles.pedido}>
            <View style={styles.motorista}>
              <Avatar nome={s.passageiro.nome} fotoUri={s.passageiro.fotoUri} tamanho={40} />
              <View style={styles.dadosMotorista}>
                <Text style={styles.nomePedido}>{s.passageiro.nome}</Text>
                <Text style={styles.legenda}>
                  {s.passageiro.totalAvaliacoes > 0
                    ? `${formatarNota(s.passageiro.avaliacaoMedia, s.passageiro.totalAvaliacoes)} ★ · ${contar(s.passageiro.totalAvaliacoes, 'avaliação', 'avaliações')}`
                    : 'Sem avaliações ainda'}
                </Text>
              </View>
              <Selo rotulo={pendente ? 'Aguardando você' : 'Confirmado'} tom={pendente ? 'aviso' : 'verdeForte'} />
            </View>
            {pendente ? (
              <View style={styles.acoes}>
                <Botao titulo="Recusar" variante="contorno" pequeno desabilitado={enviando} onPress={() => responder(s, false)} estilo={styles.flex} />
                <Botao titulo="Aceitar" icone="checkmark" variante="verde" pequeno desabilitado={enviando} onPress={() => responder(s, true)} estilo={styles.flex} />
              </View>
            ) : avaliavel ? (
              <Botao
                titulo="Avaliar passageiro"
                icone="star-outline"
                variante="suave"
                pequeno
                onPress={() => router.push({ pathname: '/avaliar/[reservaId]', params: { reservaId: s.reserva.id } })}
              />
            ) : null}
          </View>
        );
      })}
    </Cartao>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  pedido: { gap: espaco.sm, paddingVertical: espaco.sm, borderTopWidth: 1, borderTopColor: cores.borda },
  nomePedido: { ...tipografia.rotulo, color: cores.texto },
  acoes: { flexDirection: 'row', gap: espaco.sm },
  topo: { gap: espaco.sm, paddingTop: espaco.sm },
  quando: { ...tipografia.tituloG, color: cores.texto },
  parada: { flexDirection: 'row', gap: espaco.md },
  marcadorColuna: { alignItems: 'center', width: 20 },
  marcadorPonta: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 4,
    borderColor: cores.verde,
    backgroundColor: cores.superficie,
    marginTop: 3,
  },
  marcadorParada: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: cores.primaria,
    borderWidth: 3,
    borderColor: cores.primariaSuave,
    marginTop: 6,
  },
  linhaTrajeto: { width: 2, flex: 1, minHeight: 24, backgroundColor: cores.bordaForte, marginVertical: 2 },
  textosParada: { flex: 1, paddingBottom: espaco.md },
  cidadePonta: { ...tipografia.rotulo, color: cores.texto },
  cidadeParada: { ...tipografia.rotuloP, color: cores.texto },
  horario: { ...tipografia.rotuloP, color: cores.verde },
  legenda: { ...tipografia.legenda, color: cores.textoSecundario },
  linhaValores: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  valor: { ...tipografia.numero, color: cores.verde },
  disponibilidade: { alignItems: 'flex-end', gap: 2 },
  motorista: { flexDirection: 'row', alignItems: 'flex-start', gap: espaco.md },
  dadosMotorista: { flex: 1, gap: espaco.xs },
  linhaNome: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: espaco.sm },
  nome: { ...tipografia.tituloP, color: cores.texto, flexShrink: 1 },
  bio: { ...tipografia.corpo, color: cores.texto, flex: 1 },
  observacao: { flexDirection: 'row', gap: espaco.sm, alignItems: 'flex-start' },
});
