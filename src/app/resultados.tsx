import { router, useLocalSearchParams } from 'expo-router';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CardCarona } from '@/components/card-carona';
import { EstadoCarregando, EstadoErro, EstadoVazio } from '@/components/estados';
import { buscarCaronas } from '@/data/repositorio';
import { useCarregamento } from '@/hooks/use-carregamento';
import { cores, espaco, tipografia } from '@/theme';
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

  const resumo = [
    origem || 'Qualquer origem',
    '→',
    destino || 'qualquer destino',
    data ? `· ${formatarData(`${data}T12:00:00`)}` : '',
  ].join(' ');

  function conteudo() {
    if (lista.status === 'carregando') return <EstadoCarregando mensagem="Procurando caronas…" />;
    if (lista.status === 'erro') {
      return <EstadoErro mensagem={lista.erro.message} onTentarNovamente={lista.recarregar} />;
    }
    if (lista.dados.length === 0) {
      return (
        <EstadoVazio
          titulo="Nenhuma carona encontrada"
          mensagem="Tente outra data ou publique um pedido para motoristas que fazem esse trajeto."
          acao={{ titulo: 'Publicar pedido de carona', onPress: () => router.navigate('/publicar') }}
        />
      );
    }
    return null;
  }

  const pronto = lista.status === 'pronto' && lista.dados.length > 0;

  return (
    <SafeAreaView style={styles.raiz} edges={['bottom']}>
      <FlatList
        data={pronto ? lista.dados : []}
        keyExtractor={(item) => item.carona.id}
        contentContainerStyle={styles.lista}
        ListHeaderComponent={
          <View style={styles.cabecalho}>
            <Text style={styles.resumo}>{resumo}</Text>
            {pronto ? (
              <Text style={styles.contagem}>
                {lista.dados.length} {lista.dados.length === 1 ? 'carona' : 'caronas'}
              </Text>
            ) : null}
          </View>
        }
        ListEmptyComponent={conteudo()}
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
  cabecalho: { gap: espaco.xs },
  resumo: { ...tipografia.rotulo, color: cores.texto },
  contagem: { ...tipografia.legenda, color: cores.textoSecundario },
});
