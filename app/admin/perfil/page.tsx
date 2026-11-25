'use client';

import { useState } from 'react';
import { KeyRound, Lock, CheckCircle2, AlertCircle, Loader2, ShieldCheck } from 'lucide-react';
import AdminLayout from '@/components/AdminLayout';

export default function AdminPerfilPage() {
  const [passwordActual, setPasswordActual] = useState('');
  const [nuevoPassword, setNuevoPassword] = useState('');
  const [confirmarPassword, setConfirmarPassword] = useState('');
  const [procesando, setProcesando] = useState(false);
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMensajeExito(null);

    if (nuevoPassword !== confirmarPassword) {
      setError('La confirmación de la contraseña no coincide.');
      return;
    }

    setProcesando(true);
    try {
      const res = await fetch('/api/admin/cambiar-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          passwordActual,
          nuevoPassword,
          confirmarPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Error al cambiar la contraseña.');
      }

      setMensajeExito('Contraseña cambiada exitosamente.');
      setPasswordActual('');
      setNuevoPassword('');
      setConfirmarPassword('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setProcesando(false);
    }
  };

  return (
    <AdminLayout>
      <div className="p-6 sm:p-8 space-y-6 max-w-2xl">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">
            Seguridad & Contraseña
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Actualiza las credenciales del Administrador Único de la Iglesia Cristiana Tu Palabra
          </p>
        </div>

        {mensajeExito && (
          <div className="p-4 rounded-xl bg-green-50 border border-green-200 text-green-800 text-xs font-medium flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
            <span>{mensajeExito}</span>
          </div>
        )}

        {error && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <span>{error}</span>
          </div>
        )}

        <div className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 shadow-xs">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Contraseña Actual <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
                <input
                  type="password"
                  required
                  value={passwordActual}
                  onChange={(e) => setPasswordActual(e.target.value)}
                  placeholder="Tu contraseña actual"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-hidden"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Nueva Contraseña <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
                <input
                  type="password"
                  required
                  value={nuevoPassword}
                  onChange={(e) => setNuevoPassword(e.target.value)}
                  placeholder="Mínimo 8 caracteres, mayúscula, número y símbolo"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-hidden"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Confirmar Nueva Contraseña <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
                <input
                  type="password"
                  required
                  value={confirmarPassword}
                  onChange={(e) => setConfirmarPassword(e.target.value)}
                  placeholder="Repite la nueva contraseña"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-hidden"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={procesando}
                className="w-full py-3 px-4 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-semibold text-sm shadow-xs transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {procesando ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Actualizando contraseña...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Guardar Nueva Contraseña</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </AdminLayout>
  );
}
