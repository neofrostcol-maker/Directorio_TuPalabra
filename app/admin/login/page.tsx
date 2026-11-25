'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Shield, Lock, User, AlertCircle, Loader2, ArrowRight } from 'lucide-react';
import LogoTuPalabra from '@/components/LogoTuPalabra';

export default function AdminLoginPage() {
  const router = useRouter();
  const [usuario, setUsuario] = useState('');
  const [password, setPassword] = useState('');
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setCargando(true);

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usuario, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Credenciales no válidas.');
      }

      router.push('/admin');
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Error al iniciar sesión.');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-tupalabra-950 via-tupalabra-900 to-tupalabra-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 px-4">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link href="/" className="inline-block transition-transform hover:scale-102">
          <LogoTuPalabra variant="white" size="lg" showSubtitle={true} className="mx-auto" />
        </Link>

        <h2 className="mt-5 text-2xl font-extrabold text-white tracking-tight">
          Panel de Administración
        </h2>
        <p className="mt-1 text-xs text-tupalabra-200 uppercase tracking-widest">
          Gestión del Directorio Empresarial
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-2xl rounded-3xl sm:px-10 border border-tupalabra-100">
          {error && (
            <div className="mb-6 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2.5 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Error de autenticación:</p>
                <p>{error}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Nombre de Usuario
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  required
                  value={usuario}
                  onChange={(e) => setUsuario(e.target.value)}
                  placeholder="Usuario administrador"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:border-tupalabra-700 focus:ring-1 focus:ring-tupalabra-700 outline-hidden"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Contraseña
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:border-tupalabra-700 focus:ring-1 focus:ring-tupalabra-700 outline-hidden"
                />
              </div>
              <p className="text-[11px] text-gray-400 mt-1">
                Por seguridad, tras 5 intentos fallidos el acceso se bloquea temporalmente.
              </p>
            </div>

            <button
              type="submit"
              disabled={cargando}
              className="w-full py-3 px-4 rounded-xl bg-tupalabra-700 hover:bg-tupalabra-800 text-white font-semibold text-sm shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50 active:scale-[0.99]"
            >
              {cargando ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Verificando credenciales...</span>
                </>
              ) : (
                <>
                  <Shield className="w-4 h-4" />
                  <span>Ingresar al Panel</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-gray-100 text-center">
            <Link
              href="/"
              className="text-xs text-gray-500 hover:text-tupalabra-700 inline-flex items-center gap-1 font-semibold"
            >
              <span>Volver a la vista pública del directorio</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
