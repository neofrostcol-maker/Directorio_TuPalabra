'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowLeft,
  Share2,
  Phone,
  MessageCircle,
  Mail,
  MapPin,
  Clock,
  Globe,
  Instagram,
  Facebook,
  ExternalLink,
  Building2,
  User,
  CheckCircle,
  Calendar,
  Sparkles,
  Tag,
  Copy,
  Check,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  X,
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

interface NegocioDetalle {
  id: string;
  tipo: 'empresa' | 'persona_natural';
  nombreNegocio: string;
  direccion: string;
  telefono: string;
  correo: string;
  descripcionCorta: string | null;
  descripcionLarga: string | null;
  responsable: string | null;
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
  creadoEn: string;
  imagenes: Array<{ id: string; url: string; orden: number }>;
  categorias: Array<{ id: number; nombre: string; slug: string; descripcion: string }>;
}

export default function NegocioDetallePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [negocio, setNegocio] = useState<NegocioDetalle | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Galería y Lightbox
  const [imagenActiva, setImagenActiva] = useState(0);
  const [lightboxAbierto, setLightboxAbierto] = useState(false);
  const [copiado, setCopiado] = useState(false);

  useEffect(() => {
    async function cargar() {
      try {
        const res = await fetch(`/api/negocios/${id}`);
        if (!res.ok) {
          throw new Error('Negocio no encontrado o no disponible públicamente.');
        }
        const data = await res.json();
        setNegocio(data);
      } catch (err: any) {
        setError(err.message || 'Error cargando datos del negocio.');
      } finally {
        setCargando(false);
      }
    }
    cargar();
  }, [id]);

  const handleCompartir = async () => {
    if (typeof window === 'undefined') return;
    const url = window.location.href;

    if (navigator.share) {
      try {
        await navigator.share({
          title: negocio?.nombreNegocio || 'Directorio Tu Palabra',
          text: `Conoce "${negocio?.nombreNegocio}" en el Directorio Empresarial de la Iglesia Tu Palabra`,
          url,
        });
        return;
      } catch {}
    }

    try {
      await navigator.clipboard.writeText(url);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2500);
    } catch {}
  };

  const getWhatsAppLink = (tel: string, nombre: string) => {
    const limpio = tel.replace(/[^\d]/g, '');
    const num = limpio.startsWith('57') ? limpio : `57${limpio}`;
    const texto = encodeURIComponent(
      `¡Hola! Vi a "${nombre}" en el Directorio Empresarial Tu Palabra y me gustaría contactar con ustedes.`
    );
    return `https://wa.me/${num}?text=${texto}`;
  };

  if (cargando) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Navbar />
        <div className="flex-1 flex items-center justify-center py-20">
          <div className="text-center space-y-3">
            <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-gray-500 font-medium">Cargando perfil del negocio...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !negocio) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Navbar />
        <div className="flex-1 max-w-lg mx-auto py-24 px-4 text-center space-y-4">
          <h2 className="text-xl font-bold text-gray-900">Negocio no disponible</h2>
          <p className="text-sm text-gray-500">{error || 'El negocio solicitado no existe o está en revisión.'}</p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-700 text-white rounded-xl text-xs font-semibold hover:bg-blue-800"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Volver al Directorio</span>
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const imagenes = negocio.imagenes && negocio.imagenes.length > 0 ? negocio.imagenes : [];
  const imagenActualUrl = imagenes[imagenActiva]?.url || 'https://picsum.photos/seed/default/800/600';
  const direccionCompleta = `${negocio.direccion}, ${negocio.ciudad || 'Bogotá'}, Colombia`;
  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(direccionCompleta)}`;

  return (
    <div className="min-h-screen flex flex-col bg-gray-50/60">
      <Navbar />

      <main className="flex-1 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Barra de navegación superior */}
          <div className="flex items-center justify-between">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-xs font-semibold text-gray-600 hover:text-blue-700 bg-white px-3.5 py-2 rounded-xl border border-gray-200 shadow-2xs transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Volver al Directorio</span>
            </Link>

            <button
              type="button"
              onClick={handleCompartir}
              className="inline-flex items-center gap-2 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 px-3.5 py-2 rounded-xl border border-blue-200 transition-colors"
            >
              {copiado ? (
                <>
                  <Check className="w-4 h-4 text-green-600" />
                  <span className="text-green-700">¡Enlace copiado!</span>
                </>
              ) : (
                <>
                  <Share2 className="w-4 h-4" />
                  <span>Compartir negocio</span>
                </>
              )}
            </button>
          </div>

          {/* TARJETA PRINCIPAL DEL NEGOCIO */}
          <div className="bg-white rounded-2xl shadow-xs border border-gray-200 overflow-hidden">
            {/* Encabezado del Perfil */}
            <div className="p-6 sm:p-8 border-b border-tupalabra-800 bg-gradient-to-r from-tupalabra-950 via-tupalabra-900 to-tupalabra-950 text-white">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
                <div className="flex items-center gap-4">
                  {negocio.logoUrl ? (
                    <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl border-2 border-white shadow-md bg-white overflow-hidden shrink-0">
                      <Image
                        src={negocio.logoUrl}
                        alt="Logo"
                        fill
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-tupalabra-800/80 border border-tupalabra-700 text-white flex items-center justify-center shrink-0">
                      <Building2 className="w-8 h-8 text-tupalabra-200" />
                    </div>
                  )}

                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                      <span className="bg-white/20 backdrop-blur-xs text-white text-[11px] font-semibold px-2.5 py-0.5 rounded-md flex items-center gap-1">
                        {negocio.tipo === 'empresa' ? (
                          <>
                            <Building2 className="w-3 h-3 text-tupalabra-200" />
                            <span>Empresa</span>
                          </>
                        ) : (
                          <>
                            <User className="w-3 h-3 text-amber-200" />
                            <span>Persona Natural / Independiente</span>
                          </>
                        )}
                      </span>

                      {negocio.esMiembroIglesia && (
                        <span className="bg-green-600 text-white text-[11px] font-bold px-2.5 py-0.5 rounded-md flex items-center gap-1 shadow-xs">
                          <CheckCircle className="w-3 h-3 text-green-200" />
                          <span>Miembro Iglesia Tu Palabra</span>
                        </span>
                      )}
                    </div>

                    <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                      {negocio.nombreNegocio}
                    </h1>

                    {negocio.responsable && (
                      <p className="text-xs text-blue-200 mt-1">
                        A cargo de: <strong className="text-white">{negocio.responsable}</strong>
                      </p>
                    )}
                  </div>
                </div>

                {/* Botón Principal de WhatsApp en Cabecera */}
                <div className="w-full sm:w-auto">
                  <a
                    href={getWhatsAppLink(negocio.telefono, negocio.nombreNegocio)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-green-500 hover:bg-green-600 text-white font-bold text-sm shadow-md transition-all active:scale-95"
                  >
                    <MessageCircle className="w-5 h-5" />
                    <span>Contactar por WhatsApp</span>
                  </a>
                </div>
              </div>
            </div>

            {/* CONTENIDO EN DOS COLUMNAS */}
            <div className="p-6 sm:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Columna Izquierda: Galería de Fotos (3 a 5 fotos con carrusel & lightbox) */}
              <div className="lg:col-span-7 space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-gray-900 flex items-center gap-2">
                  <span>Galería de Fotos</span>
                  <span className="text-xs font-normal text-gray-500">
                    ({imagenes.length} fotos)
                  </span>
                </h3>

                {/* Visor de Foto Principal */}
                <div className="relative aspect-16/10 rounded-2xl overflow-hidden bg-gray-100 border border-gray-200 shadow-inner group">
                  <Image
                    src={imagenActualUrl}
                    alt={`${negocio.nombreNegocio} foto ${imagenActiva + 1}`}
                    fill
                    className="object-cover"
                    priority
                  />

                  {/* Botones de navegación en imagen */}
                  {imagenes.length > 1 && (
                    <>
                      <button
                        type="button"
                        onClick={() =>
                          setImagenActiva((i) => (i === 0 ? imagenes.length - 1 : i - 1))
                        }
                        className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
                        title="Foto anterior"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          setImagenActiva((i) => (i === imagenes.length - 1 ? 0 : i + 1))
                        }
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
                        title="Siguiente foto"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </>
                  )}

                  {/* Botón para abrir Lightbox */}
                  <button
                    type="button"
                    onClick={() => setLightboxAbierto(true)}
                    className="absolute bottom-3 right-3 p-2 rounded-lg bg-black/60 hover:bg-black/80 text-white text-xs font-medium flex items-center gap-1.5 transition-colors"
                  >
                    <Maximize2 className="w-4 h-4" />
                    <span>Ver pantalla completa</span>
                  </button>
                </div>

                {/* Miniaturas */}
                {imagenes.length > 1 && (
                  <div className="grid grid-cols-5 gap-2.5">
                    {imagenes.map((img, idx) => (
                      <button
                        key={img.id || idx}
                        type="button"
                        onClick={() => setImagenActiva(idx)}
                        className={`relative aspect-4/3 rounded-xl overflow-hidden border-2 transition-all ${
                          imagenActiva === idx
                            ? 'border-tupalabra-700 ring-2 ring-tupalabra-700/30'
                            : 'border-transparent opacity-70 hover:opacity-100'
                        }`}
                      >
                        <Image
                          src={img.url}
                          alt="Miniatura"
                          fill
                          className="object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}

                {/* Descripción Completa */}
                <div className="pt-4 space-y-3">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-gray-900">
                    Sobre este Negocio
                  </h3>
                  <div className="prose prose-sm text-gray-700 leading-relaxed whitespace-pre-line">
                    {negocio.descripcionLarga ||
                      negocio.descripcionCorta ||
                      'Negocio comprometido en prestar el mejor servicio con calidad y transparencia.'}
                  </div>
                </div>

                {/* Servicios Destacados (Tags) */}
                {negocio.serviciosDestacados && negocio.serviciosDestacados.length > 0 && (
                  <div className="pt-2 space-y-2">
                    <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Servicios y Productos Destacados
                    </h4>
                    <div className="flex flex-wrap gap-1.5">
                      {negocio.serviciosDestacados.map((item, idx) => (
                        <span
                          key={idx}
                          className="px-3 py-1 bg-gray-100 text-gray-800 rounded-lg text-xs font-medium border border-gray-200"
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Promoción para Miembros de la Iglesia */}
                {negocio.promocionMiembros && (
                  <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl border border-green-200 space-y-2">
                    <div className="flex items-center gap-2 text-green-900 font-bold text-sm">
                      <Tag className="w-4 h-4 text-green-600" />
                      <span>Beneficio para Miembros de Iglesia Tu Palabra</span>
                    </div>
                    <p className="text-xs text-green-800 leading-relaxed">
                      {negocio.promocionMiembros}
                    </p>
                  </div>
                )}
              </div>

              {/* Columna Derecha: Canales de Contacto, Categorías & Ubicación */}
              <div className="lg:col-span-5 space-y-6">
                {/* Categorías asociadas */}
                <div className="bg-gray-50/80 p-5 rounded-2xl border border-gray-200 space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-gray-700">
                    Categorías de Actividad
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {negocio.categorias?.map((c, idx) => (
                      <span
                        key={c.id ?? c.slug ?? `cat-${idx}`}
                        className="px-3 py-1 rounded-xl bg-blue-50 text-blue-800 text-xs font-semibold border border-blue-100"
                      >
                        {c.nombre}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Caja de Contacto Rápido */}
                <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-2xs space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-gray-900 border-b border-gray-100 pb-2">
                    Canales de Contacto Directo
                  </h4>

                  <div className="space-y-3 text-xs">
                    {/* Teléfono / WhatsApp */}
                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50">
                      <div className="flex items-center gap-2.5 text-gray-800">
                        <Phone className="w-4 h-4 text-blue-600" />
                        <div>
                          <p className="text-[10px] text-gray-400 font-medium">Teléfono / WhatsApp</p>
                          <p className="font-semibold text-gray-900">{negocio.telefono}</p>
                        </div>
                      </div>
                      <div className="flex gap-1.5">
                        <a
                          href={`tel:${negocio.telefono}`}
                          className="px-2.5 py-1.5 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold text-[11px]"
                        >
                          Llamar
                        </a>
                        <a
                          href={getWhatsAppLink(negocio.telefono, negocio.nombreNegocio)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2.5 py-1.5 rounded-lg bg-green-600 hover:bg-green-700 text-white font-semibold text-[11px]"
                        >
                          WhatsApp
                        </a>
                      </div>
                    </div>

                    {/* Correo Electrónico */}
                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50">
                      <div className="flex items-center gap-2.5 text-gray-800">
                        <Mail className="w-4 h-4 text-blue-600 shrink-0" />
                        <div className="truncate pr-2">
                          <p className="text-[10px] text-gray-400 font-medium">Correo Electrónico</p>
                          <p className="font-semibold text-gray-900 truncate">{negocio.correo}</p>
                        </div>
                      </div>
                      <a
                        href={`mailto:${negocio.correo}`}
                        className="px-2.5 py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 font-semibold text-[11px] shrink-0"
                      >
                        Escribir
                      </a>
                    </div>

                    {/* Dirección y Mapa */}
                    <div className="p-2.5 rounded-xl bg-gray-50 space-y-2">
                      <div className="flex items-start gap-2.5 text-gray-800">
                        <MapPin className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-[10px] text-gray-400 font-medium">Ubicación</p>
                          <p className="font-semibold text-gray-900">{negocio.direccion}</p>
                          <p className="text-gray-500 text-[11px]">
                            {negocio.ciudad || 'Bogotá'} {negocio.barrio ? `• ${negocio.barrio}` : ''}
                          </p>
                        </div>
                      </div>
                      <a
                        href={googleMapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs text-blue-600 hover:underline font-semibold pt-1"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Ver en Google Maps</span>
                      </a>
                    </div>

                    {/* Horario */}
                    {negocio.horario && (
                      <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-gray-50 text-gray-800">
                        <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-[10px] text-gray-400 font-medium">Horario de Atención</p>
                          <p className="font-semibold text-gray-900">{negocio.horario}</p>
                        </div>
                      </div>
                    )}

                    {/* Trayectoria */}
                    {negocio.anioFundacion && (
                      <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-gray-50 text-gray-800">
                        <Calendar className="w-4 h-4 text-purple-600" />
                        <div>
                          <p className="text-[10px] text-gray-400 font-medium">Trayectoria</p>
                          <p className="font-semibold text-gray-900">{negocio.anioFundacion}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Redes Sociales y Enlaces Web */}
                {(negocio.sitioWeb || negocio.instagram || negocio.facebook || negocio.tiktok || negocio.catalogoUrl) && (
                  <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-2xs space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-gray-900 border-b border-gray-100 pb-2">
                      Sitio Web & Redes Sociales
                    </h4>

                    <div className="flex flex-col gap-2 text-xs">
                      {negocio.sitioWeb && (
                        <a
                          href={negocio.sitioWeb}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-between p-2 rounded-xl hover:bg-gray-50 text-gray-700"
                        >
                          <span className="flex items-center gap-2">
                            <Globe className="w-4 h-4 text-blue-600" />
                            <span>Sitio Web Oficial</span>
                          </span>
                          <ExternalLink className="w-3.5 h-3.5 text-gray-400" />
                        </a>
                      )}

                      {negocio.catalogoUrl && (
                        <a
                          href={negocio.catalogoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-between p-2 rounded-xl bg-blue-50 text-blue-900 font-semibold"
                        >
                          <span className="flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-blue-700" />
                            <span>Ver Catálogo / Menú Digital</span>
                          </span>
                          <ExternalLink className="w-3.5 h-3.5 text-blue-700" />
                        </a>
                      )}

                      {negocio.instagram && (
                        <a
                          href={
                            negocio.instagram.startsWith('http')
                              ? negocio.instagram
                              : `https://instagram.com/${negocio.instagram.replace('@', '')}`
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-between p-2 rounded-xl hover:bg-pink-50 text-pink-700"
                        >
                          <span className="flex items-center gap-2">
                            <Instagram className="w-4 h-4" />
                            <span>Instagram ({negocio.instagram})</span>
                          </span>
                          <ExternalLink className="w-3.5 h-3.5 text-pink-400" />
                        </a>
                      )}

                      {negocio.facebook && (
                        <a
                          href={
                            negocio.facebook.startsWith('http')
                              ? negocio.facebook
                              : `https://facebook.com/${negocio.facebook}`
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-between p-2 rounded-xl hover:bg-blue-50 text-blue-800"
                        >
                          <span className="flex items-center gap-2">
                            <Facebook className="w-4 h-4" />
                            <span>Facebook</span>
                          </span>
                          <ExternalLink className="w-3.5 h-3.5 text-blue-400" />
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* LIGHTBOX MODAL DE PANTALLA COMPLETA */}
      {lightboxAbierto && (
        <div className="fixed inset-0 z-50 bg-black/95 flex flex-col items-center justify-center p-4">
          <button
            type="button"
            onClick={() => setLightboxAbierto(false)}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/20 text-white hover:bg-white/30 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>

          <div className="relative max-w-5xl max-h-[85vh] w-full h-[70vh]">
            <Image
              src={imagenActualUrl}
              alt="Pantalla completa"
              fill
              className="object-contain"
            />
          </div>

          <div className="mt-4 flex items-center gap-4 text-white text-xs">
            {imagenes.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={() =>
                    setImagenActiva((i) => (i === 0 ? imagenes.length - 1 : i - 1))
                  }
                  className="p-2 rounded-full bg-white/20 hover:bg-white/30"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <span>
                  {imagenActiva + 1} de {imagenes.length}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setImagenActiva((i) => (i === imagenes.length - 1 ? 0 : i + 1))
                  }
                  className="p-2 rounded-full bg-white/20 hover:bg-white/30"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </>
            )}
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
