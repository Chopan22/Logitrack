'use client';

import { useCallback, useEffect, useState } from 'react';
import { Button, Card, Field, Input, Spinner } from '@/components/ui';
import { api } from '@/lib/api';
import type { Conductor, Vehiculo } from '@/lib/types';

export default function FlotaPage() {
  const [vehiculos, setVehiculos] = useState<Vehiculo[]>([]);
  const [conductores, setConductores] = useState<Conductor[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [vForm, setVForm] = useState({ patente: '', alias: '', tipo: '' });
  const [cForm, setCForm] = useState({ nombre: '', telefono: '' });
  const [savingV, setSavingV] = useState(false);
  const [savingC, setSavingC] = useState(false);

  const cargar = useCallback(async () => {
    try {
      const [v, c] = await Promise.all([api.listVehiculos(), api.listConductores()]);
      setVehiculos(v);
      setConductores(c);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al cargar.');
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  async function crearVehiculo(e: React.FormEvent) {
    e.preventDefault();
    if (!vForm.patente.trim()) {
      setError('La patente es requerida.');
      return;
    }
    setSavingV(true);
    setError(null);
    try {
      await api.crearVehiculo({
        patente: vForm.patente.trim(),
        alias: vForm.alias.trim() || undefined,
        tipo: vForm.tipo.trim() || undefined,
      });
      setVForm({ patente: '', alias: '', tipo: '' });
      await cargar();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo crear el vehiculo.');
    } finally {
      setSavingV(false);
    }
  }

  async function crearConductor(e: React.FormEvent) {
    e.preventDefault();
    if (!cForm.nombre.trim()) {
      setError('El nombre es requerido.');
      return;
    }
    setSavingC(true);
    setError(null);
    try {
      await api.crearConductor({
        nombre: cForm.nombre.trim(),
        telefono: cForm.telefono.trim() || undefined,
      });
      setCForm({ nombre: '', telefono: '' });
      await cargar();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo crear el conductor.');
    } finally {
      setSavingC(false);
    }
  }

  async function toggleVehiculo(v: Vehiculo) {
    try {
      await api.actualizarVehiculo(v.id, { activo: !v.activo });
      await cargar();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error.');
    }
  }

  async function toggleConductor(c: Conductor) {
    try {
      await api.actualizarConductor(c.id, { activo: !c.activo });
      await cargar();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error.');
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">Flota</h1>
      {error && <p className="font-medium text-red-600">{error}</p>}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Vehiculos */}
        <Card>
          <h2 className="mb-4 text-lg font-semibold">Vehiculos</h2>
          <form onSubmit={crearVehiculo} className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Field label="Patente *">
              <Input
                value={vForm.patente}
                onChange={(e) => setVForm({ ...vForm, patente: e.target.value })}
                placeholder="GHJK12"
              />
            </Field>
            <Field label="Alias">
              <Input
                value={vForm.alias}
                onChange={(e) => setVForm({ ...vForm, alias: e.target.value })}
                placeholder="Moto 1"
              />
            </Field>
            <Field label="Tipo">
              <Input
                value={vForm.tipo}
                onChange={(e) => setVForm({ ...vForm, tipo: e.target.value })}
                placeholder="moto"
              />
            </Field>
            <div className="sm:col-span-3">
              <Button type="submit" loading={savingV}>
                Agregar vehiculo
              </Button>
            </div>
          </form>

          {cargando ? (
            <Spinner />
          ) : (
            <ul className="divide-y divide-slate-100">
              {vehiculos.map((v) => (
                <li key={v.id} className="flex items-center justify-between py-2.5">
                  <div>
                    <p className="font-medium">
                      {v.patente}{' '}
                      {v.alias && <span className="text-slate-400">({v.alias})</span>}
                    </p>
                    <p className="text-xs text-slate-400">{v.tipo ?? 'sin tipo'}</p>
                  </div>
                  <button
                    onClick={() => toggleVehiculo(v)}
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      v.activo ? 'bg-green-100 text-green-700' : 'bg-slate-200 text-slate-500'
                    }`}
                  >
                    {v.activo ? 'Activo' : 'Inactivo'}
                  </button>
                </li>
              ))}
              {vehiculos.length === 0 && <p className="py-2 text-slate-500">Sin vehiculos.</p>}
            </ul>
          )}
        </Card>

        {/* Conductores */}
        <Card>
          <h2 className="mb-4 text-lg font-semibold">Conductores</h2>
          <form onSubmit={crearConductor} className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Nombre *">
              <Input
                value={cForm.nombre}
                onChange={(e) => setCForm({ ...cForm, nombre: e.target.value })}
                placeholder="Juan Perez"
              />
            </Field>
            <Field label="Telefono">
              <Input
                value={cForm.telefono}
                onChange={(e) => setCForm({ ...cForm, telefono: e.target.value })}
                placeholder="+56 9 1234 5678"
              />
            </Field>
            <div className="sm:col-span-2">
              <Button type="submit" loading={savingC}>
                Agregar conductor
              </Button>
            </div>
          </form>

          {cargando ? (
            <Spinner />
          ) : (
            <ul className="divide-y divide-slate-100">
              {conductores.map((c) => (
                <li key={c.id} className="flex items-center justify-between py-2.5">
                  <div>
                    <p className="font-medium">{c.nombre}</p>
                    <p className="text-xs text-slate-400">{c.telefono ?? 'sin telefono'}</p>
                  </div>
                  <button
                    onClick={() => toggleConductor(c)}
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      c.activo ? 'bg-green-100 text-green-700' : 'bg-slate-200 text-slate-500'
                    }`}
                  >
                    {c.activo ? 'Activo' : 'Inactivo'}
                  </button>
                </li>
              ))}
              {conductores.length === 0 && <p className="py-2 text-slate-500">Sin conductores.</p>}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
