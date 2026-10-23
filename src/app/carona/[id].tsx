import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Avatar } from '@/components/avatar';
import { Botao } from '@/components/botao';
import { EstadoCarregando, EstadoErro, EstadoVazio } from '@/components/estados';
import { Tela } from '@/components/tela';
import { cancelarReserva, obterCarona, obterMinhaReserva, solicitarVaga } from '@/data/repositorio';
import { useCarregamento } from '@/hooks/use-carregamento';
import { cores, espaco, raio, tipografia } from '@/theme';
import { formatarData, formatarDiasSemana, formatarHora, formatarMoeda } from '@/utils/formato';

export default function DetalhesCarona() {
  // Parâmetro recebido da lista: /carona/c1
  const { id } = useLocalSearchParams<{ id: string }>();
  const detalhe = useCarregamento(async () => {
    const [resultado, reserva] = await Promise.all([obterCarona(id), obterMinhaReserva(id)]);
    return resultado ? { ...resultado, reserva } : null;
  }, [id]);

  const [enviando, setEnviando] = useState(false);
  const [mensagem, setMensagem] = useState<{ tipo: 'ok' | 'erro'; texto: string } | null>(null);

  if (detalhe.status === 'carregando' && !detalhe.dados) {
    return (
      <Tela bordas={['bottom']}>
        <EstadoCarregando itens={2} />
      </Tela>
    );
  }
  if (detalhe.status === 'erro') {
    return (
      <Tela bordas={['bottom']}>
        <EstadoErro mensagem={detalhe.erro.message} onTentarNovamente={detalhe.recarregar} />
      </Tela>
    );
  }
  if (!detalhe.dados) {
    return (
      <Tela bordas={['bottom']}>
        <EstadoVazio titulo="Carona não encontrada" mensagem="Ela pode ter sido removida pelo motorista." icone="car-outline" />
      </Tela>
    );
  }

  const { carona, motorista, reserva } = detalhe.dados;
  const trajeto = [carona.origem, ...carona.paradas, carona.destino];
  const lotada = carona.vagasDisponiveis <= 0;
  const viagemPassada = new Date(carona.dataHora).getTime() < Date.now();

  async function executar(acao: () => Promise<unknown>, sucesso: string) {
    setEnviando(true);
    setMensagem(null);
    try {
      await acao();
      setMensagem({ tipo: 'ok', texto: sucesso });
      await detalhe.recarregar();
    } catch (e) {
      setMensagem({ tipo: 'erro', texto: e instanceof Error ? e.message : 'Erro inesperado.' });
    } finally {
      setEnviando(false);
    }
  }

  const rodape = viagemPassada ? null : reserva ? (
    <Botao
      titulo="Cancelar minha vaga"
      variante="perigo"
      carregando={enviando}
      onPress={() => executar(() => cancelarReserva(reserva.id), 'Sua vaga foi cancelada.')}
    />
  ) : (
    <Botao
      titulo={lotada ? 'Carona lotada' : 'Solicitar vaga'}
      icone="hand-right-outline"
      desabilitado={lotada}
      carregando={enviando}
      onPress={() => executar(() => solicitarVaga(carona.id), 'Vaga reservada! Combine o pagamento com o motorista.')}
    />
  );

  return (
    <Tela bordas={['bottom']} rodape={rodape}>
      <View style={styles.bloco}>
        <Text style={styles.quando}>
          {formatarData(carona.dataHora)} · {formatarHora(carona.dataHora)}
        </Text>
        {carona.recorrencia ? (
          <Text style={styles.recorrente}>
            <Ionicons name="repeat" size={14} /> Toda semana: {formatarDiasSemana(carona.recorrencia.diasSemana)}
          </Text>
        ) : null}
        <View style={styles.trajeto}>
          {trajeto.map((cidade, i) => {
            const ponta = i === 0 || i === trajeto.length - 1;
            return (
              <View key={`${cidade}-${i}`} style={styles.parada}>
                <View style={styles.marcadorColuna}>
                  <View style={[styles.marcador, ponta ? styles.marcadorPonta : styles.marcadorParada]} />
                  {i < trajeto.length - 1 ? <View style={styles.linhaTrajeto} /> : null}
                </View>
                <Text style={ponta ? styles.cidadePonta : styles.cidadeParada}>{cidade}</Text>
              </View>
            );
          })}
        </View>
      </View>

      <View style={[styles.bloco, styles.linhaInfo]}>
        <View style={styles.info}>
          <Text style={styles.infoValor}>{formatarMoeda(carona.valorPorVaga)}</Text>
          <Text style={styles.infoRotulo}>por vaga</Text>
        </View>
        <View style={styles.info}>
          <Text style={styles.infoValor}>
            {carona.vagasDisponiveis}/{carona.vagasTotais}
          </Text>
          <Text style={styles.infoRotulo}>vagas livres</Text>
        </View>
      </View>
      <Text style={styles.avisoPagamento}>O pagamento é combinado diretamente com o motorista.</Text>

      <View style={[styles.bloco, styles.motorista]}>
        <Avatar nome={motorista.nome} fotoUri={motorista.fotoUri} tamanho={56} />
        <View style={styles.flex}>
          <Text style={styles.nome}>{motorista.nome}</Text>
          <Text style={styles.detalheMotorista}>
            <Ionicons name="star" size={14} color={cores.aviso} /> {motorista.avaliacaoMedia.toFixed(1)} ·{' '}
            {motorista.totalAvaliacoes} avaliações · {motorista.totalViagens} viagens
          </Text>
          {motorista.bio ? <Text style={styles.bio}>{motorista.bio}</Text> : null}
        </View>
      </View>

      {carona.observacoes ? (
        <View style={styles.bloco}>
          <Text style={styles.rotulo}>Observações do motorista</Text>
          <Text style={styles.texto}>{carona.observacoes}</Text>
        </View>
      ) : null}

      {reserva && !mensagem ? (
        <Text style={[styles.mensagem, styles.mensagemOk]}>Você tem uma vaga nesta carona.</Text>
      ) : null}
      {mensagem ? (
        <Text style={[styles.mensagem, mensagem.tipo === 'ok' ? styles.mensagemOk : styles.mensagemErro]}>
          {mensagem.texto}
        </Text>
      ) : null}
    </Tela>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, gap: 2 },
  bloco: {
    backgroundColor: cores.superficie,
    borderRadius: raio.lg,
    borderWidth: 1,
    borderColor: cores.borda,
    padding: espaco.md,
    gap: espaco.sm,
  },
  quando: { ...tipografia.tituloP, color: cores.primaria },
  recorrente: { ...tipografia.legenda, color: cores.primaria },
  trajeto: { marginTop: espaco.sm },
  parada: { flexDirection: 'row', gap: espaco.md },
  marcadorColuna: { alignItems: 'center', width: 16 },
  marcador: { width: 14, height: 14, borderRadius: 7, marginTop: 5 },
  marcadorPonta: { backgroundColor: cores.primaria },
  marcadorParada: { backgroundColor: cores.superficie, borderWidth: 2, borderColor: cores.bordaForte },
  linhaTrajeto: { width: 2, flex: 1, minHeight: 20, backgroundColor: cores.bordaForte },
  cidadePonta: { ...tipografia.tituloP, color: cores.texto, paddingBottom: espaco.md },
  cidadeParada: { ...tipografia.corpo, color: cores.textoSecundario, paddingBottom: espaco.md },
  linhaInfo: { flexDirection: 'row' },
  info: { flex: 1, alignItems: 'center' },
  infoValor: { ...tipografia.tituloM, color: cores.texto },
  infoRotulo: { ...tipografia.legenda, color: cores.textoSecundario },
  avisoPagamento: { ...tipografia.legenda, color: cores.textoSecundario, textAlign: 'center', marginTop: -espaco.sm },
  motorista: { flexDirection: 'row', alignItems: 'flex-start', gap: espaco.md },
  nome: { ...tipografia.tituloP, color: cores.texto },
  detalheMotorista: { ...tipografia.legenda, color: cores.textoSecundario },
  bio: { ...tipografia.corpo, color: cores.texto, marginTop: espaco.xs },
  rotulo: { ...tipografia.rotuloP, color: cores.texto },
  texto: { ...tipografia.corpo, color: cores.texto },
  mensagem: { ...tipografia.rotuloP, padding: espaco.md, borderRadius: raio.md, textAlign: 'center' },
  mensagemOk: { backgroundColor: cores.sucessoSuave, color: cores.sucesso },
  mensagemErro: { backgroundColor: cores.erroSuave, color: cores.erro },
});
