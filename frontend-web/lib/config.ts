// URL base del backend de LogiTrack.
// Sobrescribe con NEXT_PUBLIC_API_URL en .env.local si tu backend no esta en localhost.
export const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';
