import { onAuthStateChanged, User } from 'firebase/auth';
import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from 'react';

import { confirmarVerificacao } from '@/data/auth';
import { auth } from '@/data/firebase';
import { garantirMeuPerfil } from '@/data/repositorio';

type Sessao = {
  /** true até o Firebase informar se há alguém logado (sessão salva no aparelho). */
  carregando: boolean;
  usuario: User | null;
  verificado: boolean;
  /** Relê a conta (ex.: depois de clicar no link de verificação). Devolve se já está verificada. */
  atualizar: () => Promise<boolean>;
};

const ContextoSessao = createContext<Sessao | null>(null);

/** Acompanha o login do Firebase Auth e disponibiliza a sessão para todo o app. */
export function SessaoProvider({ children }: { children: ReactNode }) {
  const [carregando, setCarregando] = useState(true);
  const [usuario, setUsuario] = useState<User | null>(null);
  const [verificado, setVerificado] = useState(false);

  useEffect(() => {
    return onAuthStateChanged(auth, async (novo) => {
      if (novo?.emailVerified) {
        // Primeira entrada depois da verificação: cria o perfil público.
        await garantirMeuPerfil().catch(() => undefined);
      }
      setUsuario(novo);
      setVerificado(!!novo?.emailVerified);
      setCarregando(false);
    });
  }, []);

  const atualizar = useCallback(async () => {
    const ok = await confirmarVerificacao();
    if (ok) await garantirMeuPerfil();
    setVerificado(ok);
    return ok;
  }, []);

  return (
    <ContextoSessao.Provider value={{ carregando, usuario, verificado, atualizar }}>
      {children}
    </ContextoSessao.Provider>
  );
}

export function useSessao() {
  const sessao = useContext(ContextoSessao);
  if (!sessao) throw new Error('useSessao precisa estar dentro de <SessaoProvider>.');
  return sessao;
}
