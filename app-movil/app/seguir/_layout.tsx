import { Stack } from 'expo-router';
import { Brand } from '@/constants/ui';

export default function SeguirLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: Brand.primary },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: '700' },
      }}>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="[id]" options={{ title: 'Seguimiento' }} />
    </Stack>
  );
}
