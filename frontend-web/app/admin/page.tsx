'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Card, Spinner } from '@/components/ui';
import { api } from '@/lib/api';

interface Resumen {
  pedidosPendientes: number;
  pedidosEnCamino: number;
  rutasEnCurso: number;
  vehiculos: number;
  conductores: number;
}

export default function AdminHome() {
  const [resumen, setResumen] = useState<Resumen | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [pendientes, enCamino, rutas, vehiculos, conductores] = await Promise.all([
          api.listPedidos({ estado: 'pendiente' }),
          api.listPedidos({ estado: 'en_camino' }),
          api.listRutas('en_curso'),
          api.listVehiculos(),
          api.listConductores(),
        ]);
        setResumen({
          pedidosPendientes: pendientes.length,
          pedidosEnCamino: enCamino.length,
          rutasEnCurso: rutas.length,
          // Solo la flota vigente: los dados de baja no cuentan como disponibles.
          vehiculos: vehiculos.filter((v) => v.activo).length,
          conductores: conductores.filter((c) => c.activo).length,
        });
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Error al cargar el resumen.');
      }
    })();
  }, []);

  if (error) return <p className="font-medium text-red-600">{error}</p>;
  if (!resumen) return <Spinner />;

  const tarjetas = [
    { label: 'Pedidos pendientes', valor: resumen.pedidosPendientes, href: '/admin/pedidos' },
    { label: 'Pedidos en camino', valor: resumen.pedidosEnCamino, href: '/admin/pedidos' },
    { label: 'Rutas en curso', valor: resumen.rutasEnCurso, href: '/admin/rutas' },
    { label: 'Vehiculos activos', valor: resumen.vehiculos, href: '/admin/flota' },
    { label: 'Conductores activos', valor: resumen.conductores, href: '/admin/flota' },
  ];

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Resumen</h1>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {tarjetas.map((t) => (
          <Link key={t.label} href={t.href}>
            <Card className="transition hover:border-sky-300">
              <p className="text-3xl font-extrabold text-sky-700">{t.valor}</p>
              <p className="mt-1 text-sm text-slate-500">{t.label}</p>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
