import { useState } from 'react';
import { StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';

import { alturaToque, cores, espaco, raio, tipografia } from '@/theme';

type Props = TextInputProps & {
  rotulo: string;
  erro?: string;
  ajuda?: string;
};

export function Campo({ rotulo, erro, ajuda, multiline, style, ...resto }: Props) {
  const [focado, setFocado] = useState(false);

  return (
    <View style={styles.raiz}>
      <Text style={styles.rotulo}>{rotulo}</Text>
      <TextInput
        placeholderTextColor={cores.textoSecundario}
        multiline={multiline}
        onFocus={(e) => {
          setFocado(true);
          resto.onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocado(false);
          resto.onBlur?.(e);
        }}
        style={[
          styles.input,
          multiline && styles.multilinha,
          focado && styles.focado,
          !!erro && styles.comErro,
          style,
        ]}
        {...resto}
      />
      {erro ? (
        <Text style={[styles.dica, { color: cores.erro }]}>{erro}</Text>
      ) : ajuda ? (
        <Text style={styles.dica}>{ajuda}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  raiz: { gap: espaco.xs },
  rotulo: { ...tipografia.rotuloP, color: cores.texto },
  input: {
    ...tipografia.corpo,
    minHeight: alturaToque,
    backgroundColor: cores.fundo,
    borderWidth: 1,
    borderColor: cores.borda,
    borderRadius: raio.md,
    paddingHorizontal: espaco.md,
    paddingVertical: espaco.sm,
    color: cores.texto,
  },
  multilinha: { minHeight: 120, textAlignVertical: 'top', paddingTop: espaco.md },
  focado: { borderWidth: 2, borderColor: cores.primaria },
  comErro: { borderColor: cores.erro },
  dica: { ...tipografia.legenda, color: cores.textoSecundario },
});
