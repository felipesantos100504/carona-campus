import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Avatar } from '@/components/avatar';
import { Botao } from '@/components/botao';
import { Campo } from '@/components/campo';
import { CampoCidade } from '@/components/campo-cidade';
import { Entrada } from '@/components/entrada';
import { salvarMeuPerfil, sessao } from '@/data/repositorio';

// TODO: escolher foto (expo-image-picker) e validar os campos na etapa 3,
// junto com o Firebase Auth. O nome e a cidade já ficam salvos localmente.
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
    <Entrada aba="cadastro">
      <View style={styles.avatar}>
        <Avatar nome={nome || '?'} tamanho={72} />
      </View>
      <Campo rotulo="Nome completo" icone="person-outline" value={nome} onChangeText={setNome} placeholder="Seu nome" />
      <CampoCidade rotulo="Cidade" tipo="origem" valor={cidade} onChange={setCidade} placeholder="Onde você mora" />
      <Campo
        rotulo="E-mail"
        icone="at"
        value={email}
        onChangeText={setEmail}
        placeholder="seu@email.com"
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <Botao titulo="Criar conta" icone="person-add-outline" onPress={criarConta} carregando={salvando} />
    </Entrada>
  );
}

const styles = StyleSheet.create({
  avatar: { alignItems: 'center' },
});
