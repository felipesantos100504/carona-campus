import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Switch, Text, View } from 'react-native';

import { Botao } from '@/components/botao';
import { Campo } from '@/components/campo';
import { CampoCidade } from '@/components/campo-cidade';
import { Chip } from '@/components/chip';
import { EstadoCarregando } from '@/components/estados';
import { Tela } from '@/components/tela';
import { extrairViagem, ViagemExtraida } from '@/data/ia';
import { publicarCarona } from '@/data/repositorio';
import { cores, espaco, raio, tipografia } from '@/theme';
import { combinarDataHora, DIAS_CURTOS } from '@/utils/formato';

export default function Publicar() {
  const [texto, setTexto] = useState('');
  const [interpretando, setInterpretando] = useState(false);
  const [mostrarCampos, setMostrarCampos] = useState(false);
  const [erroIA, setErroIA] = useState<string | null>(null);

  const [origem, setOrigem] = useState('');
  const [destino, setDestino] = useState('');
  const [paradas, setParadas] = useState('');
  const [data, setData] = useState('');
  const [horario, setHorario] = useState('');
  const [vagas, setVagas] = useState('');
  const [valor, setValor] = useState('');
  const [recorrente, setRecorrente] = useState(false);
  const [diasSemana, setDiasSemana] = useState<number[]>([]);

  const [publicando, setPublicando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  function preencher(viagem: ViagemExtraida) {
    setOrigem(viagem.origem ?? '');
    setDestino(viagem.destino ?? '');
    setParadas(viagem.paradas.join(', '));
    setData(viagem.data ?? '');
    setHorario(viagem.horario ?? '');
    setVagas(viagem.vagas ? String(viagem.vagas) : '');
    setValor(viagem.valorPorVaga != null ? String(viagem.valorPorVaga) : '');
    setRecorrente(!!viagem.diasSemana);
    setDiasSemana(viagem.diasSemana ?? []);
  }

  async function interpretar() {
    setInterpretando(true);
    setMostrarCampos(false);
    setErroIA(null);
    setErro(null);
    try {
      preencher(await extrairViagem(texto));
    } catch (e) {
      // RF-16: se a IA falhar, os campos ficam vazios para preenchimento manual.
      preencher({ paradas: [] });
      setErroIA(e instanceof Error ? e.message : 'Erro inesperado.');
    } finally {
      setInterpretando(false);
      setMostrarCampos(true);
    }
  }

  function alternarDia(dia: number) {
    setDiasSemana((dias) => (dias.includes(dia) ? dias.filter((d) => d !== dia) : [...dias, dia]));
  }

  function validar() {
    if (!origem.trim() || !destino.trim()) return 'Informe a origem e o destino.';
    if (!/^\d{4}-\d{2}-\d{2}$/.test(data)) return 'Informe a data no formato AAAA-MM-DD.';
    if (!/^\d{1,2}:\d{2}$/.test(horario)) return 'Informe o horário no formato HH:MM.';
    if (!(Number(vagas) >= 1)) return 'Informe quantas vagas você oferece.';
    if (!valor.trim() || !(Number(valor.replace(',', '.')) >= 0)) return 'Informe o valor por vaga.';
    if (recorrente && diasSemana.length === 0) return 'Escolha os dias da semana da viagem.';
    return null;
  }

  async function publicar() {
    const problema = validar();
    setErro(problema);
    if (problema) return;
    setPublicando(true);
    try {
      const carona = await publicarCarona({
        origem: origem.trim(),
        destino: destino.trim(),
        paradas: paradas
          .split(',')
          .map((p) => p.trim())
          .filter(Boolean),
        dataHora: combinarDataHora(data, horario),
        vagasTotais: Number(vagas),
        valorPorVaga: Number(valor.replace(',', '.')),
        recorrencia: recorrente ? { diasSemana } : undefined,
        textoOriginal: texto.trim(),
      });
      setTexto('');
      setMostrarCampos(false);
      setErroIA(null);
      router.push({ pathname: '/carona/[id]', params: { id: carona.id } });
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro inesperado.');
    } finally {
      setPublicando(false);
    }
  }

  const rodape = mostrarCampos ? (
    <Botao titulo="Publicar carona" icone="checkmark-circle-outline" carregando={publicando} onPress={publicar} />
  ) : null;

  return (
    <Tela rodape={rodape}>
      <View style={styles.cabecalho}>
        <Text style={styles.titulo}>Publicar carona</Text>
        <Text style={styles.subtitulo}>
          Descreva a viagem como numa mensagem de WhatsApp. A IA organiza os dados para você conferir.
        </Text>
      </View>

      <Campo
        rotulo="Sua viagem"
        placeholder="Ex.: saio de Pato Branco toda sexta às 18h pra Curitiba, passo por Guarapuava e Ponta Grossa, 3 vagas, R$ 90"
        multiline
        value={texto}
        onChangeText={setTexto}
      />
      <Botao
        titulo="Interpretar com IA"
        icone="sparkles-outline"
        variante={mostrarCampos ? 'contorno' : 'primaria'}
        desabilitado={!texto.trim()}
        carregando={interpretando}
        onPress={interpretar}
      />
      {erroIA ? <Text style={[styles.mensagem, styles.mensagemErro]}>{erroIA}</Text> : null}

      {interpretando ? <EstadoCarregando itens={1} mensagem="Interpretando sua viagem…" /> : null}
      {mostrarCampos ? (
        <View style={styles.bloco}>
          <Text style={styles.rotulo}>Confira os dados antes de publicar</Text>
          <CampoCidade rotulo="Saindo de" valor={origem} onChange={setOrigem} placeholder="Ex.: Pato Branco" />
          <CampoCidade rotulo="Indo para" valor={destino} onChange={setDestino} placeholder="Ex.: Curitiba" />
          <Campo rotulo="Passa por" placeholder="Cidades separadas por vírgula" value={paradas} onChangeText={setParadas} />
          <View style={styles.linha}>
            <View style={styles.flex}>
              <Campo rotulo="Data" placeholder="AAAA-MM-DD" value={data} onChangeText={setData} />
            </View>
            <View style={styles.flex}>
              <Campo rotulo="Horário" placeholder="HH:MM" value={horario} onChangeText={setHorario} />
            </View>
          </View>
          <View style={styles.linha}>
            <View style={styles.flex}>
              <Campo rotulo="Vagas" keyboardType="number-pad" value={vagas} onChangeText={setVagas} />
            </View>
            <View style={styles.flex}>
              <Campo rotulo="R$ por vaga" keyboardType="decimal-pad" value={valor} onChangeText={setValor} />
            </View>
          </View>
          <View style={styles.linhaSwitch}>
            <Text style={styles.textoSwitch}>Repetir toda semana</Text>
            <Switch
              value={recorrente}
              onValueChange={setRecorrente}
              trackColor={{ true: cores.primaria, false: cores.bordaForte }}
            />
          </View>
          {recorrente ? (
            <View style={styles.dias}>
              {DIAS_CURTOS.map((rotulo, dia) => (
                <Chip key={rotulo} rotulo={rotulo} selecionado={diasSemana.includes(dia)} onPress={() => alternarDia(dia)} />
              ))}
            </View>
          ) : null}
        </View>
      ) : null}

      {erro ? <Text style={[styles.mensagem, styles.mensagemErro]}>{erro}</Text> : null}
    </Tela>
  );
}

const styles = StyleSheet.create({
  cabecalho: { paddingTop: espaco.lg, gap: espaco.xs },
  titulo: { ...tipografia.tituloG, color: cores.texto },
  subtitulo: { ...tipografia.corpo, color: cores.textoSecundario },
  bloco: {
    backgroundColor: cores.superficie,
    borderRadius: raio.lg,
    borderWidth: 1,
    borderColor: cores.borda,
    padding: espaco.md,
    gap: espaco.md,
  },
  rotulo: { ...tipografia.rotuloP, color: cores.primaria },
  linha: { flexDirection: 'row', gap: espaco.md },
  flex: { flex: 1 },
  linhaSwitch: { flexDirection: 'row', alignItems: 'center', minHeight: 44 },
  textoSwitch: { ...tipografia.corpo, color: cores.texto, flex: 1 },
  dias: { flexDirection: 'row', flexWrap: 'wrap', gap: espaco.sm },
  mensagem: { ...tipografia.rotuloP, padding: espaco.md, borderRadius: raio.md, textAlign: 'center' },
  mensagemErro: { backgroundColor: cores.erroSuave, color: cores.erro },
});
