'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Button, Card, Field, Input } from '@/components/ui';
import { useAuth } from '@/lib/auth';

export default function LoginPage() {
  const { usuario, cargando, login } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!cargando && usuario) router.replace('/admin');
  }, [cargando, usuario, router]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password) {
      setError('Ingresa email y contrasena.');
      return;
    }
    setError(null);
    setEnviando(true);
    try {
      await login(email.trim().toLowerCase(), password);
      router.replace('/admin');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo iniciar sesion.');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <main className="flex flex-1 items-center justify-center p-6">
      <Card className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-extrabold text-sky-700">LogiTrack</h1>
          <p className="mt-1 text-sm font-medium text-slate-500">Panel de Administracion</p>
        </div>

        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <Field label="Email">
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@logitrack.cl"
              autoComplete="email"
            />
          </Field>
          <Field label="Contrasena">
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="********"
              autoComplete="current-password"
            />
          </Field>

          {error && <p className="text-sm font-medium text-red-600">{error}</p>}

          <Button type="submit" loading={enviando} className="mt-1 w-full">
            Iniciar sesion
          </Button>
        </form>
      </Card>
    </main>
  );
}
