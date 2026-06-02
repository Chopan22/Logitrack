'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';

type Modo = 'login' | 'registro';

const inputStyle = {
  width: '100%',
  padding: '0.625rem 0.75rem',
  border: '1px solid #DEDEDE',
  borderRadius: 8,
  fontSize: '0.9375rem',
  outline: 'none',
  boxSizing: 'border-box' as const,
  color: '#2D2D2D',
};

const labelStyle = {
  display: 'block' as const,
  fontSize: '0.875rem',
  fontWeight: 500,
  color: '#2D2D2D',
  marginBottom: 6,
};

export default function Login() {
  const [modo, setModo] = useState<Modo>('login');
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const resetForm = () => {
    setNombre('');
    setEmail('');
    setPassword('');
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (modo === 'login') {
        const data = await api.auth.login(email, password);
        if (data?.token) {
          login(data.token, data.usuario);
          router.push('/');
        } else {
          setError(data?.error || 'Credenciales inválidas');
        }
      } else {
        const data = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000'}/api/auth/registro`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ nombre, email, password, rol: 'admin' }),
        }).then(r => r.json());

        if (data?.id) {
          const loginData = await api.auth.login(email, password);
          if (loginData?.token) {
            login(loginData.token, loginData.usuario);
            router.push('/');
          }
        } else {
          setError(data?.error || 'Error al registrar usuario');
        }
      }
    } catch {
      setError('Error de conexión con el servidor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#F2F2F0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{
        background: '#fff',
        borderRadius: 12,
        padding: '2.5rem',
        width: '100%',
        maxWidth: 400,
        boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
        border: '1px solid #DEDEDE',
      }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: '#C8603F' }}>LogiTrack</div>
          <p style={{ color: '#6B6B6B', fontSize: '0.875rem', marginTop: 4 }}>Panel de administración</p>
        </div>

        <div style={{ display: 'flex', marginBottom: '1.5rem', background: '#F2F2F0', borderRadius: 8, padding: 4 }}>
          {(['login', 'registro'] as Modo[]).map(m => (
            <button key={m} onClick={() => { setModo(m); resetForm(); }} style={{
              flex: 1,
              padding: '0.5rem',
              borderRadius: 6,
              border: 'none',
              fontSize: '0.875rem',
              fontWeight: modo === m ? 600 : 400,
              background: modo === m ? '#fff' : 'transparent',
              color: modo === m ? '#C8603F' : '#6B6B6B',
              cursor: 'pointer',
              boxShadow: modo === m ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
            }}>
              {m === 'login' ? 'Ingresar' : 'Registrarse'}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit}>
          {modo === 'registro' && (
            <div style={{ marginBottom: '1rem' }}>
              <label style={labelStyle}>Nombre</label>
              <input type="text" value={nombre} onChange={e => setNombre(e.target.value)} required style={inputStyle} placeholder="Tu nombre" />
            </div>
          )}

          <div style={{ marginBottom: '1rem' }}>
            <label style={labelStyle}>Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required style={inputStyle} placeholder="admin@empresa.com" />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={labelStyle}>Contraseña</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required style={inputStyle} />
          </div>

          {error && (
            <p style={{ color: '#dc2626', fontSize: '0.875rem', marginBottom: '1rem', textAlign: 'center' }}>{error}</p>
          )}

          <button type="submit" disabled={loading} style={{
            width: '100%',
            padding: '0.75rem',
            background: loading ? '#e09070' : '#C8603F',
            color: 'white',
            border: 'none',
            borderRadius: 8,
            fontSize: '0.9375rem',
            fontWeight: 600,
            cursor: loading ? 'not-allowed' : 'pointer',
          }}>
            {loading ? '...' : modo === 'login' ? 'Ingresar' : 'Crear cuenta'}
          </button>
        </form>
      </div>
    </div>
  );
}
