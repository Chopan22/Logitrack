'use client';

import type {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
} from 'react';

type Variant = 'primary' | 'danger' | 'success' | 'outline';

const variantClasses: Record<Variant, string> = {
  primary: 'bg-sky-700 hover:bg-sky-800 text-white border-transparent',
  danger: 'bg-red-600 hover:bg-red-700 text-white border-transparent',
  success: 'bg-green-600 hover:bg-green-700 text-white border-transparent',
  outline: 'bg-white hover:bg-slate-50 text-sky-700 border-sky-600',
};

export function Button({
  children,
  variant = 'primary',
  loading,
  className = '',
  disabled,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; loading?: boolean }) {
  return (
    <button
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed ${variantClasses[variant]} ${className}`}
      {...rest}
    >
      {loading && (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      )}
      {children}
    </button>
  );
}

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-sky-600 focus:ring-1 focus:ring-sky-600 ${props.className ?? ''}`}
    />
  );
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={`w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-sky-600 focus:ring-1 focus:ring-sky-600 ${props.className ?? ''}`}
    />
  );
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-sm font-medium text-slate-600">{label}</span>
      {children}
    </label>
  );
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-xl border border-slate-200 bg-white p-5 shadow-sm ${className}`}>
      {children}
    </div>
  );
}

const estadoClasses: Record<string, string> = {
  pendiente: 'bg-amber-100 text-amber-700',
  en_camino: 'bg-blue-100 text-blue-700',
  entregado: 'bg-green-100 text-green-700',
  cancelado: 'bg-red-100 text-red-700',
  en_curso: 'bg-blue-100 text-blue-700',
  completada: 'bg-slate-200 text-slate-600',
};

const estadoLabel: Record<string, string> = {
  pendiente: 'Pendiente',
  en_camino: 'En camino',
  entregado: 'Entregado',
  cancelado: 'Cancelado',
  en_curso: 'En curso',
  completada: 'Completada',
};

export function Badge({ estado }: { estado: string }) {
  return (
    <span
      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${estadoClasses[estado] ?? 'bg-slate-100 text-slate-600'}`}
    >
      {estadoLabel[estado] ?? estado}
    </span>
  );
}

export function Spinner() {
  return (
    <div className="flex items-center justify-center p-8">
      <span className="h-8 w-8 animate-spin rounded-full border-4 border-sky-600 border-t-transparent" />
    </div>
  );
}
