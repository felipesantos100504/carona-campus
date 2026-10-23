import { Image } from 'expo-image';
import { StyleSheet, Text, View } from 'react-native';

import { cores, fontes } from '@/theme';

const paleta = ['#6366F1', '#1E3A8A', '#059669', '#B45309', '#7C3AED', '#0E7490'];

type Props = {
  nome: string;
  fotoUri?: string;
  tamanho?: number;
};

/** Mostra a foto do usuário ou, sem foto, as iniciais do nome. */
export function Avatar({ nome, fotoUri, tamanho = 48 }: Props) {
  const dimensoes = { width: tamanho, height: tamanho, borderRadius: tamanho / 2 };

  if (fotoUri) {
    return <Image source={{ uri: fotoUri }} style={dimensoes} contentFit="cover" />;
  }

  const iniciais = nome
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((parte) => parte[0]?.toUpperCase())
    .join('');
  const cor = paleta[somaDosCaracteres(nome) % paleta.length];

  return (
    <View style={[styles.circulo, dimensoes, { backgroundColor: cor }]}>
      <Text style={[styles.iniciais, { fontSize: tamanho * 0.38 }]}>{iniciais}</Text>
    </View>
  );
}

function somaDosCaracteres(texto: string) {
  let soma = 0;
  for (const c of texto) soma += c.charCodeAt(0);
  return soma;
}

const styles = StyleSheet.create({
  circulo: { alignItems: 'center', justifyContent: 'center' },
  iniciais: { color: cores.textoSobrePrimaria, fontFamily: fontes.titulo },
});
