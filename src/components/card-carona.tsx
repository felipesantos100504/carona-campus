import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Carona, Usuario } from '@/data/tipos';
import { cores, espaco, raio, sombra, tipografia } from '@/theme';
import { formatarData, formatarDiasSemana, formatarHora, formatarMoeda } from '@/utils/formato';

import { Avatar } from './avatar';
import { Botao } from './botao';
import { Selo } from './selo';

type Props = {
  carona: Carona;
  motorista?: Usuario;
  onPress?: () => void;
};

/** Selo de vagas: verde com vagas, âmbar na última, cinza quando lotada. */
export function SeloVagas({ carona }: { carona: Carona }) {
  const vagas = carona.vagasDisponiveis;
  if (vagas <= 0) return <Selo rotulo="Lotada" tom="neutro" />;
  if (vagas === 1) return <Selo rotulo="Última vaga!" icone="flash" tom="aviso" />;
  return <Selo rotulo={`${vagas} vagas livres`} icone="ellipse" tom="verde" />;
}

/** Cartão completo de carona, usado nos resultados e nas listas de viagens. */
export function CardCarona({ carona, motorista, onPress }: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Carona de ${carona.origem} para ${carona.destino}`}
      onPress={onPress}
      style={({ pressed }) => [styles.cartao, pressed && styles.pressionado]}>
      <View style={styles.linha}>
        {carona.recorrencia ? (
          <Selo rotulo={`Toda semana: ${formatarDiasSemana(carona.recorrencia.diasSemana)}`} icone="repeat" />
        ) : (
          <Selo rotulo="Viagem única" icone="calendar-outline" tom="neutro" />
        )}
        <SeloVagas carona={carona} />
      </View>

      <View style={styles.linha}>
        <View>
          <Text style={styles.hora}>{formatarHora(carona.dataHora)}</Text>
          <Text style={styles.data}>{formatarData(carona.dataHora)}</Text>
        </View>
        <View style={styles.preco}>
          <Text style={styles.valor}>{formatarMoeda(carona.valorPorVaga)}</Text>
          <Text style={styles.porVaga}>por vaga</Text>
        </View>
      </View>

      <View style={styles.trajeto}>
        <View style={styles.cidades}>
          <View style={styles.pontoOrigem} />
          <Text style={styles.cidade} numberOfLines={1}>
            {carona.origem}
          </Text>
          <View style={styles.tracejado} />
          <Ionicons name="location-outline" size={16} color={cores.primaria} />
          <Text style={styles.cidade} numberOfLines={1}>
            {carona.destino}
          </Text>
        </View>
        <View style={styles.paradas}>
          <Ionicons
            name={carona.paradas.length > 0 ? 'git-branch-outline' : 'checkmark-circle-outline'}
            size={14}
            color={cores.primaria}
          />
          <Text style={styles.textoParadas} numberOfLines={1}>
            {carona.paradas.length > 0
              ? `Passa por ${carona.paradas.join(', ')}`
              : 'Direta, sem paradas intermediárias'}
          </Text>
        </View>
      </View>

      {motorista ? (
        <View style={styles.motorista}>
          <Avatar nome={motorista.nome} fotoUri={motorista.fotoUri} tamanho={40} verificado />
          <View style={styles.dadosMotorista}>
            <Text style={styles.nome} numberOfLines={1}>
              {motorista.nome}
            </Text>
            <Text style={styles.nota}>
              <Ionicons name="star" size={12} color={cores.estrela} /> {motorista.avaliacaoMedia.toFixed(1)} ·{' '}
              {motorista.totalViagens} viagens
            </Text>
          </View>
          {onPress ? <Botao titulo="Ver detalhes" variante="verde" pequeno onPress={onPress} /> : null}
        </View>
      ) : null}
    </Pressable>
  );
}

/** Versão compacta para listas curtas, como as caronas em destaque da tela inicial. */
export function CardCaronaCompacto({ carona, motorista, onPress }: Props) {
  const vagas = carona.vagasDisponiveis;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Carona de ${carona.origem} para ${carona.destino}`}
      onPress={onPress}
      style={({ pressed }) => [styles.cartao, styles.compacto, pressed && styles.pressionado]}>
      {motorista ? <Avatar nome={motorista.nome} fotoUri={motorista.fotoUri} tamanho={44} verificado /> : null}
      <View style={styles.dadosCompacto}>
        <Text style={styles.cidade} numberOfLines={1}>
          {carona.origem} → {carona.destino}
        </Text>
        <Text style={styles.data}>
          <Ionicons name="time-outline" size={12} color={cores.textoSecundario} /> {formatarData(carona.dataHora)} ·{' '}
          {formatarHora(carona.dataHora)}
        </Text>
        <Text style={styles.data} numberOfLines={1}>
          {carona.paradas.length > 0 ? `Via ${carona.paradas.join(', ')}` : 'Direto'}
        </Text>
      </View>
      <View style={styles.preco}>
        <Text style={styles.valorCompacto}>{formatarMoeda(carona.valorPorVaga)}</Text>
        <Text style={[styles.porVaga, vagas <= 1 && { color: cores.erro }]}>
          {vagas <= 0 ? 'Lotada' : vagas === 1 ? 'Última vaga' : `${vagas} vagas`}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  cartao: {
    backgroundColor: cores.superficie,
    borderRadius: raio.lg,
    borderWidth: 1,
    borderColor: cores.borda,
    padding: espaco.md,
    gap: espaco.md,
    ...sombra.cartao,
  },
  pressionado: { opacity: 0.92 },
  linha: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: espaco.sm },
  hora: { ...tipografia.numero, color: cores.texto },
  data: { ...tipografia.legenda, color: cores.textoSecundario },
  preco: { alignItems: 'flex-end' },
  valor: { ...tipografia.numero, color: cores.verde },
  valorCompacto: { ...tipografia.tituloP, color: cores.verde },
  porVaga: { ...tipografia.legenda, color: cores.textoSecundario },
  trajeto: {
    backgroundColor: cores.superficieAlt,
    borderRadius: raio.md,
    padding: espaco.md - 4,
    gap: espaco.xs,
  },
  cidades: { flexDirection: 'row', alignItems: 'center', gap: espaco.xs },
  pontoOrigem: { width: 8, height: 8, borderRadius: 4, backgroundColor: cores.verde },
  cidade: { ...tipografia.rotulo, color: cores.texto, flexShrink: 1 },
  tracejado: {
    flex: 1,
    minWidth: 12,
    borderTopWidth: 1,
    borderStyle: 'dashed',
    borderColor: cores.bordaForte,
    marginHorizontal: espaco.xs,
  },
  paradas: { flexDirection: 'row', alignItems: 'center', gap: espaco.xs },
  textoParadas: { ...tipografia.legenda, color: cores.primariaEscura, flexShrink: 1 },
  motorista: { flexDirection: 'row', alignItems: 'center', gap: espaco.sm },
  dadosMotorista: { flex: 1 },
  nome: { ...tipografia.rotulo, color: cores.texto },
  nota: { ...tipografia.legenda, color: cores.textoSecundario },
  compacto: { flexDirection: 'row', alignItems: 'center', gap: espaco.md },
  dadosCompacto: { flex: 1, gap: 2 },
});
