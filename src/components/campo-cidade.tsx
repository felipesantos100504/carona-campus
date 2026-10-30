import { Ionicons } from '@expo/vector-icons';
import { ComponentProps, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { mesmaCidade, sugerirCidades } from '@/data/cidades';
import { alturaToque, cores, espaco, raio, tipografia } from '@/theme';

import { Chip } from './chip';

type Props = {
  rotulo: string;
  valor: string;
  onChange: (cidade: string) => void;
  placeholder?: string;
  /** "origem" mostra o ponto verde; "destino", o marcador de mapa. */
  tipo?: 'origem' | 'destino';
};

const ICONES: Record<'origem' | 'destino', ComponentProps<typeof Ionicons>['name']> = {
  origem: 'radio-button-on',
  destino: 'location-outline',
};

/** Campo de cidade no estilo do Stitch, com sugestões do catálogo de cidades. */
export function CampoCidade({ rotulo, valor, onChange, placeholder, tipo = 'destino' }: Props) {
  const [focado, setFocado] = useState(false);
  const sugestoes = sugerirCidades(valor, 4).filter((c) => !mesmaCidade(c, valor));

  return (
    <View style={styles.raiz}>
      <View style={[styles.caixa, focado && styles.focado]}>
        <View style={[styles.icone, tipo === 'origem' ? styles.iconeOrigem : styles.iconeDestino]}>
          <Ionicons
            name={ICONES[tipo]}
            size={16}
            color={tipo === 'origem' ? cores.sucesso : cores.primaria}
          />
        </View>
        <View style={styles.textos}>
          <Text style={styles.rotulo}>{rotulo}</Text>
          <TextInput
            value={valor}
            onChangeText={onChange}
            placeholder={placeholder}
            placeholderTextColor={cores.textoSecundario}
            autoCorrect={false}
            onFocus={() => setFocado(true)}
            onBlur={() => setFocado(false)}
            style={styles.input}
            accessibilityLabel={rotulo}
          />
        </View>
        {valor ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Limpar ${rotulo}`}
            onPress={() => onChange('')}
            style={styles.limpar}>
            <Ionicons name="close" size={18} color={cores.textoSecundario} />
          </Pressable>
        ) : null}
      </View>
      {sugestoes.length > 0 ? (
        <View style={styles.sugestoes}>
          {sugestoes.map((c) => (
            <Chip key={c} rotulo={c} onPress={() => onChange(c)} />
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  raiz: { gap: espaco.sm },
  caixa: {
    minHeight: alturaToque + 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaco.sm,
    paddingHorizontal: espaco.sm,
    borderRadius: raio.md,
    backgroundColor: cores.superficieAlt,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  focado: { borderWidth: 2, borderColor: cores.primaria, backgroundColor: cores.superficie },
  icone: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  iconeOrigem: { backgroundColor: cores.verdeSuave },
  iconeDestino: { backgroundColor: cores.primariaSuave },
  textos: { flex: 1 },
  rotulo: { ...tipografia.legenda, color: cores.textoSecundario },
  input: { ...tipografia.rotulo, color: cores.texto, padding: 0 },
  limpar: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  sugestoes: { flexDirection: 'row', flexWrap: 'wrap', gap: espaco.sm },
});
