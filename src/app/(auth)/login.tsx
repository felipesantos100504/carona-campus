import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text } from 'react-native';

import { Botao } from '@/components/botao';
import { Campo } from '@/components/campo';
import { Entrada } from '@/components/entrada';
import { sessao } from '@/data/repositorio';
import { cores, tipografia } from '@/theme';

// Autenticação real (Firebase Auth) fica para a próxima etapa:
// por enquanto "Entrar" só grava uma sessão local.
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
    <Entrada aba="login">
      <Campo
        rotulo="E-mail"
        icone="at"
        placeholder="seu@email.com"
        keyboardType="email-address"
        autoCapitalize="none"
        value={email}
        onChangeText={setEmail}
      />
      <Campo
        rotulo="Senha"
        icone="lock-closed-outline"
        placeholder="Digite sua senha"
        secureTextEntry
        value={senha}
        onChangeText={setSenha}
      />
      <Botao titulo="Entrar" icone="car-outline" onPress={entrar} carregando={entrando} />
      <Text style={styles.aviso}>Protótipo: o login ainda não valida a conta.</Text>
    </Entrada>
  );
}

const styles = StyleSheet.create({
  aviso: { ...tipografia.legenda, color: cores.textoSecundario, textAlign: 'center' },
});
