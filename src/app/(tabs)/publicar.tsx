import { StyleSheet, Text } from 'react-native';

import { Placeholder } from '@/components/placeholder';
import { Tela } from '@/components/tela';
import { cores, espaco, tipografia } from '@/theme';

// TODO(Integrante B): implementar a publicação em texto livre.
// Já disponível:
//   - extrairViagem(texto) em src/data/ia.ts (IA simulada; lança ErroExtracao)
//   - publicarCarona(dados) em src/data/repositorio.ts (salva no AsyncStorage)
//   - Campo, CampoCidade, Chip e Botao em src/components
export default function Publicar() {
  return (
    <Tela>
      <Text style={styles.titulo}>Publicar carona</Text>
      <Placeholder
        responsavel="Integrante B"
        itens={[
          'Alternar "Oferecer" / "Pedir" carona',
          'Caixa de texto livre ("saio de Pato Branco sexta 18h, 3 vagas, R$ 90")',
          'Botão "Interpretar" → extrairViagem() com estado de carregando',
          'Cartão de confirmação com campos editáveis (origem, destino, paradas, data, hora, vagas, valor)',
          'Se a IA falhar: mostrar erro e liberar os campos para preenchimento manual (RF-16)',
          'Publicar → publicarCarona() e navegar para Viagens',
        ]}
      />
    </Tela>
  );
}

const styles = StyleSheet.create({
  titulo: { ...tipografia.tituloG, color: cores.texto, paddingTop: espaco.lg },
});
