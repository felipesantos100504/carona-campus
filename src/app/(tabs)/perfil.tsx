import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, Switch, Text, View } from 'react-native';

import { Avatar } from '@/components/avatar';
import { Botao } from '@/components/botao';
import { Campo } from '@/components/campo';
import { CampoCidade } from '@/components/campo-cidade';
import { EstadoCarregando, EstadoErro } from '@/components/estados';
import { Tela } from '@/components/tela';
import {
  definirSimularErro,
  obterConfig,
  obterMeuPerfil,
  restaurarDadosDeExemplo,
  salvarMeuPerfil,
  sessao,
} from '@/data/repositorio';
import { Usuario } from '@/data/tipos';
import { useCarregamento } from '@/hooks/use-carregamento';
import { cores, espaco, raio, tipografia } from '@/theme';

// A troca de foto (RF-03) entra com o recurso nativo de câmera/galeria na etapa 3.
export default function Perfil() {
  const perfil = useCarregamento(obterMeuPerfil);
  const [simularErro, setSimularErro] = useState(false);

  const [editando, setEditando] = useState(false);
  const [nome, setNome] = useState('');
  const [cidade, setCidade] = useState('');
  const [bio, setBio] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

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
    setEditando(false);
    perfil.recarregar();
  }

  function editar(usuario: Usuario) {
    setNome(usuario.nome);
    setCidade(usuario.cidade);
    setBio(usuario.bio ?? '');
    setErro(null);
    setEditando(true);
  }

  async function salvar() {
    if (!nome.trim() || !cidade.trim()) {
      setErro('Informe seu nome e sua cidade.');
      return;
    }
    setSalvando(true);
    setErro(null);
    try {
      await salvarMeuPerfil({ nome: nome.trim(), cidade: cidade.trim(), bio: bio.trim() || undefined });
      setEditando(false);
      await perfil.recarregar();
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro inesperado.');
    } finally {
      setSalvando(false);
    }
  }

  return (
    <Tela>
      {perfil.status === 'carregando' && !perfil.dados ? <EstadoCarregando itens={1} /> : null}
      {perfil.status === 'erro' ? <EstadoErro mensagem={perfil.erro.message} onTentarNovamente={perfil.recarregar} /> : null}
      {perfil.dados && perfil.status !== 'erro' && !editando ? (
        <View style={styles.cabecalho}>
          <Avatar nome={perfil.dados.nome} fotoUri={perfil.dados.fotoUri} tamanho={88} />
          <Text style={styles.nome}>{perfil.dados.nome}</Text>
          <Text style={styles.detalhe}>
            {perfil.dados.cidade} · ★ {perfil.dados.avaliacaoMedia.toFixed(1)} · {perfil.dados.totalViagens} viagens
          </Text>
          {perfil.dados.bio ? <Text style={styles.bio}>{perfil.dados.bio}</Text> : null}
          <Botao
            titulo="Editar perfil"
            icone="create-outline"
            variante="contorno"
            estilo={styles.botaoEditar}
            onPress={() => perfil.dados && editar(perfil.dados)}
          />
        </View>
      ) : null}

      {editando ? (
        <View style={styles.bloco}>
          <Text style={styles.rotulo}>Editar perfil</Text>
          <Campo rotulo="Nome completo" value={nome} onChangeText={setNome} placeholder="Seu nome" />
          <CampoCidade rotulo="Cidade" valor={cidade} onChange={setCidade} placeholder="Onde você mora" />
          <Campo
            rotulo="Sobre você"
            value={bio}
            onChangeText={setBio}
            placeholder="Ex.: viajo toda sexta para visitar a família"
            multiline
          />
          {erro ? <Text style={[styles.mensagem, styles.mensagemErro]}>{erro}</Text> : null}
          <Botao titulo="Salvar" icone="checkmark" carregando={salvando} onPress={salvar} />
          <Botao titulo="Cancelar" variante="texto" desabilitado={salvando} onPress={() => setEditando(false)} />
        </View>
      ) : null}

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
  botaoEditar: { marginTop: espaco.sm, alignSelf: 'stretch' },
  bloco: {
    backgroundColor: cores.superficie,
    borderRadius: raio.lg,
    borderWidth: 1,
    borderColor: cores.borda,
    padding: espaco.md,
    gap: espaco.md,
    marginTop: espaco.lg,
  },
  rotulo: { ...tipografia.rotuloP, color: cores.primaria },
  mensagem: { ...tipografia.rotuloP, padding: espaco.md, borderRadius: raio.md, textAlign: 'center' },
  mensagemErro: { backgroundColor: cores.erroSuave, color: cores.erro },
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
