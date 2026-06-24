import { API_URL } from './config';
import type {
  Conductor,
  EstadoPedido,
  Pedido,
  Ruta,
  Tracking,
  Usuario,
  Vehiculo,
} from './types';

// Token JWT en memoria. El AuthContext lo sincroniza al iniciar/cerrar sesion.
let authToken: string | null = null;

export function setAuthToken(token: string | null) {
  authToken = token;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) ?? {}),
  };
  if (authToken) headers.Authorization = `Bearer ${authToken}`;

  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, { ...options, headers });
  } catch {
    throw new Error(
      `No se pudo conectar con el servidor (${API_URL}). Revisa que el backend este corriendo y que la IP en app.json sea correcta.`
    );
  }

  const text = await res.text();
  let data: any = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (!res.ok) {
    const msg = (data && data.error) || `Error ${res.status}`;
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

  registro: (nombre: string, email: string, password: string, rol = 'repartidor') =>
    request<Usuario>('/api/auth/registro', {
      method: 'POST',
      body: JSON.stringify({ nombre, email, password, rol }),
    }),

  // --- Vehiculos ---
  listVehiculos: () => request<Vehiculo[]>('/api/vehiculos'),

  // --- Conductores ---
  listConductores: () => request<Conductor[]>('/api/conductores'),

  // --- Rutas ---
  listRutas: (estado?: string) =>
    request<Ruta[]>(`/api/rutas${estado ? `?estado=${estado}` : ''}`),

  iniciarRuta: (vehiculo_id: number, conductor_id: number) =>
    request<Ruta>('/api/rutas', {
      method: 'POST',
      body: JSON.stringify({ vehiculo_id, conductor_id }),
    }),

  cerrarRuta: (id: number) =>
    request<Ruta>(`/api/rutas/${id}/cerrar`, { method: 'PATCH' }),

  // --- Pedidos (requieren JWT) ---
  listPedidos: (params: { estado?: string; ruta_id?: number } = {}) => {
    const qs = new URLSearchParams();
    if (params.estado) qs.set('estado', params.estado);
    if (params.ruta_id != null) qs.set('ruta_id', String(params.ruta_id));
    const q = qs.toString();
    return request<Pedido[]>(`/api/pedidos${q ? `?${q}` : ''}`);
  },

  asignarPedido: (id: number, ruta_id: number) =>
    request<Pedido>(`/api/pedidos/${id}/asignar`, {
      method: 'PATCH',
      body: JSON.stringify({ ruta_id }),
    }),

  // Publico (sin login): seguimiento del pedido por el cliente final.
  trackingPedido: (id: number) =>
    request<Tracking>(`/api/pedidos/${id}/tracking`),

  actualizarPedido: (id: number, cambios: { estado?: EstadoPedido }) =>
    request<Pedido>(`/api/pedidos/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(cambios),
    }),
};
