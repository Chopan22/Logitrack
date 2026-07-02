// Paleta de marca de LogiTrack y tokens de espaciado reutilizables.

export const Brand = {
  primary: '#0a7ea4',
  primaryDark: '#075e7a',
  bg: '#f3f5f7',
  card: '#ffffff',
  text: '#11181c',
  textMuted: '#6b7280',
  border: '#e2e8f0',
  danger: '#dc2626',
  success: '#16a34a',
  warning: '#d97706',
  info: '#2563eb',
};

// Colores por estado de pedido.
export const EstadoColor: Record<string, string> = {
  pendiente: Brand.warning,
  en_camino: Brand.info,
  entregado: Brand.success,
  cancelado: Brand.danger,
};

export const EstadoLabel: Record<string, string> = {
  pendiente: 'Pendiente',
  en_camino: 'En camino',
  entregado: 'Entregado',
  cancelado: 'Cancelado',
};
