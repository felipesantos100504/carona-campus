import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Botao } from '@/components/botao';
import { CampoCidade } from '@/components/campo-cidade';
import { Chip } from '@/components/chip';
import { Tela } from '@/components/tela';
import { cores, espaco, tipografia } from '@/theme';
import { hojeISO } from '@/utils/formato';

const OPCOES_DATA = [
  { rotulo: 'Qualquer dia', valor: '' },
  { rotulo: 'Hoje', valor: hojeISO(0) },
  { rotulo: 'Amanhã', valor: hojeISO(1) },
];

export default function Buscar() {
  const [origem, setOrigem] = useState('');
  const [destino, setDestino] = useState('');
  const [data, setData] = useState('');

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

  return (
    <Tela rodape={<Botao titulo="Buscar caronas" icone="search" onPress={buscar} />}>
      <View style={styles.cabecalho}>
        <Text style={styles.titulo}>Para onde você vai?</Text>
        <Text style={styles.subtitulo}>Encontre caronas entre cidades, inclusive as que passam pela sua.</Text>
      </View>

      <CampoCidade rotulo="Saindo de" valor={origem} onChange={setOrigem} placeholder="Ex.: Pato Branco" />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Inverter origem e destino"
        onPress={inverter}
        style={styles.inverter}>
        <Ionicons name="swap-vertical" size={20} color={cores.primaria} />
        <Text style={styles.inverterTexto}>Inverter</Text>
      </Pressable>
      <CampoCidade rotulo="Indo para" valor={destino} onChange={setDestino} placeholder="Ex.: Curitiba" />

      <Text style={styles.rotulo}>Quando</Text>
      <View style={styles.linha}>
        {OPCOES_DATA.map((o) => (
          <Chip key={o.rotulo} rotulo={o.rotulo} selecionado={data === o.valor} onPress={() => setData(o.valor)} />
        ))}
      </View>
    </Tela>
  );
}

const styles = StyleSheet.create({
  cabecalho: { paddingTop: espaco.lg, gap: espaco.xs },
  titulo: { ...tipografia.tituloG, color: cores.texto },
  subtitulo: { ...tipografia.corpo, color: cores.textoSecundario },
  inverter: { flexDirection: 'row', alignItems: 'center', gap: espaco.xs, alignSelf: 'flex-end', minHeight: 44 },
  inverterTexto: { ...tipografia.rotuloP, color: cores.primaria },
  rotulo: { ...tipografia.rotuloP, color: cores.texto },
  linha: { flexDirection: 'row', flexWrap: 'wrap', gap: espaco.sm },
});
