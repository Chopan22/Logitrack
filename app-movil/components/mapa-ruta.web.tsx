import { StyleSheet, Text, View } from 'react-native';
import { Brand } from '@/constants/ui';

export interface Punto {
  lat: number;
  lng: number;
}

export interface Destino extends Punto {
  label?: string;
}

// react-native-maps no funciona en web. Mostramos un sustituto con las coordenadas.
export default function MapaRuta({
  actual,
}: {
  actual: Punto | null;
  recorrido: Punto[];
  destinos?: Destino[];
  destinoActivo?: Punto | null;
  rutaCalles?: Punto[] | null;
}) {
  return (
    <View style={styles.box}>
      <Text style={styles.titulo}>Mapa disponible en la app movil</Text>
      <Text style={styles.coords}>
        {actual
          ? `Lat ${actual.lat.toFixed(5)}  ·  Lng ${actual.lng.toFixed(5)}`
          : 'Esperando ubicacion GPS...'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#dfe7ec',
    gap: 8,
  },
  titulo: { fontWeight: '700', color: Brand.text },
  coords: { color: Brand.textMuted },
});
