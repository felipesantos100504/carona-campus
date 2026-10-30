import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Botao } from '@/components/botao';
import { CardCarona } from '@/components/card-carona';
import { EstadoCarregando, EstadoErro, EstadoVazio } from '@/components/estados';
import { Tela } from '@/components/tela';
import { avaliarViagem, listarMinhasReservas } from '@/data/repositorio';
import { useCarregamento } from '@/hooks/use-carregamento';
import { cores, espaco, raio, tipografia } from '@/theme';

export default function Avaliar() {
  // Parâmetro recebido da lista de viagens: /avaliar/r1
  const { reservaId } = useLocalSearchParams<{ reservaId: string }>();
  const detalhe = useCarregamento(
    async () => (await listarMinhasReservas()).find((item) => item.reserva.id === reservaId) ?? null,
    [reservaId],
  );

  const [nota, setNota] = useState(0);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  if (detalhe.status === 'carregando' && !detalhe.dados) {
    return (
      <Tela bordas={['bottom']}>
        <EstadoCarregando itens={1} />
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
        <EstadoVazio titulo="Viagem não encontrada" mensagem="Ela pode ter sido removida." icone="car-outline" />
      </Tela>
    );
  }

  const { carona, motorista } = detalhe.dados;

  async function enviar() {
    setEnviando(true);
    setErro(null);
    try {
      await avaliarViagem(reservaId, nota);
      router.back();
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro inesperado.');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Tela
      bordas={['bottom']}
      rodape={
        <>
          <Botao
            titulo="Enviar avaliação"
            icone="star-outline"
            desabilitado={nota === 0}
            carregando={enviando}
            onPress={enviar}
          />
          <Botao titulo="Fechar" variante="texto" onPress={() => router.back()} />
        </>
      }>
      <CardCarona carona={carona} motorista={motorista} />
      <Text style={styles.pergunta}>Como foi viajar com {motorista.nome}?</Text>
      <View style={styles.estrelas}>
        {[1, 2, 3, 4, 5].map((n) => (
          <Pressable
            key={n}
            accessibilityRole="button"
            accessibilityLabel={`${n} de 5 estrelas`}
            accessibilityState={{ selected: n === nota }}
            onPress={() => setNota(n)}
            style={styles.estrela}>
            <Ionicons name={n <= nota ? 'star' : 'star-outline'} size={36} color={cores.aviso} />
          </Pressable>
        ))}
      </View>
      {erro ? <Text style={[styles.mensagem, styles.mensagemErro]}>{erro}</Text> : null}
    </Tela>
  );
}

const styles = StyleSheet.create({
  pergunta: { ...tipografia.tituloP, color: cores.texto, textAlign: 'center' },
  estrelas: { flexDirection: 'row', justifyContent: 'center', gap: espaco.sm },
  estrela: { minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  mensagem: { ...tipografia.rotuloP, padding: espaco.md, borderRadius: raio.md, textAlign: 'center' },
  mensagemErro: { backgroundColor: cores.erroSuave, color: cores.erro },
});
