'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  Trash2,
  Eye,
  Download,
  AlertCircle,
  Building2,
  User,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import AdminLayout from '@/components/AdminLayout';

interface NegocioAdmin {
  id: string;
  nombreNegocio: string;
  tipo: 'empresa' | 'persona_natural';
  telefono: string;
  correo: string;
  ciudad: string | null;
  documento: string | null;
  estado: 'pendiente' | 'aprobado' | 'rechazado';
  creadoEn: string;
  responsable: string | null;
  motivoRechazo: string | null;
  categorias: Array<{ id: number; nombre: string }>;
}

function AdminNegociosContent() {
  const searchParams = useSearchParams();
  const estadoInicial = searchParams.get('estado') || '';

  const [negocios, setNegocios] = useState<NegocioAdmin[]>([]);
  const [total, setTotal] = useState(0);
  const [pagina, setPagina] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [cargando, setCargando] = useState(true);

  // Filtros
  const [estadoFiltro, setEstadoFiltro] = useState<string>(estadoInicial);
  const [tipoFiltro, setTipoFiltro] = useState<string>('');
  const [categoriaFiltro, setCategoriaFiltro] = useState<string>('');
  const [fechaDesde, setFechaDesde] = useState<string>('');
  const [fechaHasta, setFechaHasta] = useState<string>('');
  const [listaCategorias, setListaCategorias] = useState<Array<{ id: number; nombre: string; slug: string }>>([]);
  const [busqueda, setBusqueda] = useState('');

  // Selección múltiple para acciones masivas
  const [seleccionados, setSeleccionados] = useState<string[]>([]);
  const [modalMasivo, setModalMasivo] = useState<{
    accion: 'aprobar' | 'rechazar' | 'eliminar';
    abierto: boolean;
  }>({ accion: 'aprobar', abierto: false });
  const [motivoRechazoMasivo, setMotivoRechazoMasivo] = useState('');
  const [ejecutandoAccion, setEjecutandoAccion] = useState(false);
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);
  const [mensajeError, setMensajeError] = useState<string | null>(null);

  useEffect(() => {
    const paramEstado = searchParams.get('estado') || '';
    if (paramEstado && paramEstado !== estadoFiltro) {
      setEstadoFiltro(paramEstado);
      setPagina(1);
    }
  }, [searchParams, estadoFiltro]);

  const cargarNegocios = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (estadoFiltro) params.set('estado', estadoFiltro);
      if (tipoFiltro) params.set('tipo', tipoFiltro);
      if (categoriaFiltro) params.set('categoriaId', categoriaFiltro);
      if (fechaDesde) params.set('fechaDesde', fechaDesde);
      if (fechaHasta) params.set('fechaHasta', fechaHasta);
      if (busqueda.trim()) params.set('q', busqueda.trim());
      params.set('pagina', pagina.toString());
      params.set('limite', '15');

      const res = await fetch(`/api/admin/negocios?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setNegocios(data.negocios || []);
        setTotal(data.total || 0);
        setTotalPaginas(data.totalPaginas || 1);
        if (Array.isArray(data.categorias) && data.categorias.length > 0) {
          setListaCategorias(data.categorias);
        }
        setSeleccionados([]); // Limpiar selección al recargar
      }
    } catch (err) {
      console.error('Error cargando negocios:', err);
    } finally {
      setCargando(false);
    }
  }, [estadoFiltro, tipoFiltro, categoriaFiltro, fechaDesde, fechaHasta, busqueda, pagina]);

  useEffect(() => {
    cargarNegocios();
  }, [cargarNegocios]);

  // Selección individual o total
  const toggleSeleccion = (id: string) => {
    setSeleccionados((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const seleccionarTodosVisibles = () => {
    if (seleccionados.length === negocios.length) {
      setSeleccionados([]);
    } else {
      setSeleccionados(negocios.map((n) => n.id));
    }
  };

  const seleccionarTodosPendientes = () => {
    const pend = negocios.filter((n) => n.estado === 'pendiente').map((n) => n.id);
    setSeleccionados(pend);
  };

  // Ejecutar Acción Masiva
  const ejecutarAccionMasiva = async () => {
    if (seleccionados.length === 0) return;
    setEjecutandoAccion(true);

    try {
      const res = await fetch('/api/admin/negocios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ids: seleccionados,
          accion: modalMasivo.accion,
          motivoRechazo: motivoRechazoMasivo,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Error al ejecutar acción masiva.');
      }

      setMensajeError(null);
      setMensajeExito(data.message || 'Acción completada con éxito.');
      setTimeout(() => setMensajeExito(null), 4000);
      setModalMasivo({ accion: 'aprobar', abierto: false });
      setMotivoRechazoMasivo('');
      cargarNegocios();
    } catch (err: any) {
      setMensajeError(err.message || 'Error en la operación.');
    } finally {
      setEjecutandoAccion(false);
    }
  };

  return (
    <AdminLayout>
      <div className="p-6 sm:p-8 space-y-6">
        {/* Cabecera y Exportación */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">
              Gestión de Negocios
            </h1>
            <p className="text-xs text-gray-500 mt-1">
              Revisa, aprueba, rechaza y administra todas las solicitudes registradas
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => cargarNegocios()}
              className="p-2.5 rounded-xl border border-gray-300 bg-white hover:bg-gray-50 text-gray-600"
              title="Recargar tabla"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            <a
              href={`/api/admin/export?${new URLSearchParams({
                ...(estadoFiltro ? { estado: estadoFiltro } : {}),
                ...(tipoFiltro ? { tipo: tipoFiltro } : {}),
                ...(categoriaFiltro ? { categoriaId: categoriaFiltro } : {}),
                ...(fechaDesde ? { fechaDesde } : {}),
                ...(fechaHasta ? { fechaHasta } : {}),
                ...(busqueda.trim() ? { q: busqueda.trim() } : {}),
              }).toString()}`}
              download
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 text-xs font-semibold shadow-2xs transition-colors"
            >
              <Download className="w-4 h-4 text-gray-500" />
              <span>Exportar filtrados a CSV</span>
            </a>
          </div>
        </div>

        {/* Notificación de éxito o error */}
        {mensajeExito && (
          <div className="p-3.5 rounded-xl bg-green-50 border border-green-200 text-green-800 text-xs font-medium flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-green-600" />
            <span>{mensajeExito}</span>
          </div>
        )}
        {mensajeError && (
          <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium flex items-center gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-red-600" />
            <span>{mensajeError}</span>
          </div>
        )}

        {/* BARRA DE FILTROS Y BÚSQUEDA COMPLETA */}
        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs space-y-3">
          <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
            <div className="w-full md:w-80 relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
              <input
                type="text"
                value={busqueda}
                onChange={(e) => {
                  setBusqueda(e.target.value);
                  setPagina(1);
                }}
                placeholder="Buscar por nombre, email, teléfono, documento..."
                className="w-full pl-10 pr-3.5 py-2 text-xs rounded-xl border border-gray-300 focus:outline-hidden focus:ring-1 focus:ring-blue-600"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              {/* Estado */}
              <select
                value={estadoFiltro}
                onChange={(e) => {
                  setEstadoFiltro(e.target.value);
                  setPagina(1);
                }}
                className="px-3 py-2 rounded-xl border border-gray-300 text-xs text-gray-700 bg-white"
              >
                <option value="">Todos los Estados</option>
                <option value="pendiente">Solo Pendientes</option>
                <option value="aprobado">Solo Aprobados</option>
                <option value="rechazado">Solo Rechazados</option>
              </select>

              {/* Tipo */}
              <select
                value={tipoFiltro}
                onChange={(e) => {
                  setTipoFiltro(e.target.value);
                  setPagina(1);
                }}
                className="px-3 py-2 rounded-xl border border-gray-300 text-xs text-gray-700 bg-white"
              >
                <option value="">Todos los Tipos</option>
                <option value="empresa">Empresas</option>
                <option value="persona_natural">Persona Natural</option>
              </select>

              {/* Categoría */}
              <select
                value={categoriaFiltro}
                onChange={(e) => {
                  setCategoriaFiltro(e.target.value);
                  setPagina(1);
                }}
                className="px-3 py-2 rounded-xl border border-gray-300 text-xs text-gray-700 bg-white max-w-[180px] truncate"
              >
                <option value="">Todas las Categorías</option>
                {listaCategorias.map((c) => (
                  <option key={c.id} value={c.id.toString()}>
                    {c.nombre}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Filtros de Fecha */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-gray-100 text-xs text-gray-600">
            <div className="flex flex-wrap items-center gap-3">
              <span className="font-semibold text-gray-700 flex items-center gap-1">
                <span>Rango de Fecha:</span>
              </span>
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-gray-500">Desde:</span>
                <input
                  type="date"
                  value={fechaDesde}
                  onChange={(e) => {
                    setFechaDesde(e.target.value);
                    setPagina(1);
                  }}
                  className="px-2.5 py-1.5 rounded-lg border border-gray-300 text-xs text-gray-700 bg-white"
                />
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-gray-500">Hasta:</span>
                <input
                  type="date"
                  value={fechaHasta}
                  onChange={(e) => {
                    setFechaHasta(e.target.value);
                    setPagina(1);
                  }}
                  className="px-2.5 py-1.5 rounded-lg border border-gray-300 text-xs text-gray-700 bg-white"
                />
              </div>
            </div>

            {(estadoFiltro || tipoFiltro || categoriaFiltro || fechaDesde || fechaHasta || busqueda) && (
              <button
                type="button"
                onClick={() => {
                  setEstadoFiltro('');
                  setTipoFiltro('');
                  setCategoriaFiltro('');
                  setFechaDesde('');
                  setFechaHasta('');
                  setBusqueda('');
                  setPagina(1);
                }}
                className="text-xs text-blue-700 hover:text-blue-900 font-semibold"
              >
                Limpiar filtros
              </button>
            )}
          </div>
        </div>

        {/* BARRA DE ACCIONES MASIVAS CUANDO HAY ELEMENTOS SELECCIONADOS */}
        {seleccionados.length > 0 && (
          <div className="bg-blue-900 text-white p-3.5 rounded-2xl shadow-md flex flex-col sm:flex-row items-center justify-between gap-3 animate-in fade-in">
            <div className="flex items-center gap-2 text-xs font-semibold">
              <span className="bg-blue-700 px-2.5 py-1 rounded-md">
                {seleccionados.length} seleccionados
              </span>
              <span>de {negocios.length} visibles</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setModalMasivo({ accion: 'aprobar', abierto: true })}
                className="px-3 py-1.5 rounded-lg bg-green-600 hover:bg-green-700 text-white font-semibold text-xs flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Aprobar seleccionados</span>
              </button>

              <button
                type="button"
                onClick={() => setModalMasivo({ accion: 'rechazar', abierto: true })}
                className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs flex items-center gap-1.5"
              >
                <XCircle className="w-3.5 h-3.5" />
                <span>Rechazar seleccionados</span>
              </button>

              <button
                type="button"
                onClick={() => setModalMasivo({ accion: 'eliminar', abierto: true })}
                className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold text-xs flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Eliminar</span>
              </button>
            </div>
          </div>
        )}

        {/* TABLA PRINCIPAL DE REGISTROS */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
          {/* Accesos rápidos de selección en cabecera */}
          <div className="p-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={seleccionarTodosVisibles}
                className="text-blue-700 hover:underline font-semibold"
              >
                {seleccionados.length === negocios.length ? 'Deseleccionar todos' : 'Seleccionar visibles'}
              </button>
              <span>•</span>
              <button
                type="button"
                onClick={seleccionarTodosPendientes}
                className="text-amber-700 hover:underline font-semibold"
              >
                Seleccionar solo pendientes
              </button>
            </div>

            <span>{total} registros en total</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-gray-600">
              <thead className="bg-gray-50 border-b border-gray-200 text-gray-700 font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="p-3.5 w-10">
                    <input
                      type="checkbox"
                      checked={negocios.length > 0 && seleccionados.length === negocios.length}
                      onChange={seleccionarTodosVisibles}
                      className="rounded-sm text-blue-600"
                    />
                  </th>
                  <th className="p-3.5">Estado</th>
                  <th className="p-3.5">Negocio</th>
                  <th className="p-3.5">Tipo</th>
                  <th className="p-3.5">Categorías</th>
                  <th className="p-3.5">Contacto</th>
                  <th className="p-3.5">Documento (Privado)</th>
                  <th className="p-3.5">Fecha</th>
                  <th className="p-3.5 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {cargando ? (
                  <tr>
                    <td colSpan={9} className="p-12 text-center text-gray-400">
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                        <span>Cargando registros...</span>
                      </div>
                    </td>
                  </tr>
                ) : negocios.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-12 text-center text-gray-400">
                      No se encontraron registros con los filtros seleccionados.
                    </td>
                  </tr>
                ) : (
                  negocios.map((n) => {
                    const estaSeleccionado = seleccionados.includes(n.id);

                    return (
                      <tr
                        key={n.id}
                        className={`hover:bg-gray-50/80 transition-colors ${
                          estaSeleccionado ? 'bg-blue-50/40' : ''
                        }`}
                      >
                        <td className="p-3.5">
                          <input
                            type="checkbox"
                            checked={estaSeleccionado}
                            onChange={() => toggleSeleccion(n.id)}
                            className="rounded-sm text-blue-600"
                          />
                        </td>

                        {/* Estado */}
                        <td className="p-3.5">
                          {n.estado === 'pendiente' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold bg-amber-100 text-amber-800">
                              <Clock className="w-3 h-3" />
                              <span>Pendiente</span>
                            </span>
                          )}
                          {n.estado === 'aprobado' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold bg-green-100 text-green-800">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Aprobado</span>
                            </span>
                          )}
                          {n.estado === 'rechazado' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold bg-red-100 text-red-800">
                              <XCircle className="w-3 h-3" />
                              <span>Rechazado</span>
                            </span>
                          )}
                        </td>

                        {/* Negocio */}
                        <td className="p-3.5 font-bold text-gray-900">
                          <Link
                            href={`/admin/negocios/${n.id}`}
                            className="hover:text-blue-700 underline-offset-2 hover:underline block max-w-xs truncate"
                          >
                            {n.nombreNegocio}
                          </Link>
                          {n.responsable && (
                            <span className="text-[10px] text-gray-400 font-normal block">
                              Resp: {n.responsable}
                            </span>
                          )}
                        </td>

                        {/* Tipo */}
                        <td className="p-3.5">
                          <span className="text-[11px] font-medium text-gray-700">
                            {n.tipo === 'empresa' ? 'Empresa' : 'Persona Natural'}
                          </span>
                        </td>

                        {/* Categorías */}
                        <td className="p-3.5">
                          <div className="flex flex-wrap gap-1 max-w-xs">
                            {n.categorias?.slice(0, 2).map((c) => (
                              <span
                                key={c.id}
                                className="text-[9px] font-semibold bg-gray-100 px-1.5 py-0.5 rounded text-gray-700"
                              >
                                {c.nombre}
                              </span>
                            ))}
                            {n.categorias && n.categorias.length > 2 && (
                              <span className="text-[9px] text-gray-400">
                                +{n.categorias.length - 2}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Contacto */}
                        <td className="p-3.5">
                          <p className="font-semibold text-gray-900">{n.telefono}</p>
                          <p className="text-gray-400 text-[10px] truncate max-w-[140px]">
                            {n.correo}
                          </p>
                        </td>

                        {/* Documento (Privado) */}
                        <td className="p-3.5 font-mono text-[11px] text-gray-600">
                          {n.documento || <span className="text-gray-300">-</span>}
                        </td>

                        {/* Fecha */}
                        <td className="p-3.5 text-gray-400 text-[11px] whitespace-nowrap">
                          {new Date(n.creadoEn).toLocaleDateString('es-CO')}
                        </td>

                        {/* Acciones */}
                        <td className="p-3.5 text-right whitespace-nowrap">
                          <Link
                            href={`/admin/negocios/${n.id}`}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold text-xs"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Ver y Gestionar</span>
                          </Link>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Paginación */}
          {totalPaginas > 1 && (
            <div className="p-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between text-xs">
              <span className="text-gray-500">
                Página {pagina} de {totalPaginas}
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={pagina <= 1}
                  onClick={() => setPagina((p) => Math.max(1, p - 1))}
                  className="px-3 py-1.5 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-40"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  disabled={pagina >= totalPaginas}
                  onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
                  className="px-3 py-1.5 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-40"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* MODAL DE CONFIRMACIÓN DE ACCIÓN MASIVA */}
      {modalMasivo.abierto && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="flex items-center gap-3">
              <div
                className={`p-3 rounded-xl ${
                  modalMasivo.accion === 'aprobar'
                    ? 'bg-green-100 text-green-700'
                    : modalMasivo.accion === 'rechazar'
                    ? 'bg-amber-100 text-amber-700'
                    : 'bg-red-100 text-red-700'
                }`}
              >
                {modalMasivo.accion === 'aprobar' ? (
                  <CheckCircle2 className="w-6 h-6" />
                ) : modalMasivo.accion === 'rechazar' ? (
                  <XCircle className="w-6 h-6" />
                ) : (
                  <Trash2 className="w-6 h-6" />
                )}
              </div>
              <div>
                <h3 className="font-bold text-base text-gray-900 capitalize">
                  {modalMasivo.accion === 'aprobar'
                    ? 'Aprobar Registros Masivamente'
                    : modalMasivo.accion === 'rechazar'
                    ? 'Rechazar Registros Masivamente'
                    : 'Eliminar Registros Permanentemente'}
                </h3>
                <p className="text-xs text-gray-500">
                  Esta acción se aplicará a {seleccionados.length} negocios seleccionados.
                </p>
              </div>
            </div>

            {modalMasivo.accion === 'rechazar' && (
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Motivo del Rechazo (Se enviará por correo a los solicitantes) <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  value={motivoRechazoMasivo}
                  onChange={(e) => setMotivoRechazoMasivo(e.target.value)}
                  placeholder="Explica la razón del rechazo..."
                  className="w-full p-2.5 rounded-xl border border-gray-300 text-xs focus:ring-1 focus:ring-blue-600 outline-hidden"
                />
              </div>
            )}

            {modalMasivo.accion === 'eliminar' && (
              <p className="text-xs text-red-700 bg-red-50 p-3 rounded-xl border border-red-200">
                ⚠️ Se eliminarán los registros de la base de datos y sus imágenes asociadas de Vercel Blob. Esta acción no se puede deshacer.
              </p>
            )}

            <div className="pt-3 flex items-center justify-end gap-2">
              <button
                type="button"
                disabled={ejecutandoAccion}
                onClick={() => setModalMasivo({ ...modalMasivo, abierto: false })}
                className="px-4 py-2 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-50 text-xs font-semibold"
              >
                Cancelar
              </button>

              <button
                type="button"
                disabled={
                  ejecutandoAccion ||
                  (modalMasivo.accion === 'rechazar' && !motivoRechazoMasivo.trim())
                }
                onClick={ejecutarAccionMasiva}
                className={`px-4 py-2 rounded-xl text-white font-semibold text-xs transition-colors flex items-center gap-1.5 disabled:opacity-50 ${
                  modalMasivo.accion === 'aprobar'
                    ? 'bg-green-600 hover:bg-green-700'
                    : modalMasivo.accion === 'rechazar'
                    ? 'bg-amber-600 hover:bg-amber-700'
                    : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {ejecutandoAccion ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Procesando...</span>
                  </>
                ) : (
                  <span>Confirmar acción</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

export default function AdminNegociosPage() {
  return (
    <Suspense
      fallback={
        <AdminLayout>
          <div className="flex-1 flex items-center justify-center p-12 text-gray-500">
            <Loader2 className="w-6 h-6 animate-spin mr-2" />
            <span>Cargando gestión de negocios...</span>
          </div>
        </AdminLayout>
      }
    >
      <AdminNegociosContent />
    </Suspense>
  );
}
