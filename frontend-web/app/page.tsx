'use client';
import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import NavBar from '@/components/NavBar';
import { api } from '@/lib/api';

const MapaTracking = dynamic(() => import('@/components/MapaTracking'), { ssr: false });

interface Ruta {
  id: number;
  estado: string;
  inicio: string;
  patente: string;
  vehiculo_alias: string;
  conductor_nombre: string;
}

export default function Dashboard() {
  const { token } = useAuth();
  const router = useRouter();
  const [rutas, setRutas] = useState<Ruta[]>([]);

  useEffect(() => {
    if (!token) {
      router.push('/login');
      return;
    }
    api.rutas.listar('en_curso').then(data => {
      if (data) setRutas(data);
    });
  }, [token, router]);

  if (!token) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <NavBar />
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <aside style={{
          width: 280,
          background: '#fff',
          borderRight: '1px solid #DEDEDE',
          overflowY: 'auto',
          padding: '1.25rem',
          flexShrink: 0,
        }}>
          <p style={{ fontSize: '0.75rem', fontWeight: 600, color: '#6B6B6B', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '1rem' }}>
            Rutas activas ({rutas.length})
          </p>
          {rutas.length === 0 ? (
            <p style={{ fontSize: '0.875rem', color: '#9B9B9B' }}>No hay rutas en curso</p>
          ) : (
            rutas.map((ruta) => (
              <div key={ruta.id} style={{
                padding: '0.75rem',
                borderRadius: 8,
                border: '1px solid #DEDEDE',
                marginBottom: '0.5rem',
                background: '#FAFAFA',
              }}>
                <div style={{ fontWeight: 600, color: '#2D2D2D', fontSize: '0.9375rem' }}>{ruta.patente}</div>
                {ruta.vehiculo_alias && (
                  <div style={{ fontSize: '0.8125rem', color: '#6B6B6B' }}>{ruta.vehiculo_alias}</div>
                )}
                <div style={{ fontSize: '0.8125rem', color: '#6B6B6B', marginTop: 2 }}>{ruta.conductor_nombre}</div>
                <div style={{ marginTop: '0.5rem' }}>
                  <span style={{ fontSize: '0.75rem', background: '#C8603F', color: 'white', padding: '0.125rem 0.5rem', borderRadius: 9999 }}>
                    en curso
                  </span>
                </div>
              </div>
            ))
          )}
        </aside>
        <main style={{ flex: 1, position: 'relative' }}>
          <MapaTracking />
        </main>
      </div>
    </div>
  );
}
