import { Ionicons } from '@expo/vector-icons';
import { ComponentProps } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';

import { cores, espaco, raio, tipografia } from '@/theme';

type Props = {
  rotulo: string;
  selecionado?: boolean;
  onPress?: () => void;
  icone?: ComponentProps<typeof Ionicons>['name'];
  /** Chips pequenos e redondos, como os dias da semana. */
  compacto?: boolean;
};

/** Pílula selecionável (filtros, datas, dias da semana, sugestões). */
export function Chip({ rotulo, selecionado = false, onPress, icone, compacto = false }: Props) {
  const corTexto = selecionado ? cores.textoSobrePrimaria : cores.texto;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: selecionado }}
      onPress={onPress}
      style={[styles.chip, compacto && styles.compacto, selecionado && styles.selecionado]}>
      {icone ? <Ionicons name={icone} size={16} color={selecionado ? corTexto : cores.primaria} /> : null}
      <Text style={[styles.texto, { color: corTexto }]}>{rotulo}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    minHeight: 44,
    paddingHorizontal: espaco.md,
    borderRadius: raio.total,
    backgroundColor: cores.primariaSuave,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: espaco.xs,
  },
  compacto: { minWidth: 44, paddingHorizontal: espaco.sm },
  selecionado: { backgroundColor: cores.verde },
  texto: { ...tipografia.rotuloP },
});
