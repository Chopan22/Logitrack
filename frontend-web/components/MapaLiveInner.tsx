'use client';

import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useEffect, useState } from 'react';
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet';
import { api } from '@/lib/api';
import { getSocket } from '@/lib/socket';
import type { Ruta, UbicacionPayload } from '@/lib/types';

// Icono simple (punto azul) para evitar problemas con los assets por defecto de Leaflet.
const icono = L.divIcon({
  className: '',
  html:
    '<div style="background:#0369a1;width:18px;height:18px;border-radius:50%;border:3px solid white;box-shadow:0 0 4px rgba(0,0,0,.4)"></div>',
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

export default function MapaLiveInner() {
  const [posiciones, setPosiciones] = useState<Record<number, { lat: number; lng: number }>>({});
  const [rutas, setRutas] = useState<Record<number, Ruta>>({});

  // Info de las rutas en curso (para etiquetar cada repartidor).
  useEffect(() => {
    api
      .listRutas('en_curso')
      .then((rs) => {
        const map: Record<number, Ruta> = {};
        rs.forEach((r) => {
          map[r.id] = r;
        });
        setRutas(map);
      })
      .catch(() => {});
  }, []);

  // Ubicaciones en tiempo real.
  useEffect(() => {
    const s = getSocket();
    const onUbicacion = (d: UbicacionPayload) => {
      setPosiciones((prev) => ({ ...prev, [d.ruta_id]: { lat: d.lat, lng: d.lng } }));
    };
    s.on('nueva_ubicacion', onUbicacion);
    return () => {
      s.off('nueva_ubicacion', onUbicacion);
    };
  }, []);

  const entradas = Object.entries(posiciones);

  return (
    <MapContainer center={[-33.45, -70.66]} zoom={11} style={{ height: '100%', width: '100%' }}>
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      />
      {entradas.map(([rid, pos]) => {
        const r = rutas[Number(rid)];
        return (
          <Marker key={rid} position={[pos.lat, pos.lng]} icon={icono}>
            <Popup>
              <strong>Ruta #{rid}</strong>
              <br />
              {r ? `${r.patente} · ${r.conductor_nombre}` : 'Repartidor'}
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}
