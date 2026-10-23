import AsyncStorage from '@react-native-async-storage/async-storage';

// Persistência local (etapa 2). Na próxima etapa este módulo será trocado
// pelo Firestore sem mudar as telas, que só conhecem o repositório.

const PREFIXO = '@carona-campus:v1:';

export async function ler<T>(chave: string, padrao: T): Promise<T> {
  const bruto = await AsyncStorage.getItem(PREFIXO + chave);
  if (bruto == null) return padrao;
  try {
    return JSON.parse(bruto) as T;
  } catch {
    return padrao;
  }
}

export async function gravar<T>(chave: string, valor: T) {
  await AsyncStorage.setItem(PREFIXO + chave, JSON.stringify(valor));
}

export async function apagarTudo() {
  const chaves = await AsyncStorage.getAllKeys();
  await AsyncStorage.multiRemove(chaves.filter((c) => c.startsWith(PREFIXO)));
}
