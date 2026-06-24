import { Redirect } from 'expo-router';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Brand } from '@/constants/ui';
import { useAuth } from '@/lib/auth';

export default function Index() {
  const { token, cargando } = useAuth();

  if (cargando) {
    return (
      <View style={styles.container}>
        <Text style={styles.logo}>LogiTrack</Text>
        <ActivityIndicator color={Brand.primary} size="large" />
      </View>
    );
  }

  return <Redirect href={token ? '/(repartidor)/rutas' : '/login'} />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
    backgroundColor: Brand.bg,
  },
  logo: {
    fontSize: 30,
    fontWeight: '800',
    color: Brand.primary,
    letterSpacing: 0.5,
  },
});
