import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Avatar } from '@/components/avatar';
import { Aviso } from '@/components/aviso';
import { Botao } from '@/components/botao';
import { SeloVagas } from '@/components/card-carona';
import { Cartao } from '@/components/cartao';
import { EstadoCarregando, EstadoErro, EstadoVazio } from '@/components/estados';
import { Selo } from '@/components/selo';
import { Tela } from '@/components/tela';
import { cancelarReserva, obterCarona, obterMinhaReserva, solicitarVaga } from '@/data/repositorio';
import { ID_USUARIO_ATUAL } from '@/data/seed';
import { useCarregamento } from '@/hooks/use-carregamento';
import { cores, espaco, tipografia } from '@/theme';
import { formatarDataExtensa, formatarDiasSemana, formatarHora, formatarMoeda } from '@/utils/formato';

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
  const minhaCarona = carona.motoristaId === ID_USUARIO_ATUAL;

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

  const rodape = viagemPassada || minhaCarona ? null : reserva ? (
    <Botao
      titulo="Cancelar minha vaga"
      variante="perigo"
      icone="close-circle-outline"
      carregando={enviando}
      onPress={() => executar(() => cancelarReserva(reserva.id), 'Sua vaga foi cancelada.')}
    />
  ) : (
    <Botao
      titulo={lotada ? 'Carona lotada' : 'Solicitar vaga'}
      icone="person-add-outline"
      desabilitado={lotada}
      carregando={enviando}
      onPress={() => executar(() => solicitarVaga(carona.id), 'Vaga reservada! Combine o pagamento com o motorista.')}
    />
  );

  function legendaParada(i: number) {
    if (i === 0) return 'Ponto de partida';
    if (i === trajeto.length - 1) return 'Destino final';
    return 'Parada intermediária';
  }

  return (
    <Tela bordas={['bottom']} rodape={rodape}>
      <View style={styles.topo}>
        {carona.recorrencia ? (
          <Selo rotulo={`Toda semana: ${formatarDiasSemana(carona.recorrencia.diasSemana)}`} icone="repeat" />
        ) : null}
        <Text style={styles.quando}>{formatarDataExtensa(carona.dataHora)}</Text>
      </View>

      {mensagem ? (
        <Aviso tipo={mensagem.tipo === 'ok' ? 'sucesso' : 'erro'}>{mensagem.texto}</Aviso>
      ) : reserva ? (
        <Aviso tipo="sucesso">Você tem uma vaga nesta carona.</Aviso>
      ) : minhaCarona ? (
        <Aviso icone="car-outline">Esta é uma carona publicada por você.</Aviso>
      ) : null}

      <Cartao titulo="Itinerário planejado" icone="map-outline">
        <View>
          {trajeto.map((cidade, i) => {
            const ponta = i === 0 || i === trajeto.length - 1;
            const ultima = i === trajeto.length - 1;
            return (
              <View key={`${cidade}-${i}`} style={styles.parada}>
                <View style={styles.marcadorColuna}>
                  <View style={ponta ? styles.marcadorPonta : styles.marcadorParada} />
                  {ultima ? null : <View style={styles.linhaTrajeto} />}
                </View>
                <View style={styles.textosParada}>
                  <Text style={ponta ? styles.cidadePonta : styles.cidadeParada}>{cidade}</Text>
                  <Text style={styles.legenda}>{legendaParada(i)}</Text>
                </View>
                {i === 0 ? <Text style={styles.horario}>{formatarHora(carona.dataHora)}</Text> : null}
              </View>
            );
          })}
        </View>
      </Cartao>

      <Cartao>
        <View style={styles.linhaValores}>
          <View>
            <Text style={styles.legenda}>Contribuição</Text>
            <Text style={styles.valor}>
              {formatarMoeda(carona.valorPorVaga)} <Text style={styles.legenda}>/ vaga</Text>
            </Text>
          </View>
          <View style={styles.disponibilidade}>
            <Text style={styles.legenda}>Disponibilidade</Text>
            <View>
              <SeloVagas carona={carona} />
            </View>
            <Text style={styles.legenda}>de {carona.vagasTotais} no total</Text>
          </View>
        </View>
        <Aviso>O pagamento é combinado diretamente com o motorista. Não intermediamos cobranças no app.</Aviso>
      </Cartao>

      <Cartao>
        <View style={styles.motorista}>
          <Avatar nome={motorista.nome} fotoUri={motorista.fotoUri} tamanho={56} verificado />
          <View style={styles.dadosMotorista}>
            <View style={styles.linhaNome}>
              <Text style={styles.nome}>{motorista.nome}</Text>
              <Selo rotulo={motorista.avaliacaoMedia.toFixed(1)} icone="star" tom="aviso" />
            </View>
            <Text style={styles.legenda}>
              {motorista.totalAvaliacoes} avaliações · {motorista.totalViagens} viagens realizadas
            </Text>
            <Selo rotulo="E-mail verificado" icone="shield-checkmark-outline" />
          </View>
        </View>
        {motorista.bio ? <Text style={styles.bio}>{motorista.bio}</Text> : null}
      </Cartao>

      {carona.observacoes ? (
        <Cartao titulo="Observações do motorista" icone="document-text-outline">
          <View style={styles.observacao}>
            <Ionicons name="location-outline" size={18} color={cores.primaria} />
            <Text style={styles.bio}>{carona.observacoes}</Text>
          </View>
        </Cartao>
      ) : null}
    </Tela>
  );
}

const styles = StyleSheet.create({
  topo: { gap: espaco.sm, paddingTop: espaco.sm },
  quando: { ...tipografia.tituloG, color: cores.texto },
  parada: { flexDirection: 'row', gap: espaco.md },
  marcadorColuna: { alignItems: 'center', width: 20 },
  marcadorPonta: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 4,
    borderColor: cores.verde,
    backgroundColor: cores.superficie,
    marginTop: 3,
  },
  marcadorParada: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: cores.primaria,
    borderWidth: 3,
    borderColor: cores.primariaSuave,
    marginTop: 6,
  },
  linhaTrajeto: { width: 2, flex: 1, minHeight: 24, backgroundColor: cores.bordaForte, marginVertical: 2 },
  textosParada: { flex: 1, paddingBottom: espaco.md },
  cidadePonta: { ...tipografia.rotulo, color: cores.texto },
  cidadeParada: { ...tipografia.rotuloP, color: cores.texto },
  horario: { ...tipografia.rotuloP, color: cores.verde },
  legenda: { ...tipografia.legenda, color: cores.textoSecundario },
  linhaValores: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  valor: { ...tipografia.numero, color: cores.verde },
  disponibilidade: { alignItems: 'flex-end', gap: 2 },
  motorista: { flexDirection: 'row', alignItems: 'flex-start', gap: espaco.md },
  dadosMotorista: { flex: 1, gap: espaco.xs },
  linhaNome: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: espaco.sm },
  nome: { ...tipografia.tituloP, color: cores.texto, flexShrink: 1 },
  bio: { ...tipografia.corpo, color: cores.texto, flex: 1 },
  observacao: { flexDirection: 'row', gap: espaco.sm, alignItems: 'flex-start' },
});
