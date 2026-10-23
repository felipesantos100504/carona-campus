import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';

import { sessao } from '@/data/repositorio';

/** Decide a tela inicial: app (sessão local ativa) ou login. */
export default function Inicio() {
  const [ativa, setAtiva] = useState<boolean | null>(null);

  useEffect(() => {
    sessao.estaAtiva().then(setAtiva);
  }, []);

  if (ativa === null) return null;
  return <Redirect href={ativa ? '/(tabs)' : '/login'} />;
}
