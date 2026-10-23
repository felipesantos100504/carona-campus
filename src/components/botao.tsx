import { Ionicons } from '@expo/vector-icons';
import { ComponentProps } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, ViewStyle } from 'react-native';

import { alturaToque, cores, espaco, raio, tipografia } from '@/theme';

type Variante = 'primaria' | 'secundaria' | 'contorno' | 'texto' | 'perigo';

type Props = {
  titulo: string;
  onPress?: () => void;
  variante?: Variante;
  icone?: ComponentProps<typeof Ionicons>['name'];
  carregando?: boolean;
  desabilitado?: boolean;
  estilo?: ViewStyle;
};

export function Botao({
  titulo,
  onPress,
  variante = 'primaria',
  icone,
  carregando = false,
  desabilitado = false,
  estilo,
}: Props) {
  const bloqueado = desabilitado || carregando;
  const corTexto = corDoTexto[variante];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: bloqueado, busy: carregando }}
      onPress={onPress}
      disabled={bloqueado}
      style={({ pressed }) => [
        styles.base,
        estilos[variante],
        pressed && styles.pressionado,
        bloqueado && styles.bloqueado,
        estilo,
      ]}>
      {carregando ? (
        <ActivityIndicator color={corTexto} />
      ) : (
        <>
          {icone ? <Ionicons name={icone} size={20} color={corTexto} /> : null}
          <Text style={[styles.texto, { color: corTexto }]}>{titulo}</Text>
        </>
      )}
    </Pressable>
  );
}

const corDoTexto: Record<Variante, string> = {
  primaria: cores.textoSobrePrimaria,
  secundaria: cores.textoSobrePrimaria,
  contorno: cores.texto,
  texto: cores.primaria,
  perigo: cores.erro,
};

const styles = StyleSheet.create({
  base: {
    minHeight: alturaToque,
    borderRadius: raio.lg,
    paddingHorizontal: espaco.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: espaco.sm,
  },
  texto: { ...tipografia.rotulo },
  pressionado: { opacity: 0.85 },
  bloqueado: { opacity: 0.5 },
});

const estilos = StyleSheet.create({
  primaria: { backgroundColor: cores.primaria },
  secundaria: { backgroundColor: cores.secundaria },
  contorno: { backgroundColor: cores.superficie, borderWidth: 1, borderColor: cores.borda },
  texto: { backgroundColor: 'transparent' },
  perigo: { backgroundColor: cores.superficie, borderWidth: 1, borderColor: cores.erro },
});
