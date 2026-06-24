import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, Card } from '@/components/ui-kit';
import { Brand } from '@/constants/ui';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import type { Conductor, Ruta, Vehiculo } from '@/lib/types';

export default function RutasScreen() {
  const { usuario, logout } = useAuth();
  const router = useRouter();

  const [rutas, setRutas] = useState<Ruta[]>([]);
  const [vehiculos, setVehiculos] = useState<Vehiculo[]>([]);
  const [conductores, setConductores] = useState<Conductor[]>([]);
  const [vehiculoSel, setVehiculoSel] = useState<number | null>(null);
  const [conductorSel, setConductorSel] = useState<number | null>(null);

  const [refrescando, setRefrescando] = useState(false);
  const [iniciando, setIniciando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    setError(null);
    try {
      const [r, v, c] = await Promise.all([
        api.listRutas('en_curso'),
        api.listVehiculos(),
        api.listConductores(),
      ]);
      setRutas(r);
      setVehiculos(v.filter((x) => x.activo));
      setConductores(c.filter((x) => x.activo));
    } catch (e: any) {
      setError(e.message ?? 'Error al cargar datos.');
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  async function onRefresh() {
    setRefrescando(true);
    await cargar();
    setRefrescando(false);
  }

  async function iniciarRuta() {
    if (!vehiculoSel || !conductorSel) {
      setError('Selecciona un vehiculo y un conductor.');
      return;
    }
    setError(null);
    setIniciando(true);
    try {
      const ruta = await api.iniciarRuta(vehiculoSel, conductorSel);
      setVehiculoSel(null);
      setConductorSel(null);
      await cargar();
      router.push({
        pathname: '/(repartidor)/seguimiento/[id]',
        params: { id: String(ruta.id) },
      });
    } catch (e: any) {
      setError(e.message ?? 'No se pudo iniciar la ruta.');
    } finally {
      setIniciando(false);
    }
  }

  function confirmarLogout() {
    Alert.alert('Cerrar sesion', 'Seguro que quieres salir?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Salir', style: 'destructive', onPress: () => logout() },
    ]);
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refrescando} onRefresh={onRefresh} />}>
        <View style={styles.topRow}>
          <View>
            <Text style={styles.hola}>Hola,</Text>
            <Text style={styles.nombre}>{usuario?.nombre ?? 'Repartidor'}</Text>
          </View>
          <Pressable onPress={confirmarLogout} hitSlop={10}>
            <Text style={styles.salir}>Salir</Text>
          </Pressable>
        </View>

        {error && <Text style={styles.error}>{error}</Text>}

        <Text style={styles.seccion}>Rutas en curso</Text>
        {rutas.length === 0 ? (
          <Text style={styles.vacio}>No tienes rutas activas. Inicia una abajo.</Text>
        ) : (
          rutas.map((r) => (
            <Card key={r.id} style={styles.rutaCard}>
              <View style={styles.rutaInfo}>
                <Text style={styles.rutaTitulo}>
                  Ruta #{r.id} · {r.patente}
                </Text>
                <Text style={styles.rutaSub}>
                  {r.vehiculo_alias ? `${r.vehiculo_alias} · ` : ''}
                  {r.conductor_nombre}
                </Text>
              </View>
              <Button
                title="Abrir"
                onPress={() =>
                  router.push({
                    pathname: '/(repartidor)/seguimiento/[id]',
                    params: { id: String(r.id) },
                  })
                }
              />
            </Card>
          ))
        )}

        <Text style={styles.seccion}>Iniciar nueva ruta</Text>
        <Card style={{ gap: 14 }}>
          <Text style={styles.label}>Vehiculo</Text>
          <ChipGroup
            items={vehiculos.map((v) => ({
              id: v.id,
              label: `${v.patente}${v.alias ? ` (${v.alias})` : ''}`,
            }))}
            selected={vehiculoSel}
            onSelect={setVehiculoSel}
            emptyText="No hay vehiculos activos."
          />

          <Text style={styles.label}>Conductor</Text>
          <ChipGroup
            items={conductores.map((c) => ({ id: c.id, label: c.nombre }))}
            selected={conductorSel}
            onSelect={setConductorSel}
            emptyText="No hay conductores activos."
          />

          <Button title="Iniciar ruta" onPress={iniciarRuta} loading={iniciando} />
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

function ChipGroup({
  items,
  selected,
  onSelect,
  emptyText,
}: {
  items: { id: number; label: string }[];
  selected: number | null;
  onSelect: (id: number) => void;
  emptyText: string;
}) {
  if (items.length === 0) {
    return <Text style={styles.vacio}>{emptyText}</Text>;
  }
  return (
    <View style={styles.chips}>
      {items.map((it) => {
        const activo = selected === it.id;
        return (
          <Pressable
            key={it.id}
            onPress={() => onSelect(it.id)}
            style={[styles.chip, activo && styles.chipActivo]}>
            <Text style={[styles.chipText, activo && styles.chipTextActivo]}>
              {it.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Brand.bg },
  scroll: { padding: 16, gap: 14 },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  hola: { color: Brand.textMuted, fontSize: 14 },
  nombre: { color: Brand.text, fontSize: 22, fontWeight: '800' },
  salir: { color: Brand.danger, fontWeight: '700', fontSize: 15 },
  seccion: { fontSize: 17, fontWeight: '800', color: Brand.text, marginTop: 6 },
  vacio: { color: Brand.textMuted, fontStyle: 'italic' },
  error: { color: Brand.danger, fontWeight: '600' },
  rutaCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  rutaInfo: { flex: 1, gap: 2 },
  rutaTitulo: { fontSize: 16, fontWeight: '700', color: Brand.text },
  rutaSub: { fontSize: 14, color: Brand.textMuted },
  label: { fontSize: 14, fontWeight: '700', color: Brand.text },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: Brand.border,
    backgroundColor: Brand.bg,
  },
  chipActivo: { borderColor: Brand.primary, backgroundColor: `${Brand.primary}18` },
  chipText: { color: Brand.text, fontWeight: '600' },
  chipTextActivo: { color: Brand.primaryDark },
});
