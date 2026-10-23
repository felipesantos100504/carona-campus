import { HankenGrotesk_400Regular, HankenGrotesk_500Medium, HankenGrotesk_600SemiBold } from '@expo-google-fonts/hanken-grotesk';
import { Outfit_600SemiBold, Outfit_700Bold } from '@expo-google-fonts/outfit';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

import { cores, fontes } from '@/theme';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontesCarregadas, erroFontes] = useFonts({
    Outfit_600SemiBold,
    Outfit_700Bold,
    HankenGrotesk_400Regular,
    HankenGrotesk_500Medium,
    HankenGrotesk_600SemiBold,
  });

  useEffect(() => {
    if (fontesCarregadas || erroFontes) SplashScreen.hideAsync();
  }, [fontesCarregadas, erroFontes]);

  if (!fontesCarregadas && !erroFontes) return null;

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
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="resultados" options={{ title: 'Caronas encontradas' }} />
        <Stack.Screen name="carona/[id]" options={{ title: 'Detalhes da carona' }} />
        <Stack.Screen
          name="avaliar/[reservaId]"
          options={{ title: 'Avaliar viagem', presentation: 'modal' }}
        />
      </Stack>
      <StatusBar style="dark" />
    </>
  );
}
