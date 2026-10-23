import { useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';

type Estado<T> =
  | { status: 'carregando'; dados?: T }
  | { status: 'erro'; erro: Error; dados?: T }
  | { status: 'pronto'; dados: T };

/**
 * Executa `carregar` sempre que a tela ganha foco e expõe o estado
 * (carregando / erro / pronto) para a tela decidir o que mostrar.
 *
 *   const lista = useCarregamento(() => buscarCaronas(filtro), [filtro.origem]);
 *   if (lista.status === 'carregando') return <EstadoCarregando />;
 */
export function useCarregamento<T>(carregar: () => Promise<T>, dependencias: unknown[] = []) {
  const [estado, setEstado] = useState<Estado<T>>({ status: 'carregando' });
  const requisicao = useRef(0);

  const executar = useCallback(async () => {
    const atual = ++requisicao.current;
    setEstado((e) => ({ status: 'carregando', dados: e.dados }));
    try {
      const dados = await carregar();
      if (atual === requisicao.current) setEstado({ status: 'pronto', dados });
    } catch (e) {
      if (atual === requisicao.current) {
        setEstado({ status: 'erro', erro: e instanceof Error ? e : new Error(String(e)) });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, dependencias);

  useFocusEffect(
    useCallback(() => {
      executar();
    }, [executar]),
  );

  return { ...estado, recarregar: executar };
}
