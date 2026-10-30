import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { ReactNode, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Avatar } from '@/components/avatar';
import { Aviso } from '@/components/aviso';
import { Botao } from '@/components/botao';
import { EstadoCarregando, EstadoErro, EstadoVazio } from '@/components/estados';
import { Selo } from '@/components/selo';
import { avaliarViagem, listarMinhasReservas } from '@/data/repositorio';
import { useCarregamento } from '@/hooks/use-carregamento';
import { cores, espaco, raio, tipografia } from '@/theme';
import { formatarData } from '@/utils/formato';

const RETORNO = ['', 'Que pena. Algo deu errado na viagem?', 'Abaixo do esperado.', 'Viagem regular.', 'Boa viagem!', 'Excelente! Viagem segura e pontual.'];

export default function Avaliar() {
  // Parâmetro recebido da lista de viagens: /avaliar/r1
  const { reservaId } = useLocalSearchParams<{ reservaId: string }>();
  const detalhe = useCarregamento(
    async () => (await listarMinhasReservas()).find((item) => item.reserva.id === reservaId) ?? null,
    [reservaId],
  );

  const [nota, setNota] = useState(0);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function enviar() {
    setEnviando(true);
    setErro(null);
    try {
      await avaliarViagem(reservaId, nota);
      router.back();
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro inesperado.');
    } finally {
      setEnviando(false);
    }
  }

  if (detalhe.status === 'carregando' && !detalhe.dados) {
    return (
      <Folha>
        <EstadoCarregando itens={1} />
      </Folha>
    );
  }
  if (detalhe.status === 'erro') {
    return (
      <Folha>
        <EstadoErro mensagem={detalhe.erro.message} onTentarNovamente={detalhe.recarregar} />
      </Folha>
    );
  }
  if (!detalhe.dados) {
    return (
      <Folha>
        <EstadoVazio titulo="Viagem não encontrada" mensagem="Ela pode ter sido removida." icone="car-outline" />
      </Folha>
    );
  }

  const { carona, motorista } = detalhe.dados;
  const primeiroNome = motorista.nome.split(' ')[0];

  return (
    <Folha>
      <View style={styles.trajeto}>
        <View style={styles.ponto} />
        <Text style={styles.textoTrajeto} numberOfLines={1}>
          {carona.origem} → {carona.destino} · {formatarData(carona.dataHora)}
        </Text>
      </View>

      <View style={styles.motorista}>
        <Avatar nome={motorista.nome} fotoUri={motorista.fotoUri} tamanho={72} verificado />
        <Text style={styles.nome}>{motorista.nome}</Text>
        <Selo rotulo="E-mail verificado" icone="shield-checkmark-outline" estilo={styles.centro} />
      </View>

      <Text style={styles.pergunta}>Como foi sua experiência com {primeiroNome}?</Text>
      <View style={styles.estrelas}>
        {[1, 2, 3, 4, 5].map((n) => (
          <Pressable
            key={n}
            accessibilityRole="button"
            accessibilityLabel={`${n} de 5 estrelas`}
            accessibilityState={{ selected: n === nota }}
            onPress={() => setNota(n)}
            style={styles.estrela}>
            <Ionicons name={n <= nota ? 'star' : 'star-outline'} size={36} color={cores.estrela} />
          </Pressable>
        ))}
      </View>
      {nota > 0 ? <Text style={[styles.retorno, nota <= 2 && { color: cores.aviso }]}>{RETORNO[nota]}</Text> : null}

      <Aviso icone="lock-closed-outline">Sua avaliação ajuda a manter a comunidade de caronas confiável e segura.</Aviso>
      {erro ? <Aviso tipo="erro">{erro}</Aviso> : null}

      <Botao
        titulo="Enviar avaliação"
        icone="send"
        variante="verde"
        desabilitado={nota === 0}
        carregando={enviando}
        onPress={enviar}
      />
    </Folha>
  );
}

/** Folha inferior sobre a tela anterior; tocar fora ou no X fecha. */
function Folha({ children }: { children: ReactNode }) {
  const { bottom } = useSafeAreaInsets();
  return (
    <View style={styles.raiz}>
      <Pressable style={styles.fundo} accessibilityLabel="Fechar" onPress={() => router.back()} />
      <View style={[styles.folha, { paddingBottom: bottom + espaco.md }]}>
        <View style={styles.alca} />
        <View style={styles.cabecalho}>
          <Text style={styles.titulo} accessibilityRole="header">
            Avaliar viagem
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Fechar"
            onPress={() => router.back()}
            style={styles.fechar}>
            <Ionicons name="close" size={20} color={cores.texto} />
          </Pressable>
        </View>
        <ScrollView contentContainerStyle={styles.conteudo}>{children}</ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  raiz: { flex: 1, justifyContent: 'flex-end' },
  fundo: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(15, 23, 42, 0.45)' },
  folha: {
    maxHeight: '90%',
    backgroundColor: cores.superficie,
    borderTopLeftRadius: raio.xl,
    borderTopRightRadius: raio.xl,
    paddingTop: espaco.sm,
  },
  alca: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: cores.bordaForte },
  cabecalho: { alignItems: 'center', justifyContent: 'center', paddingVertical: espaco.sm, minHeight: 52 },
  titulo: { ...tipografia.tituloP, color: cores.texto },
  fechar: {
    position: 'absolute',
    right: espaco.md,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: cores.superficieAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  conteudo: { paddingHorizontal: espaco.md, gap: espaco.md },
  trajeto: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaco.sm,
    padding: espaco.md - 4,
    borderRadius: raio.md,
    backgroundColor: cores.superficieAlt,
  },
  ponto: { width: 8, height: 8, borderRadius: 4, backgroundColor: cores.verde },
  textoTrajeto: { ...tipografia.rotuloP, color: cores.texto, flexShrink: 1 },
  motorista: { alignItems: 'center', gap: espaco.xs },
  centro: { alignSelf: 'center' },
  nome: { ...tipografia.tituloP, color: cores.texto, marginTop: espaco.xs },
  pergunta: { ...tipografia.corpo, color: cores.texto, textAlign: 'center' },
  estrelas: { flexDirection: 'row', justifyContent: 'center', gap: espaco.sm },
  estrela: { minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  retorno: { ...tipografia.rotuloP, color: cores.verde, textAlign: 'center' },
});
