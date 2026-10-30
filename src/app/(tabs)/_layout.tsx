import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { ComponentProps } from 'react';

import { cores, fontes } from '@/theme';

type NomeIcone = ComponentProps<typeof Ionicons>['name'];

function icone(ativo: NomeIcone, inativo: NomeIcone) {
  function IconeAba({ color, focused }: { color: string; focused: boolean }) {
    return <Ionicons name={focused ? ativo : inativo} size={24} color={color} />;
  }
  return IconeAba;
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: cores.verde,
        tabBarInactiveTintColor: cores.textoSecundario,
        tabBarLabelStyle: { fontFamily: fontes.rotulo, fontSize: 12 },
        tabBarStyle: { backgroundColor: cores.superficie, borderTopColor: cores.borda },
        sceneStyle: { backgroundColor: cores.fundo },
      }}>
      <Tabs.Screen name="index" options={{ title: 'Buscar', tabBarIcon: icone('compass', 'compass-outline') }} />
      <Tabs.Screen
        name="publicar"
        options={{ title: 'Publicar', tabBarIcon: icone('add-circle', 'add-circle-outline') }}
      />
      <Tabs.Screen name="viagens" options={{ title: 'Viagens', tabBarIcon: icone('car', 'car-outline') }} />
      <Tabs.Screen
        name="perfil"
        options={{ title: 'Perfil', tabBarIcon: icone('person-circle', 'person-circle-outline') }}
      />
    </Tabs>
  );
}
