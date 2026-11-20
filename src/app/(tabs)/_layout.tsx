import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { ComponentProps, useEffect, useState } from 'react';
import { ColorValue } from 'react-native';

import { observarPedidosPendentes } from '@/data/repositorio';
import { cores, fontes } from '@/theme';

type NomeIcone = ComponentProps<typeof Ionicons>['name'];

function icone(ativo: NomeIcone, inativo: NomeIcone) {
  function IconeAba({ color, focused }: { color: ColorValue; focused: boolean }) {
    // A barra de abas passa a cor como texto (ex.: "#0F766E"); o tipo do React
    // Native 0.88 também admite número e null, que nunca chegam aqui.
    return <Ionicons name={focused ? ativo : inativo} size={24} color={color as string} />;
  }
  return IconeAba;
}

export default function TabsLayout() {
  // Aviso dentro do app (RF-07): pedidos de vaga esperando resposta do motorista.
  const [pendentes, setPendentes] = useState(0);
  useEffect(() => observarPedidosPendentes(setPendentes), []);

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
      <Tabs.Screen name="viagens" options={{
          title: 'Viagens',
          tabBarIcon: icone('car', 'car-outline'),
          tabBarBadge: pendentes > 0 ? pendentes : undefined,
          tabBarBadgeStyle: { backgroundColor: cores.erro, fontFamily: fontes.rotulo },
        }} />
      <Tabs.Screen
        name="perfil"
        options={{ title: 'Perfil', tabBarIcon: icone('person-circle', 'person-circle-outline') }}
      />
    </Tabs>
  );
}
