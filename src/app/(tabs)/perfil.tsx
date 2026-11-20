import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';

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
import { sair as sairDaConta } from '@/data/auth';
import { definirSimularErro, obterConfig, obterMeuPerfil, salvarMeuPerfil } from '@/data/repositorio';
import { Usuario } from '@/data/tipos';
import { useCarregamento } from '@/hooks/use-carregamento';
import { cores, espaco, raio, tipografia } from '@/theme';
import { escolherFoto } from '@/utils/foto';

export default function Perfil() {
  const perfil = useCarregamento(obterMeuPerfil);
  const [simularErro, setSimularErro] = useState(false);

  const [editando, setEditando] = useState(false);
  const [nome, setNome] = useState('');
  const [cidade, setCidade] = useState('');
  const [bio, setBio] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [trocandoFoto, setTrocandoFoto] = useState(false);
  const [erroFoto, setErroFoto] = useState<string | null>(null);

  useEffect(() => {
    obterConfig().then((c) => setSimularErro(c.simularErro));
  }, []);

  async function alternarErro(valor: boolean) {
    setSimularErro(valor);
    await definirSimularErro(valor);
    perfil.recarregar();
  }

  // Ao sair, as rotas protegidas levam de volta para o login.
  async function sair() {
    await sairDaConta();
  }

  // RF-03: a foto vai reduzida para o próprio perfil no Firestore (ver utils/foto.ts).
  async function trocarFoto() {
    setErroFoto(null);
    try {
      const foto = await escolherFoto();
      if (!foto) return;
      setTrocandoFoto(true);
      await salvarMeuPerfil({ fotoUri: foto });
      await perfil.recarregar();
    } catch (e) {
      setErroFoto(e instanceof Error ? e.message : 'Não foi possível trocar a foto.');
    } finally {
      setTrocandoFoto(false);
    }
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
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Trocar foto de perfil"
              disabled={trocandoFoto}
              onPress={trocarFoto}
              style={styles.foto}>
              <Avatar nome={usuario.nome} fotoUri={usuario.fotoUri} tamanho={72} verificado />
              <Text style={styles.trocarFoto}>{trocandoFoto ? 'Salvando…' : 'Trocar foto'}</Text>
            </Pressable>
            <View style={styles.flex}>
              <Text style={styles.nome}>{usuario.nome}</Text>
              <Text style={styles.legenda}>
                <Ionicons name="location-outline" size={13} color={cores.textoSecundario} />{' '}
                {usuario.cidade || 'Cidade não informada'}
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
              <Text style={styles.legenda}>caronas oferecidas</Text>
            </View>
          </View>
          {erroFoto ? <Aviso tipo="erro">{erroFoto}</Aviso> : null}
        </Cartao>
      ) : null}

      {usuario && !usuario.cidade && !editando ? (
        <Aviso icone="location-outline">Complete seu perfil com a sua cidade para os outros usuários te conhecerem.</Aviso>
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

      {/* Ferramenta para a apresentação: força o comportamento sem conexão (RF-14 e RNF-04). */}
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
      </View>
    </Tela>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, gap: espaco.xs },
  identidade: { flexDirection: 'row', alignItems: 'center', gap: espaco.md },
  foto: { alignItems: 'center', gap: 2 },
  trocarFoto: { ...tipografia.legenda, color: cores.primaria },
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
