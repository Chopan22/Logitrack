// Tipos compartidos que reflejan el modelo de datos del backend de LogiTrack.

export type Rol = 'admin' | 'repartidor';

export interface Usuario {
  id: number;
  nombre: string;
  email: string;
  rol: Rol;
}

export interface Vehiculo {
  id: number;
  patente: string;
  alias: string | null;
  tipo: string | null;
  activo: boolean;
}

export interface Conductor {
  id: number;
  nombre: string;
  telefono: string | null;
  activo: boolean;
}

export type EstadoRuta = 'en_curso' | 'completada';

export interface Ruta {
  id: number;
  estado: EstadoRuta;
  inicio: string;
  fin: string | null;
  patente?: string;
  vehiculo_alias?: string | null;
  conductor_nombre?: string;
  vehiculo_id?: number;
  conductor_id?: number;
}

export type EstadoPedido = 'pendiente' | 'en_camino' | 'entregado' | 'cancelado';

export interface Pedido {
  id: number;
  descripcion: string | null;
  direccion_destino: string;
  cliente_nombre: string | null;
  cliente_telefono: string | null;
  estado: EstadoPedido;
  ruta_id: number | null;
  creado_en: string;
  lat: number | null;
  lng: number | null;
}

export interface UbicacionPayload {
  ruta_id: number;
  lat: number;
  lng: number;
}
