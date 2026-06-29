import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, Input } from '@/components/ui-kit';
import { Brand } from '@/constants/ui';
import { useAuth } from '@/lib/auth';

export default function LoginScreen() {
  const { login } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit() {
    if (!email || !password) {
      setError('Ingresa tu email y contrasena.');
      return;
    }
    setError(null);
    setCargando(true);
    try {
      await login(email.trim().toLowerCase(), password);
      router.replace('/(repartidor)/rutas');
    } catch (e: any) {
      setError(e.message ?? 'No se pudo iniciar sesion.');
    } finally {
      setCargando(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <Text style={styles.logo}>LogiTrack</Text>
            <Text style={styles.subtitle}>Panel del Repartidor</Text>
          </View>

          <View style={styles.form}>
            <Text style={styles.label}>Email</Text>
            <Input
              value={email}
              onChangeText={setEmail}
              placeholder="repartidor@logitrack.cl"
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
            />

            <Text style={styles.label}>Contrasena</Text>
            <Input
              value={password}
              onChangeText={setPassword}
              placeholder="********"
              secureTextEntry
            />

            {error && <Text style={styles.error}>{error}</Text>}

            <View style={{ marginTop: 8 }}>
              <Button title="Iniciar sesion" onPress={onSubmit} loading={cargando} />
            </View>
          </View>

          <Pressable onPress={() => router.push('/seguir')} hitSlop={8}>
            <Text style={styles.link}>Eres cliente? Sigue tu pedido</Text>
          </Pressable>

          <Text style={styles.hint}>
            Conecta con tu backend configurando la IP en app.json (expo.extra.apiUrl).
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Brand.bg },
  flex: { flex: 1 },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 24, gap: 28 },
  header: { alignItems: 'center', gap: 6 },
  logo: { fontSize: 36, fontWeight: '800', color: Brand.primary, letterSpacing: 0.5 },
  subtitle: { fontSize: 16, color: Brand.textMuted, fontWeight: '600' },
  form: { gap: 8 },
  label: { fontSize: 14, fontWeight: '600', color: Brand.text, marginTop: 8 },
  error: { color: Brand.danger, fontSize: 14, marginTop: 4 },
  link: { textAlign: 'center', color: Brand.primary, fontWeight: '600', fontSize: 15 },
  hint: { textAlign: 'center', color: Brand.textMuted, fontSize: 12, lineHeight: 18 },
});
