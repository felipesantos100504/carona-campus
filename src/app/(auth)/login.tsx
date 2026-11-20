import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Aviso } from '@/components/aviso';
import { Botao } from '@/components/botao';
import { Campo } from '@/components/campo';
import { Entrada } from '@/components/entrada';
import { entrarComEmail, entrarComGoogle, googleDisponivel, mensagemDeErroAuth, redefinirSenha } from '@/data/auth';
import { cores, espaco, tipografia } from '@/theme';

// Ao entrar, o Firebase Auth avisa o app (useSessao) e as rotas protegidas
// levam o usuário para as abas ou para a confirmação de e-mail.
export default function Login() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [enviando, setEnviando] = useState<'email' | 'google' | 'senha' | null>(null);
  const [mensagem, setMensagem] = useState<{ tipo: 'erro' | 'sucesso'; texto: string } | null>(null);

  async function executar(tipo: 'email' | 'google' | 'senha', acao: () => Promise<void>, sucesso?: string) {
    setEnviando(tipo);
    setMensagem(null);
    try {
      await acao();
      if (sucesso) setMensagem({ tipo: 'sucesso', texto: sucesso });
    } catch (e) {
      setMensagem({ tipo: 'erro', texto: mensagemDeErroAuth(e) });
    } finally {
      setEnviando(null);
    }
  }

  function entrar() {
    if (!email.trim() || !senha) {
      setMensagem({ tipo: 'erro', texto: 'Informe e-mail e senha.' });
      return;
    }
    executar('email', () => entrarComEmail(email, senha));
  }

  function esqueciSenha() {
    if (!email.trim()) {
      setMensagem({ tipo: 'erro', texto: 'Digite seu e-mail acima para receber o link de nova senha.' });
      return;
    }
    executar('senha', () => redefinirSenha(email), 'Enviamos um link para criar uma nova senha. Confira seu e-mail.');
  }

  return (
    <Entrada aba="login">
      <Campo
        rotulo="E-mail"
        icone="at"
        placeholder="seu@email.com"
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        value={email}
        onChangeText={setEmail}
      />
      <Campo
        rotulo="Senha"
        icone="lock-closed-outline"
        placeholder="Digite sua senha"
        secureTextEntry
        autoComplete="current-password"
        value={senha}
        onChangeText={setSenha}
        onSubmitEditing={entrar}
      />
      {mensagem ? <Aviso tipo={mensagem.tipo}>{mensagem.texto}</Aviso> : null}
      <Botao titulo="Entrar" icone="car-outline" onPress={entrar} carregando={enviando === 'email'} desabilitado={!!enviando} />
      <Botao
        titulo="Esqueci minha senha"
        variante="texto"
        pequeno
        carregando={enviando === 'senha'}
        desabilitado={!!enviando}
        onPress={esqueciSenha}
      />

      {googleDisponivel ? (
        <>
          <View style={styles.separador}>
            <View style={styles.linha} />
            <Text style={styles.ou}>ou</Text>
            <View style={styles.linha} />
          </View>
          <Botao
            titulo="Entrar com Google"
            icone="logo-google"
            variante="contorno"
            carregando={enviando === 'google'}
            desabilitado={!!enviando}
            onPress={() => executar('google', entrarComGoogle)}
          />
        </>
      ) : null}
    </Entrada>
  );
}

const styles = StyleSheet.create({
  separador: { flexDirection: 'row', alignItems: 'center', gap: espaco.sm },
  linha: { flex: 1, height: 1, backgroundColor: cores.borda },
  ou: { ...tipografia.legenda, color: cores.textoSecundario },
});
