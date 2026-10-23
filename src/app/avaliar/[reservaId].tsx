import { router, useLocalSearchParams } from 'expo-router';
import { StyleSheet, Text } from 'react-native';

import { Botao } from '@/components/botao';
import { Placeholder } from '@/components/placeholder';
import { Tela } from '@/components/tela';
import { cores, tipografia } from '@/theme';

// TODO(Integrante D): estrelas de 1 a 5 e salvar com avaliarViagem(reservaId, nota).
export default function Avaliar() {
  const { reservaId } = useLocalSearchParams<{ reservaId: string }>();

  return (
    <Tela bordas={['bottom']} rodape={<Botao titulo="Fechar" variante="contorno" onPress={() => router.back()} />}>
      <Text style={styles.texto}>Reserva recebida por parâmetro: {reservaId}</Text>
      <Placeholder
        responsavel="Integrante D"
        itens={['Mostrar motorista e trajeto da viagem', 'Seleção de 1 a 5 estrelas', 'Enviar → avaliarViagem() e voltar']}
      />
    </Tela>
  );
}

const styles = StyleSheet.create({
  texto: { ...tipografia.corpo, color: cores.textoSecundario },
});
