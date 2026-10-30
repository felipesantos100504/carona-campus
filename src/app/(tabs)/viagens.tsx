import { router } from 'expo-router';
import { ReactElement, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Botao } from '@/components/botao';
import { CardCarona } from '@/components/card-carona';
import { Chip } from '@/components/chip';
import { EstadoCarregando, EstadoErro, EstadoVazio } from '@/components/estados';
import { listarMinhasCaronas, listarMinhasReservas } from '@/data/repositorio';
import { Carona, ReservaDetalhada } from '@/data/tipos';
import { useCarregamento } from '@/hooks/use-carregamento';
import { cores, espaco, tipografia } from '@/theme';

const ROTULO_STATUS = {
  pendente: 'Aguardando motorista',
  confirmada: 'Vaga confirmada',
  cancelada: 'Cancelada',
  concluida: 'Viagem realizada',
};

type Aba = 'passageiro' | 'motorista';

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

  function renderizarReserva({ item }: { item: ReservaDetalhada }) {
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

  function renderizarCarona({ item }: { item: Carona }) {
    const reservadas = item.vagasTotais - item.vagasDisponiveis;
    const passada = new Date(item.dataHora).getTime() < Date.now();
    return (
      <View style={styles.item}>
        <Text style={styles.status}>
          {passada ? 'Viagem realizada · ' : ''}
          {reservadas} de {item.vagasTotais} {item.vagasTotais === 1 ? 'vaga reservada' : 'vagas reservadas'}
        </Text>
        <CardCarona
          carona={item}
          onPress={() => router.push({ pathname: '/carona/[id]', params: { id: item.id } })}
        />
      </View>
    );
  }

  const cabecalho = (
    <View style={styles.cabecalho}>
      <Text style={styles.titulo}>Minhas viagens</Text>
      <View style={styles.abas}>
        <Chip rotulo="Como passageiro" selecionado={aba === 'passageiro'} onPress={() => setAba('passageiro')} />
        <Chip rotulo="Como motorista" selecionado={aba === 'motorista'} onPress={() => setAba('motorista')} />
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.raiz} edges={['top']}>
      {aba === 'passageiro' ? (
        <FlatList
          key="passageiro"
          data={reservas.status === 'pronto' ? reservas.dados : []}
          keyExtractor={(item) => item.reserva.id}
          contentContainerStyle={styles.lista}
          ListHeaderComponent={cabecalho}
          ListEmptyComponent={estadoDaLista(
            reservas,
            <EstadoVazio
              titulo="Nenhuma reserva ainda"
              mensagem="Quando você reservar uma vaga, ela aparece aqui."
              icone="car-outline"
              acao={{ titulo: 'Buscar caronas', onPress: () => router.navigate('/(tabs)') }}
            />,
          )}
          renderItem={renderizarReserva}
        />
      ) : (
        <FlatList
          key="motorista"
          data={caronas.status === 'pronto' ? caronas.dados : []}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.lista}
          ListHeaderComponent={cabecalho}
          ListEmptyComponent={estadoDaLista(
            caronas,
            <EstadoVazio
              titulo="Nenhuma carona publicada"
              mensagem="As viagens que você oferecer como motorista aparecem aqui."
              icone="car-outline"
              acao={{ titulo: 'Publicar carona', onPress: () => router.navigate('/(tabs)/publicar') }}
            />,
          )}
          renderItem={renderizarCarona}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  raiz: { flex: 1, backgroundColor: cores.fundo },
  lista: { padding: espaco.md, gap: espaco.lg, flexGrow: 1 },
  cabecalho: { gap: espaco.md, paddingTop: espaco.lg },
  titulo: { ...tipografia.tituloG, color: cores.texto },
  abas: { flexDirection: 'row', gap: espaco.sm },
  item: { gap: espaco.sm },
  status: { ...tipografia.rotuloP, color: cores.textoSecundario },
});
