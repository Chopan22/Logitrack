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
  // Campos agregados por el JOIN en GET /api/rutas
  patente?: string;
  vehiculo_alias?: string | null;
  conductor_nombre?: string;
  // Campos al crear con POST /api/rutas
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
  // Coordenadas del destino (las entrega el backend con ST_Y / ST_X).
  lat: number | null;
  lng: number | null;
}

// Payload del socket de ubicaciones en tiempo real.
export interface UbicacionPayload {
  ruta_id: number;
  lat: number;
  lng: number;
}

// Respuesta del endpoint publico de seguimiento (vista del cliente).
export interface Tracking {
  pedido: {
    id: number;
    descripcion: string | null;
    direccion_destino: string;
    estado: EstadoPedido;
    ruta_id: number | null;
    cliente_nombre: string | null;
    lat: number | null;
    lng: number | null;
  };
  ubicacion: { lat: number; lng: number; fecha_hora: string } | null;
}
