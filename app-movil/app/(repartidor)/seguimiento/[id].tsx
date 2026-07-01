import * as Location from 'expo-location';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import MapaRuta, { type Destino, type Punto } from '@/components/mapa-ruta';
import { Button, Card, EstadoBadge } from '@/components/ui-kit';
import { Brand } from '@/constants/ui';
import { api } from '@/lib/api';
import {
  distanciaMetros,
  formatearDistancia,
  formatearDuracion,
  obtenerRutaOSRM,
} from '@/lib/routing';
import { disconnectSocket, enviarUbicacion, getSocket } from '@/lib/socket';
import type { Pedido } from '@/lib/types';
import { 
  GEOFENCE_TASK_NAME, 
  startGeofencesForOrders, 
  stopAllGeofences, 
  retryPendingGeofenceEvents 
} from '@/tasks/geofencing';

export default function SeguimientoScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const rutaId = Number(id);
  const router = useRouter();

  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [pendientes, setPendientes] = useState<Pedido[]>([]);
  const [actual, setActual] = useState<Punto | null>(null);
  const [recorrido, setRecorrido] = useState<Punto[]>([]);
  const [rastreando, setRastreando] = useState(false);
  const [conectado, setConectado] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Ruta real por calles (OSRM) + su distancia/duracion estimada.
  const [rutaCalles, setRutaCalles] = useState<Punto[] | null>(null);
  const [infoRuta, setInfoRuta] = useState<{ distanciaM: number; duracionS: number } | null>(null);
  const [calculandoRuta, setCalculandoRuta] = useState(false);

  const watchRef = useRef<Location.LocationSubscription | null>(null);
  const actualRef = useRef<Punto | null>(null);
  const destinoActivoRef = useRef<Punto | null>(null);
  const ultimoOrigenRef = useRef<Punto | null>(null);

  // Destinos con coordenadas para marcar en el mapa.
  const destinos: Destino[] = pedidos
    .filter((p) => p.lat != null && p.lng != null)
    .map((p) => ({
      lat: p.lat as number,
      lng: p.lng as number,
      label: `#${p.id} ${p.direccion_destino}`,
    }));

  // Destino activo: el pedido en camino con coordenadas (o el primero disponible).
  const pedidoActivo =
    pedidos.find((p) => p.estado === 'en_camino' && p.lat != null && p.lng != null) ??
    pedidos.find((p) => p.lat != null && p.lng != null);
  const destinoActivo: Punto | null =
    pedidoActivo && pedidoActivo.lat != null && pedidoActivo.lng != null
      ? { lat: pedidoActivo.lat, lng: pedidoActivo.lng }
      : null;

  const cargarPedidos = useCallback(async () => {
    try {
      const [delaRuta, sinAsignar] = await Promise.all([
        api.listPedidos({ ruta_id: rutaId }),
        api.listPedidos({ estado: 'pendiente' }),
      ]);
      setPedidos(delaRuta);
      setPendientes(sinAsignar.filter((p) => p.ruta_id == null));

      await sincronizarGeofences(delaRuta);
    } catch (e: any) {
      setError(e.message ?? 'Error al cargar pedidos.');
    }
  }, [rutaId, sincronizarGeofences]);

  const sincronizarGeofences = useCallback(async (orders: Pedido[]) => {
      const pendientesGeofence = orders.filter(
        (p) => p.estado !== 'llegada' && p.estado !== 'entregado' && p.lat != null && p.lng != null
      );

      if (pendientesGeofence.length === 0) {
        await stopAllGeofences().catch(console.warn);
        return;
      }

      const { status: bgStatus } = await Location.requestBackgroundPermissionsAsync();
      if (bgStatus !== 'granted') {
        console.warn('Background location permission not granted – geofencing may not work in background');
      }

      await retryPendingGeofenceEvents();
      await startGeofencesForOrders(pendientesGeofence);
  }, []);

  // Estado de conexion del socket.
  useEffect(() => {
    const s = getSocket();
    setConectado(s.connected);
    const onConnect = () => setConectado(true);
    const onDisconnect = () => setConectado(false);
    s.on('connect', onConnect);
    s.on('disconnect', onDisconnect);
    return () => {
      s.off('connect', onConnect);
      s.off('disconnect', onDisconnect);
    };
  }, []);

  useEffect(() => {
    cargarPedidos();
  }, [cargarPedidos]);

  // Detener el rastreo al salir de la pantalla.
  useEffect(() => {
    return () => {
      watchRef.current?.remove();
      watchRef.current = null;

      stopAllGeofences().catch(console.warn);
    };
  }, []);

  // Pide a OSRM la ruta por calles entre origen y destino.
  const recalcularRuta = useCallback(async (origen: Punto, destino: Punto) => {
    setCalculandoRuta(true);
    try {
      const ruta = await obtenerRutaOSRM(origen, destino);
      if (ruta) {
        setRutaCalles(ruta.puntos);
        setInfoRuta({ distanciaM: ruta.distanciaM, duracionS: ruta.duracionS });
        ultimoOrigenRef.current = origen;
      }
    } finally {
      setCalculandoRuta(false);
    }
  }, []);

  // Recalcula cuando cambia el destino activo (si ya hay posicion).
  useEffect(() => {
    destinoActivoRef.current = destinoActivo;
    if (actualRef.current && destinoActivo) {
      recalcularRuta(actualRef.current, destinoActivo);
    } else if (!destinoActivo) {
      setRutaCalles(null);
      setInfoRuta(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [destinoActivo?.lat, destinoActivo?.lng, recalcularRuta]);

  useEffect(() => {
    const socket = getSocket();
    const handleArrival = (data: any) => {
      console.log('Pedido llegó:', data.pedidoId);
      cargarPedidos(); // refresh to update estado and UI
    };
    socket.on('conductor_llego_pedido', handleArrival);
    return () => {
      socket.off('conductor_llego_pedido', handleArrival);
    };
  }, [cargarPedidos]);


  async function iniciarRastreo() {
    setError(null);
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      setError('Permiso de ubicacion denegado. Activalo para enviar tu posicion.');
      return;
    }

    watchRef.current = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.Balanced,
        timeInterval: 5000,
        distanceInterval: 10,
      },
      (loc) => {
        const punto: Punto = {
          lat: loc.coords.latitude,
          lng: loc.coords.longitude,
        };
        setActual(punto);
        actualRef.current = punto;
        setRecorrido((prev) => [...prev, punto]);
        enviarUbicacion({ ruta_id: rutaId, lat: punto.lat, lng: punto.lng });

        // Recalcula la ruta por calles si nos movimos > 75 m (o no hay ruta aun).
        const dest = destinoActivoRef.current;
        if (dest) {
          const last = ultimoOrigenRef.current;
          if (!last || distanciaMetros(last, punto) > 75) {
            recalcularRuta(punto, dest);
          }
        }
      }
    );
    setRastreando(true);
  }

  function detenerRastreo() {
    watchRef.current?.remove();
    watchRef.current = null;
    setRastreando(false);
  }

  async function entregar(pedido: Pedido) {
    try {
      await api.actualizarPedido(pedido.id, { estado: 'entregado' });
      await cargarPedidos();
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'No se pudo marcar como entregado.');
    }
  }

  async function asignar(pedido: Pedido) {
    try {
      await api.asignarPedido(pedido.id, rutaId);
      await cargarPedidos();
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'No se pudo asignar el pedido.');
    }
  }

  function cerrarRuta() {
    Alert.alert('Cerrar ruta', 'Esto finalizara la ruta. Continuar?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Cerrar',
        style: 'destructive',
        onPress: async () => {
          try {
            detenerRastreo();
            await api.cerrarRuta(rutaId);
            disconnectSocket();
            router.replace('/(repartidor)/rutas');
          } catch (e: any) {
            Alert.alert('Error', e.message ?? 'No se pudo cerrar la ruta.');
          }
        },
      },
    ]);
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <View style={styles.mapWrap}>
        <MapaRuta
          actual={actual}
          recorrido={recorrido}
          destinos={destinos}
          destinoActivo={destinoActivo}
          rutaCalles={rutaCalles}
        />
        <View style={styles.estadoChip}>
          <View
            style={[
              styles.dot,
              { backgroundColor: conectado ? Brand.success : Brand.danger },
            ]}
          />
          <Text style={styles.estadoText}>
            {conectado ? 'Conectado' : 'Sin conexion'}
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {error && <Text style={styles.error}>{error}</Text>}

        <View style={styles.acciones}>
          {rastreando ? (
            <Button title="Detener GPS" variant="danger" onPress={detenerRastreo} />
          ) : (
            <Button title="Iniciar GPS en vivo" onPress={iniciarRastreo} />
          )}
        </View>

        {destinoActivo && (
          <Card style={styles.rutaInfoCard}>
            <View style={styles.rutaInfoTop}>
              <Text style={styles.rutaInfoTitulo}>Ruta al destino</Text>
              {calculandoRuta && <ActivityIndicator size="small" color={Brand.primary} />}
            </View>
            {infoRuta ? (
              <Text style={styles.rutaInfoDatos}>
                {formatearDistancia(infoRuta.distanciaM)}  ·  ~{formatearDuracion(infoRuta.duracionS)}
              </Text>
            ) : (
              <Text style={styles.vacio}>
                {actual
                  ? 'Calculando ruta por calles...'
                  : 'Inicia el GPS para trazar la ruta.'}
              </Text>
            )}
            {actual && (
              <View style={{ marginTop: 8 }}>
                <Button
                  title="Recalcular ruta"
                  variant="outline"
                  loading={calculandoRuta}
                  onPress={() => recalcularRuta(actual, destinoActivo)}
                />
              </View>
            )}
          </Card>
        )}

        <Text style={styles.seccion}>Pedidos de esta ruta ({pedidos.length})</Text>
        {pedidos.length === 0 ? (
          <Text style={styles.vacio}>Aun no hay pedidos asignados a esta ruta.</Text>
        ) : (
          pedidos.map((p) => (
            <Card key={p.id} style={styles.pedidoCard}>
              <View style={styles.pedidoTop}>
                <Text style={styles.pedidoTitulo}>#{p.id} · {p.direccion_destino}</Text>
                <EstadoBadge estado={p.estado} />
              </View>
              {p.cliente_nombre && (
                <Text style={styles.pedidoSub}>
                  {p.cliente_nombre}
                  {p.cliente_telefono ? ` · ${p.cliente_telefono}` : ''}
                </Text>
              )}
              {p.descripcion && <Text style={styles.pedidoDesc}>{p.descripcion}</Text>}
              {p.estado !== 'entregado' && (
                <View style={{ marginTop: 8 }}>
                  <Button title="Marcar entregado" variant="success" onPress={() => entregar(p)} />
                </View>
              )}
            </Card>
          ))
        )}

        {pendientes.length > 0 && (
          <>
            <Text style={styles.seccion}>Pedidos pendientes por asignar</Text>
            {pendientes.map((p) => (
              <Card key={p.id} style={styles.pedidoCard}>
                <View style={styles.pedidoTop}>
                  <Text style={styles.pedidoTitulo}>#{p.id} · {p.direccion_destino}</Text>
                  <EstadoBadge estado={p.estado} />
                </View>
                {p.cliente_nombre && (
                  <Text style={styles.pedidoSub}>{p.cliente_nombre}</Text>
                )}
                <View style={{ marginTop: 8 }}>
                  <Button title="Asignar a esta ruta" variant="outline" onPress={() => asignar(p)} />
                </View>
              </Card>
            ))}
          </>
        )}

        <View style={{ marginTop: 18 }}>
          <Button title="Cerrar ruta" variant="danger" onPress={cerrarRuta} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Brand.bg },
  mapWrap: { height: 260, backgroundColor: '#dfe7ec' },
  estadoChip: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#ffffffee',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  dot: { width: 9, height: 9, borderRadius: 999 },
  estadoText: { fontSize: 12, fontWeight: '700', color: Brand.text },
  scroll: { padding: 16, gap: 12 },
  acciones: { gap: 10 },
  rutaInfoCard: { gap: 4 },
  rutaInfoTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rutaInfoTitulo: { fontSize: 15, fontWeight: '700', color: Brand.text },
  rutaInfoDatos: { fontSize: 18, fontWeight: '800', color: Brand.primary },
  seccion: { fontSize: 17, fontWeight: '800', color: Brand.text, marginTop: 8 },
  vacio: { color: Brand.textMuted, fontStyle: 'italic' },
  error: { color: Brand.danger, fontWeight: '600' },
  pedidoCard: { gap: 4 },
  pedidoTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
  },
  pedidoTitulo: { flex: 1, fontSize: 15, fontWeight: '700', color: Brand.text },
  pedidoSub: { fontSize: 14, color: Brand.textMuted },
  pedidoDesc: { fontSize: 14, color: Brand.text },
});
