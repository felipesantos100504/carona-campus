import { HankenGrotesk_400Regular, HankenGrotesk_500Medium, HankenGrotesk_600SemiBold } from '@expo-google-fonts/hanken-grotesk';
import { SpaceGrotesk_600SemiBold, SpaceGrotesk_700Bold } from '@expo-google-fonts/space-grotesk';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { Platform } from 'react-native';

import { SessaoProvider, useSessao } from '@/hooks/use-sessao';
import { cores, fontes } from '@/theme';

SplashScreen.preventAutoHideAsync();

// Versão web: declara o idioma português para o navegador não oferecer
// tradução e os leitores de tela usarem a pronúncia correta.
if (Platform.OS === 'web' && typeof document !== 'undefined') {
  document.documentElement.lang = 'pt-BR';
}

export default function RootLayout() {
  return (
    <SessaoProvider>
      <Navegacao />
    </SessaoProvider>
  );
}

function Navegacao() {
  const { carregando, usuario, verificado } = useSessao();
  const [fontesCarregadas, erroFontes] = useFonts({
    SpaceGrotesk_600SemiBold,
    SpaceGrotesk_700Bold,
    HankenGrotesk_400Regular,
    HankenGrotesk_500Medium,
    HankenGrotesk_600SemiBold,
  });
  const pronto = (fontesCarregadas || !!erroFontes) && !carregando;

  useEffect(() => {
    if (pronto) SplashScreen.hideAsync();
  }, [pronto]);

  // A tela de abertura fica visível até as fontes e a sessão salva carregarem.
  if (!pronto) return null;

  const logado = !!usuario;

  return (
    <>
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: cores.fundo },
          headerShadowVisible: false,
          headerTintColor: cores.texto,
          headerTitleStyle: { fontFamily: fontes.titulo },
          headerBackButtonDisplayMode: 'minimal',
          contentStyle: { backgroundColor: cores.fundo },
        }}>
        <Stack.Screen name="index" options={{ headerShown: false }} />

        {/* Telas públicas: só para quem não entrou. */}
        <Stack.Protected guard={!logado}>
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        </Stack.Protected>

        {/* Conta criada, mas e-mail ainda não confirmado (RF-01). */}
        <Stack.Protected guard={logado && !verificado}>
          <Stack.Screen name="verificar-email" options={{ headerShown: false }} />
        </Stack.Protected>

        {/* Telas privadas: só com login e e-mail verificado. */}
        <Stack.Protected guard={logado && verificado}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="resultados" options={{ title: 'Resultados' }} />
          <Stack.Screen name="carona/[id]" options={{ title: 'Detalhes da viagem' }} />
          <Stack.Screen
            name="avaliar/[reservaId]"
            options={{ headerShown: false, presentation: 'transparentModal', animation: 'slide_from_bottom' }}
          />
        </Stack.Protected>
      </Stack>
      <StatusBar style="dark" />
    </>
  );
}
