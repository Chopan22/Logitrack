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

export default function SeguirIndex() {
  const router = useRouter();
  const [numero, setNumero] = useState('');
  const [error, setError] = useState<string | null>(null);

  function seguir() {
    const id = parseInt(numero.trim(), 10);
    if (!numero.trim() || Number.isNaN(id) || id <= 0) {
      setError('Ingresa un numero de pedido valido.');
      return;
    }
    setError(null);
    router.push({ pathname: '/seguir/[id]', params: { id: String(id) } });
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <Text style={styles.logo}>LogiTrack</Text>
            <Text style={styles.subtitle}>Sigue tu pedido</Text>
          </View>

          <View style={styles.form}>
            <Text style={styles.label}>Numero de pedido</Text>
            <Input
              value={numero}
              onChangeText={setNumero}
              placeholder="Ej. 12"
              keyboardType="number-pad"
              onSubmitEditing={seguir}
              returnKeyType="search"
            />
            {error && <Text style={styles.error}>{error}</Text>}
            <View style={{ marginTop: 8 }}>
              <Button title="Seguir pedido" onPress={seguir} />
            </View>
          </View>

          <Pressable onPress={() => router.replace('/login')} hitSlop={8}>
            <Text style={styles.link}>Soy repartidor / administrador</Text>
          </Pressable>
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
  label: { fontSize: 14, fontWeight: '600', color: Brand.text },
  error: { color: Brand.danger, fontSize: 14, marginTop: 4 },
  link: { textAlign: 'center', color: Brand.primary, fontWeight: '600', fontSize: 14 },
});
