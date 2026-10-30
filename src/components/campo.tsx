import { Ionicons } from '@expo/vector-icons';
import { ComponentProps, ReactNode, useState } from 'react';
import { StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';

import { alturaToque, cores, espaco, raio, tipografia } from '@/theme';

type Props = TextInputProps & {
  rotulo: string;
  icone?: ComponentProps<typeof Ionicons>['name'];
  /** Conteúdo à direita do rótulo (ex.: "Esqueci minha senha"). */
  acessorio?: ReactNode;
  erro?: string;
  ajuda?: string;
};

export function Campo({ rotulo, icone, acessorio, erro, ajuda, multiline, style, ...resto }: Props) {
  const [focado, setFocado] = useState(false);

  return (
    <View style={styles.raiz}>
      <View style={styles.linhaRotulo}>
        {icone ? <Ionicons name={icone} size={16} color={cores.textoSecundario} /> : null}
        <Text style={styles.rotulo}>{rotulo}</Text>
        {acessorio ? <View style={styles.acessorio}>{acessorio}</View> : null}
      </View>
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
  linhaRotulo: { flexDirection: 'row', alignItems: 'center', gap: espaco.xs },
  rotulo: { ...tipografia.rotuloP, color: cores.texto },
  acessorio: { marginLeft: 'auto' },
  input: {
    ...tipografia.corpo,
    minHeight: alturaToque,
    backgroundColor: cores.superficieAlt,
    borderWidth: 1,
    borderColor: 'transparent',
    borderRadius: raio.md,
    paddingHorizontal: espaco.md,
    paddingVertical: espaco.sm,
    color: cores.texto,
  },
  multilinha: { minHeight: 120, textAlignVertical: 'top', paddingTop: espaco.md },
  focado: { borderWidth: 2, borderColor: cores.primaria, backgroundColor: cores.superficie },
  comErro: { borderColor: cores.erro },
  dica: { ...tipografia.legenda, color: cores.textoSecundario },
});
