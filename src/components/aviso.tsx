import { Ionicons } from '@expo/vector-icons';
import { ComponentProps, ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { cores, espaco, raio, tipografia } from '@/theme';

type Tipo = 'info' | 'sucesso' | 'erro';

type Props = {
  children: ReactNode;
  titulo?: string;
  tipo?: Tipo;
  icone?: ComponentProps<typeof Ionicons>['name'];
};

const ESTILO: Record<Tipo, { fundo: string; cor: string; icone: ComponentProps<typeof Ionicons>['name'] }> = {
  info: { fundo: cores.superficieAlt, cor: cores.primaria, icone: 'information-circle-outline' },
  sucesso: { fundo: cores.verdeSuave, cor: cores.verde, icone: 'checkmark-circle' },
  erro: { fundo: cores.erroSuave, cor: cores.erro, icone: 'alert-circle-outline' },
};

/** Faixa de informação, sucesso ou erro com ícone à esquerda. */
export function Aviso({ children, titulo, tipo = 'info', icone }: Props) {
  const estilo = ESTILO[tipo];
  return (
    <View
      style={[styles.aviso, { backgroundColor: estilo.fundo }]}
      accessibilityRole={tipo === 'erro' ? 'alert' : undefined}>
      <Ionicons name={icone ?? estilo.icone} size={20} color={estilo.cor} />
      <View style={styles.textos}>
        {titulo ? <Text style={[styles.titulo, { color: estilo.cor }]}>{titulo}</Text> : null}
        <Text style={[styles.texto, tipo !== 'info' && { color: estilo.cor }]}>{children}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  aviso: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: espaco.sm,
    padding: espaco.md - 4,
    borderRadius: raio.md,
  },
  textos: { flex: 1, gap: 2 },
  titulo: { ...tipografia.rotulo },
  texto: { ...tipografia.legenda, color: cores.textoSecundario },
});
