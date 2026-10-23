import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text } from 'react-native';

import { Avatar } from '@/components/avatar';
import { Botao } from '@/components/botao';
import { Campo } from '@/components/campo';
import { Tela } from '@/components/tela';
import { salvarMeuPerfil, sessao } from '@/data/repositorio';
import { cores, tipografia } from '@/theme';

// TODO(Integrante A): escolher foto (expo-image-picker), validar campos,
// botão de voltar para o login. O nome e a cidade já ficam salvos localmente.
export default function Cadastro() {
  const [nome, setNome] = useState('');
  const [cidade, setCidade] = useState('');
  const [email, setEmail] = useState('');
  const [salvando, setSalvando] = useState(false);

  async function criarConta() {
    setSalvando(true);
    await sessao.entrar();
    await salvarMeuPerfil({ nome: nome.trim() || 'Você', cidade: cidade.trim() || 'Pato Branco' });
    router.replace('/(tabs)');
  }

  return (
    <Tela
      rodape={
        <>
          <Botao titulo="Criar conta" onPress={criarConta} carregando={salvando} />
          <Botao titulo="Já tenho conta" variante="texto" onPress={() => router.back()} />
        </>
      }>
      <Text style={styles.titulo}>Criar conta</Text>
      <Avatar nome={nome || '?'} tamanho={88} />
      <Campo rotulo="Nome completo" value={nome} onChangeText={setNome} placeholder="Seu nome" />
      <Campo rotulo="Cidade" value={cidade} onChangeText={setCidade} placeholder="Onde você mora" />
      <Campo
        rotulo="E-mail"
        value={email}
        onChangeText={setEmail}
        placeholder="voce@email.com"
        keyboardType="email-address"
        autoCapitalize="none"
      />
    </Tela>
  );
}

const styles = StyleSheet.create({
  titulo: { ...tipografia.tituloG, color: cores.texto, paddingTop: 24 },
});
