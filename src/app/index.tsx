import { Redirect } from 'expo-router';

import { useSessao } from '@/hooks/use-sessao';

/** Decide a tela inicial a partir da sessão do Firebase Auth. */
export default function Inicio() {
  const { usuario, verificado } = useSessao();

  if (!usuario) return <Redirect href="/login" />;
  if (!verificado) return <Redirect href="/verificar-email" />;
  return <Redirect href="/(tabs)" />;
}
