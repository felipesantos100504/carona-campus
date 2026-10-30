import { Ionicons } from '@expo/vector-icons';
import { ComponentProps } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { cores, espaco, raio, tipografia } from '@/theme';

type Opcao<T extends string> = {
  valor: T;
  rotulo: string;
  icone?: ComponentProps<typeof Ionicons>['name'];
  contador?: number;
};

type Props<T extends string> = {
  opcoes: Opcao<T>[];
  valor: T;
  onChange: (valor: T) => void;
};

/** Alternância entre duas ou mais visões (Entrar / Criar conta, passageiro / motorista). */
export function Segmentado<T extends string>({ opcoes, valor, onChange }: Props<T>) {
  return (
    <View style={styles.raiz} accessibilityRole="tablist">
      {opcoes.map((opcao) => {
        const ativo = opcao.valor === valor;
        const cor = ativo ? cores.textoSobrePrimaria : cores.texto;
        return (
          <Pressable
            key={opcao.valor}
            accessibilityRole="tab"
            accessibilityState={{ selected: ativo }}
            onPress={() => onChange(opcao.valor)}
            style={[styles.opcao, ativo && styles.ativo]}>
            {opcao.icone ? <Ionicons name={opcao.icone} size={16} color={cor} /> : null}
            <Text style={[styles.texto, { color: cor }]} numberOfLines={1}>
              {opcao.rotulo}
            </Text>
            {opcao.contador ? (
              <View style={[styles.contador, ativo && styles.contadorAtivo]}>
                <Text style={[styles.textoContador, ativo && { color: cores.primaria }]}>{opcao.contador}</Text>
              </View>
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  raiz: {
    flexDirection: 'row',
    padding: espaco.xs,
    borderRadius: raio.total,
    backgroundColor: cores.primariaSuave,
    gap: espaco.xs,
  },
  opcao: {
    flex: 1,
    minHeight: 44,
    borderRadius: raio.total,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: espaco.xs,
    paddingHorizontal: espaco.sm,
  },
  ativo: { backgroundColor: cores.primaria },
  texto: { ...tipografia.rotuloP, flexShrink: 1 },
  contador: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    paddingHorizontal: 4,
    backgroundColor: cores.erro,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contadorAtivo: { backgroundColor: cores.superficie },
  textoContador: { ...tipografia.legenda, fontSize: 11, lineHeight: 14, color: cores.textoSobrePrimaria },
});
