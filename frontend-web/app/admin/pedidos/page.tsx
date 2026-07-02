'use client';

import { useCallback, useEffect, useState } from 'react';
import { Badge, Button, Card, Field, Input, Select, Spinner } from '@/components/ui';
import { api } from '@/lib/api';
import type { Pedido, Ruta } from '@/lib/types';

export default function PedidosPage() {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [rutas, setRutas] = useState<Ruta[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Formulario de nuevo pedido.
  const [form, setForm] = useState({
    direccion_destino: '',
    descripcion: '',
    cliente_nombre: '',
    cliente_telefono: '',
  });
  const [creando, setCreando] = useState(false);

  // Seleccion de ruta por pedido para asignar.
  const [rutaSel, setRutaSel] = useState<Record<number, string>>({});

  // Filtros del listado.
  const [filtroEstado, setFiltroEstado] = useState('');
  const [busqueda, setBusqueda] = useState('');

  const cargar = useCallback(async () => {
    try {
      const [p, r] = await Promise.all([
        api.listPedidos({ estado: filtroEstado || undefined }),
        api.listRutas('en_curso'),
      ]);
      setPedidos(p);
      setRutas(r);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al cargar.');
    } finally {
      setCargando(false);
    }
  }, [filtroEstado]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  async function crear(e: React.FormEvent) {
    e.preventDefault();
    if (!form.direccion_destino.trim()) {
      setError('La direccion de destino es requerida.');
      return;
    }
    setCreando(true);
    setError(null);
    try {
      await api.crearPedido({
        direccion_destino: form.direccion_destino.trim(),
        descripcion: form.descripcion.trim() || undefined,
        cliente_nombre: form.cliente_nombre.trim() || undefined,
        cliente_telefono: form.cliente_telefono.trim() || undefined,
      });
      setForm({ direccion_destino: '', descripcion: '', cliente_nombre: '', cliente_telefono: '' });
      await cargar();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo crear el pedido.');
    } finally {
      setCreando(false);
    }
  }

  async function asignar(pedido: Pedido) {
    const rid = Number(rutaSel[pedido.id]);
    if (!rid) {
      setError('Selecciona una ruta para asignar.');
      return;
    }
    try {
      await api.asignarPedido(pedido.id, rid);
      await cargar();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo asignar.');
    }
  }

  async function cambiarEstado(pedido: Pedido, estado: 'entregado' | 'cancelado') {
    try {
      await api.actualizarPedido(pedido.id, { estado });
      await cargar();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo actualizar.');
    }
  }

  // Busqueda en memoria sobre lo ya filtrado por estado en el backend.
  const texto = busqueda.trim().toLowerCase();
  const pedidosFiltrados = texto
    ? pedidos.filter(
        (p) =>
          p.direccion_destino.toLowerCase().includes(texto) ||
          (p.cliente_nombre ?? '').toLowerCase().includes(texto) ||
          (p.descripcion ?? '').toLowerCase().includes(texto)
      )
    : pedidos;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">Pedidos</h1>

      <Card>
        <h2 className="mb-4 text-lg font-semibold">Nuevo pedido</h2>
        <form onSubmit={crear} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Direccion de destino *">
            <Input
              value={form.direccion_destino}
              onChange={(e) => setForm({ ...form, direccion_destino: e.target.value })}
              placeholder="Hector Fuenzalida 1580, Maipu, Santiago"
            />
          </Field>
          <Field label="Descripcion">
            <Input
              value={form.descripcion}
              onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
              placeholder="Caja mediana"
            />
          </Field>
          <Field label="Cliente">
            <Input
              value={form.cliente_nombre}
              onChange={(e) => setForm({ ...form, cliente_nombre: e.target.value })}
              placeholder="Nombre del cliente"
            />
          </Field>
          <Field label="Telefono">
            <Input
              value={form.cliente_telefono}
              onChange={(e) => setForm({ ...form, cliente_telefono: e.target.value })}
              placeholder="+56 9 1234 5678"
            />
          </Field>
          <div className="sm:col-span-2">
            <Button type="submit" loading={creando}>
              Crear pedido
            </Button>
            <p className="mt-2 text-xs text-slate-400">
              Las coordenadas se obtienen automaticamente desde la direccion (geocodificacion).
            </p>
          </div>
        </form>
      </Card>

      {error && <p className="font-medium text-red-600">{error}</p>}

      <Card className="overflow-x-auto">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <h2 className="text-lg font-semibold">Listado ({pedidosFiltrados.length})</h2>
          <div className="flex flex-wrap items-end gap-3">
            <Field label="Buscar">
              <Input
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Direccion, cliente..."
                className="w-52"
              />
            </Field>
            <Field label="Estado">
              <Select
                value={filtroEstado}
                onChange={(e) => setFiltroEstado(e.target.value)}
                className="w-40"
              >
                <option value="">Todos</option>
                <option value="pendiente">Pendiente</option>
                <option value="en_camino">En camino</option>
                <option value="entregado">Entregado</option>
                <option value="cancelado">Cancelado</option>
              </Select>
            </Field>
          </div>
        </div>
        {cargando ? (
          <Spinner />
        ) : pedidosFiltrados.length === 0 ? (
          <p className="text-slate-500">No hay pedidos que coincidan con el filtro.</p>
        ) : (
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-slate-500">
                <th className="py-2 pr-3">#</th>
                <th className="py-2 pr-3">Destino</th>
                <th className="py-2 pr-3">Cliente</th>
                <th className="py-2 pr-3">Estado</th>
                <th className="py-2 pr-3">Coords</th>
                <th className="py-2 pr-3">Accion</th>
              </tr>
            </thead>
            <tbody>
              {pedidosFiltrados.map((p) => (
                <tr key={p.id} className="border-b border-slate-100 align-top">
                  <td className="py-3 pr-3 font-mono text-slate-500">{p.id}</td>
                  <td className="py-3 pr-3">
                    <p className="font-medium">{p.direccion_destino}</p>
                    {p.descripcion && <p className="text-xs text-slate-400">{p.descripcion}</p>}
                  </td>
                  <td className="py-3 pr-3">{p.cliente_nombre ?? '—'}</td>
                  <td className="py-3 pr-3">
                    <Badge estado={p.estado} />
                    {p.ruta_id && <p className="mt-1 text-xs text-slate-400">Ruta #{p.ruta_id}</p>}
                  </td>
                  <td className="py-3 pr-3 text-xs text-slate-500">
                    {p.lat != null && p.lng != null
                      ? `${p.lat.toFixed(4)}, ${p.lng.toFixed(4)}`
                      : '— sin geo'}
                  </td>
                  <td className="py-3 pr-3">
                    {p.estado === 'pendiente' && (
                      <div className="flex items-center gap-2">
                        <Select
                          value={rutaSel[p.id] ?? ''}
                          onChange={(e) => setRutaSel({ ...rutaSel, [p.id]: e.target.value })}
                          className="w-40"
                        >
                          <option value="">Ruta...</option>
                          {rutas.map((r) => (
                            <option key={r.id} value={r.id}>
                              #{r.id} {r.patente}
                            </option>
                          ))}
                        </Select>
                        <Button variant="outline" onClick={() => asignar(p)}>
                          Asignar
                        </Button>
                      </div>
                    )}
                    {p.estado === 'en_camino' && (
                      <div className="flex gap-2">
                        <Button variant="success" onClick={() => cambiarEstado(p, 'entregado')}>
                          Entregado
                        </Button>
                        <Button variant="danger" onClick={() => cambiarEstado(p, 'cancelado')}>
                          Cancelar
                        </Button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
