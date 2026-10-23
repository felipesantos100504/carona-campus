import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Carona, Usuario } from '@/data/tipos';
import { cores, espaco, raio, sombra, tipografia } from '@/theme';
import { formatarData, formatarDiasSemana, formatarHora, formatarMoeda } from '@/utils/formato';

import { Avatar } from './avatar';

type Props = {
  carona: Carona;
  motorista?: Usuario;
  onPress?: () => void;
};

export function CardCarona({ carona, motorista, onPress }: Props) {
  const lotada = carona.vagasDisponiveis <= 0;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Carona de ${carona.origem} para ${carona.destino}`}
      onPress={onPress}
      style={({ pressed }) => [styles.cartao, pressed && { opacity: 0.9 }]}>
      <View style={styles.topo}>
        <Text style={styles.quando}>
          {formatarData(carona.dataHora)} · {formatarHora(carona.dataHora)}
        </Text>
        <Text style={styles.valor}>{formatarMoeda(carona.valorPorVaga)}</Text>
      </View>

      <View style={styles.trajeto}>
        <Text style={styles.cidade} numberOfLines={1}>
          {carona.origem}
        </Text>
        <Ionicons name="arrow-forward" size={18} color={cores.textoSecundario} />
        <Text style={styles.cidade} numberOfLines={1}>
          {carona.destino}
        </Text>
      </View>
      {carona.paradas.length > 0 ? (
        <Text style={styles.paradas} numberOfLines={1}>
          Passa por {carona.paradas.join(', ')}
        </Text>
      ) : null}

      <View style={styles.rodape}>
        {motorista ? (
          <View style={styles.motorista}>
            <Avatar nome={motorista.nome} fotoUri={motorista.fotoUri} tamanho={32} />
            <Text style={styles.nome} numberOfLines={1}>
              {motorista.nome}
            </Text>
            <Ionicons name="star" size={14} color={cores.aviso} />
            <Text style={styles.nota}>{motorista.avaliacaoMedia.toFixed(1)}</Text>
          </View>
        ) : (
          <View />
        )}
        <View style={styles.selos}>
          {carona.recorrencia ? (
            <Text style={[styles.selo, styles.seloRecorrente]}>
              {formatarDiasSemana(carona.recorrencia.diasSemana)}
            </Text>
          ) : null}
          <Text style={[styles.selo, lotada ? styles.seloLotado : styles.seloVagas]}>
            {lotada
              ? 'Lotada'
              : `${carona.vagasDisponiveis} ${carona.vagasDisponiveis === 1 ? 'vaga' : 'vagas'}`}
          </Text>
        </View>
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
    gap: espaco.sm,
    ...sombra.cartao,
  },
  topo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  quando: { ...tipografia.rotuloP, color: cores.primaria },
  valor: { ...tipografia.tituloP, color: cores.texto },
  trajeto: { flexDirection: 'row', alignItems: 'center', gap: espaco.sm },
  cidade: { ...tipografia.tituloP, color: cores.texto, flexShrink: 1 },
  paradas: { ...tipografia.legenda, color: cores.textoSecundario },
  rodape: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: espaco.xs,
    gap: espaco.sm,
  },
  motorista: { flexDirection: 'row', alignItems: 'center', gap: espaco.xs, flexShrink: 1 },
  nome: { ...tipografia.legenda, color: cores.texto, flexShrink: 1, marginLeft: espaco.xs },
  nota: { ...tipografia.legenda, color: cores.texto },
  selos: { flexDirection: 'row', gap: espaco.xs },
  selo: {
    ...tipografia.legenda,
    paddingHorizontal: espaco.sm,
    paddingVertical: 2,
    borderRadius: raio.total,
    overflow: 'hidden',
  },
  seloVagas: { backgroundColor: cores.sucessoSuave, color: cores.sucesso },
  seloLotado: { backgroundColor: cores.superficieAlt, color: cores.textoSecundario },
  seloRecorrente: { backgroundColor: cores.primariaSuave, color: cores.primaria },
});
