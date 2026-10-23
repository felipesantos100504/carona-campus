import { StyleSheet, View } from 'react-native';

import { mesmaCidade, sugerirCidades } from '@/data/cidades';
import { espaco } from '@/theme';

import { Campo } from './campo';
import { Chip } from './chip';

type Props = {
  rotulo: string;
  valor: string;
  onChange: (cidade: string) => void;
  placeholder?: string;
};

/** Campo de texto com sugestões de cidades do catálogo. */
export function CampoCidade({ rotulo, valor, onChange, placeholder }: Props) {
  const sugestoes = sugerirCidades(valor, 4).filter((c) => !mesmaCidade(c, valor));

  return (
    <View style={styles.raiz}>
      <Campo
        rotulo={rotulo}
        value={valor}
        onChangeText={onChange}
        placeholder={placeholder}
        autoCorrect={false}
      />
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
  sugestoes: { flexDirection: 'row', flexWrap: 'wrap', gap: espaco.sm },
});
