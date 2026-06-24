import { Stack } from 'expo-router';
import { Brand } from '@/constants/ui';

export default function RepartidorLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: Brand.primary },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: '700' },
      }}>
      <Stack.Screen name="rutas" options={{ title: 'LogiTrack' }} />
      <Stack.Screen name="seguimiento/[id]" options={{ title: 'Seguimiento de ruta' }} />
    </Stack>
  );
}
