import { DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-gesture-handler';
import 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AuthProvider, useAuth } from '@/lib/auth';

export const unstable_settings = {
  anchor: 'index',
};

function RootNavigator() {
  const { token, cargando } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  // Guardia de sesion: redirige segun haya o no token.
  useEffect(() => {
    if (cargando) return;
    const enZonaPrivada = segments[0] === '(repartidor)';

    if (!token && enZonaPrivada) {
      router.replace('/login');
    } else if (token && !enZonaPrivada) {
      router.replace('/(repartidor)/rutas');
    }
  }, [token, cargando, segments, router]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="login" />
      <Stack.Screen name="seguir" />
      <Stack.Screen name="(repartidor)" />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <ThemeProvider value={DefaultTheme}>
          <RootNavigator />
          <StatusBar style="dark" />
        </ThemeProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
