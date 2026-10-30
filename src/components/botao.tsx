import { Ionicons } from '@expo/vector-icons';
import { ComponentProps } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, ViewStyle } from 'react-native';

import { alturaToque, cores, espaco, raio, tipografia } from '@/theme';

// primaria (índigo): ações principais e de IA; verde: confirmar, publicar, avaliar;
// suave: ação secundária dentro de cartões.
type Variante = 'primaria' | 'verde' | 'secundaria' | 'suave' | 'contorno' | 'texto' | 'perigo';

type Props = {
  titulo: string;
  onPress?: () => void;
  variante?: Variante;
  icone?: ComponentProps<typeof Ionicons>['name'];
  carregando?: boolean;
  desabilitado?: boolean;
  /** Botão compacto, para ações dentro de cartões. */
  pequeno?: boolean;
  estilo?: ViewStyle;
};

export function Botao({
  titulo,
  onPress,
  variante = 'primaria',
  icone,
  carregando = false,
  desabilitado = false,
  pequeno = false,
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
        pequeno && styles.pequeno,
        estilos[variante],
        pressed && styles.pressionado,
        bloqueado && styles.bloqueado,
        estilo,
      ]}>
      {carregando ? (
        <ActivityIndicator color={corTexto} />
      ) : (
        <>
          {icone ? <Ionicons name={icone} size={pequeno ? 16 : 20} color={corTexto} /> : null}
          <Text style={[pequeno ? styles.textoPequeno : styles.texto, { color: corTexto }]}>{titulo}</Text>
        </>
      )}
    </Pressable>
  );
}

const corDoTexto: Record<Variante, string> = {
  primaria: cores.textoSobrePrimaria,
  verde: cores.textoSobrePrimaria,
  secundaria: cores.textoSobrePrimaria,
  suave: cores.primariaEscura,
  contorno: cores.texto,
  texto: cores.primaria,
  perigo: cores.erro,
};

const styles = StyleSheet.create({
  base: {
    minHeight: alturaToque,
    borderRadius: raio.total,
    paddingHorizontal: espaco.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: espaco.sm,
  },
  pequeno: { minHeight: 40, paddingHorizontal: espaco.md, gap: espaco.xs },
  texto: { ...tipografia.rotulo },
  textoPequeno: { ...tipografia.rotuloP },
  pressionado: { opacity: 0.85 },
  bloqueado: { opacity: 0.5 },
});

const estilos = StyleSheet.create({
  primaria: { backgroundColor: cores.primaria },
  verde: { backgroundColor: cores.verde },
  secundaria: { backgroundColor: cores.secundaria },
  suave: { backgroundColor: cores.primariaSuave },
  contorno: { backgroundColor: cores.superficie, borderWidth: 1, borderColor: cores.borda },
  texto: { backgroundColor: 'transparent' },
  perigo: { backgroundColor: cores.erroSuave },
});
