import { ReactNode } from 'react';
import { ScrollView, StyleSheet, View, ViewStyle } from 'react-native';
import { Edge, SafeAreaView } from 'react-native-safe-area-context';

import { cores, espaco } from '@/theme';

type Props = {
  children: ReactNode;
  /** Rola o conteúdo. Desligue quando a tela tiver uma FlatList própria. */
  rolar?: boolean;
  /** Conteúdo fixo no rodapé (ex.: botão principal na área do polegar). */
  rodape?: ReactNode;
  /** Telas dentro de Stack com cabeçalho não precisam da margem superior. */
  bordas?: Edge[];
  estilo?: ViewStyle;
};

export function Tela({ children, rolar = true, rodape, bordas = ['top'], estilo }: Props) {
  return (
    <SafeAreaView style={styles.raiz} edges={bordas}>
      {rolar ? (
        <ScrollView
          contentContainerStyle={[styles.conteudo, estilo]}
          keyboardShouldPersistTaps="handled">
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.conteudo, styles.flex, estilo]}>{children}</View>
      )}
      {rodape ? <View style={styles.rodape}>{rodape}</View> : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  raiz: { flex: 1, backgroundColor: cores.fundo },
  flex: { flex: 1 },
  conteudo: { padding: espaco.md, gap: espaco.md },
  rodape: {
    padding: espaco.md,
    gap: espaco.sm,
    backgroundColor: cores.superficie,
    borderTopWidth: 1,
    borderTopColor: cores.borda,
  },
});
