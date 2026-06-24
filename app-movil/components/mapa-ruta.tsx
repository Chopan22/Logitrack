import MapView, { Marker, Polyline } from 'react-native-maps';
import { StyleSheet } from 'react-native';
import { Brand } from '@/constants/ui';

export interface Punto {
  lat: number;
  lng: number;
}

export interface Destino extends Punto {
  label?: string;
}

export default function MapaRuta({
  actual,
  recorrido,
  destinos = [],
  destinoActivo = null,
  rutaCalles = null,
}: {
  actual: Punto | null;
  recorrido: Punto[];
  destinos?: Destino[];
  destinoActivo?: Punto | null;
  rutaCalles?: Punto[] | null;
}) {
  const centro = actual ?? destinoActivo ?? destinos[0] ?? null;

  const region = centro
    ? {
        latitude: centro.lat,
        longitude: centro.lng,
        latitudeDelta: 0.03,
        longitudeDelta: 0.03,
      }
    : {
        // Centro por defecto: Valparaiso, Chile.
        latitude: -33.045,
        longitude: -71.62,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      };

  // Linea hacia el destino: por calles si esta disponible, si no recta.
  const lineaDestino =
    rutaCalles && rutaCalles.length > 1
      ? rutaCalles
      : actual && destinoActivo
        ? [actual, destinoActivo]
        : null;

  return (
    <MapView style={styles.map} region={region} showsUserLocation showsMyLocationButton>
      {actual && (
        <Marker
          coordinate={{ latitude: actual.lat, longitude: actual.lng }}
          title="Tu posicion"
          pinColor={Brand.primary}
        />
      )}

      {destinos.map((d, i) => (
        <Marker
          key={`destino-${i}`}
          coordinate={{ latitude: d.lat, longitude: d.lng }}
          title={d.label ?? 'Destino'}
          pinColor={Brand.warning}
        />
      ))}

      {/* Rastro recorrido por el repartidor */}
      {recorrido.length > 1 && (
        <Polyline
          coordinates={recorrido.map((p) => ({ latitude: p.lat, longitude: p.lng }))}
          strokeColor={Brand.textMuted}
          strokeWidth={3}
        />
      )}

      {/* Ruta hacia el destino activo */}
      {lineaDestino && (
        <Polyline
          coordinates={lineaDestino.map((p) => ({ latitude: p.lat, longitude: p.lng }))}
          strokeColor={Brand.primary}
          strokeWidth={4}
          lineDashPattern={rutaCalles ? undefined : [8, 6]}
        />
      )}
    </MapView>
  );
}

const styles = StyleSheet.create({
  map: { ...StyleSheet.absoluteFillObject },
});
