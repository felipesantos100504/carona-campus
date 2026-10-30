import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { ReactElement, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Avatar } from '@/components/avatar';
import { Botao } from '@/components/botao';
import { Cabecalho } from '@/components/cabecalho';
import { EstadoCarregando, EstadoErro, EstadoVazio } from '@/components/estados';
import { Segmentado } from '@/components/segmentado';
import { Selo, Tom } from '@/components/selo';
import { listarMinhasCaronas, listarMinhasReservas } from '@/data/repositorio';
import { Carona, ReservaDetalhada, StatusReserva } from '@/data/tipos';
import { useCarregamento } from '@/hooks/use-carregamento';
import { cores, espaco, raio, sombra, tipografia } from '@/theme';
import { formatarData, formatarDiasSemana, formatarHora, formatarMoeda } from '@/utils/formato';

const STATUS: Record<StatusReserva, { rotulo: string; tom: Tom; cor: string }> = {
  pendente: { rotulo: 'Aguardando motorista', tom: 'indigo', cor: cores.primaria },
  confirmada: { rotulo: 'Vaga confirmada', tom: 'verdeForte', cor: cores.verde },
  cancelada: { rotulo: 'Cancelada', tom: 'erro', cor: cores.erro },
  concluida: { rotulo: 'Viagem realizada', tom: 'neutro', cor: cores.textoSecundario },
};

type Aba = 'passageiro' | 'motorista';

function abrirCarona(id: string) {
  router.push({ pathname: '/carona/[id]', params: { id } });
}

// Reservas como passageiro e caronas publicadas como motorista (RF-09).
export default function Viagens() {
  const [aba, setAba] = useState<Aba>('passageiro');
  const reservas = useCarregamento(listarMinhasReservas);
  const caronas = useCarregamento(listarMinhasCaronas);

  function estadoDaLista(lista: typeof reservas | typeof caronas, vazio: ReactElement) {
    if (lista.status === 'carregando') return <EstadoCarregando />;
    if (lista.status === 'erro') {
      return <EstadoErro mensagem={lista.erro.message} onTentarNovamente={lista.recarregar} />;
    }
    return vazio;
  }

  function cabecalho(titulo: string, quantidade?: number) {
    return (
      <View style={styles.cabecalho}>
        <Cabecalho titulo="Minhas viagens" />
        <Segmentado
          valor={aba}
          onChange={setAba}
          opcoes={[
            { valor: 'passageiro', rotulo: 'Como passageiro', icone: 'person-outline' },
            { valor: 'motorista', rotulo: 'Como motorista', icone: 'car-outline' },
          ]}
        />
        <View style={styles.secao}>
          <Ionicons name="git-network-outline" size={16} color={cores.primaria} />
          <Text style={styles.tituloSecao}>{titulo}</Text>
          {quantidade ? (
            <Text style={styles.contagem}>
              {quantidade} {quantidade === 1 ? 'registro' : 'registros'}
            </Text>
          ) : null}
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.raiz} edges={['top']}>
      {aba === 'passageiro' ? (
        <FlatList
          key="passageiro"
          data={reservas.status === 'pronto' ? reservas.dados : []}
          keyExtractor={(item) => item.reserva.id}
          contentContainerStyle={styles.lista}
          ListHeaderComponent={cabecalho(
            'Reservas intermunicipais',
            reservas.status === 'pronto' ? reservas.dados.length : undefined,
          )}
          ListEmptyComponent={estadoDaLista(
            reservas,
            <EstadoVazio
              titulo="Nenhuma reserva ainda"
              mensagem="Quando você reservar uma vaga, ela aparece aqui."
              icone="car-outline"
              acao={{ titulo: 'Buscar caronas', icone: 'search', onPress: () => router.navigate('/(tabs)') }}
            />,
          )}
          renderItem={({ item }) => <CartaoReserva item={item} />}
        />
      ) : (
        <FlatList
          key="motorista"
          data={caronas.status === 'pronto' ? caronas.dados : []}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.lista}
          ListHeaderComponent={cabecalho(
            'Caronas que você oferece',
            caronas.status === 'pronto' ? caronas.dados.length : undefined,
          )}
          ListEmptyComponent={estadoDaLista(
            caronas,
            <EstadoVazio
              titulo="Nenhuma carona publicada"
              mensagem="As viagens que você oferecer como motorista aparecem aqui."
              icone="car-outline"
              acao={{
                titulo: 'Publicar carona',
                icone: 'add-circle-outline',
                onPress: () => router.navigate('/(tabs)/publicar'),
              }}
            />,
          )}
          renderItem={({ item }) => <CartaoMinhaCarona carona={item} />}
        />
      )}
    </SafeAreaView>
  );
}

function CartaoReserva({ item }: { item: ReservaDetalhada }) {
  const { reserva, carona, motorista } = item;
  const status = STATUS[reserva.status];
  const podeAvaliar = reserva.status === 'concluida' && !reserva.avaliacao;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Reserva de ${carona.origem} para ${carona.destino}`}
      onPress={() => abrirCarona(carona.id)}
      style={({ pressed }) => [styles.cartao, pressed && styles.pressionado]}>
      <View style={styles.linha}>
        <View style={styles.trajeto}>
          <View style={[styles.ponto, { backgroundColor: status.cor }]} />
          <Text style={styles.cidades} numberOfLines={1}>
            {carona.origem} → {carona.destino}
          </Text>
        </View>
        <Selo rotulo={status.rotulo} tom={status.tom} />
      </View>
      <Text style={styles.legenda}>
        {formatarData(carona.dataHora)} às {formatarHora(carona.dataHora)}
      </Text>

      <View style={styles.caixa}>
        <Avatar nome={motorista.nome} fotoUri={motorista.fotoUri} tamanho={36} verificado />
        <View style={styles.flex}>
          <Text style={styles.nome} numberOfLines={1}>
            {motorista.nome}
          </Text>
          <Text style={styles.legenda}>Motorista verificado</Text>
        </View>
        <View style={styles.direita}>
          <Text style={styles.legenda}>Contribuição</Text>
          <Text style={styles.valorPequeno}>{formatarMoeda(carona.valorPorVaga)}</Text>
        </View>
      </View>

      {podeAvaliar ? (
        <View style={styles.linha}>
          <Text style={[styles.legenda, styles.flex]}>Sua avaliação ajuda a comunidade.</Text>
          <Botao
            titulo="Avaliar motorista"
            icone="star"
            variante="verde"
            pequeno
            onPress={() => router.push({ pathname: '/avaliar/[reservaId]', params: { reservaId: reserva.id } })}
          />
        </View>
      ) : reserva.avaliacao ? (
        <Text style={styles.legenda}>
          <Ionicons name="star" size={12} color={cores.estrela} /> Você avaliou com {reserva.avaliacao}{' '}
          {reserva.avaliacao === 1 ? 'estrela' : 'estrelas'}.
        </Text>
      ) : null}
    </Pressable>
  );
}

function CartaoMinhaCarona({ carona }: { carona: Carona }) {
  const reservadas = carona.vagasTotais - carona.vagasDisponiveis;
  const passada = new Date(carona.dataHora).getTime() < Date.now();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Sua carona de ${carona.origem} para ${carona.destino}`}
      onPress={() => abrirCarona(carona.id)}
      style={({ pressed }) => [styles.cartao, pressed && styles.pressionado]}>
      <View style={styles.linha}>
        {carona.recorrencia ? (
          <Selo rotulo={`Toda semana: ${formatarDiasSemana(carona.recorrencia.diasSemana)}`} icone="repeat" />
        ) : (
          <Selo rotulo="Viagem única" icone="calendar-outline" tom="neutro" />
        )}
        <Selo rotulo={passada ? 'Realizada' : 'Publicada'} tom={passada ? 'neutro' : 'verdeForte'} />
      </View>

      <View style={styles.linha}>
        <View>
          <Text style={styles.legenda}>Horário de partida</Text>
          <Text style={styles.quando}>
            {formatarData(carona.dataHora)} às {formatarHora(carona.dataHora)}
          </Text>
        </View>
        <View style={styles.direita}>
          <Text style={styles.valor}>{formatarMoeda(carona.valorPorVaga)}</Text>
          <Text style={styles.legenda}>por vaga</Text>
        </View>
      </View>

      <View style={[styles.caixa, styles.rota]}>
        <View style={styles.linha}>
          <View style={styles.trajeto}>
            <View style={[styles.ponto, { backgroundColor: cores.verde }]} />
            <Text style={styles.nome}>{carona.origem}</Text>
          </View>
          <Text style={styles.legenda}>Origem</Text>
        </View>
        {carona.paradas.length > 0 ? (
          <Text style={[styles.legenda, styles.paradas]}>Passa por {carona.paradas.join(', ')}</Text>
        ) : null}
        <View style={styles.linha}>
          <View style={styles.trajeto}>
            <View style={[styles.ponto, { backgroundColor: cores.primaria }]} />
            <Text style={styles.nome}>{carona.destino}</Text>
          </View>
          <Text style={styles.legenda}>Destino</Text>
        </View>
      </View>

      <View style={styles.ocupacao}>
        <View style={styles.linha}>
          <Text style={styles.legenda}>Ocupação do veículo</Text>
          <Text style={styles.vagasLivres}>
            {carona.vagasDisponiveis} de {carona.vagasTotais} vagas livres
          </Text>
        </View>
        <View style={styles.barra}>
          <View style={[styles.barraCheia, { width: `${(reservadas / carona.vagasTotais) * 100}%` }]} />
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  raiz: { flex: 1, backgroundColor: cores.fundo },
  lista: { padding: espaco.md, gap: espaco.md, flexGrow: 1 },
  cabecalho: { gap: espaco.md },
  secao: { flexDirection: 'row', alignItems: 'center', gap: espaco.xs },
  tituloSecao: { ...tipografia.rotulo, color: cores.texto, flex: 1 },
  contagem: { ...tipografia.legenda, color: cores.textoSecundario },
  cartao: {
    backgroundColor: cores.superficie,
    borderRadius: raio.lg,
    borderWidth: 1,
    borderColor: cores.borda,
    padding: espaco.md,
    gap: espaco.sm + 4,
    ...sombra.cartao,
  },
  pressionado: { opacity: 0.92 },
  linha: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: espaco.sm },
  trajeto: { flexDirection: 'row', alignItems: 'center', gap: espaco.sm, flexShrink: 1 },
  ponto: { width: 8, height: 8, borderRadius: 4 },
  cidades: { ...tipografia.tituloP, color: cores.texto, flexShrink: 1 },
  legenda: { ...tipografia.legenda, color: cores.textoSecundario },
  caixa: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaco.sm,
    padding: espaco.sm + 4,
    borderRadius: raio.md,
    backgroundColor: cores.superficieAlt,
  },
  rota: { flexDirection: 'column', alignItems: 'stretch', gap: espaco.sm },
  paradas: { paddingLeft: espaco.md },
  flex: { flex: 1 },
  nome: { ...tipografia.rotulo, color: cores.texto },
  direita: { alignItems: 'flex-end' },
  quando: { ...tipografia.tituloP, color: cores.texto },
  valor: { ...tipografia.numero, color: cores.verde },
  valorPequeno: { ...tipografia.rotulo, color: cores.texto },
  ocupacao: { gap: espaco.xs },
  vagasLivres: { ...tipografia.rotuloP, color: cores.verde },
  barra: { height: 6, borderRadius: 3, backgroundColor: cores.superficieAlt, overflow: 'hidden' },
  barraCheia: { height: 6, borderRadius: 3, backgroundColor: cores.verde },
});
