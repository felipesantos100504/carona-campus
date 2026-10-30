import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Aviso } from '@/components/aviso';
import { Botao } from '@/components/botao';
import { Cabecalho } from '@/components/cabecalho';
import { CampoCidade } from '@/components/campo-cidade';
import { CardCaronaCompacto } from '@/components/card-carona';
import { Cartao } from '@/components/cartao';
import { Chip } from '@/components/chip';
import { EstadoCarregando, EstadoErro } from '@/components/estados';
import { Tela } from '@/components/tela';
import { buscarCaronas } from '@/data/repositorio';
import { useCarregamento } from '@/hooks/use-carregamento';
import { cores, espaco, sombra, tipografia } from '@/theme';
import { hojeISO } from '@/utils/formato';

const SUGESTOES = ['Curitiba', 'Guarapuava', 'Ponta Grossa', 'Francisco Beltrão', 'Cascavel'];

export default function Buscar() {
  const [origem, setOrigem] = useState('');
  const [destino, setDestino] = useState('');
  const [data, setData] = useState('');
  const proximas = useCarregamento(async () => (await buscarCaronas()).slice(0, 3));

  // Calculado a cada renderização para não ficar com a data errada após a meia-noite.
  const opcoesData = [
    { rotulo: 'Qualquer dia', valor: '' },
    { rotulo: 'Hoje', valor: hojeISO(0) },
    { rotulo: 'Amanhã', valor: hojeISO(1) },
  ];

  function inverter() {
    setOrigem(destino);
    setDestino(origem);
  }

  function buscar() {
    // Passagem de parâmetros para a tela de resultados.
    router.push({
      pathname: '/resultados',
      params: { origem: origem.trim(), destino: destino.trim(), data },
    });
  }

  function abrirCarona(id: string) {
    router.push({ pathname: '/carona/[id]', params: { id } });
  }

  return (
    <Tela>
      <Cabecalho titulo="Carona Campus" subtitulo="Buscar" />
      <View style={styles.intro}>
        <Text style={styles.titulo}>Para onde você quer ir?</Text>
        <Text style={styles.subtitulo}>Encontre e compartilhe caronas entre cidades do Paraná.</Text>
      </View>

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

        <Aviso>Também mostramos viagens que passam pela sua cidade.</Aviso>
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
