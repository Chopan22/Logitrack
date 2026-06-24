'use client';

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { api, TOKEN_KEY, USER_KEY } from './api';
import type { Usuario } from './types';

interface AuthState {
  usuario: Usuario | null;
  cargando: boolean;
  login: (email: string, password: string) => Promise<Usuario>;
  logout: () => void;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    try {
      const u = localStorage.getItem(USER_KEY);
      const t = localStorage.getItem(TOKEN_KEY);
      if (u && t) setUsuario(JSON.parse(u));
    } finally {
      setCargando(false);
    }
  }, []);

  async function login(email: string, password: string) {
    const res = await api.login(email, password);
    localStorage.setItem(TOKEN_KEY, res.token);
    localStorage.setItem(USER_KEY, JSON.stringify(res.usuario));
    setUsuario(res.usuario);
    return res.usuario;
  }

  function logout() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setUsuario(null);
  }

  const value = useMemo(
    () => ({ usuario, cargando, login, logout }),
    [usuario, cargando]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  return ctx;
}
