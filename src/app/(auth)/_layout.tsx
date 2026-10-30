import { Stack } from 'expo-router';

import { cores } from '@/theme';

export default function AuthLayout() {
  // Login e cadastro alternam pelo seletor do topo, então trocam com fade em vez de deslizar.
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'fade', contentStyle: { backgroundColor: cores.fundo } }} />
  );
}
