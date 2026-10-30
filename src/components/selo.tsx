import { Ionicons } from '@expo/vector-icons';
import { ComponentProps } from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';

import { cores, espaco, raio, tipografia } from '@/theme';

export type Tom = 'indigo' | 'verde' | 'verdeForte' | 'aviso' | 'erro' | 'neutro';

type Props = {
  rotulo: string;
  icone?: ComponentProps<typeof Ionicons>['name'];
  tom?: Tom;
  estilo?: ViewStyle;
};

const TONS: Record<Tom, { fundo: string; texto: string }> = {
  indigo: { fundo: cores.primariaSuave, texto: cores.primariaEscura },
  verde: { fundo: cores.verdeSuave, texto: cores.verde },
  verdeForte: { fundo: cores.verde, texto: cores.textoSobrePrimaria },
  aviso: { fundo: cores.avisoSuave, texto: cores.aviso },
  erro: { fundo: cores.erroSuave, texto: cores.erro },
  neutro: { fundo: cores.superficieAlt, texto: cores.textoSecundario },
};

/** Pílula de status (vagas, recorrência, e-mail verificado, situação da reserva). */
export function Selo({ rotulo, icone, tom = 'indigo', estilo }: Props) {
  const { fundo, texto } = TONS[tom];
  return (
    <View style={[styles.selo, { backgroundColor: fundo }, estilo]}>
      {icone ? <Ionicons name={icone} size={13} color={texto} /> : null}
      <Text style={[styles.texto, { color: texto }]} numberOfLines={1}>
        {rotulo}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  selo: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    paddingHorizontal: espaco.sm + 2,
    paddingVertical: 3,
    borderRadius: raio.total,
    flexShrink: 1,
  },
  texto: { ...tipografia.legenda, fontSize: 12 },
});
