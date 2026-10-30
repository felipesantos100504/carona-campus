import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { ComponentProps, ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { cores, espaco, raio, sombra, tipografia } from '@/theme';

import { Segmentado } from './segmentado';
import { Tela } from './tela';

type Props = {
  aba: 'login' | 'cadastro';
  children: ReactNode;
};

const DESTAQUES: { icone: ComponentProps<typeof Ionicons>['name']; titulo: string; texto: string; verde?: boolean }[] = [
  {
    icone: 'bus-outline',
    titulo: 'Rotas regionais',
    texto: 'Pato Branco, Francisco Beltrão, Curitiba e outras cidades do Paraná.',
  },
  {
    icone: 'shield-checkmark-outline',
    titulo: 'Comunidade avaliada',
    texto: 'Perfis com avaliações e divisão justa dos custos da viagem.',
    verde: true,
  },
];

/** Estrutura comum de login e cadastro: marca, alternância entre as telas e destaques. */
export function Entrada({ aba, children }: Props) {
  return (
    <Tela>
      <View style={styles.marca}>
        <View style={styles.logo}>
          <Ionicons name="car-sport" size={36} color={cores.verde} />
        </View>
        <Text style={styles.nome}>
          <Text style={{ color: cores.verde }}>Carona</Text> <Text style={{ color: cores.primaria }}>Campus</Text>
        </Text>
        <Text style={styles.slogan}>Caronas simples e seguras entre cidades do Paraná</Text>
      </View>

      <Segmentado
        valor={aba}
        onChange={(nova) => {
          if (nova !== aba) router.replace(nova === 'login' ? '/login' : '/cadastro');
        }}
        opcoes={[
          { valor: 'login', rotulo: 'Entrar', icone: 'log-in-outline' },
          { valor: 'cadastro', rotulo: 'Criar conta', icone: 'person-add-outline' },
        ]}
      />

      <View style={styles.formulario}>{children}</View>

      {DESTAQUES.map((d) => (
        <View key={d.titulo} style={styles.destaque}>
          <View style={[styles.iconeDestaque, d.verde && { backgroundColor: cores.verdeSuave }]}>
            <Ionicons name={d.icone} size={20} color={d.verde ? cores.verde : cores.primaria} />
          </View>
          <View style={styles.flex}>
            <Text style={styles.tituloDestaque}>{d.titulo}</Text>
            <Text style={styles.textoDestaque}>{d.texto}</Text>
          </View>
        </View>
      ))}

      <Text style={styles.rodape}>
        <Ionicons name="earth-outline" size={13} color={cores.textoSecundario} /> Aberto a toda a comunidade, sem
        mensalidades.
      </Text>
    </Tela>
  );
}

const styles = StyleSheet.create({
  marca: { alignItems: 'center', gap: espaco.xs, paddingTop: espaco.lg },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: cores.superficie,
    borderWidth: 1,
    borderColor: cores.borda,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: espaco.sm,
    ...sombra.cartao,
  },
  nome: { ...tipografia.display },
  slogan: { ...tipografia.corpo, color: cores.textoSecundario, textAlign: 'center' },
  formulario: {
    gap: espaco.md,
    padding: espaco.md,
    borderRadius: raio.lg,
    backgroundColor: cores.superficie,
    borderWidth: 1,
    borderColor: cores.borda,
    ...sombra.cartao,
  },
  destaque: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaco.md,
    padding: espaco.md,
    borderRadius: raio.lg,
    backgroundColor: cores.superficie,
  },
  iconeDestaque: {
    width: 44,
    height: 44,
    borderRadius: raio.md,
    backgroundColor: cores.primariaSuave,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flex: { flex: 1 },
  tituloDestaque: { ...tipografia.rotulo, color: cores.texto },
  textoDestaque: { ...tipografia.legenda, color: cores.textoSecundario },
  rodape: { ...tipografia.legenda, color: cores.textoSecundario, textAlign: 'center', paddingVertical: espaco.sm },
});
