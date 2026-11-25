'use client';

import { useState, useEffect, useCallback, use } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Trash2,
  Edit,
  ExternalLink,
  Building2,
  User,
  Phone,
  Mail,
  MapPin,
  Clock,
  Globe,
  Tag,
  Shield,
  Loader2,
  AlertCircle,
  Save,
  X,
} from 'lucide-react';
import AdminLayout from '@/components/AdminLayout';

interface NegocioDetalleAdmin {
  id: string;
  tipo: 'empresa' | 'persona_natural';
  nombreNegocio: string;
  direccion: string;
  telefono: string;
  correo: string;
  descripcionCorta: string | null;
  descripcionLarga: string | null;
  responsable: string | null;
  documento: string | null; // Privado
  ciudad: string | null;
  barrio: string | null;
  sitioWeb: string | null;
  instagram: string | null;
  facebook: string | null;
  tiktok: string | null;
  catalogoUrl: string | null;
  horario: string | null;
  anioFundacion: string | null;
  tiposAtencion: string[];
  serviciosDestacados: string[];
  promocionMiembros: string | null;
  esMiembroIglesia: boolean;
  logoUrl: string | null;
  estado: 'pendiente' | 'aprobado' | 'rechazado';
  motivoRechazo: string | null;
  creadoEn: string;
  aprobadoEn: string | null;
  aprobadoPor: string | null;
  ipRegistro: string | null;
  imagenes: Array<{ id: string; url: string; orden: number }>;
  categorias: Array<{ id: number; nombre: string; slug: string }>;
}

export default function AdminNegocioDetallePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();

  const [negocio, setNegocio] = useState<NegocioDetalleAdmin | null>(null);
  const [cargando, setCargando] = useState(true);
  const [procesando, setProcesando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Modal Rechazo
  const [modalRechazoAbierto, setModalRechazoAbierto] = useState(false);
  const [motivoRechazo, setMotivoRechazo] = useState('');

  // Modo Edición
  const [modoEdicion, setModoEdicion] = useState(false);
  const [editNombre, setEditNombre] = useState('');
  const [editTelefono, setEditTelefono] = useState('');
  const [editCorreo, setEditCorreo] = useState('');
  const [editDireccion, setEditDireccion] = useState('');
  const [editCiudad, setEditCiudad] = useState('');
  const [editDescripcionCorta, setEditDescripcionCorta] = useState('');
  const [editDescripcionLarga, setEditDescripcionLarga] = useState('');
  const [editResponsable, setEditResponsable] = useState('');
  const [editDocumento, setEditDocumento] = useState('');
  const [editPromocion, setEditPromocion] = useState('');

  const cargarNegocio = useCallback(async () => {
    try {
      const res = await fetch(`/api/negocios/${id}`);
      if (!res.ok) throw new Error('No se pudo cargar el registro.');
      const data = await res.json();
      setNegocio(data);

      // Prellenar campos editables
      setEditNombre(data.nombreNegocio || '');
      setEditTelefono(data.telefono || '');
      setEditCorreo(data.correo || '');
      setEditDireccion(data.direccion || '');
      setEditCiudad(data.ciudad || '');
      setEditDescripcionCorta(data.descripcionCorta || '');
      setEditDescripcionLarga(data.descripcionLarga || '');
      setEditResponsable(data.responsable || '');
      setEditDocumento(data.documento || '');
      setEditPromocion(data.promocionMiembros || '');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  }, [id]);

  useEffect(() => {
    cargarNegocio();
  }, [cargarNegocio]);

  // Cambiar estado a Aprobado
  const handleAprobar = async () => {
    if (!confirm('¿Deseas aprobar este negocio y publicarlo en el directorio público?')) return;
    setProcesando(true);
    try {
      const res = await fetch(`/api/admin/negocios/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accion: 'cambiar_estado', estado: 'aprobado' }),
      });
      if (!res.ok) throw new Error('Error al aprobar.');
      await cargarNegocio();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setProcesando(false);
    }
  };

  // Rechazar
  const handleRechazar = async () => {
    if (!motivoRechazo.trim()) {
      alert('Debes indicar el motivo del rechazo.');
      return;
    }
    setProcesando(true);
    try {
      const res = await fetch(`/api/admin/negocios/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accion: 'cambiar_estado',
          estado: 'rechazado',
          motivoRechazo,
        }),
      });
      if (!res.ok) throw new Error('Error al rechazar.');
      setModalRechazoAbierto(false);
      await cargarNegocio();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setProcesando(false);
    }
  };

  // Guardar Edición
  const handleGuardarEdicion = async () => {
    setProcesando(true);
    try {
      const res = await fetch(`/api/admin/negocios/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accion: 'editar',
          nombreNegocio: editNombre,
          telefono: editTelefono,
          correo: editCorreo,
          direccion: editDireccion,
          ciudad: editCiudad,
          descripcionCorta: editDescripcionCorta,
          descripcionLarga: editDescripcionLarga,
          responsable: editResponsable,
          documento: editDocumento,
          promocionMiembros: editPromocion,
        }),
      });
      if (!res.ok) throw new Error('Error al guardar cambios.');
      setModoEdicion(false);
      await cargarNegocio();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setProcesando(false);
    }
  };

  // Eliminar definitivamente
  const handleEliminar = async () => {
    if (
      !confirm(
        '¿Estás seguro de ELIMINAR permanentemente este negocio y todas sus imágenes de Vercel Blob? Esta acción no se puede deshacer.'
      )
    )
      return;

    setProcesando(true);
    try {
      const res = await fetch(`/api/admin/negocios/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Error al eliminar.');
      router.push('/admin/negocios');
    } catch (err: any) {
      alert(err.message);
      setProcesando(false);
    }
  };

  if (cargando) {
    return (
      <AdminLayout>
        <div className="flex-1 flex items-center justify-center p-12 text-gray-500">
          <Loader2 className="w-6 h-6 animate-spin mr-2" />
          <span>Cargando detalle del registro...</span>
        </div>
      </AdminLayout>
    );
  }

  if (error || !negocio) {
    return (
      <AdminLayout>
        <div className="p-8 text-center space-y-4">
          <p className="text-red-600 font-bold">{error || 'Registro no encontrado'}</p>
          <Link href="/admin/negocios" className="text-xs text-blue-600 underline">
            Volver a la lista
          </Link>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-6 sm:p-8 space-y-6">
        {/* Cabecera y Botones de Acción */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <Link
            href="/admin/negocios"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-600 hover:text-blue-700"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Volver a la lista de negocios</span>
          </Link>

          <div className="flex flex-wrap items-center gap-2">
            {negocio.estado === 'aprobado' && (
              <Link
                href={`/negocio/${negocio.id}`}
                target="_blank"
                className="px-3.5 py-2 rounded-xl bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 text-xs font-semibold inline-flex items-center gap-1.5"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Ver en público</span>
              </Link>
            )}

            <button
              type="button"
              onClick={() => setModoEdicion(!modoEdicion)}
              className="px-3.5 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-semibold inline-flex items-center gap-1.5"
            >
              <Edit className="w-3.5 h-3.5" />
              <span>{modoEdicion ? 'Cancelar Edición' : 'Editar Datos'}</span>
            </button>

            {negocio.estado !== 'aprobado' && (
              <button
                type="button"
                disabled={procesando}
                onClick={handleAprobar}
                className="px-4 py-2 rounded-xl bg-green-600 hover:bg-green-700 text-white text-xs font-bold inline-flex items-center gap-1.5 shadow-xs"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Aprobar Negocio</span>
              </button>
            )}

            {negocio.estado !== 'rechazado' && (
              <button
                type="button"
                disabled={procesando}
                onClick={() => setModalRechazoAbierto(true)}
                className="px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold inline-flex items-center gap-1.5"
              >
                <XCircle className="w-3.5 h-3.5" />
                <span>Rechazar</span>
              </button>
            )}

            <button
              type="button"
              disabled={procesando}
              onClick={handleEliminar}
              className="px-3.5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold inline-flex items-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Eliminar</span>
            </button>
          </div>
        </div>

        {/* Tarjeta de Estado & Resumen */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-5">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span
                  className={`text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider ${
                    negocio.estado === 'aprobado'
                      ? 'bg-green-100 text-green-800'
                      : negocio.estado === 'rechazado'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  Estado: {negocio.estado}
                </span>

                <span className="text-xs text-gray-500">
                  Registrado el {new Date(negocio.creadoEn).toLocaleString('es-CO')}
                </span>
              </div>

              <h1 className="text-2xl font-extrabold text-gray-900">
                {negocio.nombreNegocio}
              </h1>
            </div>

            {/* Datos Internos Privados */}
            <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-200 text-xs space-y-1">
              <p className="font-semibold text-gray-700 flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-blue-600" />
                <span>Datos Privados del Solicitante</span>
              </p>
              <p>
                <strong>NIT / Documento:</strong> {negocio.documento || 'No suministrado'}
              </p>
              <p>
                <strong>IP Hash:</strong> {negocio.ipRegistro || 'Local'}
              </p>
              {negocio.aprobadoPor && (
                <p>
                  <strong>Aprobado por:</strong> {negocio.aprobadoPor}
                </p>
              )}
            </div>
          </div>

          {/* Motivo de Rechazo si aplica */}
          {negocio.estado === 'rechazado' && negocio.motivoRechazo && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-xs text-red-900 space-y-1">
              <p className="font-bold flex items-center gap-1.5 text-red-700">
                <AlertCircle className="w-4 h-4" />
                Motivo del Rechazo registrado:
              </p>
              <p>{negocio.motivoRechazo}</p>
            </div>
          )}

          {/* FOTOS SUBIDAS (3 a 5) */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700">
              Fotos del Negocio ({negocio.imagenes?.length || 0} imágenes)
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {negocio.imagenes?.map((img, idx) => (
                <a
                  key={img.id || idx}
                  href={img.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="relative aspect-4/3 rounded-xl overflow-hidden bg-gray-100 border border-gray-200 hover:opacity-90 transition-opacity block group"
                >
                  <Image
                    src={img.url}
                    alt={`Foto ${idx + 1}`}
                    fill
                    className="object-cover"
                  />
                  <span className="absolute bottom-1 left-1 bg-black/70 text-white text-[9px] px-1.5 py-0.5 rounded font-mono">
                    Foto {idx + 1}
                  </span>
                </a>
              ))}
            </div>
          </div>

          {/* MODO EDICIÓN O MODO LECTURA */}
          {modoEdicion ? (
            <div className="space-y-4 pt-4 border-t border-gray-100 bg-blue-50/30 p-5 rounded-2xl">
              <h3 className="font-bold text-sm text-blue-900">Editar Datos del Negocio</h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="font-semibold block mb-1">Nombre del Negocio</label>
                  <input
                    type="text"
                    value={editNombre}
                    onChange={(e) => setEditNombre(e.target.value)}
                    className="w-full p-2 border rounded-lg bg-white"
                  />
                </div>

                <div>
                  <label className="font-semibold block mb-1">Responsable</label>
                  <input
                    type="text"
                    value={editResponsable}
                    onChange={(e) => setEditResponsable(e.target.value)}
                    className="w-full p-2 border rounded-lg bg-white"
                  />
                </div>

                <div>
                  <label className="font-semibold block mb-1">Teléfono / WhatsApp</label>
                  <input
                    type="text"
                    value={editTelefono}
                    onChange={(e) => setEditTelefono(e.target.value)}
                    className="w-full p-2 border rounded-lg bg-white"
                  />
                </div>

                <div>
                  <label className="font-semibold block mb-1">Correo Electrónico</label>
                  <input
                    type="email"
                    value={editCorreo}
                    onChange={(e) => setEditCorreo(e.target.value)}
                    className="w-full p-2 border rounded-lg bg-white"
                  />
                </div>

                <div>
                  <label className="font-semibold block mb-1">Dirección</label>
                  <input
                    type="text"
                    value={editDireccion}
                    onChange={(e) => setEditDireccion(e.target.value)}
                    className="w-full p-2 border rounded-lg bg-white"
                  />
                </div>

                <div>
                  <label className="font-semibold block mb-1">Ciudad</label>
                  <input
                    type="text"
                    value={editCiudad}
                    onChange={(e) => setEditCiudad(e.target.value)}
                    className="w-full p-2 border rounded-lg bg-white"
                  />
                </div>

                <div>
                  <label className="font-semibold block mb-1">NIT / Cédula (Privado)</label>
                  <input
                    type="text"
                    value={editDocumento}
                    onChange={(e) => setEditDocumento(e.target.value)}
                    className="w-full p-2 border rounded-lg bg-white"
                  />
                </div>

                <div>
                  <label className="font-semibold block mb-1">Promoción para Miembros</label>
                  <input
                    type="text"
                    value={editPromocion}
                    onChange={(e) => setEditPromocion(e.target.value)}
                    className="w-full p-2 border rounded-lg bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold block text-xs mb-1">Descripción Corta</label>
                <input
                  type="text"
                  maxLength={160}
                  value={editDescripcionCorta}
                  onChange={(e) => setEditDescripcionCorta(e.target.value)}
                  className="w-full p-2 border rounded-lg bg-white text-xs"
                />
              </div>

              <div>
                <label className="font-semibold block text-xs mb-1">Descripción Completa</label>
                <textarea
                  rows={4}
                  value={editDescripcionLarga}
                  onChange={(e) => setEditDescripcionLarga(e.target.value)}
                  className="w-full p-2 border rounded-lg bg-white text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModoEdicion(false)}
                  className="px-4 py-2 border rounded-xl text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={procesando}
                  onClick={handleGuardarEdicion}
                  className="px-5 py-2 bg-blue-700 text-white rounded-xl text-xs font-bold inline-flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Guardar Cambios</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs text-gray-700 pt-4 border-t border-gray-100">
              <div className="space-y-3">
                <p>
                  <strong>Tipo de Registro:</strong>{' '}
                  {negocio.tipo === 'empresa' ? 'Empresa' : 'Persona Natural'}
                </p>
                <p>
                  <strong>Teléfono / WhatsApp:</strong> {negocio.telefono}
                </p>
                <p>
                  <strong>Correo:</strong> {negocio.correo}
                </p>
                <p>
                  <strong>Dirección:</strong> {negocio.direccion} ({negocio.ciudad || 'Bogotá'})
                </p>
                <p>
                  <strong>Es Miembro Iglesia:</strong>{' '}
                  {negocio.esMiembroIglesia ? 'Sí' : 'No'}
                </p>
                {negocio.horario && (
                  <p>
                    <strong>Horario:</strong> {negocio.horario}
                  </p>
                )}
              </div>

              <div className="space-y-3">
                <p>
                  <strong>Categorías:</strong>{' '}
                  {negocio.categorias?.map((c) => c.nombre).join(', ') || 'Ninguna'}
                </p>
                <p>
                  <strong>Promoción Miembros:</strong>{' '}
                  {negocio.promocionMiembros || 'Sin promoción especial'}
                </p>
                {negocio.sitioWeb && (
                  <p>
                    <strong>Sitio Web:</strong>{' '}
                    <a
                      href={negocio.sitioWeb}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 underline"
                    >
                      {negocio.sitioWeb}
                    </a>
                  </p>
                )}
                {negocio.instagram && (
                  <p>
                    <strong>Instagram:</strong> {negocio.instagram}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* MODAL DE RECHAZO INDIVIDUAL */}
      {modalRechazoAbierto && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95">
            <h3 className="font-bold text-base text-gray-900">Rechazar Solicitud</h3>
            <p className="text-xs text-gray-500">
              Indica la razón por la cual no se aprueba el negocio. Este mensaje será notificado por correo electrónico al solicitante.
            </p>

            <textarea
              rows={3}
              required
              value={motivoRechazo}
              onChange={(e) => setMotivoRechazo(e.target.value)}
              placeholder="Ej. La dirección suministrada no es clara, o las fotos no corresponden al giro de negocio..."
              className="w-full p-2.5 rounded-xl border border-gray-300 text-xs focus:ring-1 focus:ring-blue-600 outline-hidden"
            />

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setModalRechazoAbierto(false)}
                className="px-4 py-2 rounded-xl border border-gray-300 text-xs font-semibold"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={procesando || !motivoRechazo.trim()}
                onClick={handleRechazar}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold disabled:opacity-50"
              >
                {procesando ? 'Enviando...' : 'Confirmar Rechazo'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
