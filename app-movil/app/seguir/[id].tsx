import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import MapaRuta, { type Punto } from '@/components/mapa-ruta';
import { Button, Card, EstadoBadge } from '@/components/ui-kit';
import { Brand } from '@/constants/ui';
import { api } from '@/lib/api';
import {
  distanciaMetros,
  formatearDistancia,
  formatearDuracion,
  obtenerRutaOSRM,
} from '@/lib/routing';
import { getSocket } from '@/lib/socket';
import type { Tracking, UbicacionPayload } from '@/lib/types';

export default function SeguirPedido() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const pedidoId = Number(id);
  const router = useRouter();

  const [tracking, setTracking] = useState<Tracking | null>(null);
  const [driver, setDriver] = useState<Punto | null>(null);
  const [rutaCalles, setRutaCalles] = useState<Punto[] | null>(null);
  const [infoRuta, setInfoRuta] = useState<{ distanciaM: number; duracionS: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(true);

  const ultimoOrigenRef = useRef<Punto | null>(null);

  const destino: Punto | null =
    tracking?.pedido.lat != null && tracking?.pedido.lng != null
      ? { lat: tracking.pedido.lat, lng: tracking.pedido.lng }
      : null;

  const recalcularRuta = useCallback(async (origen: Punto, dest: Punto) => {
    const ruta = await obtenerRutaOSRM(origen, dest);
    if (ruta) {
      setRutaCalles(ruta.puntos);
      setInfoRuta({ distanciaM: ruta.distanciaM, duracionS: ruta.duracionS });
      ultimoOrigenRef.current = origen;
    }
  }, []);

  const cargar = useCallback(async () => {
    try {
      const t = await api.trackingPedido(pedidoId);
      setTracking(t);
      if (t.ubicacion) {
        setDriver({ lat: t.ubicacion.lat, lng: t.ubicacion.lng });
      }
      setError(null);
    } catch (e: any) {
      setError(e.message ?? 'No se pudo cargar el pedido.');
    } finally {
      setCargando(false);
    }
  }, [pedidoId]);

  // Carga inicial + refresco de estado cada 15s.
  useEffect(() => {
    cargar();
    const intervalo = setInterval(cargar, 15000);
    return () => clearInterval(intervalo);
  }, [cargar]);

  // Escucha ubicaciones en tiempo real del repartidor de esta ruta.
  useEffect(() => {
    const rutaId = tracking?.pedido.ruta_id;
    if (!rutaId) return;

    const s = getSocket();
    const onUbicacion = (data: UbicacionPayload) => {
      if (data.ruta_id !== rutaId) return;
      const punto = { lat: data.lat, lng: data.lng };
      setDriver(punto);
      if (destino) {
        const last = ultimoOrigenRef.current;
        if (!last || distanciaMetros(last, punto) > 75) {
          recalcularRuta(punto, destino);
        }
      }
    };
    s.on('nueva_ubicacion', onUbicacion);
    return () => {
      s.off('nueva_ubicacion', onUbicacion);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tracking?.pedido.ruta_id, destino?.lat, destino?.lng, recalcularRuta]);

  // Calcula la ruta inicial en cuanto haya posicion del repartidor y destino.
  useEffect(() => {
    if (driver && destino && !rutaCalles) {
      recalcularRuta(driver, destino);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [driver, destino?.lat, destino?.lng]);

  if (cargando) {
    return (
      <View style={styles.centro}>
        <ActivityIndicator size="large" color={Brand.primary} />
      </View>
    );
  }

  if (error || !tracking) {
    return (
      <SafeAreaView style={styles.safe}>
        <Stack.Screen options={{ title: `Pedido #${pedidoId}` }} />
        <View style={styles.centro}>
          <Text style={styles.error}>{error ?? 'Pedido no encontrado.'}</Text>
          <View style={{ marginTop: 12 }}>
            <Button title="Volver" variant="outline" onPress={() => router.replace('/seguir')} />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  const p = tracking.pedido;
  const enReparto = p.estado === 'en_camino';

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <Stack.Screen options={{ title: `Pedido #${p.id}` }} />

      <View style={styles.mapWrap}>
        <MapaRuta
          actual={driver}
          recorrido={[]}
          destinos={destino ? [{ ...destino, label: p.direccion_destino }] : []}
          destinoActivo={destino}
          rutaCalles={rutaCalles}
        />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <Card style={{ gap: 8 }}>
          <View style={styles.row}>
            <Text style={styles.titulo}>Estado del pedido</Text>
            <EstadoBadge estado={p.estado} />
          </View>
          <Text style={styles.direccion}>{p.direccion_destino}</Text>
          {p.descripcion && <Text style={styles.desc}>{p.descripcion}</Text>}
        </Card>

        {p.estado === 'entregado' ? (
          <Card style={styles.banner}>
            <Text style={styles.bannerOk}>Tu pedido fue entregado. Gracias!</Text>
          </Card>
        ) : !p.ruta_id ? (
          <Card style={styles.banner}>
            <Text style={styles.bannerInfo}>
              Tu pedido aun no sale a reparto. Te avisaremos cuando vaya en camino.
            </Text>
          </Card>
        ) : !driver ? (
          <Card style={styles.banner}>
            <Text style={styles.bannerInfo}>
              El repartidor va en camino. Esperando su ubicacion en tiempo real...
            </Text>
          </Card>
        ) : (
          <Card style={{ gap: 4 }}>
            <Text style={styles.titulo}>Repartidor en camino</Text>
            {infoRuta ? (
              <Text style={styles.eta}>
                {formatearDistancia(infoRuta.distanciaM)}  ·  llega en ~{formatearDuracion(infoRuta.duracionS)}
              </Text>
            ) : (
              <Text style={styles.desc}>Calculando tiempo de llegada...</Text>
            )}
          </Card>
        )}

        {enReparto && (
          <Text style={styles.nota}>La ubicacion se actualiza automaticamente.</Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Brand.bg },
  centro: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: Brand.bg },
  mapWrap: { height: 300, backgroundColor: '#dfe7ec' },
  scroll: { padding: 16, gap: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  titulo: { fontSize: 16, fontWeight: '800', color: Brand.text },
  direccion: { fontSize: 15, color: Brand.text },
  desc: { fontSize: 14, color: Brand.textMuted },
  eta: { fontSize: 18, fontWeight: '800', color: Brand.primary },
  error: { color: Brand.danger, fontWeight: '600', textAlign: 'center' },
  banner: { backgroundColor: '#eaf3f7' },
  bannerInfo: { color: Brand.info, fontWeight: '600', textAlign: 'center' },
  bannerOk: { color: Brand.success, fontWeight: '700', textAlign: 'center', fontSize: 16 },
  nota: { textAlign: 'center', color: Brand.textMuted, fontSize: 12 },
});
