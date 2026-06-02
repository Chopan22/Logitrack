'use client';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function NavBar() {
  const { usuario, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const linkStyle = (path: string) => ({
    fontSize: '0.875rem',
    fontWeight: pathname === path ? 600 : 400,
    color: pathname === path ? '#C8603F' : '#6B6B6B',
    textDecoration: 'none',
  });

  return (
    <nav style={{
      background: '#fff',
      borderBottom: '1px solid #DEDEDE',
      padding: '0 1.5rem',
      height: 56,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      flexShrink: 0,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
        <span style={{ fontWeight: 700, fontSize: '1.125rem', color: '#C8603F' }}>
          LogiTrack
        </span>
        <div style={{ display: 'flex', gap: '1.5rem' }}>
          <Link href="/" style={linkStyle('/')}>Mapa</Link>
          <Link href="/flota" style={linkStyle('/flota')}>Flota</Link>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <span style={{ fontSize: '0.875rem', color: '#6B6B6B' }}>{usuario?.nombre}</span>
        <button onClick={handleLogout} style={{
          fontSize: '0.875rem',
          color: '#C8603F',
          background: 'none',
          border: '1px solid #C8603F',
          borderRadius: 6,
          padding: '0.25rem 0.75rem',
          cursor: 'pointer',
        }}>
          Salir
        </button>
      </div>
    </nav>
  );
}
