'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Clock,
  CheckCircle2,
  XCircle,
  Building2,
  TrendingUp,
  Download,
  ArrowRight,
  Eye,
  AlertCircle,
  Check,
  X,
  PlusCircle,
} from 'lucide-react';
import AdminLayout from '@/components/AdminLayout';

interface Metricas {
  total: number;
  pendientes: number;
  aprobados: number;
  rechazados: number;
}

interface StatCat {
  categoriaId: number;
  nombre: string;
  count: number;
}

interface NegocioItem {
  id: string;
  nombreNegocio: string;
  tipo: string;
  telefono: string;
  correo: string;
  estado: string;
  creadoEn: string;
  responsable?: string;
  categorias: Array<{ nombre: string }>;
}

export default function AdminDashboardPage() {
  const [metricas, setMetricas] = useState<Metricas>({
    total: 0,
    pendientes: 0,
    aprobados: 0,
    rechazados: 0,
  });
  const [statsCategorias, setStatsCategorias] = useState<StatCat[]>([]);
  const [statsMeses, setStatsMeses] = useState<Array<{ mes: string; etiqueta: string; count: number }>>([]);
  const [pendientes, setPendientes] = useState<NegocioItem[]>([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    async function cargarData() {
      try {
        const res = await fetch('/api/admin/negocios?limite=10');
        if (res.ok) {
          const data = await res.json();
          setMetricas(data.metricas || { total: 0, pendientes: 0, aprobados: 0, rechazados: 0 });
          setStatsCategorias(data.statsPorCategoria || []);
          setStatsMeses(data.statsPorMes || []);
          // Filtrar pendientes para cola rápida
          const p = (data.negocios || []).filter((n: any) => n.estado === 'pendiente');
          setPendientes(p);
        }
      } catch (err) {
        console.error('Error cargando dashboard:', err);
      } finally {
        setCargando(false);
      }
    }
    cargarData();
  }, []);

  return (
    <AdminLayout>
      <div className="p-6 sm:p-8 space-y-8">
        {/* Cabecera del Dashboard */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">
              Dashboard de Control
            </h1>
            <p className="text-xs text-gray-500 mt-1">
              Resumen operativo del Directorio Empresarial Tu Palabra
            </p>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="/api/admin/export"
              download
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 text-xs font-semibold shadow-2xs transition-colors"
            >
              <Download className="w-4 h-4 text-gray-500" />
              <span>Exportar Base a CSV</span>
            </a>

            <Link
              href="/admin/negocios"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold shadow-2xs transition-colors"
            >
              <span>Ver Todos los Negocios</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* TARJETAS DE MÉTRICAS CLAVE */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Pendientes (Destacado) */}
          <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-5 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-amber-800">
                Pendientes de Aprobación
              </p>
              <h3 className="text-3xl font-extrabold text-amber-950 mt-1">
                {metricas.pendientes}
              </h3>
              <p className="text-[11px] text-amber-700 mt-1">Requieren revisión</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-amber-200/80 text-amber-900 flex items-center justify-center">
              <Clock className="w-6 h-6" />
            </div>
          </div>

          {/* Aprobados */}
          <div className="bg-green-50/80 border border-green-200 rounded-2xl p-5 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-green-800">
                Negocios Publicados
              </p>
              <h3 className="text-3xl font-extrabold text-green-950 mt-1">
                {metricas.aprobados}
              </h3>
              <p className="text-[11px] text-green-700 mt-1">Activos en el directorio</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-green-200/80 text-green-900 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6" />
            </div>
          </div>

          {/* Rechazados */}
          <div className="bg-red-50/80 border border-red-200 rounded-2xl p-5 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-red-800">
                Registros Rechazados
              </p>
              <h3 className="text-3xl font-extrabold text-red-950 mt-1">
                {metricas.rechazados}
              </h3>
              <p className="text-[11px] text-red-700 mt-1">Con motivo registrado</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-red-200/80 text-red-900 flex items-center justify-center">
              <XCircle className="w-6 h-6" />
            </div>
          </div>

          {/* Total */}
          <div className="bg-tupalabra-50 border border-tupalabra-200 rounded-2xl p-5 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-tupalabra-800">
                Total Solicitudes
              </p>
              <h3 className="text-3xl font-extrabold text-tupalabra-950 mt-1">
                {metricas.total}
              </h3>
              <p className="text-[11px] text-tupalabra-700 mt-1">Histórico general</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-tupalabra-200 text-tupalabra-900 flex items-center justify-center">
              <Building2 className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* COLA RÁPIDA DE PENDIENTES & DISTRIBUCIÓN POR CATEGORÍAS */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Cola de Pendientes */}
          <div className="lg:col-span-7 bg-white rounded-2xl border border-gray-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-600" />
                <h2 className="font-bold text-sm text-gray-900">
                  Cola de Negocios Pendientes de Revisión
                </h2>
              </div>
              <Link
                href="/admin/negocios?estado=pendiente"
                className="text-xs font-semibold text-blue-700 hover:text-blue-900"
              >
                Ver todos los pendientes
              </Link>
            </div>

            {pendientes.length === 0 ? (
              <div className="py-10 text-center space-y-2">
                <CheckCircle2 className="w-10 h-10 text-green-500 mx-auto" />
                <p className="text-sm font-bold text-gray-800">¡Al día! No hay negocios pendientes</p>
                <p className="text-xs text-gray-500">
                  Todos los registros postulados han sido revisados y procesados.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {pendientes.map((neg) => (
                  <div
                    key={neg.id}
                    className="py-3.5 flex items-center justify-between gap-4 hover:bg-gray-50/70 rounded-xl px-2 transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-xs text-gray-900 truncate">
                        {neg.nombreNegocio}
                      </p>
                      <p className="text-[11px] text-gray-500 truncate">
                        {neg.responsable ? `${neg.responsable} • ` : ''}
                        {neg.telefono} • {neg.correo}
                      </p>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className="text-[10px] bg-amber-100 text-amber-800 font-semibold px-2 py-0.5 rounded-md">
                          Pendiente
                        </span>
                        <span className="text-[10px] text-gray-400">
                          {new Date(neg.creadoEn).toLocaleDateString('es-CO')}
                        </span>
                      </div>
                    </div>

                    <Link
                      href={`/admin/negocios/${neg.id}`}
                      className="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 font-semibold text-xs inline-flex items-center gap-1 shrink-0"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Revisar</span>
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Gráfica de Registros por Categoría */}
          <div className="lg:col-span-5 bg-white rounded-2xl border border-gray-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-blue-600" />
                <h2 className="font-bold text-sm text-gray-900">
                  Negocios por Categoría
                </h2>
              </div>
              <span className="text-xs text-gray-400">Total sectores</span>
            </div>

            {statsCategorias.length === 0 ? (
              <p className="text-xs text-gray-400 py-6 text-center">
                Sin datos de categorías aún.
              </p>
            ) : (
              <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
                {statsCategorias.map((cat) => {
                  const maxCount = Math.max(...statsCategorias.map((s) => s.count), 1);
                  const porcentaje = Math.round((cat.count / maxCount) * 100);

                  return (
                    <div key={cat.categoriaId} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-gray-700 truncate pr-2">
                          {cat.nombre}
                        </span>
                        <span className="font-bold text-gray-900 shrink-0">
                          {cat.count}
                        </span>
                      </div>
                      <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-blue-600 h-full rounded-full transition-all duration-500"
                          style={{ width: `${porcentaje}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Gráfica de Tendencia de Registros por Mes */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-green-600" />
              <h2 className="font-bold text-sm text-gray-900">
                Tendencia de Registros por Mes (Últimos 6 meses)
              </h2>
            </div>
            <span className="text-xs text-gray-400 font-medium">Actividad reciente</span>
          </div>

          <div className="pt-4">
            {statsMeses.length === 0 ? (
              <p className="text-xs text-gray-400 py-6 text-center">
                Sin historial mensual disponible.
              </p>
            ) : (
              <div className="grid grid-cols-6 gap-3 sm:gap-6 items-end h-44 pt-6 pb-2 px-2">
                {statsMeses.map((m) => {
                  const maxVal = Math.max(...statsMeses.map((x) => x.count), 1);
                  const porcentaje = Math.max(Math.round((m.count / maxVal) * 100), 8);

                  return (
                    <div key={m.mes} className="flex flex-col items-center h-full justify-end group">
                      <span className="text-[11px] font-bold text-gray-800 mb-1.5 transition-transform group-hover:scale-110">
                        {m.count}
                      </span>
                      <div className="w-full max-w-[48px] bg-blue-100 rounded-t-xl overflow-hidden h-28 flex items-end">
                        <div
                          className="w-full bg-blue-600 group-hover:bg-blue-700 transition-all duration-500 rounded-t-xl shadow-xs"
                          style={{ height: `${porcentaje}%` }}
                        />
                      </div>
                      <span className="text-[10px] font-semibold text-gray-500 mt-2 truncate w-full text-center">
                        {m.etiqueta}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
