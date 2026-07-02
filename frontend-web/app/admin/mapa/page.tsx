'use client';

import dynamic from 'next/dynamic';

const MapaLive = dynamic(() => import('@/components/MapaLiveInner'), {
  ssr: false,
  loading: () => <p className="p-4 text-slate-500">Cargando mapa...</p>,
});

export default function MapaPage() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold">Mapa en vivo</h1>
      <div className="h-[70vh] overflow-hidden rounded-xl border border-slate-200">
        <MapaLive />
      </div>
      <p className="text-xs text-slate-400">
        Los repartidores aparecen en el mapa cuando envian su ubicacion GPS desde la app
        (ruta iniciada + GPS activo). La posicion se actualiza en tiempo real.
      </p>
    </div>
  );
}
