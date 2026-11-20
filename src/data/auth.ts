import AsyncStorage from '@react-native-async-storage/async-storage';
import { FirebaseError } from 'firebase/app';
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  User,
} from 'firebase/auth';
import { Platform } from 'react-native';

import { auth } from './firebase';

// Autenticação com Firebase Auth: e-mail e senha (com verificação de e-mail,
// RF-01) e Google (no navegador). O perfil público (coleção "usuarios") só é
// criado depois que o e-mail é verificado, porque as regras do Firestore
// recusam qualquer escrita de conta não verificada (RNF-02).

const CHAVE_CADASTRO_PENDENTE = '@carona-campus:v1:cadastro-pendente';

export type DadosCadastro = {
  nome: string;
  cidade: string;
  email: string;
  senha: string;
  fotoUri?: string;
};

export type PerfilPendente = { nome: string; cidade: string; fotoUri?: string };

export const googleDisponivel = Platform.OS === 'web';

export async function entrarComEmail(email: string, senha: string) {
  await signInWithEmailAndPassword(auth, email.trim(), senha);
}

export async function cadastrar({ nome, cidade, email, senha, fotoUri }: DadosCadastro) {
  // Guarda os dados do perfil no aparelho até o e-mail ser verificado.
  const pendente: PerfilPendente = { nome: nome.trim(), cidade: cidade.trim(), fotoUri };
  await AsyncStorage.setItem(CHAVE_CADASTRO_PENDENTE, JSON.stringify(pendente));

  const { user } = await createUserWithEmailAndPassword(auth, email.trim(), senha);
  await updateProfile(user, { displayName: nome.trim() });
  await sendEmailVerification(user);
}

export async function entrarComGoogle() {
  if (!googleDisponivel) {
    throw new Error('O login com Google está disponível na versão web. No celular, entre com e-mail e senha.');
  }
  const provedor = new GoogleAuthProvider();
  provedor.setCustomParameters({ prompt: 'select_account' });
  await signInWithPopup(auth, provedor);
}

export async function reenviarVerificacao() {
  if (auth.currentUser) await sendEmailVerification(auth.currentUser);
}

/**
 * Atualiza os dados da conta depois que o usuário clica no link do e-mail.
 * O token precisa ser renovado para as regras do Firestore enxergarem
 * email_verified = true.
 */
export async function confirmarVerificacao(): Promise<boolean> {
  const usuario = auth.currentUser;
  if (!usuario) return false;
  await usuario.reload();
  if (usuario.emailVerified) await usuario.getIdToken(true);
  return usuario.emailVerified;
}

export async function redefinirSenha(email: string) {
  await sendPasswordResetEmail(auth, email.trim());
}

export async function sair() {
  await signOut(auth);
}

export async function lerPerfilPendente(): Promise<PerfilPendente | null> {
  const bruto = await AsyncStorage.getItem(CHAVE_CADASTRO_PENDENTE);
  return bruto ? (JSON.parse(bruto) as PerfilPendente) : null;
}

export async function limparPerfilPendente() {
  await AsyncStorage.removeItem(CHAVE_CADASTRO_PENDENTE);
}

export function usuarioAtual(): User {
  const usuario = auth.currentUser;
  if (!usuario) throw new Error('Sessão expirada. Entre novamente.');
  return usuario;
}

/** Traduz os códigos de erro do Firebase Auth para mensagens em português. */
export function mensagemDeErroAuth(e: unknown) {
  const codigo = e instanceof FirebaseError ? e.code : '';
  const mensagens: Record<string, string> = {
    'auth/invalid-email': 'E-mail inválido.',
    'auth/missing-password': 'Informe a senha.',
    'auth/weak-password': 'A senha precisa ter pelo menos 6 caracteres.',
    'auth/email-already-in-use': 'Já existe uma conta com este e-mail. Tente entrar.',
    'auth/invalid-credential': 'E-mail ou senha incorretos.',
    'auth/wrong-password': 'E-mail ou senha incorretos.',
    'auth/user-not-found': 'E-mail ou senha incorretos.',
    'auth/too-many-requests': 'Muitas tentativas. Aguarde alguns minutos e tente de novo.',
    'auth/network-request-failed': 'Sem conexão com a internet.',
    'auth/popup-closed-by-user': 'A janela do Google foi fechada antes de concluir.',
    'auth/popup-blocked': 'O navegador bloqueou a janela do Google. Permita pop-ups e tente de novo.',
  };
  if (mensagens[codigo]) return mensagens[codigo];
  return e instanceof Error ? e.message : 'Erro inesperado. Tente novamente.';
}
