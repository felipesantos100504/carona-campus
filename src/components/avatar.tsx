import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { StyleSheet, Text, View } from 'react-native';

import { cores, fontes } from '@/theme';

const paleta = ['#6366F1', '#1E3A8A', '#047857', '#B45309', '#7C3AED', '#0E7490'];

type Props = {
  nome: string;
  fotoUri?: string;
  tamanho?: number;
  /** Mostra o selo verde de perfil verificado no canto. */
  verificado?: boolean;
};

/** Mostra a foto do usuário ou, sem foto, as iniciais do nome. */
export function Avatar({ nome, fotoUri, tamanho = 48, verificado = false }: Props) {
  const dimensoes = { width: tamanho, height: tamanho, borderRadius: tamanho / 2 };
  const tamanhoSelo = Math.max(16, Math.round(tamanho * 0.34));

  const iniciais = nome
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((parte) => parte[0]?.toUpperCase())
    .join('');
  const cor = paleta[somaDosCaracteres(nome) % paleta.length];

  return (
    <View style={dimensoes}>
      {fotoUri ? (
        <Image source={{ uri: fotoUri }} style={dimensoes} contentFit="cover" />
      ) : (
        <View style={[styles.circulo, dimensoes, { backgroundColor: cor }]}>
          <Text style={[styles.iniciais, { fontSize: tamanho * 0.38 }]}>{iniciais}</Text>
        </View>
      )}
      {verificado ? (
        <View
          style={[
            styles.selo,
            { width: tamanhoSelo, height: tamanhoSelo, borderRadius: tamanhoSelo / 2 },
          ]}>
          <Ionicons name="checkmark" size={tamanhoSelo * 0.65} color={cores.textoSobrePrimaria} />
        </View>
      ) : null}
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
  selo: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    backgroundColor: cores.verde,
    borderWidth: 2,
    borderColor: cores.superficie,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
