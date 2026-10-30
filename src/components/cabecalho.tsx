import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { cores, espaco, raio, tipografia } from '@/theme';

type Props = {
  titulo: string;
  subtitulo?: string;
  /** Esconde o atalho para o perfil (usado na própria aba Perfil). */
  semPerfil?: boolean;
};

/** Barra superior das abas: marca, título da tela e atalho para o perfil. */
export function Cabecalho({ titulo, subtitulo, semPerfil = false }: Props) {
  return (
    <View style={styles.raiz}>
      <View style={styles.marca}>
        <Ionicons name="car-sport" size={20} color={cores.verde} />
      </View>
      <View style={styles.textos}>
        <Text style={styles.titulo} accessibilityRole="header">
          {titulo}
        </Text>
        {subtitulo ? <Text style={styles.subtitulo}>{subtitulo}</Text> : null}
      </View>
      {semPerfil ? null : (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Abrir meu perfil"
          onPress={() => router.navigate('/(tabs)/perfil')}
          style={styles.perfil}>
          <Ionicons name="person" size={18} color={cores.textoSobrePrimaria} />
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  raiz: { flexDirection: 'row', alignItems: 'center', gap: espaco.sm, paddingVertical: espaco.sm },
  marca: {
    width: 40,
    height: 40,
    borderRadius: raio.md,
    backgroundColor: cores.verdeSuave,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textos: { flex: 1 },
  titulo: { ...tipografia.tituloP, color: cores.texto },
  subtitulo: { ...tipografia.legenda, color: cores.textoSecundario },
  perfil: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: cores.verde,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
