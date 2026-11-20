import AsyncStorage from '@react-native-async-storage/async-storage';
import { initializeApp } from 'firebase/app';
// getReactNativePersistence só existe no build React Native do SDK; os tipos
// publicados são os do navegador, por isso o import é feito à parte.
import * as authRN from 'firebase/auth';
import { connectAuthEmulator, getAuth, initializeAuth } from 'firebase/auth';
import { connectFirestoreEmulator, initializeFirestore, memoryLocalCache, persistentLocalCache } from 'firebase/firestore';
import { Platform } from 'react-native';

// Ponto único de inicialização do Firebase. Os valores vêm do arquivo .env
// (modelo em .env.example). Não são segredos: identificam o projeto, e quem
// protege os dados são as regras do Firestore (firestore.rules).
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
  throw new Error(
    'Configuração do Firebase ausente. Copie .env.example para .env e reinicie o "npx expo start".',
  );
}

const web = Platform.OS === 'web';

export const app = initializeApp(firebaseConfig);

// ignoreUndefinedProperties: campos opcionais vazios (ex.: observações) são
// simplesmente omitidos, em vez de o Firestore recusar o documento.
// No navegador o cache fica no IndexedDB e sobrevive ao recarregar a página;
// no celular o SDK JavaScript só tem cache em memória, e o RNF-04 é coberto
// pelo cache próprio do repositório (AsyncStorage).
export const db = initializeFirestore(app, {
  ignoreUndefinedProperties: true,
  localCache: web ? persistentLocalCache() : memoryLocalCache(),
});

type ComPersistenciaRN = {
  getReactNativePersistence: (storage: typeof AsyncStorage) => authRN.Persistence;
};

// No celular a sessão fica salva no AsyncStorage e sobrevive ao fechamento do
// app (RF-02). No navegador o getAuth já guarda a sessão sozinho (IndexedDB).
export const auth = web
  ? getAuth(app)
  : initializeAuth(app, {
      persistence: (authRN as unknown as ComPersistenciaRN).getReactNativePersistence(AsyncStorage),
    });

// Desenvolvimento: com EXPO_PUBLIC_USAR_EMULADOR=1 o app usa os emuladores
// locais do Firebase (npm run emuladores) em vez do projeto de verdade.
if (process.env.EXPO_PUBLIC_USAR_EMULADOR === '1') {
  const host = process.env.EXPO_PUBLIC_EMULADOR_HOST || '127.0.0.1';
  connectFirestoreEmulator(db, host, 8080);
  connectAuthEmulator(auth, `http://${host}:9099`, { disableWarnings: true });
}
