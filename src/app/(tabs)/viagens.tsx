import { router } from 'expo-router';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Botao } from '@/components/botao';
import { CardCarona } from '@/components/card-carona';
import { EstadoCarregando, EstadoErro, EstadoVazio } from '@/components/estados';
import { Placeholder } from '@/components/placeholder';
import { listarMinhasReservas } from '@/data/repositorio';
import { ReservaDetalhada } from '@/data/tipos';
import { useCarregamento } from '@/hooks/use-carregamento';
import { cores, espaco, tipografia } from '@/theme';

const ROTULO_STATUS = {
  pendente: 'Aguardando motorista',
  confirmada: 'Vaga confirmada',
  cancelada: 'Cancelada',
  concluida: 'Viagem realizada',
};

// TODO(Integrante D): abas "Como passageiro" / "Como motorista"
// (listarMinhasCaronas), visual do status e agrupamento por data.
export default function Viagens() {
  const lista = useCarregamento(listarMinhasReservas);

  function vazioOuEstado() {
    if (lista.status === 'carregando') return <EstadoCarregando />;
    if (lista.status === 'erro') {
      return <EstadoErro mensagem={lista.erro.message} onTentarNovamente={lista.recarregar} />;
    }
    return (
      <EstadoVazio
        titulo="Nenhuma viagem ainda"
        mensagem="Quando você reservar uma vaga, ela aparece aqui."
        icone="car-outline"
        acao={{ titulo: 'Buscar caronas', onPress: () => router.navigate('/(tabs)') }}
      />
    );
  }

  function renderizar({ item }: { item: ReservaDetalhada }) {
    const { reserva, carona, motorista } = item;
    const podeAvaliar = reserva.status === 'concluida' && !reserva.avaliacao;
    return (
      <View style={styles.item}>
        <Text style={styles.status}>{ROTULO_STATUS[reserva.status]}</Text>
        <CardCarona
          carona={carona}
          motorista={motorista}
          onPress={() => router.push({ pathname: '/carona/[id]', params: { id: carona.id } })}
        />
        {podeAvaliar ? (
          <Botao
            titulo="Avaliar viagem"
            icone="star-outline"
            variante="contorno"
            onPress={() =>
              router.push({ pathname: '/avaliar/[reservaId]', params: { reservaId: reserva.id } })
            }
          />
        ) : null}
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.raiz} edges={['top']}>
      <FlatList
        data={lista.status === 'pronto' ? lista.dados : []}
        keyExtractor={(item) => item.reserva.id}
        contentContainerStyle={styles.lista}
        ListHeaderComponent={
          <View style={styles.cabecalho}>
            <Text style={styles.titulo}>Minhas viagens</Text>
            <Placeholder responsavel="Integrante D" itens={['Separar passageiro / motorista', 'Refinar visual do status']} />
          </View>
        }
        ListEmptyComponent={vazioOuEstado()}
        renderItem={renderizar}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  raiz: { flex: 1, backgroundColor: cores.fundo },
  lista: { padding: espaco.md, gap: espaco.lg, flexGrow: 1 },
  cabecalho: { gap: espaco.md, paddingTop: espaco.lg },
  titulo: { ...tipografia.tituloG, color: cores.texto },
  item: { gap: espaco.sm },
  status: { ...tipografia.rotuloP, color: cores.textoSecundario },
});
