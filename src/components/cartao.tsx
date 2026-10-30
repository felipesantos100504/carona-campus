import { Ionicons } from '@expo/vector-icons';
import { ComponentProps, ReactNode } from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';

import { cores, espaco, raio, sombra, tipografia } from '@/theme';

type Props = {
  children: ReactNode;
  titulo?: string;
  icone?: ComponentProps<typeof Ionicons>['name'];
  /** Conteúdo à direita do título (selo, link...). */
  extra?: ReactNode;
  estilo?: ViewStyle;
};

/** Cartão branco com cantos arredondados, usado para agrupar seções das telas. */
export function Cartao({ children, titulo, icone, extra, estilo }: Props) {
  return (
    <View style={[styles.cartao, estilo]}>
      {titulo ? (
        <View style={styles.cabecalho}>
          {icone ? <Ionicons name={icone} size={18} color={cores.primaria} /> : null}
          <Text style={styles.titulo}>{titulo}</Text>
          {extra ? <View style={styles.extra}>{extra}</View> : null}
        </View>
      ) : null}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  cartao: {
    backgroundColor: cores.superficie,
    borderRadius: raio.lg,
    borderWidth: 1,
    borderColor: cores.borda,
    padding: espaco.md,
    gap: espaco.md,
    ...sombra.cartao,
  },
  cabecalho: { flexDirection: 'row', alignItems: 'center', gap: espaco.sm },
  titulo: { ...tipografia.tituloP, color: cores.texto, flexShrink: 1 },
  extra: { marginLeft: 'auto' },
});
