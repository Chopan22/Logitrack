'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import NavBar from '@/components/NavBar';
import { api } from '@/lib/api';

type Tab = 'vehiculos' | 'conductores' | 'rutas' | 'pedidos';

const inputStyle = {
  width: '100%',
  padding: '0.5rem 0.75rem',
  border: '1px solid #DEDEDE',
  borderRadius: 8,
  fontSize: '0.875rem',
  outline: 'none',
  boxSizing: 'border-box' as const,
  color: '#2D2D2D',
};

const labelStyle = {
  display: 'block' as const,
  fontSize: '0.8125rem',
  fontWeight: 500,
  color: '#2D2D2D',
  marginBottom: 4,
};

const btnPrimary = {
  padding: '0.5rem 1.25rem',
  background: '#C8603F',
  color: 'white',
  border: 'none',
  borderRadius: 8,
  fontSize: '0.875rem',
  fontWeight: 600,
  cursor: 'pointer',
};

const btnDanger = {
  padding: '0.25rem 0.75rem',
  background: 'none',
  color: '#dc2626',
  border: '1px solid #dc2626',
  borderRadius: 6,
  fontSize: '0.8125rem',
  cursor: 'pointer',
};

const card = {
  background: '#fff',
  borderRadius: 12,
  border: '1px solid #DEDEDE',
  padding: '1.5rem',
  marginBottom: '1.5rem',
};

export default function Flota() {
  const { token } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('vehiculos');

  const [vehiculos, setVehiculos] = useState<any[]>([]);
  const [conductores, setConductores] = useState<any[]>([]);
  const [rutas, setRutas] = useState<any[]>([]);
  const [pedidos, setPedidos] = useState<any[]>([]);

  const [formVehiculo, setFormVehiculo] = useState({ patente: '', alias: '', tipo: '' });
  const [formConductor, setFormConductor] = useState({ nombre: '', telefono: '' });
  const [formRuta, setFormRuta] = useState({ vehiculo_id: '', conductor_id: '' });
  const [formPedido, setFormPedido] = useState({ descripcion: '', direccion_destino: '', cliente_nombre: '', cliente_telefono: '' });
  const [formAsignar, setFormAsignar] = useState({ pedido_id: '', ruta_id: '' });
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) { router.push('/login'); return; }
    cargarTodo();
  }, [token, router]);

  const cargarTodo = async () => {
    const [v, c, r, p] = await Promise.all([
      api.vehiculos.listar(),
      api.conductores.listar(),
      api.rutas.listar(),
      api.pedidos.listar(),
    ]);
    if (v) setVehiculos(v);
    if (c) setConductores(c);
    if (r) setRutas(r);
    if (p) setPedidos(p);
  };

  const handleCrearVehiculo = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const data = await api.vehiculos.crear(formVehiculo);
    if (data?.id) {
      setFormVehiculo({ patente: '', alias: '', tipo: '' });
      cargarTodo();
    } else {
      setError(data?.error || 'Error al crear vehículo');
    }
  };

  const handleCrearConductor = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const data = await api.conductores.crear(formConductor);
    if (data?.id) {
      setFormConductor({ nombre: '', telefono: '' });
      cargarTodo();
    } else {
      setError(data?.error || 'Error al crear conductor');
    }
  };

  const handleIniciarRuta = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const data = await api.rutas.iniciar({
      vehiculo_id: Number(formRuta.vehiculo_id),
      conductor_id: Number(formRuta.conductor_id),
    });
    if (data?.id) {
      setFormRuta({ vehiculo_id: '', conductor_id: '' });
      cargarTodo();
    } else {
      setError(data?.error || 'Error al iniciar ruta');
    }
  };

  const handleCerrarRuta = async (id: number) => {
    setError('');
    const data = await api.rutas.cerrar(id);
    if (data?.id) cargarTodo();
    else setError(data?.error || 'Error al cerrar ruta');
  };

  const handleCrearPedido = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const data = await api.pedidos.crear(formPedido);
    if (data?.id) {
      setFormPedido({ descripcion: '', direccion_destino: '', cliente_nombre: '', cliente_telefono: '' });
      cargarTodo();
    } else {
      setError(data?.error || 'Error al crear pedido');
    }
  };

  const handleAsignarPedido = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const data = await api.pedidos.asignar(Number(formAsignar.pedido_id), Number(formAsignar.ruta_id));
    if (data?.id) {
      setFormAsignar({ pedido_id: '', ruta_id: '' });
      cargarTodo();
    } else {
      setError(data?.error || 'Error al asignar pedido');
    }
  };

  const estadoBadge = (estado: string) => {
    const colores: Record<string, string> = {
      en_curso: '#C8603F',
      completada: '#16a34a',
      cancelada: '#6B6B6B',
      pendiente: '#ca8a04',
      en_camino: '#2563eb',
      entregado: '#16a34a',
    };
    return (
      <span style={{ fontSize: '0.75rem', background: colores[estado] || '#6B6B6B', color: 'white', padding: '0.125rem 0.5rem', borderRadius: 9999 }}>
        {estado.replace('_', ' ')}
      </span>
    );
  };

  if (!token) return null;

  const tabs: { key: Tab; label: string }[] = [
    { key: 'vehiculos', label: 'Vehículos' },
    { key: 'conductores', label: 'Conductores' },
    { key: 'rutas', label: 'Rutas' },
    { key: 'pedidos', label: 'Pedidos' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <NavBar />
      <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', maxWidth: 900, margin: '0 auto', width: '100%' }}>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '1.5rem', background: '#fff', borderRadius: 10, padding: '0.25rem', border: '1px solid #DEDEDE', width: 'fit-content' }}>
          {tabs.map(t => (
            <button key={t.key} onClick={() => { setTab(t.key); setError(''); }} style={{
              padding: '0.5rem 1.25rem',
              borderRadius: 8,
              border: 'none',
              fontSize: '0.875rem',
              fontWeight: tab === t.key ? 600 : 400,
              background: tab === t.key ? '#C8603F' : 'transparent',
              color: tab === t.key ? 'white' : '#6B6B6B',
              cursor: 'pointer',
            }}>
              {t.label}
            </button>
          ))}
        </div>

        {error && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '0.75rem 1rem', marginBottom: '1rem', color: '#dc2626', fontSize: '0.875rem' }}>
            {error}
          </div>
        )}

        {/* VEHÍCULOS */}
        {tab === 'vehiculos' && (
          <>
            <div style={card}>
              <h2 style={{ fontWeight: 600, color: '#2D2D2D', marginBottom: '1rem' }}>Registrar vehículo</h2>
              <form onSubmit={handleCrearVehiculo} style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: 140 }}>
                  <label style={labelStyle}>Patente *</label>
                  <input style={inputStyle} value={formVehiculo.patente} onChange={e => setFormVehiculo(p => ({ ...p, patente: e.target.value }))} required placeholder="ABCD12" />
                </div>
                <div style={{ flex: 1, minWidth: 140 }}>
                  <label style={labelStyle}>Alias</label>
                  <input style={inputStyle} value={formVehiculo.alias} onChange={e => setFormVehiculo(p => ({ ...p, alias: e.target.value }))} placeholder="Camión Norte" />
                </div>
                <div style={{ flex: 1, minWidth: 140 }}>
                  <label style={labelStyle}>Tipo</label>
                  <select style={inputStyle} value={formVehiculo.tipo} onChange={e => setFormVehiculo(p => ({ ...p, tipo: e.target.value }))}>
                    <option value="">Seleccionar</option>
                    <option value="camion">Camión</option>
                    <option value="van">Van</option>
                    <option value="moto">Moto</option>
                  </select>
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                  <button type="submit" style={btnPrimary}>Agregar</button>
                </div>
              </form>
            </div>

            <div style={card}>
              <h2 style={{ fontWeight: 600, color: '#2D2D2D', marginBottom: '1rem' }}>Flota ({vehiculos.length})</h2>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #DEDEDE' }}>
                    {['Patente', 'Alias', 'Tipo', 'Estado'].map(h => (
                      <th key={h} style={{ textAlign: 'left', padding: '0.5rem 0.75rem', color: '#6B6B6B', fontWeight: 600 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {vehiculos.map(v => (
                    <tr key={v.id} style={{ borderBottom: '1px solid #F0F0F0' }}>
                      <td style={{ padding: '0.625rem 0.75rem', fontWeight: 600 }}>{v.patente}</td>
                      <td style={{ padding: '0.625rem 0.75rem', color: '#6B6B6B' }}>{v.alias || '—'}</td>
                      <td style={{ padding: '0.625rem 0.75rem', color: '#6B6B6B' }}>{v.tipo || '—'}</td>
                      <td style={{ padding: '0.625rem 0.75rem' }}>{estadoBadge(v.activo ? 'en_curso' : 'cancelada')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* CONDUCTORES */}
        {tab === 'conductores' && (
          <>
            <div style={card}>
              <h2 style={{ fontWeight: 600, color: '#2D2D2D', marginBottom: '1rem' }}>Registrar conductor</h2>
              <form onSubmit={handleCrearConductor} style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: 180 }}>
                  <label style={labelStyle}>Nombre *</label>
                  <input style={inputStyle} value={formConductor.nombre} onChange={e => setFormConductor(p => ({ ...p, nombre: e.target.value }))} required placeholder="Juan Pérez" />
                </div>
                <div style={{ flex: 1, minWidth: 160 }}>
                  <label style={labelStyle}>Teléfono</label>
                  <input style={inputStyle} value={formConductor.telefono} onChange={e => setFormConductor(p => ({ ...p, telefono: e.target.value }))} placeholder="+56912345678" />
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                  <button type="submit" style={btnPrimary}>Agregar</button>
                </div>
              </form>
            </div>

            <div style={card}>
              <h2 style={{ fontWeight: 600, color: '#2D2D2D', marginBottom: '1rem' }}>Conductores ({conductores.length})</h2>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #DEDEDE' }}>
                    {['Nombre', 'Teléfono', 'Estado'].map(h => (
                      <th key={h} style={{ textAlign: 'left', padding: '0.5rem 0.75rem', color: '#6B6B6B', fontWeight: 600 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {conductores.map(c => (
                    <tr key={c.id} style={{ borderBottom: '1px solid #F0F0F0' }}>
                      <td style={{ padding: '0.625rem 0.75rem', fontWeight: 600 }}>{c.nombre}</td>
                      <td style={{ padding: '0.625rem 0.75rem', color: '#6B6B6B' }}>{c.telefono || '—'}</td>
                      <td style={{ padding: '0.625rem 0.75rem' }}>{estadoBadge(c.activo ? 'en_curso' : 'cancelada')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* RUTAS */}
        {tab === 'rutas' && (
          <>
            <div style={card}>
              <h2 style={{ fontWeight: 600, color: '#2D2D2D', marginBottom: '1rem' }}>Iniciar ruta</h2>
              <form onSubmit={handleIniciarRuta} style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: 180 }}>
                  <label style={labelStyle}>Vehículo *</label>
                  <select style={inputStyle} value={formRuta.vehiculo_id} onChange={e => setFormRuta(p => ({ ...p, vehiculo_id: e.target.value }))} required>
                    <option value="">Seleccionar</option>
                    {vehiculos.filter(v => v.activo).map(v => (
                      <option key={v.id} value={v.id}>{v.patente}{v.alias ? ` — ${v.alias}` : ''}</option>
                    ))}
                  </select>
                </div>
                <div style={{ flex: 1, minWidth: 180 }}>
                  <label style={labelStyle}>Conductor *</label>
                  <select style={inputStyle} value={formRuta.conductor_id} onChange={e => setFormRuta(p => ({ ...p, conductor_id: e.target.value }))} required>
                    <option value="">Seleccionar</option>
                    {conductores.filter(c => c.activo).map(c => (
                      <option key={c.id} value={c.id}>{c.nombre}</option>
                    ))}
                  </select>
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                  <button type="submit" style={btnPrimary}>Iniciar</button>
                </div>
              </form>
            </div>

            <div style={card}>
              <h2 style={{ fontWeight: 600, color: '#2D2D2D', marginBottom: '1rem' }}>Historial de rutas ({rutas.length})</h2>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #DEDEDE' }}>
                    {['Vehículo', 'Conductor', 'Inicio', 'Estado', ''].map(h => (
                      <th key={h} style={{ textAlign: 'left', padding: '0.5rem 0.75rem', color: '#6B6B6B', fontWeight: 600 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rutas.map(r => (
                    <tr key={r.id} style={{ borderBottom: '1px solid #F0F0F0' }}>
                      <td style={{ padding: '0.625rem 0.75rem', fontWeight: 600 }}>{r.patente}</td>
                      <td style={{ padding: '0.625rem 0.75rem', color: '#6B6B6B' }}>{r.conductor_nombre}</td>
                      <td style={{ padding: '0.625rem 0.75rem', color: '#6B6B6B' }}>{new Date(r.inicio).toLocaleString('es-CL')}</td>
                      <td style={{ padding: '0.625rem 0.75rem' }}>{estadoBadge(r.estado)}</td>
                      <td style={{ padding: '0.625rem 0.75rem' }}>
                        {r.estado === 'en_curso' && (
                          <button style={btnDanger} onClick={() => handleCerrarRuta(r.id)}>Cerrar</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* PEDIDOS */}
        {tab === 'pedidos' && (
          <>
            <div style={card}>
              <h2 style={{ fontWeight: 600, color: '#2D2D2D', marginBottom: '1rem' }}>Crear pedido</h2>
              <form onSubmit={handleCrearPedido} style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                <div style={{ flex: 2, minWidth: 200 }}>
                  <label style={labelStyle}>Dirección de entrega *</label>
                  <input style={inputStyle} value={formPedido.direccion_destino} onChange={e => setFormPedido(p => ({ ...p, direccion_destino: e.target.value }))} required placeholder="Av. Providencia 1234, Santiago" />
                </div>
                <div style={{ flex: 1, minWidth: 160 }}>
                  <label style={labelStyle}>Descripción</label>
                  <input style={inputStyle} value={formPedido.descripcion} onChange={e => setFormPedido(p => ({ ...p, descripcion: e.target.value }))} placeholder="Caja electrónica" />
                </div>
                <div style={{ flex: 1, minWidth: 160 }}>
                  <label style={labelStyle}>Cliente</label>
                  <input style={inputStyle} value={formPedido.cliente_nombre} onChange={e => setFormPedido(p => ({ ...p, cliente_nombre: e.target.value }))} placeholder="Juan Pérez" />
                </div>
                <div style={{ flex: 1, minWidth: 140 }}>
                  <label style={labelStyle}>Teléfono cliente</label>
                  <input style={inputStyle} value={formPedido.cliente_telefono} onChange={e => setFormPedido(p => ({ ...p, cliente_telefono: e.target.value }))} placeholder="+56912345678" />
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                  <button type="submit" style={btnPrimary}>Crear</button>
                </div>
              </form>
            </div>

            <div style={card}>
              <h2 style={{ fontWeight: 600, color: '#2D2D2D', marginBottom: '0.75rem' }}>Asignar pedido a ruta</h2>
              <form onSubmit={handleAsignarPedido} style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: 180 }}>
                  <label style={labelStyle}>Pedido *</label>
                  <select style={inputStyle} value={formAsignar.pedido_id} onChange={e => setFormAsignar(p => ({ ...p, pedido_id: e.target.value }))} required>
                    <option value="">Seleccionar</option>
                    {pedidos.filter(p => p.estado === 'pendiente').map(p => (
                      <option key={p.id} value={p.id}>#{p.id} — {p.direccion_destino}</option>
                    ))}
                  </select>
                </div>
                <div style={{ flex: 1, minWidth: 180 }}>
                  <label style={labelStyle}>Ruta activa *</label>
                  <select style={inputStyle} value={formAsignar.ruta_id} onChange={e => setFormAsignar(p => ({ ...p, ruta_id: e.target.value }))} required>
                    <option value="">Seleccionar</option>
                    {rutas.filter(r => r.estado === 'en_curso').map(r => (
                      <option key={r.id} value={r.id}>{r.patente} — {r.conductor_nombre}</option>
                    ))}
                  </select>
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                  <button type="submit" style={btnPrimary}>Asignar</button>
                </div>
              </form>
            </div>

            <div style={card}>
              <h2 style={{ fontWeight: 600, color: '#2D2D2D', marginBottom: '1rem' }}>Pedidos ({pedidos.length})</h2>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #DEDEDE' }}>
                    {['Dirección', 'Cliente', 'Descripción', 'Estado'].map(h => (
                      <th key={h} style={{ textAlign: 'left', padding: '0.5rem 0.75rem', color: '#6B6B6B', fontWeight: 600 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {pedidos.map(p => (
                    <tr key={p.id} style={{ borderBottom: '1px solid #F0F0F0' }}>
                      <td style={{ padding: '0.625rem 0.75rem', fontWeight: 500 }}>{p.direccion_destino}</td>
                      <td style={{ padding: '0.625rem 0.75rem', color: '#6B6B6B' }}>{p.cliente_nombre || '—'}</td>
                      <td style={{ padding: '0.625rem 0.75rem', color: '#6B6B6B' }}>{p.descripcion || '—'}</td>
                      <td style={{ padding: '0.625rem 0.75rem' }}>{estadoBadge(p.estado)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
