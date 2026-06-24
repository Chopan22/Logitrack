import type { Punto } from '@/components/mapa-ruta';

export interface RutaCalles {
  puntos: Punto[]; // Polilinea que sigue las calles.
  distanciaM: number; // Distancia total en metros.
  duracionS: number; // Duracion estimada en segundos.
}


export async function obtenerRutaOSRM(
  origen: Punto,
  destino: Punto
): Promise<RutaCalles | null> {
  const url =
    `https://router.project-osrm.org/route/v1/driving/` +
    `${origen.lng},${origen.lat};${destino.lng},${destino.lat}` +
    `?overview=full&geometries=geojson`;

  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    const ruta = data.routes?.[0];
    if (!ruta) return null;

    const coords: [number, number][] = ruta.geometry.coordinates;
    return {
      puntos: coords.map(([lng, lat]) => ({ lat, lng })),
      distanciaM: ruta.distance,
      duracionS: ruta.duration,
    };
  } catch {
    return null;
  }
}

/** Distancia en metros entre dos puntos (formula de Haversine). */
export function distanciaMetros(a: Punto, b: Punto): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** Formatea metros a "350 m" o "2.4 km". */
export function formatearDistancia(m: number): string {
  return m < 1000 ? `${Math.round(m)} m` : `${(m / 1000).toFixed(1)} km`;
}

/** Formatea segundos a "5 min" o "1 h 12 min". */
export function formatearDuracion(s: number): string {
  const min = Math.round(s / 60);
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  return `${h} h ${min % 60} min`;
}
