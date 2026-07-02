'use client';

import { Fragment, useCallback, useEffect, useState } from 'react';
import { Badge, Button, Card, Field, Select, Spinner } from '@/components/ui';
import { api } from '@/lib/api';
import type { Conductor, Ruta, RutaDetalle, Vehiculo } from '@/lib/types';

export default function RutasPage() {
  const [rutas, setRutas] = useState<Ruta[]>([]);
  const [vehiculos, setVehiculos] = useState<Vehiculo[]>([]);
  const [conductores, setConductores] = useState<Conductor[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [vehiculoSel, setVehiculoSel] = useState('');
  const [conductorSel, setConductorSel] = useState('');
  const [iniciando, setIniciando] = useState(false);

  // Detalle expandido: pedidos de la ruta seleccionada.
  const [detalle, setDetalle] = useState<RutaDetalle | null>(null);
  const [cargandoDetalle, setCargandoDetalle] = useState(false);

  const cargar = useCallback(async () => {
    try {
      const [r, v, c] = await Promise.all([
        api.listRutas(),
        api.listVehiculos(),
        api.listConductores(),
      ]);
      setRutas(r);
      setVehiculos(v);
      setConductores(c);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al cargar.');
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  async function iniciar(e: React.FormEvent) {
    e.preventDefault();
    if (!vehiculoSel || !conductorSel) {
      setError('Selecciona vehiculo y conductor.');
      return;
    }
    setIniciando(true);
    setError(null);
    try {
      await api.iniciarRuta(Number(vehiculoSel), Number(conductorSel));
      setVehiculoSel('');
      setConductorSel('');
      await cargar();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo iniciar la ruta.');
    } finally {
      setIniciando(false);
    }
  }

  async function cerrar(ruta: Ruta) {
    try {
      await api.cerrarRuta(ruta.id);
      await cargar();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo cerrar la ruta.');
    }
  }

  async function verPedidos(ruta: Ruta) {
    if (detalle?.id === ruta.id) {
      setDetalle(null); // segundo clic: colapsar
      return;
    }
    setCargandoDetalle(true);
    try {
      setDetalle(await api.detalleRuta(ruta.id));
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo cargar el detalle.');
    } finally {
      setCargandoDetalle(false);
    }
  }

  const fmt = (s: string | null) => (s ? new Date(s).toLocaleString('es-CL') : '—');

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">Rutas</h1>

      <Card>
        <h2 className="mb-4 text-lg font-semibold">Iniciar ruta</h2>
        <form onSubmit={iniciar} className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Field label="Vehiculo">
            <Select value={vehiculoSel} onChange={(e) => setVehiculoSel(e.target.value)}>
              <option value="">Selecciona...</option>
              {vehiculos.filter((v) => v.activo).map((v) => (
                <option key={v.id} value={v.id}>
                  {v.patente} {v.alias ? `(${v.alias})` : ''}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Conductor">
            <Select value={conductorSel} onChange={(e) => setConductorSel(e.target.value)}>
              <option value="">Selecciona...</option>
              {conductores.filter((c) => c.activo).map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
            </Select>
          </Field>
          <div className="flex items-end">
            <Button type="submit" loading={iniciando}>
              Iniciar ruta
            </Button>
          </div>
        </form>
      </Card>

      {error && <p className="font-medium text-red-600">{error}</p>}

      <Card className="overflow-x-auto">
        <h2 className="mb-4 text-lg font-semibold">Listado ({rutas.length})</h2>
        {cargando ? (
          <Spinner />
        ) : rutas.length === 0 ? (
          <p className="text-slate-500">No hay rutas.</p>
        ) : (
          <table className="w-full min-w-[680px] text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-slate-500">
                <th className="py-2 pr-3">#</th>
                <th className="py-2 pr-3">Vehiculo</th>
                <th className="py-2 pr-3">Conductor</th>
                <th className="py-2 pr-3">Inicio</th>
                <th className="py-2 pr-3">Fin</th>
                <th className="py-2 pr-3">Estado</th>
                <th className="py-2 pr-3">Accion</th>
              </tr>
            </thead>
            <tbody>
              {rutas.map((r) => (
                <Fragment key={r.id}>
                  <tr className="border-b border-slate-100">
                    <td className="py-3 pr-3 font-mono text-slate-500">{r.id}</td>
                    <td className="py-3 pr-3 font-medium">
                      {r.patente}
                      {r.vehiculo_alias && (
                        <span className="text-slate-400"> ({r.vehiculo_alias})</span>
                      )}
                    </td>
                    <td className="py-3 pr-3">{r.conductor_nombre}</td>
                    <td className="py-3 pr-3 text-slate-500">{fmt(r.inicio)}</td>
                    <td className="py-3 pr-3 text-slate-500">{fmt(r.fin)}</td>
                    <td className="py-3 pr-3">
                      <Badge estado={r.estado} />
                    </td>
                    <td className="py-3 pr-3">
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          loading={cargandoDetalle && detalle?.id !== r.id}
                          onClick={() => verPedidos(r)}
                        >
                          {detalle?.id === r.id ? 'Ocultar' : 'Pedidos'}
                        </Button>
                        {r.estado === 'en_curso' && (
                          <Button variant="danger" onClick={() => cerrar(r)}>
                            Cerrar
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                  {detalle?.id === r.id && (
                    <tr className="border-b border-slate-100 bg-slate-50">
                      <td colSpan={7} className="px-4 py-3">
                        {detalle.pedidos.length === 0 ? (
                          <p className="text-slate-500">Esta ruta no tiene pedidos asignados.</p>
                        ) : (
                          <div>
                            <p className="mb-2 text-xs font-semibold uppercase text-slate-500">
                              Pedidos de la ruta ({detalle.pedidos.length})
                            </p>
                            <ul className="flex flex-col gap-1.5">
                              {detalle.pedidos.map((p) => (
                                <li key={p.id} className="flex flex-wrap items-center gap-3">
                                  <span className="font-mono text-xs text-slate-400">#{p.id}</span>
                                  <span className="font-medium">{p.direccion_destino}</span>
                                  <span className="text-slate-500">{p.cliente_nombre ?? '—'}</span>
                                  <Badge estado={p.estado} />
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
