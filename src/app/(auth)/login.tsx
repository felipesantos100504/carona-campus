import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Botao } from '@/components/botao';
import { Campo } from '@/components/campo';
import { Tela } from '@/components/tela';
import { sessao } from '@/data/repositorio';
import { cores, espaco, tipografia } from '@/theme';

// TODO(Integrante A): refinar visual. Autenticação real (Firebase Auth) fica
// para a próxima etapa — por enquanto "Entrar" só grava uma sessão local.
export default function Login() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [entrando, setEntrando] = useState(false);

  async function entrar() {
    setEntrando(true);
    await sessao.entrar();
    router.replace('/(tabs)');
  }

  return (
    <Tela
      rodape={
        <>
          <Botao titulo="Entrar" icone="log-in-outline" onPress={entrar} carregando={entrando} />
          <Botao titulo="Criar conta" variante="texto" onPress={() => router.push('/cadastro')} />
        </>
      }>
      <View style={styles.cabecalho}>
        <Text style={styles.marca}>Carona Campus</Text>
        <Text style={styles.subtitulo}>Caronas entre cidades, combinadas do seu jeito.</Text>
      </View>
      <Campo
        rotulo="E-mail"
        placeholder="voce@email.com"
        keyboardType="email-address"
        autoCapitalize="none"
        value={email}
        onChangeText={setEmail}
      />
      <Campo rotulo="Senha" placeholder="••••••••" secureTextEntry value={senha} onChangeText={setSenha} />
      <Text style={styles.aviso}>Protótipo: o login ainda não valida a conta.</Text>
    </Tela>
  );
}

const styles = StyleSheet.create({
  cabecalho: { paddingTop: espaco.xxl, paddingBottom: espaco.lg, gap: espaco.sm },
  marca: { ...tipografia.display, color: cores.primaria },
  subtitulo: { ...tipografia.corpoG, color: cores.textoSecundario },
  aviso: { ...tipografia.legenda, color: cores.textoSecundario },
});
