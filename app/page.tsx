'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Search,
  Filter,
  Phone,
  MessageCircle,
  Building2,
  User,
  CheckCircle,
  Sparkles,
  MapPin,
  Clock,
  Tag,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  ShoppingBag,
  RotateCcw,
  PlusCircle,
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import LogoTuPalabra from '@/components/LogoTuPalabra';

interface Categoria {
  id: number;
  nombre: string;
  slug: string;
  descripcion: string;
}

interface NegocioPublico {
  id: string;
  tipo: 'empresa' | 'persona_natural';
  nombreNegocio: string;
  direccion: string;
  telefono: string;
  correo: string;
  descripcionCorta: string | null;
  ciudad: string | null;
  barrio: string | null;
  horario: string | null;
  tiposAtencion: string[];
  serviciosDestacados: string[];
  promocionMiembros: string | null;
  esMiembroIglesia: boolean;
  logoUrl: string | null;
  creadoEn: string;
  imagenes: Array<{ id: string; url: string; orden: number }>;
  categorias: Array<{ id: number; nombre: string; slug: string }>;
}

export default function DirectoryHomePage() {
  const [negocios, setNegocios] = useState<NegocioPublico[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [total, setTotal] = useState(0);
  const [cargando, setCargando] = useState(true);

  // Filtros
  const [busqueda, setBusqueda] = useState('');
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState<string>('');
  const [tipoSeleccionado, setTipoSeleccionado] = useState<string>('');
  const [ciudadSeleccionada, setCiudadSeleccionada] = useState<string>('');
  const [soloMiembros, setSoloMiembros] = useState(false);
  const [orden, setOrden] = useState<'recientes' | 'az'>('recientes');
  const [pagina, setPagina] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);

  // Cargar categorías
  useEffect(() => {
    async function fetchCategorias() {
      try {
        const res = await fetch('/api/categorias');
        if (res.ok) {
          const data = await res.json();
          setCategorias(data);
        }
      } catch (err) {
        console.error('Error cargando categorías:', err);
      }
    }
    fetchCategorias();
  }, []);

  // Cargar lista de negocios
  const cargarNegocios = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (busqueda.trim()) params.set('q', busqueda.trim());
      if (categoriaSeleccionada) params.set('categoria', categoriaSeleccionada);
      if (tipoSeleccionado) params.set('tipo', tipoSeleccionado);
      if (ciudadSeleccionada) params.set('ciudad', ciudadSeleccionada);
      if (soloMiembros) params.set('miembro', 'true');
      params.set('orden', orden);
      params.set('pagina', pagina.toString());
      params.set('limite', '12');

      const res = await fetch(`/api/negocios?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setNegocios(data.negocios || []);
        setTotal(data.total || 0);
        setTotalPaginas(data.totalPaginas || 1);
      }
    } catch (err) {
      console.error('Error cargando negocios:', err);
    } finally {
      setCargando(false);
    }
  }, [busqueda, categoriaSeleccionada, tipoSeleccionado, ciudadSeleccionada, soloMiembros, orden, pagina]);

  useEffect(() => {
    cargarNegocios();
  }, [cargarNegocios]);

  // Limpiar filtros
  const limpiarFiltros = () => {
    setBusqueda('');
    setCategoriaSeleccionada('');
    setTipoSeleccionado('');
    setCiudadSeleccionada('');
    setSoloMiembros(false);
    setOrden('recientes');
    setPagina(1);
  };

  // Helper para enlace directo de WhatsApp colombiano
  const getWhatsAppLink = (tel: string, nombreNegocio: string) => {
    const limpio = tel.replace(/[^\d]/g, '');
    const num = limpio.startsWith('57') ? limpio : `57${limpio}`;
    const texto = encodeURIComponent(
      `¡Hola! Vi a "${nombreNegocio}" en el Directorio Empresarial Tu Palabra y me gustaría consultar información sobre sus productos/servicios.`
    );
    return `https://wa.me/${num}?text=${texto}`;
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#f8fbfb]">
      <Navbar />

      <main className="flex-1">
        {/* HERO SECTION CON IDENTIDAD DEL MANUAL DE MARCA */}
        <section className="relative overflow-hidden bg-gradient-to-b from-tupalabra-950 via-tupalabra-900 to-tupalabra-950 text-white py-16 sm:py-24 border-b border-tupalabra-800">
          <div className="absolute inset-0 bg-[radial-gradient(#168b9e_1px,transparent_1px)] [background-size:24px_24px] opacity-15" />

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            {/* Logo oficial en positivo blanco con identificador de Directorio */}
            <div className="flex justify-center mb-6">
              <LogoTuPalabra variant="white" size="lg" showSubtitle={true} />
            </div>

            {/* Badge de identidad y gracia */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-tupalabra-800/80 border border-tupalabra-600/40 text-tupalabra-100 text-xs font-semibold mb-4 shadow-xs backdrop-blur-xs">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Economía del Reino • Comunidad Cristiana • Colombia</span>
            </div>

            {/* Subtítulo inspirador */}
            <p className="mt-2 text-base sm:text-lg text-tupalabra-100 max-w-2xl mx-auto font-normal leading-relaxed">
              Descubre, apoya y conecta con los negocios, emprendimientos y servicios profesionales de los miembros de nuestra congregación y comunidad.
            </p>

            {/* Buscador Integrado en Hero */}
            <div className="mt-8 max-w-2xl mx-auto">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setPagina(1);
                  cargarNegocios();
                }}
                className="flex flex-col sm:flex-row gap-2 bg-white/10 p-2 rounded-2xl border border-white/20 backdrop-blur-md shadow-xl"
              >
                <div className="flex-1 relative flex items-center">
                  <Search className="w-5 h-5 text-tupalabra-300 absolute left-3.5" />
                  <input
                    type="text"
                    value={busqueda}
                    onChange={(e) => {
                      setBusqueda(e.target.value);
                      setPagina(1);
                    }}
                    placeholder="¿Qué producto, servicio o profesional buscas?"
                    className="w-full pl-10 pr-4 py-3 bg-white text-gray-900 rounded-xl text-sm placeholder:text-gray-400 focus:outline-hidden focus:ring-2 focus:ring-tupalabra-500 shadow-inner"
                  />
                </div>
                <button
                  type="submit"
                  className="px-6 py-3 bg-tupalabra-700 hover:bg-tupalabra-600 text-white rounded-xl text-sm font-semibold transition-all shadow-md active:scale-95 flex items-center justify-center gap-2"
                >
                  <Search className="w-4 h-4" />
                  <span>Buscar</span>
                </button>
              </form>
            </div>

            {/* Accesos rápidos & Contador */}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4 text-xs text-tupalabra-200">
              <div className="flex items-center gap-2 bg-tupalabra-900/90 px-4 py-1.5 rounded-full border border-tupalabra-700/60 shadow-xs">
                <ShoppingBag className="w-4 h-4 text-emerald-400" />
                <span>
                  <strong>{total}</strong> negocios activos y verificados
                </span>
              </div>

              <Link
                href="/registro"
                className="flex items-center gap-1.5 text-white bg-emerald-600 hover:bg-emerald-500 px-4 py-1.5 rounded-full font-semibold transition-colors shadow-sm"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Registra tu negocio gratis</span>
              </Link>
            </div>
          </div>
        </section>

        {/* ACCESOS RÁPIDOS A CATEGORÍAS POPULARES */}
        <section className="bg-white border-b border-tupalabra-100 py-3.5 shadow-2xs">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0 scrollbar-none">
              <button
                type="button"
                onClick={() => {
                  setCategoriaSeleccionada('');
                  setPagina(1);
                }}
                className={`text-xs px-3.5 py-1.5 rounded-full shrink-0 font-medium transition-colors ${
                  categoriaSeleccionada === ''
                    ? 'bg-tupalabra-700 text-white shadow-xs'
                    : 'bg-gray-100 text-gray-700 hover:bg-tupalabra-50 hover:text-tupalabra-800'
                }`}
              >
                Todas las Categorías
              </button>

              {categorias.slice(0, 10).map((cat, idx) => (
                <button
                  key={cat.id ?? cat.slug ?? `cat-btn-${idx}`}
                  type="button"
                  onClick={() => {
                    setCategoriaSeleccionada(
                      categoriaSeleccionada === cat.slug ? '' : cat.slug
                    );
                    setPagina(1);
                  }}
                  className={`text-xs px-3.5 py-1.5 rounded-full shrink-0 font-medium transition-colors ${
                    categoriaSeleccionada === cat.slug
                      ? 'bg-tupalabra-700 text-white shadow-xs'
                      : 'bg-gray-100 text-gray-700 hover:bg-tupalabra-50 hover:text-tupalabra-800'
                  }`}
                >
                  {cat.nombre}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* SECCIÓN PRINCIPAL: FILTROS + LISTADO DE NEGOCIOS */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* BARRA LATERAL DE FILTROS */}
            <aside className="w-full lg:w-72 shrink-0 space-y-6">
              <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs space-y-5">
                <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                  <div className="flex items-center gap-2 font-bold text-sm text-gray-900">
                    <Filter className="w-4 h-4 text-tupalabra-700" />
                    <span>Filtros de Búsqueda</span>
                  </div>
                  <button
                    type="button"
                    onClick={limpiarFiltros}
                    className="text-xs text-tupalabra-700 hover:text-tupalabra-900 flex items-center gap-1 font-semibold"
                    title="Restablecer filtros"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Limpiar</span>
                  </button>
                </div>

                {/* Filtro: Categoría completa */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-2">
                    Categoría (23 disponibles)
                  </label>
                  <select
                    value={categoriaSeleccionada}
                    onChange={(e) => {
                      setCategoriaSeleccionada(e.target.value);
                      setPagina(1);
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs text-gray-800 focus:outline-hidden focus:ring-1 focus:ring-tupalabra-700 bg-white"
                  >
                    <option value="">Todas las categorías</option>
                    {categorias.map((c, idx) => (
                      <option key={c.id ?? c.slug ?? `cat-opt-${idx}`} value={c.slug}>
                        {c.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Filtro: Tipo de Registro */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-2">
                    Tipo de Organización
                  </label>
                  <div className="space-y-1.5 text-xs text-gray-700">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="tipo"
                        checked={tipoSeleccionado === ''}
                        onChange={() => {
                          setTipoSeleccionado('');
                          setPagina(1);
                        }}
                        className="text-tupalabra-700 focus:ring-tupalabra-600"
                      />
                      <span>Todos</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="tipo"
                        checked={tipoSeleccionado === 'empresa'}
                        onChange={() => {
                          setTipoSeleccionado('empresa');
                          setPagina(1);
                        }}
                        className="text-tupalabra-700 focus:ring-tupalabra-600"
                      />
                      <span>Empresas</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="tipo"
                        checked={tipoSeleccionado === 'persona_natural'}
                        onChange={() => {
                          setTipoSeleccionado('persona_natural');
                          setPagina(1);
                        }}
                        className="text-tupalabra-700 focus:ring-tupalabra-600"
                      />
                      <span>Personas naturales / Independientes</span>
                    </label>
                  </div>
                </div>

                {/* Filtro: Solo Miembros de Tu Palabra */}
                <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-xl">
                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={soloMiembros}
                      onChange={(e) => {
                        setSoloMiembros(e.target.checked);
                        setPagina(1);
                      }}
                      className="mt-0.5 rounded-sm text-tupalabra-700 focus:ring-tupalabra-600 w-4 h-4"
                    />
                    <div>
                      <span className="text-xs font-bold text-amber-950 block">
                        Miembros de Tu Palabra
                      </span>
                      <span className="text-[11px] text-amber-800 leading-tight block mt-0.5">
                        Mostrar solo negocios vinculados a la congregación.
                      </span>
                    </div>
                  </label>
                </div>

                {/* Filtro: Orden */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-2">
                    Ordenar por
                  </label>
                  <select
                    value={orden}
                    onChange={(e) => {
                      setOrden(e.target.value as any);
                      setPagina(1);
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs text-gray-800 bg-white focus:outline-hidden focus:ring-1 focus:ring-tupalabra-700"
                  >
                    <option value="recientes">Más recientes primero</option>
                    <option value="az">Nombre alfabético (A - Z)</option>
                  </select>
                </div>
              </div>

              {/* Banner de invitación */}
              <div className="bg-gradient-to-br from-tupalabra-800 to-tupalabra-950 text-white p-5 rounded-2xl shadow-xs space-y-3 border border-tupalabra-700/40">
                <h4 className="font-bold text-sm">¿Tienes un negocio o servicio?</h4>
                <p className="text-xs text-tupalabra-100 leading-relaxed">
                  Permite que hermanos en la fe y miles de familias conozcan tu labor. El registro es gratuito y verificado.
                </p>
                <Link
                  href="/registro"
                  className="inline-flex items-center gap-1.5 text-xs font-bold bg-white text-tupalabra-900 px-4 py-2 rounded-xl hover:bg-tupalabra-50 shadow-xs transition-colors"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>Publicar mi negocio</span>
                </Link>
              </div>
            </aside>

            {/* CONTENIDO PRINCIPAL: GRILLA DE TARJETAS */}
            <div className="flex-1 space-y-6">
              {/* Barra superior de resultados */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-gray-200">
                <p className="text-xs text-gray-600">
                  Mostrando <strong className="text-gray-900">{negocios.length}</strong> de{' '}
                  <strong className="text-gray-900">{total}</strong> negocios encontrados
                  {busqueda && (
                    <span>
                      {' '}
                      para &ldquo;<span className="text-tupalabra-700 font-semibold">{busqueda}</span>&rdquo;
                    </span>
                  )}
                </p>

                {(busqueda || categoriaSeleccionada || tipoSeleccionado || soloMiembros) && (
                  <button
                    type="button"
                    onClick={limpiarFiltros}
                    className="text-xs text-tupalabra-700 hover:text-tupalabra-900 font-semibold self-start sm:self-auto"
                  >
                    Quitar filtros activos
                  </button>
                )}
              </div>

              {/* Estado de carga */}
              {cargando && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[1, 2, 3, 4, 5, 6].map((n) => (
                    <div
                      key={n}
                      className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-xs animate-pulse"
                    >
                      <div className="bg-gray-200 aspect-16/10" />
                      <div className="p-5 space-y-3">
                        <div className="h-4 bg-gray-200 rounded-sm w-3/4" />
                        <div className="h-3 bg-gray-200 rounded-sm w-1/2" />
                        <div className="h-12 bg-gray-100 rounded-lg" />
                        <div className="h-8 bg-gray-200 rounded-lg" />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Estado vacío si no hay resultados */}
              {!cargando && negocios.length === 0 && (
                <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-tupalabra-50 text-tupalabra-700 flex items-center justify-center mx-auto">
                    <Search className="w-8 h-8" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">
                    No se encontraron negocios con esos filtros
                  </h3>
                  <p className="text-xs text-gray-500 max-w-md mx-auto">
                    Intenta buscar con otros términos, seleccionar otra categoría o restablecer los filtros para ver todos los negocios publicados.
                  </p>
                  <button
                    type="button"
                    onClick={limpiarFiltros}
                    className="px-4 py-2 bg-tupalabra-700 text-white rounded-xl text-xs font-semibold hover:bg-tupalabra-800"
                  >
                    Restablecer búsqueda
                  </button>
                </div>
              )}

              {/* LISTADO DE TARJETAS */}
              {!cargando && negocios.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {negocios.map((negocio) => {
                    const fotoPrincipal =
                      negocio.imagenes && negocio.imagenes.length > 0
                        ? negocio.imagenes[0].url
                        : 'https://picsum.photos/seed/default/600/400';

                    return (
                      <article
                        key={negocio.id}
                        className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
                      >
                        {/* Cabecera / Foto */}
                        <div>
                          <div className="relative aspect-16/10 bg-gray-100 overflow-hidden">
                            <Image
                              src={fotoPrincipal}
                              alt={negocio.nombreNegocio}
                              fill
                              referrerPolicy="no-referrer"
                              className="object-cover group-hover:scale-105 transition-transform duration-300"
                              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                            />

                            {/* Badges superiores sobre la imagen */}
                            <div className="absolute top-3 inset-x-3 flex items-start justify-between gap-2 z-10 pointer-events-none">
                              {/* Tipo de negocio */}
                              <span className="bg-black/75 backdrop-blur-xs text-white text-[11px] font-semibold px-2.5 py-1 rounded-md flex items-center gap-1 shadow-xs">
                                {negocio.tipo === 'empresa' ? (
                                  <>
                                    <Building2 className="w-3 h-3 text-tupalabra-300" />
                                    <span>Empresa</span>
                                  </>
                                ) : (
                                  <>
                                    <User className="w-3 h-3 text-amber-300" />
                                    <span>Independiente</span>
                                  </>
                                )}
                              </span>

                              {/* Distintivo de miembro de la iglesia */}
                              {negocio.esMiembroIglesia && (
                                <span className="bg-tupalabra-700 text-white text-[11px] font-bold px-2.5 py-1 rounded-md flex items-center gap-1 shadow-xs">
                                  <CheckCircle className="w-3 h-3 text-amber-300" />
                                  <span>Iglesia Tu Palabra</span>
                                </span>
                              )}
                            </div>

                            {/* Logo flotante si existe */}
                            {negocio.logoUrl && (
                              <div className="absolute bottom-3 right-3 w-11 h-11 rounded-full border-2 border-white shadow-md bg-white overflow-hidden">
                                <Image
                                  src={negocio.logoUrl}
                                  alt="Logo"
                                  width={44}
                                  height={44}
                                  referrerPolicy="no-referrer"
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            )}
                          </div>

                          {/* Cuerpo de la tarjeta */}
                          <div className="p-5 space-y-3">
                            {/* Chips de Categorías */}
                            {negocio.categorias && negocio.categorias.length > 0 && (
                              <div className="flex flex-wrap gap-1.5">
                                {negocio.categorias.slice(0, 2).map((cat, catIdx) => (
                                  <span
                                    key={cat.id ?? cat.slug ?? `${negocio.id}-cat-${catIdx}`}
                                    className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-tupalabra-50 text-tupalabra-700 border border-tupalabra-200"
                                  >
                                    {cat.nombre}
                                  </span>
                                ))}
                                {negocio.categorias.length > 2 && (
                                  <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-md bg-gray-100 text-gray-600">
                                    +{negocio.categorias.length - 2}
                                  </span>
                                )}
                              </div>
                            )}

                            {/* Nombre del negocio */}
                            <h3 className="font-bold text-base text-gray-900 group-hover:text-tupalabra-700 transition-colors line-clamp-1">
                              <Link href={`/negocio/${negocio.id}`}>
                                {negocio.nombreNegocio}
                              </Link>
                            </h3>

                            {/* Descripción corta */}
                            <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">
                              {negocio.descripcionCorta ||
                                'Comprometidos con la excelencia y el mejor servicio en bendición.'}
                            </p>

                            {/* Ubicación y tipo de atención */}
                            <div className="text-[11px] text-gray-500 space-y-1 pt-1 border-t border-gray-100">
                              <div className="flex items-center gap-1.5 line-clamp-1">
                                <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                                <span>
                                  {negocio.ciudad || 'Colombia'}
                                  {negocio.barrio ? ` • ${negocio.barrio}` : ''}
                                </span>
                              </div>

                              {negocio.horario && (
                                <div className="flex items-center gap-1.5 line-clamp-1">
                                  <Clock className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                                  <span>{negocio.horario}</span>
                                </div>
                              )}
                            </div>

                            {/* Promoción especial para miembros */}
                            {negocio.promocionMiembros && (
                              <div className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-200 text-[11px] text-emerald-950 font-medium flex items-start gap-1.5">
                                <Tag className="w-3.5 h-3.5 text-emerald-700 shrink-0 mt-0.5" />
                                <span className="line-clamp-2">
                                  {negocio.promocionMiembros}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Botones de acción: WhatsApp, Llamar, Ver detalle */}
                        <div className="p-5 pt-0 border-t border-gray-100 mt-2 space-y-2">
                          <div className="grid grid-cols-2 gap-2 pt-3">
                            <a
                              href={getWhatsAppLink(negocio.telefono, negocio.nombreNegocio)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-2xs transition-colors"
                            >
                              <MessageCircle className="w-3.5 h-3.5" />
                              <span>WhatsApp</span>
                            </a>

                            <a
                              href={`tel:${negocio.telefono}`}
                              className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-gray-300 hover:bg-gray-50 text-gray-800 font-semibold text-xs transition-colors"
                            >
                              <Phone className="w-3.5 h-3.5 text-gray-600" />
                              <span>Llamar</span>
                            </a>
                          </div>

                          <Link
                            href={`/negocio/${negocio.id}`}
                            className="w-full inline-flex items-center justify-center gap-1.5 py-2 text-xs font-semibold text-tupalabra-700 hover:text-tupalabra-900 hover:underline"
                          >
                            <span>Ver detalles y galería</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </Link>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}

              {/* PAGINACIÓN */}
              {totalPaginas > 1 && (
                <div className="flex items-center justify-center gap-3 pt-6">
                  <button
                    type="button"
                    disabled={pagina <= 1}
                    onClick={() => setPagina((p) => Math.max(1, p - 1))}
                    className="p-2.5 rounded-xl border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  <span className="text-xs font-semibold text-gray-700">
                    Página {pagina} de {totalPaginas}
                  </span>

                  <button
                    type="button"
                    disabled={pagina >= totalPaginas}
                    onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
                    className="p-2.5 rounded-xl border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
