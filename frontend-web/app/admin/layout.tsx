'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Spinner } from '@/components/ui';
import { useAuth } from '@/lib/auth';

const NAV = [
  { href: '/admin', label: 'Resumen' },
  { href: '/admin/pedidos', label: 'Pedidos' },
  { href: '/admin/rutas', label: 'Rutas' },
  { href: '/admin/flota', label: 'Flota' },
  { href: '/admin/mapa', label: 'Mapa en vivo' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { usuario, cargando, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!cargando && !usuario) router.replace('/');
  }, [cargando, usuario, router]);

  if (cargando || !usuario) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="flex flex-1">
      <aside className="hidden w-60 shrink-0 flex-col border-r border-slate-200 bg-white p-4 md:flex">
        <div className="mb-6 px-2">
          <span className="text-xl font-extrabold text-sky-700">LogiTrack</span>
          <p className="text-xs text-slate-400">Admin</p>
        </div>
        <nav className="flex flex-col gap-1">
          {NAV.map((item) => {
            const activo =
              item.href === '/admin'
                ? pathname === '/admin'
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                  activo ? 'bg-sky-50 text-sky-700' : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto border-t border-slate-100 pt-4">
          <p className="px-2 text-sm font-medium text-slate-700">{usuario.nombre}</p>
          <p className="px-2 text-xs text-slate-400">{usuario.email}</p>
          <button
            onClick={() => {
              logout();
              router.replace('/');
            }}
            className="mt-2 w-full rounded-lg px-3 py-2 text-left text-sm font-semibold text-red-600 hover:bg-red-50"
          >
            Cerrar sesion
          </button>
        </div>
      </aside>

      {/* Nav superior en movil */}
      <div className="flex flex-1 flex-col">
        <header className="flex items-center gap-3 overflow-x-auto border-b border-slate-200 bg-white px-4 py-3 md:hidden">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="whitespace-nowrap text-sm font-medium text-slate-600"
            >
              {item.label}
            </Link>
          ))}
        </header>
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
