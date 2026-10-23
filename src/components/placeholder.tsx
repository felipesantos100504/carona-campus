import { StyleSheet, Text, View } from 'react-native';

import { cores, espaco, raio, tipografia } from '@/theme';

type Props = {
  responsavel: string;
  itens: string[];
};

/** Caixa provisória que lista o que falta implementar na tela. Remova quando a tela estiver pronta. */
export function Placeholder({ responsavel, itens }: Props) {
  return (
    <View style={styles.caixa}>
      <Text style={styles.titulo}>Em construção · {responsavel}</Text>
      {itens.map((item) => (
        <Text key={item} style={styles.item}>
          • {item}
        </Text>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  caixa: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: cores.primariaBorda,
    backgroundColor: cores.primariaSuave,
    borderRadius: raio.lg,
    padding: espaco.md,
    gap: espaco.xs,
  },
  titulo: { ...tipografia.rotuloP, color: cores.primaria },
  item: { ...tipografia.corpo, color: cores.texto },
});
