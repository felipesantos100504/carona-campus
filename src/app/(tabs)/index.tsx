import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Aviso } from '@/components/aviso';
import { Botao } from '@/components/botao';
import { Cabecalho } from '@/components/cabecalho';
import { CampoCidade } from '@/components/campo-cidade';
import { CardCaronaCompacto } from '@/components/card-carona';
import { Campo } from '@/components/campo';
import { Cartao } from '@/components/cartao';
import { Chip } from '@/components/chip';
import { EstadoCarregando, EstadoErro } from '@/components/estados';
import { Selo } from '@/components/selo';
import { Tela } from '@/components/tela';
import { sugerirPontos } from '@/data/cidades';
import { interpretarBusca } from '@/data/ia';
import { buscarCaronas } from '@/data/repositorio';
import { useCarregamento } from '@/hooks/use-carregamento';
import { cores, espaco, sombra, tipografia } from '@/theme';
import { formatarData, hojeISO } from '@/utils/formato';

const SUGESTOES = ['Dois Vizinhos', 'Curitiba', 'Guarapuava', 'Francisco Beltrão', 'Cascavel'];

export default function Buscar() {
  const [origem, setOrigem] = useState('');
  const [destino, setDestino] = useState('');
  const [data, setData] = useState('');
  // Horário aproximado (vem da busca em texto livre) e lugares dentro da
  // cidade onde o passageiro quer embarcar e descer (RF-17 e RF-20).
  const [horario, setHorario] = useState('');
  const [ponto, setPonto] = useState('');
  const [chegada, setChegada] = useState('');

  const [pedido, setPedido] = useState('');
  const [interpretando, setInterpretando] = useState(false);
  const [avisoIA, setAvisoIA] = useState<{ tipo: 'info' | 'erro'; texto: string } | null>(null);

  const proximas = useCarregamento(async () => (await buscarCaronas()).slice(0, 3));

  // Calculado a cada renderização para não ficar com a data errada após a meia-noite.
  const opcoesData = [
    { rotulo: 'Qualquer dia', valor: '' },
    { rotulo: 'Hoje', valor: hojeISO(0) },
    { rotulo: 'Amanhã', valor: hojeISO(1) },
  ];
  // Data trazida pela IA (ex.: sexta-feira) vira mais uma opção, já marcada.
  if (data && !opcoesData.some((o) => o.valor === data)) {
    opcoesData.push({ rotulo: formatarData(`${data}T12:00:00`), valor: data });
  }

  function inverter() {
    setOrigem(destino);
    setDestino(origem);
    setPonto(chegada);
    setChegada(ponto);
  }

  // Lugares conhecidos nas cidades escolhidas: o toque preenche "Embarcar em" e depois "Descer em".
  const pontosSugeridos = sugerirPontos([origem, destino]).filter((p) => p.nome !== ponto && p.nome !== chegada);

  function escolherPonto(nome: string) {
    if (!ponto.trim()) setPonto(nome);
    else setChegada(nome);
  }

  function abrirResultados(params: { origem: string; destino: string; data: string; via?: string }) {
    // Passagem de parâmetros para a tela de resultados.
    router.push({ pathname: '/resultados', params: { ...params, horario, ponto: ponto.trim(), chegada: chegada.trim() } });
  }

  function buscar() {
    abrirResultados({ origem: origem.trim(), destino: destino.trim(), data });
  }

  // RF-17: o passageiro descreve o que precisa e a IA preenche a busca.
  async function buscarComIA() {
    setInterpretando(true);
    setAvisoIA(null);
    try {
      const b = await interpretarBusca(pedido);
      // Cada pedido substitui a busca anterior: o que ele não informa fica vazio
      // (antes sobravam cidades de buscas passadas, como "Ponta Grossa → Ponta Grossa").
      const novaOrigem = b.origem ?? '';
      const novoDestino = b.destino ?? '';
      setOrigem(novaOrigem);
      setDestino(novoDestino);
      setData(b.data ?? '');
      setHorario(b.horario ?? '');
      setPonto(b.pontoEmbarque ?? '');
      setChegada(b.pontoChegada ?? '');
      if (!b.origem && !b.destino) {
        setAvisoIA({
          tipo: 'info',
          texto:
            'Não identificamos a cidade do seu pedido. Informe a cidade de saída e a de destino abaixo (para andar dentro da cidade, use a mesma nas duas).',
        });
        return;
      }
      router.push({
        pathname: '/resultados',
        params: {
          origem: novaOrigem.trim(),
          destino: novoDestino.trim(),
          data: b.data ?? '',
          horario: b.horario ?? '',
          ponto: b.pontoEmbarque ?? '',
          chegada: b.pontoChegada ?? '',
          via: b.fonte,
        },
      });
    } catch (e) {
      setAvisoIA({ tipo: 'erro', texto: e instanceof Error ? e.message : 'Não foi possível interpretar o pedido.' });
    } finally {
      setInterpretando(false);
    }
  }

  function abrirCarona(id: string) {
    router.push({ pathname: '/carona/[id]', params: { id } });
  }

  return (
    <Tela>
      <Cabecalho titulo="Carona Campus" subtitulo="Buscar" />
      <View style={styles.intro}>
        <Text style={styles.titulo}>Para onde você quer ir?</Text>
        <Text style={styles.subtitulo}>Encontre e compartilhe caronas entre cidades do Paraná ou dentro da sua cidade.</Text>
      </View>

      <Cartao estilo={styles.cartaoIA}>
        <Selo rotulo="Busca com IA" icone="sparkles-outline" />
        <Campo
          rotulo="Diga para onde você precisa ir"
          icone="chatbubble-ellipses-outline"
          placeholder="Ex.: preciso ir do Mercado Ítalo até a UTFPR às 18h30"
          multiline
          value={pedido}
          onChangeText={setPedido}
        />
        <Botao
          titulo="Buscar com IA"
          icone="sparkles"
          desabilitado={!pedido.trim()}
          carregando={interpretando}
          onPress={buscarComIA}
        />
        {avisoIA ? <Aviso tipo={avisoIA.tipo}>{avisoIA.texto}</Aviso> : null}
      </Cartao>

      <Text style={styles.ou}>ou preencha os campos</Text>

      <Cartao>
        <View>
          <CampoCidade rotulo="Saindo de" tipo="origem" valor={origem} onChange={setOrigem} placeholder="Ex.: Pato Branco" />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Inverter origem e destino"
            onPress={inverter}
            style={styles.inverter}>
            <Ionicons name="swap-vertical" size={20} color={cores.primaria} />
          </Pressable>
          <CampoCidade rotulo="Indo para" tipo="destino" valor={destino} onChange={setDestino} placeholder="Ex.: Curitiba" />
        </View>

        <View style={styles.bloco}>
          <Text style={styles.rotulo}>Sugestões rápidas</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.linha}>
            {SUGESTOES.map((cidade) => (
              <Chip key={cidade} rotulo={cidade} onPress={() => setDestino(cidade)} />
            ))}
          </ScrollView>
        </View>

        <View style={styles.bloco}>
          <View style={styles.linhaRotulo}>
            <Ionicons name="flag-outline" size={16} color={cores.verde} />
            <Text style={styles.rotulo}>Lugares dentro da cidade (opcional)</Text>
          </View>
          <Campo
            rotulo="Embarcar em"
            icone="flag-outline"
            value={ponto}
            onChangeText={setPonto}
            placeholder="Ex.: Posto Fênix, o seu bairro"
            maxLength={120}
          />
          <Campo
            rotulo="Descer em"
            icone="location-outline"
            value={chegada}
            onChangeText={setChegada}
            placeholder="Ex.: UTFPR"
            maxLength={120}
          />
          {pontosSugeridos.length > 0 ? (
            <View style={styles.extras}>
              {pontosSugeridos.map((p) => (
                <Chip key={p.nome} rotulo={p.nome} icone="add-circle-outline" compacto onPress={() => escolherPonto(p.nome)} />
              ))}
            </View>
          ) : null}
        </View>

        <View style={styles.bloco}>
          <View style={styles.linhaRotulo}>
            <Ionicons name="calendar-outline" size={16} color={cores.verde} />
            <Text style={styles.rotulo}>Data da viagem</Text>
          </View>
          <View style={styles.linha}>
            {opcoesData.map((o) => (
              <View key={o.rotulo} style={styles.flex}>
                <Chip rotulo={o.rotulo} selecionado={data === o.valor} onPress={() => setData(o.valor)} />
              </View>
            ))}
          </View>
        </View>

        {horario ? (
          <View style={styles.extras}>
            <Chip rotulo={`Perto das ${horario}`} icone="close-circle" onPress={() => setHorario('')} />
          </View>
        ) : null}

        <Aviso>Também mostramos viagens que passam pela sua cidade ou pelos lugares informados.</Aviso>
        <Botao titulo="Buscar caronas" icone="search" onPress={buscar} />
      </Cartao>

      <View style={styles.secao}>
        <View>
          <Text style={styles.tituloSecao}>Próximas saídas</Text>
          <Text style={styles.subtituloSecao}>Caronas entre cidades nos próximos dias</Text>
        </View>
        <Pressable accessibilityRole="link" onPress={() => router.push('/resultados')} style={styles.verTodas}>
          <Text style={styles.link}>Ver todas</Text>
          <Ionicons name="chevron-forward" size={16} color={cores.primaria} />
        </Pressable>
      </View>

      {proximas.status === 'carregando' && !proximas.dados ? <EstadoCarregando itens={2} /> : null}
      {proximas.status === 'erro' ? (
        <EstadoErro mensagem={proximas.erro.message} onTentarNovamente={proximas.recarregar} />
      ) : null}
      {proximas.dados && proximas.status !== 'erro'
        ? proximas.dados.map((item) => (
            <CardCaronaCompacto
              key={item.carona.id}
              carona={item.carona}
              motorista={item.motorista}
              onPress={() => abrirCarona(item.carona.id)}
            />
          ))
        : null}
    </Tela>
  );
}

const styles = StyleSheet.create({
  intro: { gap: espaco.xs },
  titulo: { ...tipografia.tituloG, color: cores.texto },
  subtitulo: { ...tipografia.corpo, color: cores.textoSecundario },
  // Fica entre os dois campos, sobreposto às bordas deles, como no protótipo.
  inverter: {
    alignSelf: 'flex-end',
    marginRight: espaco.xxl + espaco.sm,
    marginVertical: -16,
    zIndex: 1,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: cores.superficie,
    borderWidth: 1,
    borderColor: cores.borda,
    alignItems: 'center',
    justifyContent: 'center',
    ...sombra.cartao,
  },
  bloco: { gap: espaco.sm },
  cartaoIA: { borderColor: cores.primariaBorda, ...sombra.destaqueIA },
  ou: { ...tipografia.legenda, color: cores.textoSecundario, textAlign: 'center' },
  extras: { flexDirection: 'row', flexWrap: 'wrap', gap: espaco.sm },
  linhaRotulo: { flexDirection: 'row', alignItems: 'center', gap: espaco.xs },
  rotulo: { ...tipografia.rotuloP, color: cores.texto },
  linha: { flexDirection: 'row', gap: espaco.sm },
  flex: { flex: 1 },
  secao: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: espaco.sm },
  tituloSecao: { ...tipografia.tituloP, color: cores.texto },
  subtituloSecao: { ...tipografia.legenda, color: cores.textoSecundario },
  verTodas: { flexDirection: 'row', alignItems: 'center', minHeight: 44 },
  link: { ...tipografia.rotuloP, color: cores.primaria },
});
