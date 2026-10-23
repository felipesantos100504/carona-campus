import { Ionicons } from '@expo/vector-icons';
import { ComponentProps, useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';

import { cores, espaco, raio, tipografia } from '@/theme';

import { Botao } from './botao';

type NomeIcone = ComponentProps<typeof Ionicons>['name'];

/** Esqueletos de cartão piscando enquanto a lista carrega. */
export function EstadoCarregando({ itens = 3, mensagem }: { itens?: number; mensagem?: string }) {
  const opacidade = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const animacao = Animated.loop(
      Animated.sequence([
        Animated.timing(opacidade, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(opacidade, { toValue: 0.4, duration: 700, useNativeDriver: true }),
      ]),
    );
    animacao.start();
    return () => animacao.stop();
  }, [opacidade]);

  return (
    <View style={styles.lista} accessibilityLabel="Carregando" accessibilityRole="progressbar">
      {mensagem ? <Text style={styles.mensagemCarregando}>{mensagem}</Text> : null}
      {Array.from({ length: itens }).map((_, i) => (
        <Animated.View key={i} style={[styles.esqueleto, { opacity: opacidade }]}>
          <View style={styles.linhaCurta} />
          <View style={styles.linhaLonga} />
          <View style={styles.linhaMedia} />
        </Animated.View>
      ))}
    </View>
  );
}

type PropsVazio = {
  titulo: string;
  mensagem?: string;
  icone?: NomeIcone;
  acao?: { titulo: string; onPress: () => void };
};

export function EstadoVazio({ titulo, mensagem, icone = 'search-outline', acao }: PropsVazio) {
  return (
    <View style={styles.centro}>
      <View style={[styles.bolha, { backgroundColor: cores.primariaSuave }]}>
        <Ionicons name={icone} size={32} color={cores.primaria} />
      </View>
      <Text style={styles.titulo}>{titulo}</Text>
      {mensagem ? <Text style={styles.mensagem}>{mensagem}</Text> : null}
      {acao ? <Botao titulo={acao.titulo} onPress={acao.onPress} variante="contorno" /> : null}
    </View>
  );
}

type PropsErro = {
  mensagem?: string;
  onTentarNovamente?: () => void;
};

export function EstadoErro({
  mensagem = 'Não foi possível carregar os dados. Verifique sua conexão.',
  onTentarNovamente,
}: PropsErro) {
  return (
    <View style={styles.centro}>
      <View style={[styles.bolha, { backgroundColor: cores.erroSuave }]}>
        <Ionicons name="cloud-offline-outline" size={32} color={cores.erro} />
      </View>
      <Text style={styles.titulo}>Algo deu errado</Text>
      <Text style={styles.mensagem}>{mensagem}</Text>
      {onTentarNovamente ? (
        <Botao titulo="Tentar novamente" icone="refresh" onPress={onTentarNovamente} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  lista: { gap: espaco.md },
  mensagemCarregando: { ...tipografia.rotuloP, color: cores.primaria },
  esqueleto: {
    backgroundColor: cores.superficie,
    borderRadius: raio.lg,
    borderWidth: 1,
    borderColor: cores.borda,
    padding: espaco.md,
    gap: espaco.sm,
  },
  linhaCurta: { height: 14, width: '35%', borderRadius: raio.sm, backgroundColor: cores.borda },
  linhaLonga: { height: 18, width: '85%', borderRadius: raio.sm, backgroundColor: cores.borda },
  linhaMedia: { height: 14, width: '55%', borderRadius: raio.sm, backgroundColor: cores.borda },
  centro: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: espaco.xxl,
    paddingHorizontal: espaco.lg,
    gap: espaco.md,
  },
  bolha: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titulo: { ...tipografia.tituloP, color: cores.texto, textAlign: 'center' },
  mensagem: { ...tipografia.corpo, color: cores.textoSecundario, textAlign: 'center' },
});
