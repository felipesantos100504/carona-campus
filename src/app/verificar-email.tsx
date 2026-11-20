import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Aviso } from '@/components/aviso';
import { Botao } from '@/components/botao';
import { Cartao } from '@/components/cartao';
import { Tela } from '@/components/tela';
import { mensagemDeErroAuth, reenviarVerificacao, sair } from '@/data/auth';
import { useSessao } from '@/hooks/use-sessao';
import { cores, espaco, tipografia } from '@/theme';

// RF-01: o app só é liberado depois que o e-mail é confirmado. As regras do
// Firestore também exigem e-mail verificado (RNF-02).
export default function VerificarEmail() {
  const { usuario, atualizar } = useSessao();
  const [enviando, setEnviando] = useState<'conferir' | 'reenviar' | 'sair' | null>(null);
  const [mensagem, setMensagem] = useState<{ tipo: 'erro' | 'sucesso' | 'info'; texto: string } | null>(null);

  async function executar(tipo: 'conferir' | 'reenviar' | 'sair', acao: () => Promise<void>) {
    setEnviando(tipo);
    setMensagem(null);
    try {
      await acao();
    } catch (e) {
      setMensagem({ tipo: 'erro', texto: mensagemDeErroAuth(e) });
    } finally {
      setEnviando(null);
    }
  }

  const conferir = () =>
    executar('conferir', async () => {
      const ok = await atualizar();
      // Se confirmou, as rotas protegidas levam direto para o app.
      if (!ok) setMensagem({ tipo: 'info', texto: 'Ainda não identificamos a confirmação. Abra o link do e-mail e tente de novo.' });
    });

  const reenviar = () =>
    executar('reenviar', async () => {
      await reenviarVerificacao();
      setMensagem({ tipo: 'sucesso', texto: 'Enviamos um novo link. Confira também a caixa de spam.' });
    });

  return (
    <Tela>
      <View style={styles.topo}>
        <View style={styles.icone}>
          <Ionicons name="mail-unread-outline" size={40} color={cores.primaria} />
        </View>
        <Text style={styles.titulo}>Confirme seu e-mail</Text>
        <Text style={styles.texto}>
          Enviamos um link de confirmação para{'\n'}
          <Text style={styles.email}>{usuario?.email}</Text>
        </Text>
      </View>

      <Cartao>
        <Text style={styles.texto}>
          1. Abra o e-mail do Carona Campus (veja também o spam).{'\n'}2. Toque no link de confirmação.{'\n'}3. Volte aqui e
          toque em &quot;Já confirmei&quot;.
        </Text>
      </Cartao>

      {mensagem ? <Aviso tipo={mensagem.tipo}>{mensagem.texto}</Aviso> : null}

      <Botao titulo="Já confirmei" icone="checkmark-circle-outline" variante="verde" carregando={enviando === 'conferir'} desabilitado={!!enviando} onPress={conferir} />
      <Botao titulo="Reenviar e-mail" icone="send-outline" variante="contorno" carregando={enviando === 'reenviar'} desabilitado={!!enviando} onPress={reenviar} />
      <Botao titulo="Usar outra conta" variante="texto" carregando={enviando === 'sair'} desabilitado={!!enviando} onPress={() => executar('sair', sair)} />
    </Tela>
  );
}

const styles = StyleSheet.create({
  topo: { alignItems: 'center', gap: espaco.sm, paddingTop: espaco.xl },
  icone: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: cores.primariaSuave,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titulo: { ...tipografia.tituloG, color: cores.texto },
  texto: { ...tipografia.corpo, color: cores.textoSecundario, textAlign: 'center' },
  email: { ...tipografia.rotulo, color: cores.texto },
});
