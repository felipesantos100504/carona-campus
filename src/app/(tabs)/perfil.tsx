import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, Switch, Text, View } from 'react-native';

import { Avatar } from '@/components/avatar';
import { Botao } from '@/components/botao';
import { EstadoCarregando, EstadoErro } from '@/components/estados';
import { Placeholder } from '@/components/placeholder';
import { Tela } from '@/components/tela';
import { definirSimularErro, obterConfig, obterMeuPerfil, restaurarDadosDeExemplo, sessao } from '@/data/repositorio';
import { useCarregamento } from '@/hooks/use-carregamento';
import { cores, espaco, raio, tipografia } from '@/theme';

// TODO(Integrante A): editar nome, cidade, bio e foto (salvarMeuPerfil).
export default function Perfil() {
  const perfil = useCarregamento(obterMeuPerfil);
  const [simularErro, setSimularErro] = useState(false);

  useEffect(() => {
    obterConfig().then((c) => setSimularErro(c.simularErro));
  }, []);

  async function alternarErro(valor: boolean) {
    setSimularErro(valor);
    await definirSimularErro(valor);
    perfil.recarregar();
  }

  async function sair() {
    await sessao.sair();
    router.replace('/login');
  }

  async function restaurar() {
    await restaurarDadosDeExemplo();
    setSimularErro(false);
    perfil.recarregar();
  }

  return (
    <Tela>
      {perfil.status === 'carregando' ? <EstadoCarregando itens={1} /> : null}
      {perfil.status === 'erro' ? <EstadoErro mensagem={perfil.erro.message} onTentarNovamente={perfil.recarregar} /> : null}
      {perfil.status === 'pronto' && perfil.dados ? (
        <View style={styles.cabecalho}>
          <Avatar nome={perfil.dados.nome} fotoUri={perfil.dados.fotoUri} tamanho={88} />
          <Text style={styles.nome}>{perfil.dados.nome}</Text>
          <Text style={styles.detalhe}>
            {perfil.dados.cidade} · ★ {perfil.dados.avaliacaoMedia.toFixed(1)} · {perfil.dados.totalViagens} viagens
          </Text>
          {perfil.dados.bio ? <Text style={styles.bio}>{perfil.dados.bio}</Text> : null}
        </View>
      ) : null}

      <Placeholder responsavel="Integrante A" itens={['Editar perfil (nome, cidade, bio)', 'Trocar foto de perfil']} />

      {/* Ferramentas para a apresentação: forçar o estado de erro e voltar aos dados iniciais. */}
      <View style={styles.dev}>
        <Text style={styles.devTitulo}>Modo demonstração</Text>
        <View style={styles.linha}>
          <Text style={styles.devTexto}>Simular falta de conexão</Text>
          <Switch
            value={simularErro}
            onValueChange={alternarErro}
            trackColor={{ true: cores.primaria, false: cores.bordaForte }}
          />
        </View>
        <Botao titulo="Restaurar dados de exemplo" variante="contorno" icone="refresh" onPress={restaurar} />
      </View>

      <Botao titulo="Sair" variante="perigo" icone="log-out-outline" onPress={sair} />
    </Tela>
  );
}

const styles = StyleSheet.create({
  cabecalho: { alignItems: 'center', gap: espaco.xs, paddingTop: espaco.lg },
  nome: { ...tipografia.tituloM, color: cores.texto, marginTop: espaco.sm },
  detalhe: { ...tipografia.corpo, color: cores.textoSecundario },
  bio: { ...tipografia.corpo, color: cores.texto, textAlign: 'center' },
  dev: {
    gap: espaco.sm,
    padding: espaco.md,
    borderRadius: raio.lg,
    backgroundColor: cores.superficieAlt,
  },
  devTitulo: { ...tipografia.rotuloP, color: cores.textoSecundario },
  devTexto: { ...tipografia.corpo, color: cores.texto, flex: 1 },
  linha: { flexDirection: 'row', alignItems: 'center', minHeight: 44 },
});
