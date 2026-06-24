import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { api, setAuthToken } from './api';
import type { Usuario } from './types';

const TOKEN_KEY = 'logitrack.token';
const USER_KEY = 'logitrack.usuario';

interface AuthState {
  usuario: Usuario | null;
  token: string | null;
  cargando: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [cargando, setCargando] = useState(true);

  // Restaurar sesion guardada al iniciar la app.
  useEffect(() => {
    (async () => {
      try {
        const [t, u] = await Promise.all([
          AsyncStorage.getItem(TOKEN_KEY),
          AsyncStorage.getItem(USER_KEY),
        ]);
        if (t && u) {
          setToken(t);
          setAuthToken(t);
          setUsuario(JSON.parse(u));
        }
      } finally {
        setCargando(false);
      }
    })();
  }, []);

  async function login(email: string, password: string) {
    const res = await api.login(email, password);
    setToken(res.token);
    setUsuario(res.usuario);
    setAuthToken(res.token);
    await AsyncStorage.multiSet([
      [TOKEN_KEY, res.token],
      [USER_KEY, JSON.stringify(res.usuario)],
    ]);
  }

  async function logout() {
    setToken(null);
    setUsuario(null);
    setAuthToken(null);
    await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY]);
  }

  const value = useMemo(
    () => ({ usuario, token, cargando, login, logout }),
    [usuario, token, cargando]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  return ctx;
}
