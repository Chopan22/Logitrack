import { API_URL } from './config';
import type {
  Conductor,
  EstadoPedido,
  Pedido,
  PuntoRecorrido,
  Ruta,
  Usuario,
  Vehiculo,
} from './types';

export const TOKEN_KEY = 'logitrack.token';
export const USER_KEY = 'logitrack.usuario';

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) ?? {}),
  };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, { ...options, headers });
  } catch {
    throw new Error(
      `No se pudo conectar con el servidor (${API_URL}). Revisa que el backend este corriendo.`
    );
  }

  const text = await res.text();
  let data: unknown = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (!res.ok) {
    const msg =
      (data && typeof data === 'object' && 'error' in data
        ? (data as { error: string }).error
        : null) ?? `Error ${res.status}`;
    throw new Error(msg);
  }
  return data as T;
}

export interface LoginResponse {
  token: string;
  usuario: Usuario;
}

export const api = {
  // --- Auth ---
  login: (email: string, password: string) =>
    request<LoginResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  // --- Vehiculos ---
  listVehiculos: () => request<Vehiculo[]>('/api/vehiculos'),
  crearVehiculo: (data: { patente: string; alias?: string; tipo?: string }) =>
    request<Vehiculo>('/api/vehiculos', { method: 'POST', body: JSON.stringify(data) }),
  actualizarVehiculo: (
    id: number,
    data: { alias?: string; tipo?: string; activo?: boolean }
  ) => request<Vehiculo>(`/api/vehiculos/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  eliminarVehiculo: (id: number) =>
    request<{ mensaje: string; vehiculo: Vehiculo }>(`/api/vehiculos/${id}`, { method: 'DELETE' }),

  // --- Conductores ---
  listConductores: () => request<Conductor[]>('/api/conductores'),
  crearConductor: (data: { nombre: string; telefono?: string }) =>
    request<Conductor>('/api/conductores', { method: 'POST', body: JSON.stringify(data) }),
  actualizarConductor: (
    id: number,
    data: { nombre?: string; telefono?: string; activo?: boolean }
  ) => request<Conductor>(`/api/conductores/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  eliminarConductor: (id: number) =>
    request<{ mensaje: string; conductor: Conductor }>(`/api/conductores/${id}`, { method: 'DELETE' }),

  // --- Rutas ---
  listRutas: (estado?: string) =>
    request<Ruta[]>(`/api/rutas${estado ? `?estado=${estado}` : ''}`),
  iniciarRuta: (vehiculo_id: number, conductor_id: number) =>
    request<Ruta>('/api/rutas', { method: 'POST', body: JSON.stringify({ vehiculo_id, conductor_id }) }),
  cerrarRuta: (id: number) => request<Ruta>(`/api/rutas/${id}/cerrar`, { method: 'PATCH' }),
  listUbicacionesRuta: (id: number) =>
    request<PuntoRecorrido[]>(`/api/rutas/${id}/ubicaciones`),

  // --- Pedidos (requieren JWT) ---
  listPedidos: (params: { estado?: string; ruta_id?: number } = {}) => {
    const qs = new URLSearchParams();
    if (params.estado) qs.set('estado', params.estado);
    if (params.ruta_id != null) qs.set('ruta_id', String(params.ruta_id));
    const q = qs.toString();
    return request<Pedido[]>(`/api/pedidos${q ? `?${q}` : ''}`);
  },
  crearPedido: (data: {
    descripcion?: string;
    direccion_destino: string;
    cliente_nombre?: string;
    cliente_telefono?: string;
    lat?: number;
    lng?: number;
  }) => request<Pedido>('/api/pedidos', { method: 'POST', body: JSON.stringify(data) }),
  actualizarPedido: (id: number, data: { estado?: EstadoPedido }) =>
    request<Pedido>(`/api/pedidos/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  asignarPedido: (id: number, ruta_id: number) =>
    request<Pedido>(`/api/pedidos/${id}/asignar`, { method: 'PATCH', body: JSON.stringify({ ruta_id }) }),
  confirmarEntrega: (id: number) =>
    request<Pedido>(`/api/pedidos/${id}/confirmar-entrega`, { method: 'PATCH' }),
};
