import { Pressable, StyleSheet, Text } from 'react-native';

import { cores, espaco, raio, tipografia } from '@/theme';

type Props = {
  rotulo: string;
  selecionado?: boolean;
  onPress?: () => void;
};

/** Pílula selecionável (filtros, número de vagas, dias da semana). */
export function Chip({ rotulo, selecionado = false, onPress }: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: selecionado }}
      onPress={onPress}
      style={[styles.chip, selecionado && styles.selecionado]}>
      <Text style={[styles.texto, selecionado && styles.textoSelecionado]}>{rotulo}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    minHeight: 44,
    paddingHorizontal: espaco.md,
    borderRadius: raio.total,
    borderWidth: 1,
    borderColor: cores.borda,
    backgroundColor: cores.superficie,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selecionado: { backgroundColor: cores.primaria, borderColor: cores.primaria },
  texto: { ...tipografia.rotuloP, color: cores.texto },
  textoSelecionado: { color: cores.textoSobrePrimaria },
});
