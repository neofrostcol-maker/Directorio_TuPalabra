'use client';

import { useState, useEffect, useCallback } from 'react';
import { History, Shield, RefreshCw, Loader2 } from 'lucide-react';
import AdminLayout from '@/components/AdminLayout';

interface AuditoriaItem {
  id: string;
  adminId: string | null;
  accion: string;
  entidad: string;
  entidadId: string | null;
  detalle: string | null;
  fecha: string;
}

export default function AdminAuditoriaPage() {
  const [logs, setLogs] = useState<AuditoriaItem[]>([]);
  const [cargando, setCargando] = useState(true);

  const cargarLogs = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/auditoria');
      if (res.ok) {
        const data = await res.json();
        setLogs(data);
      }
    } catch (err) {
      console.error('Error cargando auditoría:', err);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargarLogs();
  }, [cargarLogs]);

  return (
    <AdminLayout>
      <div className="p-6 sm:p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">
              Registro de Auditoría
            </h1>
            <p className="text-xs text-gray-500 mt-1">
              Historial trazable de todas las operaciones administrativas realizadas
            </p>
          </div>

          <button
            type="button"
            onClick={cargarLogs}
            className="p-2.5 rounded-xl border border-gray-300 bg-white hover:bg-gray-50 text-gray-700"
            title="Recargar logs"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-gray-600">
              <thead className="bg-gray-50 border-b border-gray-200 text-gray-700 font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="p-3.5">Fecha y Hora</th>
                  <th className="p-3.5">Acción</th>
                  <th className="p-3.5">Entidad</th>
                  <th className="p-3.5">Detalle de la Operación</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-mono text-[11px]">
                {cargando ? (
                  <tr>
                    <td colSpan={4} className="p-12 text-center text-gray-400">
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                        <span>Cargando auditoría...</span>
                      </div>
                    </td>
                  </tr>
                ) : logs.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-12 text-center text-gray-400 font-sans">
                      No hay registros de auditoría aún.
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50">
                      <td className="p-3.5 text-gray-500 whitespace-nowrap">
                        {new Date(log.fecha).toLocaleString('es-CO')}
                      </td>
                      <td className="p-3.5">
                        <span className="font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                          {log.accion}
                        </span>
                      </td>
                      <td className="p-3.5 uppercase font-semibold text-gray-700">
                        {log.entidad}
                      </td>
                      <td className="p-3.5 font-sans text-gray-800">
                        {log.detalle || '-'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
