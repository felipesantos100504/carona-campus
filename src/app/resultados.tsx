import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Aviso } from '@/components/aviso';
import { CardCarona } from '@/components/card-carona';
import { EstadoCarregando, EstadoErro, EstadoVazio } from '@/components/estados';
import { Selo } from '@/components/selo';
import { buscarCaronas } from '@/data/repositorio';
import { useCarregamento } from '@/hooks/use-carregamento';
import { cores, espaco, raio, sombra, tipografia } from '@/theme';
import { formatarData } from '@/utils/formato';

// Tela de referência para listas: mostra os três estados exigidos
// (carregando, vazio, erro) usando useCarregamento + componentes de estado.
export default function Resultados() {
  const { origem = '', destino = '', data = '' } = useLocalSearchParams<{
    origem?: string;
    destino?: string;
    data?: string;
  }>();

  const lista = useCarregamento(
    () => buscarCaronas({ origem: origem || undefined, destino: destino || undefined, data: data || undefined }),
    [origem, destino, data],
  );

  function conteudo() {
    if (lista.status === 'carregando') return <EstadoCarregando mensagem="Procurando caronas…" />;
    if (lista.status === 'erro') {
      return <EstadoErro mensagem={lista.erro.message} onTentarNovamente={lista.recarregar} />;
    }
    if (lista.dados.length === 0) {
      return (
        <EstadoVazio
          titulo="Nenhuma carona encontrada"
          mensagem="Nenhuma viagem passa por essas cidades na data escolhida. Tente outra data."
          acao={{ titulo: 'Alterar busca', icone: 'calendar-outline', onPress: () => router.back() }}
        />
      );
    }
    return null;
  }

  const pronto = lista.status === 'pronto' && lista.dados.length > 0;
  const quantidade = pronto ? lista.dados.length : 0;

  return (
    <SafeAreaView style={styles.raiz} edges={['bottom']}>
      <FlatList
        data={pronto ? lista.dados : []}
        keyExtractor={(item) => item.carona.id}
        contentContainerStyle={styles.lista}
        ListHeaderComponent={
          <View style={styles.resumo}>
            <View style={styles.resumoTextos}>
              <View style={styles.trajeto}>
                <View style={styles.ponto} />
                <Text style={styles.cidades} numberOfLines={1}>
                  {origem || 'Qualquer origem'} → {destino || 'qualquer destino'}
                </Text>
              </View>
              <View style={styles.linha}>
                <Ionicons name="calendar-outline" size={14} color={cores.textoSecundario} />
                <Text style={styles.data}>{data ? formatarData(`${data}T12:00:00`) : 'Qualquer dia'}</Text>
                {pronto ? (
                  <Selo
                    rotulo={`${quantidade} ${quantidade === 1 ? 'carona disponível' : 'caronas disponíveis'}`}
                    icone="car-outline"
                    tom="verde"
                  />
                ) : null}
              </View>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Alterar busca"
              onPress={() => router.back()}
              style={styles.editar}>
              <Ionicons name="pencil" size={18} color={cores.primaria} />
            </Pressable>
          </View>
        }
        ListEmptyComponent={conteudo()}
        ListFooterComponent={
          pronto ? <Aviso icone="cash-outline">O pagamento é combinado diretamente com o motorista ao embarcar.</Aviso> : null
        }
        renderItem={({ item }) => (
          <CardCarona
            carona={item.carona}
            motorista={item.motorista}
            onPress={() => router.push({ pathname: '/carona/[id]', params: { id: item.carona.id } })}
          />
        )}
        onRefresh={lista.recarregar}
        refreshing={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  raiz: { flex: 1, backgroundColor: cores.fundo },
  lista: { padding: espaco.md, gap: espaco.md, flexGrow: 1 },
  resumo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaco.sm,
    padding: espaco.md,
    borderRadius: raio.lg,
    backgroundColor: cores.superficie,
    borderWidth: 1,
    borderColor: cores.borda,
    ...sombra.cartao,
  },
  resumoTextos: { flex: 1, gap: espaco.xs },
  trajeto: { flexDirection: 'row', alignItems: 'center', gap: espaco.sm },
  ponto: { width: 8, height: 8, borderRadius: 4, backgroundColor: cores.verde },
  cidades: { ...tipografia.tituloP, color: cores.texto, flexShrink: 1 },
  linha: { flexDirection: 'row', alignItems: 'center', gap: espaco.xs, flexWrap: 'wrap' },
  data: { ...tipografia.legenda, color: cores.textoSecundario, marginRight: espaco.xs },
  editar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: cores.primariaSuave,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
