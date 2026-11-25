import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';

import { Aviso } from '@/components/aviso';
import { AvisoRevisao } from '@/components/aviso-revisao';
import { Botao } from '@/components/botao';
import { Cabecalho } from '@/components/cabecalho';
import { Campo } from '@/components/campo';
import { CampoCidade } from '@/components/campo-cidade';
import { Cartao } from '@/components/cartao';
import { Chip } from '@/components/chip';
import { EstadoCarregando } from '@/components/estados';
import { Selo } from '@/components/selo';
import { Tela } from '@/components/tela';
import { mesmaCidade, mesmoPonto, pontoConhecido, sugerirPontos } from '@/data/cidades';
import { extrairViagem, revisarTexto, RevisaoTexto, ViagemExtraida } from '@/data/ia';
import { publicarCarona } from '@/data/repositorio';
import { Ponto } from '@/data/tipos';
import { cores, espaco, raio, sombra, tipografia } from '@/theme';
import { combinarDataHora, DIAS_CURTOS } from '@/utils/formato';

const MAX_VAGAS = 8;

export default function Publicar() {
  const [texto, setTexto] = useState('');
  const [interpretando, setInterpretando] = useState(false);
  const [mostrarCampos, setMostrarCampos] = useState(false);
  const [erroIA, setErroIA] = useState<string | null>(null);
  const [fonte, setFonte] = useState<'ia' | 'regras' | null>(null);

  const [origem, setOrigem] = useState('');
  const [destino, setDestino] = useState('');
  const [paradas, setParadas] = useState<string[]>([]);
  const [pontoEmbarque, setPontoEmbarque] = useState('');
  // RF-20: lugares por onde passa dentro das cidades, na ordem (ex.: Mercado Ítalo → UTFPR).
  const [pontos, setPontos] = useState<Ponto[]>([]);
  const [novoPonto, setNovoPonto] = useState('');
  const [cidadeNovoPonto, setCidadeNovoPonto] = useState('');
  const [novaParada, setNovaParada] = useState('');
  const [data, setData] = useState('');
  const [horario, setHorario] = useState('');
  const [vagas, setVagas] = useState(0);
  const [valor, setValor] = useState('');
  const [recorrente, setRecorrente] = useState(false);
  const [diasSemana, setDiasSemana] = useState<number[]>([]);
  const [observacoes, setObservacoes] = useState('');

  const [publicando, setPublicando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  // Revisão dos textos públicos pela IA (RF-19). Com avisos na tela, o próximo
  // toque em Publicar publica sem revisar de novo.
  const [revisando, setRevisando] = useState(false);
  const [revisao, setRevisao] = useState<RevisaoTexto | null>(null);

  function preencher(viagem: Partial<ViagemExtraida> & { paradas: string[] }) {
    setFonte(viagem.fonte ?? null);
    setOrigem(viagem.origem ?? '');
    setDestino(viagem.destino ?? '');
    setParadas(viagem.paradas);
    setPontoEmbarque(viagem.pontoEmbarque ?? '');
    setPontos(viagem.pontos ?? []);
    setNovoPonto('');
    setCidadeNovoPonto('');
    setNovaParada('');
    setData(viagem.data ?? '');
    setHorario(viagem.horario ?? '');
    setVagas(viagem.vagas ?? 0);
    setValor(viagem.valorPorVaga != null ? String(viagem.valorPorVaga) : '');
    setRecorrente(!!viagem.diasSemana);
    setDiasSemana(viagem.diasSemana ?? []);
    setObservacoes(viagem.observacoes ?? '');
    setRevisao(null);
  }

  // Mudou um texto público: a revisão anterior deixa de valer.
  function editarPonto(valor: string) {
    setPontoEmbarque(valor);
    setRevisao(null);
  }

  function editarObservacoes(valor: string) {
    setObservacoes(valor);
    setRevisao(null);
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

  function adicionarParada() {
    const cidade = novaParada.trim();
    if (!cidade) return;
    if (!paradas.some((p) => mesmaCidade(p, cidade))) setParadas([...paradas, cidade]);
    setNovaParada('');
  }

  // Cidades do trajeto, sem repetir (na carona dentro da cidade, só uma).
  const cidadesDaRota = [origem, ...paradas, destino]
    .map((c) => c.trim())
    .filter((c, i, todas) => c && todas.findIndex((x) => mesmaCidade(x, c)) === i);
  const sugestoesDePonto = sugerirPontos(cidadesDaRota).filter(
    (p) => !pontos.some((x) => mesmoPonto(x.nome, p.nome)) && !(pontoEmbarque && mesmoPonto(pontoEmbarque, p.nome)),
  );

  function adicionarPonto(nomeDigitado: string) {
    const conhecido = pontoConhecido(nomeDigitado);
    const nome = conhecido?.nome ?? nomeDigitado.trim();
    if (!nome) return;
    // Cidade do ponto: a do catálogo (se estiver no trajeto), a escolhida ou o destino.
    const cidade =
      cidadesDaRota.find((c) => conhecido && mesmaCidade(c, conhecido.cidade)) ||
      cidadeNovoPonto ||
      destino.trim() ||
      origem.trim();
    if (!cidade) {
      setErro('Informe a origem e o destino antes dos pontos de passagem.');
      return;
    }
    const repetido = pontos.some((p) => mesmoPonto(p.nome, nome)) || (!!pontoEmbarque && mesmoPonto(pontoEmbarque, nome));
    if (!repetido) setPontos([...pontos, { nome, cidade }]);
    setNovoPonto('');
    setRevisao(null);
  }

  function alternarDia(dia: number) {
    setDiasSemana((dias) => (dias.includes(dia) ? dias.filter((d) => d !== dia) : [...dias, dia]));
  }

  function validar() {
    if (!origem.trim() || !destino.trim()) return 'Informe a origem e o destino.';
    // Dentro da mesma cidade, a carona só faz sentido com os lugares de saída e de chegada.
    if (paradas.length === 0 && mesmaCidade(origem, destino) && (pontoEmbarque.trim() ? 1 : 0) + pontos.length < 2) {
      return 'Carona dentro da mesma cidade: informe o ponto de embarque e pelo menos um ponto de passagem (ex.: Posto Fênix → UTFPR).';
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(data)) return 'Informe a data no formato AAAA-MM-DD.';
    if (!/^\d{1,2}:\d{2}$/.test(horario)) return 'Informe o horário no formato HH:MM.';
    if (vagas < 1) return 'Informe quantas vagas você oferece.';
    if (!valor.trim() || !(Number(valor.replace(',', '.')) >= 0)) return 'Informe o valor por vaga.';
    if (recorrente && diasSemana.length === 0) return 'Escolha os dias da semana da viagem.';
    return null;
  }

  async function publicar() {
    const problema = validar();
    setErro(problema);
    if (problema) return;

    // RF-19: a IA confere o ponto de embarque e as observações, que ficam
    // visíveis para todos. Só avisa; a pessoa decide se corrige ou publica.
    if (!revisao) {
      setRevisando(true);
      const textosPublicos = [pontoEmbarque, ...pontos.map((p) => p.nome), observacoes];
      const resultado = await revisarTexto(textosPublicos.filter((t) => t.trim()).join('\n'));
      setRevisando(false);
      if (resultado.problemas.length > 0) {
        setRevisao(resultado);
        return;
      }
    }

    setPublicando(true);
    try {
      const carona = await publicarCarona({
        origem: origem.trim(),
        destino: destino.trim(),
        paradas,
        pontoEmbarque: pontoEmbarque.trim() || undefined,
        pontos,
        dataHora: combinarDataHora(data, horario),
        vagasTotais: vagas,
        valorPorVaga: Number(valor.replace(',', '.')),
        recorrencia: recorrente ? { diasSemana } : undefined,
        observacoes: observacoes.trim() || undefined,
        textoOriginal: texto.trim(),
      });
      setTexto('');
      setMostrarCampos(false);
      setErroIA(null);
      setRevisao(null);
      router.push({ pathname: '/carona/[id]', params: { id: carona.id } });
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro inesperado.');
    } finally {
      setPublicando(false);
    }
  }

  const rodape = mostrarCampos ? (
    <Botao
      titulo={revisao ? 'Publicar mesmo assim' : 'Publicar carona'}
      icone="checkmark-circle-outline"
      variante="verde"
      carregando={publicando || revisando}
      onPress={publicar}
    />
  ) : null;

  return (
    <Tela rodape={rodape}>
      <Cabecalho titulo="Publicar carona" />
      <View style={styles.intro}>
        <Selo rotulo="Publicação com IA" icone="sparkles-outline" />
        <Text style={styles.titulo}>Descreva sua viagem em texto livre</Text>
        <Text style={styles.subtitulo}>A inteligência artificial organiza os detalhes da carona para você conferir.</Text>
      </View>

      <Cartao estilo={styles.cartaoIA}>
        <Campo
          rotulo="Sua viagem, como numa mensagem de WhatsApp"
          icone="chatbubble-ellipses-outline"
          placeholder="Ex.: saio do Posto Fênix em Pato Branco toda sexta às 18h pra Curitiba, passo por Guarapuava, 3 vagas, R$ 90"
          multiline
          value={texto}
          onChangeText={setTexto}
        />
        <Botao
          titulo={mostrarCampos ? 'Interpretar novamente' : 'Interpretar com IA'}
          icone="sparkles"
          variante={mostrarCampos ? 'suave' : 'primaria'}
          desabilitado={!texto.trim()}
          carregando={interpretando}
          onPress={interpretar}
        />
      </Cartao>

      {interpretando ? <EstadoCarregando itens={1} mensagem="Interpretando sua viagem…" /> : null}
      {mostrarCampos && erroIA ? (
        <Aviso tipo="erro" titulo="Modo manual ativado" icone="warning-outline">
          {erroIA}
        </Aviso>
      ) : null}
      {mostrarCampos && !erroIA && fonte === 'ia' ? (
        <Aviso tipo="sucesso">Dados identificados pela IA. Confira e corrija antes de publicar.</Aviso>
      ) : null}
      {mostrarCampos && !erroIA && fonte === 'regras' ? (
        <Aviso titulo="IA indisponível no momento" icone="construct-outline">
          Preenchemos o que conseguimos reconhecer no texto. Confira e complete os campos antes de publicar.
        </Aviso>
      ) : null}

      {mostrarCampos ? (
        <>
          <Cartao
            titulo="Estrutura da rota"
            icone="git-branch-outline"
            extra={
              <Selo
                rotulo={
                  origem.trim() && paradas.length === 0 && mesmaCidade(origem, destino) ? 'Dentro da cidade' : 'Entre cidades'
                }
              />
            }>
            <CampoCidade rotulo="Origem da viagem" tipo="origem" valor={origem} onChange={setOrigem} placeholder="Ex.: Pato Branco" />
            <Campo
              rotulo="Ponto de embarque (opcional)"
              icone="flag-outline"
              value={pontoEmbarque}
              onChangeText={editarPonto}
              placeholder="Ex.: Posto Fênix, rodoviária"
              maxLength={120}
            />
            <CampoCidade rotulo="Destino final" tipo="destino" valor={destino} onChange={setDestino} placeholder="Ex.: Curitiba" />

            <View style={styles.bloco}>
              <Text style={styles.rotulo}>Paradas intermediárias</Text>
              {paradas.length > 0 ? (
                <View style={styles.chips}>
                  {paradas.map((p) => (
                    <Chip
                      key={p}
                      rotulo={p}
                      icone="close-circle"
                      onPress={() => setParadas(paradas.filter((x) => x !== p))}
                    />
                  ))}
                </View>
              ) : (
                <Text style={styles.legenda}>Nenhuma parada. A viagem aparece como direta.</Text>
              )}
              <CampoCidade rotulo="Adicionar parada" valor={novaParada} onChange={setNovaParada} placeholder="Ex.: Guarapuava" />
              <Botao
                titulo="Adicionar parada"
                icone="add-circle-outline"
                variante="suave"
                pequeno
                desabilitado={!novaParada.trim()}
                onPress={adicionarParada}
                estilo={styles.inicio}
              />
            </View>

            {/* RF-20: lugares dentro das cidades, para a busca por ponto (ex.: até a UTFPR). */}
            <View style={styles.bloco}>
              <Text style={styles.rotulo}>Pontos de passagem (opcional)</Text>
              <Text style={styles.legenda}>
                Lugares onde o passageiro pode embarcar ou descer, na ordem do caminho. Para uma carona dentro da
                cidade, use a mesma cidade na origem e no destino.
              </Text>
              {pontos.length > 0 ? (
                <View style={styles.chips}>
                  {pontos.map((p, i) => (
                    <Chip
                      key={`${p.nome}-${p.cidade}`}
                      rotulo={`${i + 1}. ${p.nome}${cidadesDaRota.length > 1 ? ` · ${p.cidade}` : ''}`}
                      icone="close-circle"
                      onPress={() => {
                        setPontos(pontos.filter((x) => x !== p));
                        setRevisao(null);
                      }}
                    />
                  ))}
                </View>
              ) : null}
              {sugestoesDePonto.length > 0 ? (
                <View style={styles.chips}>
                  {sugestoesDePonto.map((p) => (
                    <Chip key={p.nome} rotulo={p.nome} icone="add-circle-outline" compacto onPress={() => adicionarPonto(p.nome)} />
                  ))}
                </View>
              ) : null}
              <Campo
                rotulo="Adicionar ponto"
                icone="location-outline"
                value={novoPonto}
                onChangeText={setNovoPonto}
                placeholder="Ex.: Mercado Ítalo, UTFPR, bairro"
                maxLength={120}
              />
              {cidadesDaRota.length > 1 ? (
                <View style={styles.chips}>
                  {cidadesDaRota.map((c) => (
                    <Chip
                      key={c}
                      rotulo={c}
                      compacto
                      selecionado={mesmaCidade(cidadeNovoPonto || destino, c)}
                      onPress={() => setCidadeNovoPonto(c)}
                    />
                  ))}
                </View>
              ) : null}
              <Botao
                titulo="Adicionar ponto"
                icone="add-circle-outline"
                variante="suave"
                pequeno
                desabilitado={!novoPonto.trim()}
                onPress={() => adicionarPonto(novoPonto)}
                estilo={styles.inicio}
              />
            </View>
          </Cartao>

          <Cartao titulo="Quando e quanto" icone="calendar-outline">
            <View style={styles.linha}>
              <View style={styles.flex}>
                <Campo rotulo="Data" icone="calendar-outline" placeholder="AAAA-MM-DD" value={data} onChangeText={setData} />
              </View>
              <View style={styles.flex}>
                <Campo rotulo="Horário" icone="time-outline" placeholder="HH:MM" value={horario} onChangeText={setHorario} />
              </View>
            </View>
            <View style={styles.linha}>
              <View style={[styles.flex, styles.bloco]}>
                <View style={styles.linhaRotulo}>
                  <Ionicons name="people-outline" size={16} color={cores.textoSecundario} />
                  <Text style={styles.rotulo}>Vagas</Text>
                </View>
                <View style={styles.contador}>
                  <BotaoContador icone="remove" rotulo="Menos uma vaga" desabilitado={vagas <= 0} onPress={() => setVagas(vagas - 1)} />
                  <Text style={styles.valorContador}>{vagas}</Text>
                  <BotaoContador icone="add" rotulo="Mais uma vaga" desabilitado={vagas >= MAX_VAGAS} onPress={() => setVagas(vagas + 1)} />
                </View>
              </View>
              <View style={styles.flex}>
                <Campo
                  rotulo="R$ por vaga"
                  icone="cash-outline"
                  keyboardType="decimal-pad"
                  placeholder="90,00"
                  value={valor}
                  onChangeText={setValor}
                />
              </View>
            </View>

            <View style={styles.recorrencia}>
              <View style={styles.linhaSwitch}>
                <Ionicons name="repeat" size={20} color={cores.verde} />
                <View style={styles.flex}>
                  <Text style={styles.rotulo}>Repetir toda semana</Text>
                  <Text style={styles.legenda}>Sem precisar publicar de novo</Text>
                </View>
                <Switch
                  value={recorrente}
                  onValueChange={setRecorrente}
                  trackColor={{ true: cores.verde, false: cores.bordaForte }}
                />
              </View>
              {recorrente ? (
                <View style={styles.dias}>
                  {DIAS_CURTOS.map((rotulo, dia) => (
                    <Chip
                      key={rotulo}
                      rotulo={rotulo[0].toUpperCase() + rotulo.slice(1)}
                      compacto
                      selecionado={diasSemana.includes(dia)}
                      onPress={() => alternarDia(dia)}
                    />
                  ))}
                </View>
              ) : null}
            </View>

            <Aviso>O valor é apenas informativo, para dividir as despesas. O acerto é feito diretamente com os passageiros.</Aviso>
          </Cartao>

          <Cartao titulo="Observações" icone="document-text-outline">
            <Campo
              rotulo="Para o passageiro (opcional)"
              icone="chatbubble-ellipses-outline"
              value={observacoes}
              onChangeText={editarObservacoes}
              placeholder="Ex.: uma mala média por pessoa, saio pontualmente"
              multiline
              maxLength={500}
            />
          </Cartao>
        </>
      ) : null}

      {revisao ? <AvisoRevisao revisao={revisao} acao="Publicar mesmo assim" /> : null}
      {erro ? <Aviso tipo="erro">{erro}</Aviso> : null}
    </Tela>
  );
}

type PropsContador = {
  icone: 'add' | 'remove';
  rotulo: string;
  desabilitado: boolean;
  onPress: () => void;
};

function BotaoContador({ icone, rotulo, desabilitado, onPress }: PropsContador) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={rotulo}
      accessibilityState={{ disabled: desabilitado }}
      disabled={desabilitado}
      onPress={onPress}
      style={[styles.botaoContador, desabilitado && styles.desabilitado]}>
      <Ionicons name={icone} size={20} color={cores.primariaEscura} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  intro: { gap: espaco.sm },
  titulo: { ...tipografia.tituloG, color: cores.texto },
  subtitulo: { ...tipografia.corpo, color: cores.textoSecundario },
  cartaoIA: { borderColor: cores.primariaBorda, ...sombra.destaqueIA },
  bloco: { gap: espaco.sm },
  rotulo: { ...tipografia.rotuloP, color: cores.texto },
  legenda: { ...tipografia.legenda, color: cores.textoSecundario },
  linhaRotulo: { flexDirection: 'row', alignItems: 'center', gap: espaco.xs },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: espaco.sm },
  inicio: { alignSelf: 'flex-start' },
  linha: { flexDirection: 'row', gap: espaco.md },
  flex: { flex: 1 },
  contador: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 52,
    paddingHorizontal: espaco.xs,
    borderRadius: raio.md,
    backgroundColor: cores.superficieAlt,
  },
  botaoContador: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: cores.superficie,
    alignItems: 'center',
    justifyContent: 'center',
  },
  desabilitado: { opacity: 0.4 },
  valorContador: { ...tipografia.tituloP, color: cores.texto },
  recorrencia: { gap: espaco.md, padding: espaco.md - 4, borderRadius: raio.md, backgroundColor: cores.superficieAlt },
  linhaSwitch: { flexDirection: 'row', alignItems: 'center', gap: espaco.sm },
  dias: { flexDirection: 'row', flexWrap: 'wrap', gap: espaco.xs },
});
