'use client';
import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { getSocket } from '@/lib/socket';
import { api } from '@/lib/api';

interface VehiculoEnMapa {
  ruta_id: number;
  lat: number;
  lng: number;
}

interface Ruta {
  id: number;
  patente: string;
  vehiculo_alias: string;
  conductor_nombre: string;
  estado: string;
}

const crearIcono = () => L.divIcon({
  className: '',
  html: `<div style="
    width: 38px; height: 38px;
    background: #C8603F;
    border: 3px solid white;
    border-radius: 50%;
    box-shadow: 0 2px 10px rgba(0,0,0,0.3);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 17px;
  ">🚚</div>`,
  iconSize: [38, 38],
  iconAnchor: [19, 19],
  popupAnchor: [0, -22],
});

export default function MapaTracking() {
  const [vehiculos, setVehiculos] = useState<Map<number, VehiculoEnMapa>>(new Map());
  const [rutas, setRutas] = useState<Ruta[]>([]);

  useEffect(() => {
    api.rutas.listar('en_curso').then((data) => {
      if (data) setRutas(data);
    });

    const socket = getSocket();
    socket.connect();

    socket.on('nueva_ubicacion', (data: VehiculoEnMapa) => {
      setVehiculos(prev => {
        const next = new Map(prev);
        next.set(data.ruta_id, data);
        return next;
      });
    });

    return () => {
      socket.off('nueva_ubicacion');
      socket.disconnect();
    };
  }, []);

  const vehiculosArray = Array.from(vehiculos.values());

  return (
    <MapContainer
      center={[-33.4569, -70.6483]}
      zoom={12}
      style={{ height: '100%', width: '100%' }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      />
      {vehiculosArray.map((v) => {
        const ruta = rutas.find(r => r.id === v.ruta_id);
        return (
          <Marker key={v.ruta_id} position={[v.lat, v.lng]} icon={crearIcono()}>
            <Popup>
              <div style={{ minWidth: 140 }}>
                <strong style={{ color: '#2D2D2D' }}>
                  {ruta?.patente ?? `Ruta #${v.ruta_id}`}
                </strong>
                {ruta?.conductor_nombre && (
                  <p style={{ color: '#6B6B6B', fontSize: '0.8rem', marginTop: 2 }}>
                    {ruta.conductor_nombre}
                  </p>
                )}
                <p style={{ color: '#9B9B9B', fontSize: '0.75rem', marginTop: 4 }}>
                  {v.lat.toFixed(5)}, {v.lng.toFixed(5)}
                </p>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}
