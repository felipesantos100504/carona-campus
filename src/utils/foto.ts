import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';

// Foto de perfil (RF-03) sem Firebase Storage, que exige o plano pago (Blaze):
// a imagem é recortada, reduzida para 256 px e gravada no próprio perfil do
// Firestore como texto base64 (data URI), com cerca de 20–40 KB.

const TAMANHO = 256;

/** Abre a galeria e devolve a foto já reduzida como data URI, ou null se o usuário desistir. */
export async function escolherFoto(): Promise<string | null> {
  const permissao = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permissao.granted) {
    throw new Error('Permita o acesso às fotos para escolher uma imagem de perfil.');
  }
  const escolha = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: [1, 1],
    quality: 1,
  });
  if (escolha.canceled || !escolha.assets[0]) return null;

  const imagem = await ImageManipulator.manipulate(escolha.assets[0].uri)
    .resize({ width: TAMANHO, height: TAMANHO })
    .renderAsync();
  const resultado = await imagem.saveAsync({ compress: 0.6, format: SaveFormat.JPEG, base64: true });
  if (!resultado.base64) throw new Error('Não foi possível processar a imagem.');
  return `data:image/jpeg;base64,${resultado.base64}`;
}
