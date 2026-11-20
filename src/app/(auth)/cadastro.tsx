import { useState } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';

import { Avatar } from '@/components/avatar';
import { Aviso } from '@/components/aviso';
import { Botao } from '@/components/botao';
import { Campo } from '@/components/campo';
import { CampoCidade } from '@/components/campo-cidade';
import { Entrada } from '@/components/entrada';
import { cadastrar, mensagemDeErroAuth } from '@/data/auth';
import { cores, tipografia } from '@/theme';
import { escolherFoto } from '@/utils/foto';

// RF-01 e RF-03: cria a conta no Firebase Auth e envia o e-mail de
// verificação. O perfil público só é gravado depois da confirmação.
export default function Cadastro() {
  const [nome, setNome] = useState('');
  const [cidade, setCidade] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmacao, setConfirmacao] = useState('');
  const [foto, setFoto] = useState<string | undefined>();
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function trocarFoto() {
    setErro(null);
    try {
      const nova = await escolherFoto();
      if (nova) setFoto(nova);
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não foi possível abrir a galeria.');
    }
  }

  function validar() {
    if (!nome.trim()) return 'Informe seu nome.';
    if (!cidade.trim()) return 'Informe sua cidade.';
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return 'Informe um e-mail válido.';
    if (senha.length < 6) return 'A senha precisa ter pelo menos 6 caracteres.';
    if (senha !== confirmacao) return 'As senhas não conferem.';
    return null;
  }

  async function criarConta() {
    const problema = validar();
    setErro(problema);
    if (problema) return;
    setSalvando(true);
    try {
      await cadastrar({ nome, cidade, email, senha, fotoUri: foto });
      // A sessão muda e o app abre a tela "Confirme seu e-mail".
    } catch (e) {
      setErro(mensagemDeErroAuth(e));
      setSalvando(false);
    }
  }

  return (
    <Entrada aba="cadastro">
      <Pressable accessibilityRole="button" accessibilityLabel="Escolher foto de perfil" onPress={trocarFoto} style={styles.avatar}>
        <Avatar nome={nome || '?'} fotoUri={foto} tamanho={80} />
        <Text style={styles.trocarFoto}>{foto ? 'Trocar foto' : 'Adicionar foto'}</Text>
      </Pressable>
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
        autoComplete="email"
      />
      <Campo
        rotulo="Senha"
        icone="lock-closed-outline"
        value={senha}
        onChangeText={setSenha}
        placeholder="Mínimo de 6 caracteres"
        secureTextEntry
        autoComplete="new-password"
      />
      <Campo
        rotulo="Confirmar senha"
        icone="lock-closed-outline"
        value={confirmacao}
        onChangeText={setConfirmacao}
        placeholder="Repita a senha"
        secureTextEntry
        autoComplete="new-password"
      />
      {erro ? <Aviso tipo="erro">{erro}</Aviso> : null}
      <Botao titulo="Criar conta" icone="person-add-outline" onPress={criarConta} carregando={salvando} />
      <Text style={styles.legenda}>Vamos enviar um link para confirmar seu e-mail antes do primeiro acesso.</Text>
    </Entrada>
  );
}

const styles = StyleSheet.create({
  avatar: { alignItems: 'center', gap: 4, minHeight: 44 },
  trocarFoto: { ...tipografia.rotuloP, color: cores.primaria },
  legenda: { ...tipografia.legenda, color: cores.textoSecundario, textAlign: 'center' },
});
