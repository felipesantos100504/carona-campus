import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, Switch, Text, View } from 'react-native';

import { Avatar } from '@/components/avatar';
import { Aviso } from '@/components/aviso';
import { Botao } from '@/components/botao';
import { Cabecalho } from '@/components/cabecalho';
import { Campo } from '@/components/campo';
import { CampoCidade } from '@/components/campo-cidade';
import { Cartao } from '@/components/cartao';
import { EstadoCarregando, EstadoErro } from '@/components/estados';
import { Selo } from '@/components/selo';
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

  const usuario = perfil.status !== 'erro' ? perfil.dados : null;

  return (
    <Tela>
      <Cabecalho titulo="Perfil" semPerfil />

      {perfil.status === 'carregando' && !perfil.dados ? <EstadoCarregando itens={1} /> : null}
      {perfil.status === 'erro' ? <EstadoErro mensagem={perfil.erro.message} onTentarNovamente={perfil.recarregar} /> : null}

      {usuario ? (
        <Cartao>
          <View style={styles.identidade}>
            <Avatar nome={usuario.nome} fotoUri={usuario.fotoUri} tamanho={72} verificado />
            <View style={styles.flex}>
              <Text style={styles.nome}>{usuario.nome}</Text>
              <Text style={styles.legenda}>
                <Ionicons name="location-outline" size={13} color={cores.textoSecundario} /> {usuario.cidade}
              </Text>
              <Selo rotulo="E-mail verificado" icone="shield-checkmark-outline" />
            </View>
          </View>
          <View style={styles.numeros}>
            <View style={styles.numero}>
              <Text style={styles.valor}>
                {usuario.avaliacaoMedia.toFixed(1)} <Ionicons name="star" size={18} color={cores.estrela} />
              </Text>
              <Text style={styles.legenda}>{usuario.totalAvaliacoes} avaliações</Text>
            </View>
            <View style={styles.divisor} />
            <View style={styles.numero}>
              <Text style={styles.valor}>{usuario.totalViagens}</Text>
              <Text style={styles.legenda}>viagens feitas</Text>
            </View>
          </View>
        </Cartao>
      ) : null}

      {usuario && !editando ? (
        <Cartao titulo="Sobre mim" icone="person-outline">
          <Text style={styles.bio}>{usuario.bio || 'Conte um pouco sobre você e suas viagens.'}</Text>
        </Cartao>
      ) : null}

      {editando ? (
        <Cartao titulo="Editar perfil" icone="create-outline">
          <Campo rotulo="Nome completo" icone="person-outline" value={nome} onChangeText={setNome} placeholder="Seu nome" />
          <CampoCidade rotulo="Cidade" tipo="origem" valor={cidade} onChange={setCidade} placeholder="Onde você mora" />
          <Campo
            rotulo="Sobre você"
            icone="chatbubble-ellipses-outline"
            value={bio}
            onChangeText={setBio}
            placeholder="Ex.: viajo toda sexta para visitar a família"
            multiline
          />
          {erro ? <Aviso tipo="erro">{erro}</Aviso> : null}
          <Botao titulo="Salvar" icone="checkmark" variante="verde" carregando={salvando} onPress={salvar} />
          <Botao titulo="Cancelar" variante="texto" desabilitado={salvando} onPress={() => setEditando(false)} />
        </Cartao>
      ) : usuario ? (
        <Botao titulo="Editar perfil" icone="create-outline" variante="contorno" onPress={() => editar(usuario)} />
      ) : null}

      <Botao titulo="Sair da conta" variante="perigo" icone="log-out-outline" onPress={sair} />

      {/* Ferramentas para a apresentação: forçar o estado de erro e voltar aos dados iniciais. */}
      <View style={styles.dev}>
        <Text style={styles.devTitulo}>Modo demonstração</Text>
        <View style={styles.linha}>
          <Text style={styles.devTexto}>Simular falta de conexão</Text>
          <Switch
            value={simularErro}
            onValueChange={alternarErro}
            trackColor={{ true: cores.verde, false: cores.bordaForte }}
          />
        </View>
        <Botao titulo="Restaurar dados de exemplo" variante="contorno" icone="refresh" pequeno onPress={restaurar} />
      </View>
    </Tela>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, gap: espaco.xs },
  identidade: { flexDirection: 'row', alignItems: 'center', gap: espaco.md },
  nome: { ...tipografia.tituloM, color: cores.texto },
  legenda: { ...tipografia.legenda, color: cores.textoSecundario },
  numeros: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: espaco.md,
    borderRadius: raio.md,
    backgroundColor: cores.superficieAlt,
  },
  numero: { flex: 1, alignItems: 'center' },
  valor: { ...tipografia.numero, color: cores.primariaEscura },
  divisor: { width: 1, alignSelf: 'stretch', backgroundColor: cores.borda },
  bio: { ...tipografia.corpo, color: cores.texto },
  dev: {
    gap: espaco.sm,
    padding: espaco.md,
    borderRadius: raio.lg,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: cores.bordaForte,
    marginTop: espaco.md,
  },
  devTitulo: { ...tipografia.rotuloP, color: cores.textoSecundario },
  devTexto: { ...tipografia.corpo, color: cores.texto, flex: 1 },
  linha: { flexDirection: 'row', alignItems: 'center', minHeight: 44 },
});
