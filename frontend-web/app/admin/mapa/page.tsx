'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { Field, Select } from '@/components/ui';
import { api } from '@/lib/api';
import type { Ruta } from '@/lib/types';

const MapaLive = dynamic(() => import('@/components/MapaLiveInner'), {
  ssr: false,
  loading: () => <p className="p-4 text-slate-500">Cargando mapa...</p>,
});

export default function MapaPage() {
  const [rutas, setRutas] = useState<Ruta[]>([]);
  const [rutaSel, setRutaSel] = useState('');

  useEffect(() => {
    api
      .listRutas()
      .then(setRutas)
      .catch(() => {});
  }, []);

  const fmtFecha = (s: string) => new Date(s).toLocaleDateString('es-CL');

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="text-2xl font-bold">Mapa en vivo</h1>
        <Field label="Ver recorrido histórico de una ruta">
          <Select
            value={rutaSel}
            onChange={(e) => setRutaSel(e.target.value)}
            className="w-72"
          >
            <option value="">Sin recorrido (solo tiempo real)</option>
            {rutas.map((r) => (
              <option key={r.id} value={r.id}>
                #{r.id} · {r.patente} · {r.conductor_nombre} · {fmtFecha(r.inicio)}
                {r.estado === 'en_curso' ? ' (en curso)' : ''}
              </option>
            ))}
          </Select>
        </Field>
      </div>
      <div className="h-[70vh] overflow-hidden rounded-xl border border-slate-200">
        <MapaLive rutaHistorialId={rutaSel ? Number(rutaSel) : null} />
      </div>
      <p className="text-xs text-slate-400">
        Los repartidores aparecen en el mapa cuando envian su ubicacion GPS desde la app
        (ruta iniciada + GPS activo). La posicion se actualiza en tiempo real. Al seleccionar
        una ruta se dibuja ademas su recorrido historico completo (inicio en verde, ultimo
        punto en rojo).
      </p>
    </div>
  );
}
