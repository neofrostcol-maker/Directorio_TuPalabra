'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import confetti from 'canvas-confetti';
import {
  Building2,
  User,
  Upload,
  X,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Plus,
  ArrowUp,
  ArrowDown,
  Info,
  ShieldCheck,
  Sparkles,
  Search,
  Check,
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { comprimirImagen } from '@/lib/image-compressor';
import { REGEX_TELEFONO_COLOMBIA } from '@/lib/validations/negocio';
import { CATEGORIAS_OFICIALES } from '@/lib/constants/categorias';

interface CategoriaItem {
  id: number;
  nombre: string;
  slug: string;
  descripcion: string;
}

interface ImagenItem {
  id: string;
  url: string;
  previewUrl: string;
  cargando: boolean;
  error?: string;
}

export default function RegistroPage() {
  const [paso, setPaso] = useState<1 | 2 | 3 | 4>(1);
  const [cargandoCategorias, setCargandoCategorias] = useState(false);
  const [listaCategorias, setListaCategorias] = useState<CategoriaItem[]>(CATEGORIAS_OFICIALES);
  const [busquedaCategoria, setBusquedaCategoria] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);

  // Form State
  const [tipo, setTipo] = useState<'empresa' | 'persona_natural'>('empresa');
  const [nombreNegocio, setNombreNegocio] = useState('');
  const [direccion, setDireccion] = useState('');
  const [telefono, setTelefono] = useState('');
  const [correo, setCorreo] = useState('');
  const [descripcionCorta, setDescripcionCorta] = useState('');
  const [descripcionLarga, setDescripcionLarga] = useState('');
  const [responsable, setResponsable] = useState('');
  const [documento, setDocumento] = useState('');
  const [ciudad, setCiudad] = useState('Bogotá');
  const [barrio, setBarrio] = useState('');
  const [sitioWeb, setSitioWeb] = useState('');
  const [instagram, setInstagram] = useState('');
  const [facebook, setFacebook] = useState('');
  const [tiktok, setTiktok] = useState('');
  const [catalogoUrl, setCatalogoUrl] = useState('');
  const [horario, setHorario] = useState('');
  const [anioFundacion, setAnioFundacion] = useState('');
  const [tiposAtencion, setTiposAtencion] = useState<string[]>(['local_fisico']);
  const [serviciosDestacados, setServiciosDestacados] = useState<string[]>([]);
  const [nuevoServicio, setNuevoServicio] = useState('');
  const [promocionMiembros, setPromocionMiembros] = useState('');
  const [esMiembroIglesia, setEsMiembroIglesia] = useState(false);
  const [logoUrl, setLogoUrl] = useState('');
  const [subiendoLogo, setSubiendoLogo] = useState(false);

  // Imágenes (3 a 5)
  const [imagenes, setImagenes] = useState<ImagenItem[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  // Paso 3
  const [categoriasSeleccionadas, setCategoriasSeleccionadas] = useState<number[]>([]);
  const [aceptaDatos, setAceptaDatos] = useState(false);
  const [websiteTrap, setWebsiteTrap] = useState(''); // Honeypot anti-spam

  // Cargar categorías desde el servidor
  useEffect(() => {
    async function cargarCats() {
      try {
        const res = await fetch('/api/categorias');
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            setListaCategorias(data);
          }
        }
      } catch (err) {
        console.warn('Usando lista local de categorías:', err);
      }
    }
    cargarCats();
  }, []);

  // Efecto de confeti en pantalla final
  useEffect(() => {
    if (paso === 4) {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch {}
    }
  }, [paso]);

  // Manejo de atención checklist
  const toggleTipoAtencion = (val: string) => {
    if (tiposAtencion.includes(val)) {
      setTiposAtencion(tiposAtencion.filter((t) => t !== val));
    } else {
      setTiposAtencion([...tiposAtencion, val]);
    }
  };

  // Agregar servicio destacado
  const agregarServicio = () => {
    const val = nuevoServicio.trim();
    if (val && !serviciosDestacados.includes(val) && serviciosDestacados.length < 10) {
      setServiciosDestacados([...serviciosDestacados, val]);
      setNuevoServicio('');
    }
  };

  const eliminarServicio = (val: string) => {
    setServiciosDestacados(serviciosDestacados.filter((s) => s !== val));
  };

  // Subir logo opcional
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setErrorGeneral('El logo no debe superar los 5 MB.');
      return;
    }

    try {
      setErrorGeneral(null);
      setSubiendoLogo(true);
      const comprimido = await comprimirImagen(file, 800, 0.9);
      const formData = new FormData();
      formData.append('file', comprimido);
      formData.append('negocioId', 'logos');

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Error subiendo logo');
      }

      const data = await res.json();
      setLogoUrl(data.url);
    } catch (err: any) {
      setErrorGeneral(err.message || 'Error al procesar el logo.');
    } finally {
      setSubiendoLogo(false);
    }
  };

  // Subir fotos del negocio (mínimo 3, máximo 5)
  const handleFotosUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const espacioDisponible = 5 - imagenes.length;
    if (espacioDisponible <= 0) {
      setErrorGeneral('Ya alcanzaste el límite máximo de 5 fotos.');
      return;
    }

    setErrorGeneral(null);
    const archivosAProcesar = files.slice(0, espacioDisponible);

    for (const file of archivosAProcesar) {
      if (file.size > 5 * 1024 * 1024) {
        setErrorGeneral(`La imagen "${file.name}" excede los 5 MB permitidos.`);
        continue;
      }

      const tempId = Math.random().toString(36).substring(2);
      const previewUrl = URL.createObjectURL(file);

      // Agregar como cargando
      setImagenes((prev) => [
        ...prev,
        {
          id: tempId,
          url: '',
          previewUrl,
          cargando: true,
        },
      ]);

      try {
        const comprimido = await comprimirImagen(file, 1600, 0.85);
        const formData = new FormData();
        formData.append('file', comprimido);
        formData.append('negocioId', 'registro-temporal');

        const res = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || 'Error al subir imagen');
        }

        const data = await res.json();
        setImagenes((prev) =>
          prev.map((img) =>
            img.id === tempId ? { ...img, url: data.url, cargando: false } : img
          )
        );
      } catch (err: any) {
        setImagenes((prev) =>
          prev.map((img) =>
            img.id === tempId
              ? { ...img, cargando: false, error: err.message || 'Fallo de subida' }
              : img
          )
        );
      }
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const eliminarImagen = (index: number) => {
    setImagenes((prev) => prev.filter((_, i) => i !== index));
  };

  const moverImagen = (index: number, direccion: 'arriba' | 'abajo') => {
    const nuevoIndex = direccion === 'arriba' ? index - 1 : index + 1;
    if (nuevoIndex < 0 || nuevoIndex >= imagenes.length) return;

    setImagenes((prev) => {
      const copia = [...prev];
      const temp = copia[index];
      copia[index] = copia[nuevoIndex];
      copia[nuevoIndex] = temp;
      return copia;
    });
  };

  // Toggle categoría con límite estricto de 5
  const toggleCategoria = (id: number) => {
    if (categoriasSeleccionadas.includes(id)) {
      setCategoriasSeleccionadas(categoriasSeleccionadas.filter((c) => c !== id));
    } else {
      if (categoriasSeleccionadas.length >= 5) {
        setErrorGeneral('Puedes seleccionar como máximo 5 categorías para tu negocio.');
        return;
      }
      setCategoriasSeleccionadas([...categoriasSeleccionadas, id]);
    }
  };

  // Validaciones antes de avanzar de paso
  const validarPaso2 = (): boolean => {
    setErrorGeneral(null);

    if (!nombreNegocio.trim() || nombreNegocio.trim().length < 2) {
      setErrorGeneral('El nombre del negocio debe tener al menos 2 caracteres.');
      return false;
    }

    if (!direccion.trim() || direccion.trim().length < 5) {
      setErrorGeneral('Por favor ingresa una dirección clara para tu negocio.');
      return false;
    }

    const telLimpio = telefono.replace(/[\s\-()]/g, '');
    if (!REGEX_TELEFONO_COLOMBIA.test(telLimpio)) {
      setErrorGeneral(
        'Ingresa un número de teléfono o WhatsApp válido en Colombia (ej. 3101234567 o +573101234567).'
      );
      return false;
    }

    const regexEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!regexEmail.test(correo.trim())) {
      setErrorGeneral('Ingresa un correo electrónico válido.');
      return false;
    }

    // Validar imágenes listas
    const imagenesListas = imagenes.filter((img) => img.url && !img.cargando && !img.error);
    if (imagenesListas.length < 3) {
      setErrorGeneral(
        `Has subido ${imagenesListas.length} foto(s). Se requieren como mínimo 3 fotos del negocio (máximo 5).`
      );
      return false;
    }

    if (imagenes.some((img) => img.cargando)) {
      setErrorGeneral('Por favor espera a que todas las fotos terminen de subir.');
      return false;
    }

    return true;
  };

  // Envío final del formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorGeneral(null);

    if (categoriasSeleccionadas.length === 0) {
      setErrorGeneral('Debes seleccionar al menos 1 categoría para tu negocio.');
      return;
    }

    if (categoriasSeleccionadas.length > 5) {
      setErrorGeneral('Solo puedes seleccionar hasta 5 categorías.');
      return;
    }

    if (!aceptaDatos) {
      setErrorGeneral(
        'Debes aceptar los términos y el tratamiento de datos personales conforme a la Ley 1581 de 2012.'
      );
      return;
    }

    const imagenesUrls = imagenes
      .filter((img) => img.url && !img.error)
      .map((img) => img.url);

    if (imagenesUrls.length < 3 || imagenesUrls.length > 5) {
      setErrorGeneral('Debes incluir entre 3 y 5 fotos del negocio.');
      return;
    }

    setEnviando(true);

    try {
      const payload = {
        tipo,
        nombreNegocio,
        direccion,
        telefono,
        correo,
        descripcionCorta,
        descripcionLarga,
        responsable,
        documento,
        ciudad,
        barrio,
        sitioWeb,
        instagram,
        facebook,
        tiktok,
        catalogoUrl,
        horario,
        anioFundacion,
        tiposAtencion,
        serviciosDestacados,
        promocionMiembros,
        esMiembroIglesia,
        logoUrl,
        imagenes: imagenesUrls,
        categoriasIds: categoriasSeleccionadas,
        aceptaDatos: true,
        website_trap: websiteTrap,
      };

      const res = await fetch('/api/negocios', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Error al procesar el registro.');
      }

      setPaso(4); // Pantalla final
    } catch (err: any) {
      setErrorGeneral(err.message || 'Ocurrió un error inesperado al enviar el registro.');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50/70">
      <Navbar />

      <main className="flex-1 py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          {/* Encabezado del Formulario */}
          {paso !== 4 && (
            <div className="text-center mb-8">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-tupalabra-50 text-tupalabra-700 border border-tupalabra-200 mb-3">
                <Sparkles className="w-3.5 h-3.5" />
                Directorio Empresarial • Tu Palabra
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
                Publica tu Negocio o Emprendimiento
              </h1>
              <p className="text-sm text-gray-600 mt-2 max-w-lg mx-auto">
                Forma parte del Directorio Empresarial de la Iglesia Cristiana Tu Palabra y conecta con clientes dentro y fuera de la congregación.
              </p>

              {/* Barra de Progreso en 3 pasos */}
              <div className="mt-8 max-w-md mx-auto">
                <div className="flex items-center justify-between text-xs font-semibold text-gray-600 mb-2">
                  <span className={paso >= 1 ? 'text-tupalabra-700 font-bold' : ''}>1. Tipo</span>
                  <span className={paso >= 2 ? 'text-tupalabra-700 font-bold' : ''}>2. Datos del Negocio</span>
                  <span className={paso >= 3 ? 'text-tupalabra-700 font-bold' : ''}>3. Categorías & Envío</span>
                </div>
                <div className="w-full bg-gray-200 h-2.5 rounded-full overflow-hidden">
                  <div
                    className="bg-tupalabra-700 h-full rounded-full transition-all duration-300 ease-out"
                    style={{
                      width: paso === 1 ? '33.3%' : paso === 2 ? '66.6%' : '100%',
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Mensaje de Error General */}
          {errorGeneral && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-sm flex items-start gap-3 animate-in fade-in">
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Atención:</p>
                <p>{errorGeneral}</p>
              </div>
            </div>
          )}

          {/* Tarjeta Principal del Formulario */}
          <div className="bg-white rounded-2xl shadow-xs border border-gray-100 p-6 sm:p-10">
            {/* Honeypot anti-spam oculto */}
            <div className="hidden" aria-hidden="true">
              <label htmlFor="website_trap">Dejar en blanco</label>
              <input
                type="text"
                id="website_trap"
                name="website_trap"
                value={websiteTrap}
                onChange={(e) => setWebsiteTrap(e.target.value)}
                tabIndex={-1}
                autoComplete="off"
              />
            </div>

            {/* ================= PASO 1: TIPO DE REGISTRO ================= */}
            {paso === 1 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    Paso 1: ¿Cómo deseas registrar tu actividad?
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Selecciona si eres una empresa legalmente constituida o una persona natural con emprendimiento o servicio independiente.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <button
                    type="button"
                    onClick={() => setTipo('empresa')}
                    className={`p-6 rounded-2xl border-2 text-left transition-all flex flex-col justify-between ${
                      tipo === 'empresa'
                        ? 'border-tupalabra-700 bg-tupalabra-50/60 shadow-sm'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                  >
                    <div>
                      <div
                        className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${
                          tipo === 'empresa'
                            ? 'bg-tupalabra-700 text-white'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        <Building2 className="w-6 h-6" />
                      </div>
                      <h3 className="font-bold text-base text-gray-900">Empresa</h3>
                      <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                        Sociedad, SAS, negocio formal o establecimiento con NIT y razón social.
                      </p>
                    </div>
                    <div className="mt-4 flex items-center gap-1.5 text-xs font-semibold text-tupalabra-700">
                      {tipo === 'empresa' ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 text-tupalabra-700" />
                          <span>Seleccionado</span>
                        </>
                      ) : (
                        <span className="text-gray-400">Clic para seleccionar</span>
                      )}
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTipo('persona_natural')}
                    className={`p-6 rounded-2xl border-2 text-left transition-all flex flex-col justify-between ${
                      tipo === 'persona_natural'
                        ? 'border-tupalabra-700 bg-tupalabra-50/60 shadow-sm'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                  >
                    <div>
                      <div
                        className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${
                          tipo === 'persona_natural'
                            ? 'bg-tupalabra-700 text-white'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        <User className="w-6 h-6" />
                      </div>
                      <h3 className="font-bold text-base text-gray-900">Persona Natural</h3>
                      <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                        Emprendedor, profesional independiente, trabajador autónomo u oficio.
                      </p>
                    </div>
                    <div className="mt-4 flex items-center gap-1.5 text-xs font-semibold text-tupalabra-700">
                      {tipo === 'persona_natural' ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 text-tupalabra-700" />
                          <span>Seleccionado</span>
                        </>
                      ) : (
                        <span className="text-gray-400">Clic para seleccionar</span>
                      )}
                    </div>
                  </button>
                </div>

                <div className="pt-4 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setPaso(2)}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-tupalabra-700 hover:bg-tupalabra-800 text-white font-semibold text-sm shadow-sm transition-all"
                  >
                    <span>Continuar a datos del negocio</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* ================= PASO 2: DATOS DEL NEGOCIO ================= */}
            {paso === 2 && (
              <div className="space-y-8">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    Paso 2: Información de tu negocio o servicio
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Los campos marcados con <span className="text-red-500 font-bold">*</span> son obligatorios para la publicación.
                  </p>
                </div>

                {/* Subida del Logo (Opcional) */}
                <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 flex flex-col sm:flex-row items-center gap-4">
                  <div className="relative w-20 h-20 rounded-full border-2 border-dashed border-gray-300 bg-white flex items-center justify-center overflow-hidden shrink-0">
                    {logoUrl ? (
                      <Image
                        src={logoUrl}
                        alt="Logo del negocio"
                        width={80}
                        height={80}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Building2 className="w-8 h-8 text-gray-400" />
                    )}
                  </div>
                  <div className="flex-1 text-center sm:text-left">
                    <p className="text-sm font-semibold text-gray-900">Logo de la marca (Opcional)</p>
                    <p className="text-xs text-gray-500">Formato cuadrado recomendado. Máximo 5 MB.</p>
                    <div className="mt-2 flex items-center gap-2 justify-center sm:justify-start">
                      <input
                        type="file"
                        ref={logoInputRef}
                        accept="image/png,image/jpeg,image/webp"
                        className="hidden"
                        onChange={handleLogoUpload}
                      />
                      <button
                        type="button"
                        disabled={subiendoLogo}
                        onClick={() => logoInputRef.current?.click()}
                        className="text-xs font-medium px-3 py-1.5 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 inline-flex items-center gap-1.5"
                      >
                        {subiendoLogo ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Subiendo logo...</span>
                          </>
                        ) : (
                          <>
                            <Upload className="w-3.5 h-3.5" />
                            <span>{logoUrl ? 'Cambiar logo' : 'Subir logo'}</span>
                          </>
                        )}
                      </button>
                      {logoUrl && (
                        <button
                          type="button"
                          onClick={() => setLogoUrl('')}
                          className="text-xs text-red-600 hover:underline"
                        >
                          Quitar
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Sección 1: Datos Obligatorios */}
                <div className="space-y-4">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-blue-900 border-b border-gray-100 pb-2">
                    Datos Principales Obligatorios
                  </h3>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Nombre del Negocio o Emprendimiento <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={nombreNegocio}
                      onChange={(e) => setNombreNegocio(e.target.value)}
                      placeholder="Ej. Panadería Maná Celestial / Asesorías Contables Gómez"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 text-sm outline-hidden"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Teléfono / WhatsApp <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={telefono}
                        onChange={(e) => setTelefono(e.target.value)}
                        placeholder="Ej. 3101234567 o +57 310 123 4567"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 text-sm outline-hidden"
                      />
                      <p className="text-[11px] text-gray-400 mt-1">
                        Formato colombiano (10 dígitos). Se usará para el botón de WhatsApp directo.
                      </p>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Correo Electrónico <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        value={correo}
                        onChange={(e) => setCorreo(e.target.value)}
                        placeholder="contacto@tunegocio.com"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 text-sm outline-hidden"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Dirección <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={direccion}
                      onChange={(e) => setDireccion(e.target.value)}
                      placeholder="Ej. Carrera 15 # 85-32 / Atención a domicilio en Bogotá"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 text-sm outline-hidden"
                    />
                  </div>
                </div>

                {/* Subida Obligatoria de Fotos (3 a 5) */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700">
                        Fotos del Negocio, Productos o Servicios <span className="text-red-500">*</span>
                      </label>
                      <p className="text-xs text-gray-500">
                        Mínimo 3 fotos, máximo 5 fotos. (JPG, PNG o WebP, máx. 5 MB).
                      </p>
                    </div>
                    <span
                      className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                        imagenes.length >= 3 && imagenes.length <= 5
                          ? 'bg-green-100 text-green-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {imagenes.length} de 5 fotos
                    </span>
                  </div>

                  {/* Galería de imágenes cargadas */}
                  {imagenes.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {imagenes.map((img, idx) => (
                        <div
                          key={img.id}
                          className="relative group border rounded-xl overflow-hidden bg-gray-100 aspect-4/3 flex flex-col justify-between p-1.5"
                        >
                          <Image
                            src={img.previewUrl || img.url}
                            alt={`Foto ${idx + 1}`}
                            fill
                            referrerPolicy="no-referrer"
                            className="object-cover -z-10"
                          />

                          {/* Badge de orden */}
                          <div className="flex items-center justify-between z-10">
                            <span className="bg-black/70 text-white text-[10px] font-bold px-2 py-0.5 rounded-md">
                              {idx === 0 ? 'Foto Principal' : `#${idx + 1}`}
                            </span>
                            <button
                              type="button"
                              onClick={() => eliminarImagen(idx)}
                              className="p-1 rounded-full bg-red-600 text-white hover:bg-red-700 shadow-sm"
                              title="Eliminar foto"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {/* Estado de carga */}
                          {img.cargando && (
                            <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center text-white text-xs gap-1">
                              <Loader2 className="w-5 h-5 animate-spin" />
                              <span>Subiendo...</span>
                            </div>
                          )}

                          {img.error && (
                            <div className="absolute inset-0 bg-red-900/80 flex items-center justify-center text-white text-[10px] p-2 text-center">
                              {img.error}
                            </div>
                          )}

                          {/* Botones de reordenamiento */}
                          <div className="flex items-center justify-end gap-1 z-10 opacity-90 group-hover:opacity-100">
                            {idx > 0 && (
                              <button
                                type="button"
                                onClick={() => moverImagen(idx, 'arriba')}
                                className="p-1 rounded-md bg-white/90 text-gray-800 hover:bg-white text-[10px]"
                                title="Mover hacia arriba"
                              >
                                <ArrowUp className="w-3 h-3" />
                              </button>
                            )}
                            {idx < imagenes.length - 1 && (
                              <button
                                type="button"
                                onClick={() => moverImagen(idx, 'abajo')}
                                className="p-1 rounded-md bg-white/90 text-gray-800 hover:bg-white text-[10px]"
                                title="Mover hacia abajo"
                              >
                                <ArrowDown className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Botón para subir fotos si no ha llegado a 5 */}
                  {imagenes.length < 5 && (
                    <div>
                      <input
                        type="file"
                        ref={fileInputRef}
                        accept="image/png,image/jpeg,image/webp"
                        multiple
                        className="hidden"
                        onChange={handleFotosUpload}
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full py-4 border-2 border-dashed border-blue-300 rounded-xl hover:border-blue-500 hover:bg-blue-50/40 text-blue-700 text-sm font-medium flex flex-col items-center justify-center gap-1.5 transition-colors"
                      >
                        <Upload className="w-5 h-5 text-blue-600" />
                        <span>Seleccionar fotos desde tu dispositivo</span>
                        <span className="text-[11px] text-gray-500">
                          (Puedes seleccionar varias fotos a la vez • Mínimo 3)
                        </span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Sección 2: Datos Opcionales para enriquecer el perfil */}
                <div className="space-y-4 pt-4">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-blue-900 border-b border-gray-100 pb-2">
                    Información Complementaria (Opcional)
                  </h3>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Descripción Corta (Máx. 160 caracteres)
                    </label>
                    <input
                      type="text"
                      maxLength={160}
                      value={descripcionCorta}
                      onChange={(e) => setDescripcionCorta(e.target.value)}
                      placeholder="Resumen atractivo para la tarjeta del directorio..."
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 text-sm outline-hidden"
                    />
                    <span className="text-[10px] text-gray-400 block text-right mt-0.5">
                      {descripcionCorta.length}/160
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Descripción Completa (Máx. 1000 caracteres)
                    </label>
                    <textarea
                      rows={3}
                      maxLength={1000}
                      value={descripcionLarga}
                      onChange={(e) => setDescripcionLarga(e.target.value)}
                      placeholder="Detalla tu experiencia, tus productos, historia o propuesta de valor..."
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 text-sm outline-hidden"
                    />
                    <span className="text-[10px] text-gray-400 block text-right mt-0.5">
                      {descripcionLarga.length}/1000
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Nombre del Responsable o Propietario
                      </label>
                      <input
                        type="text"
                        value={responsable}
                        onChange={(e) => setResponsable(e.target.value)}
                        placeholder="Ej. Juan Pérez"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm outline-hidden"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1">
                        <span>NIT o Cédula</span>
                        <span className="text-[10px] text-amber-700 font-normal bg-amber-50 px-1.5 py-0.5 rounded-sm">
                          Uso interno y privado
                        </span>
                      </label>
                      <input
                        type="text"
                        value={documento}
                        onChange={(e) => setDocumento(e.target.value)}
                        placeholder="Ej. 900.123.456-7"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm outline-hidden"
                      />
                      <p className="text-[11px] text-gray-400 mt-1">
                        Nunca se publicará en el directorio.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Ciudad
                      </label>
                      <input
                        type="text"
                        value={ciudad}
                        onChange={(e) => setCiudad(e.target.value)}
                        placeholder="Bogotá, Medellín, Cali, etc."
                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm outline-hidden"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Barrio o Localidad
                      </label>
                      <input
                        type="text"
                        value={barrio}
                        onChange={(e) => setBarrio(e.target.value)}
                        placeholder="Ej. Chapinero, Suba, Teusaquillo..."
                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm outline-hidden"
                      />
                    </div>
                  </div>

                  {/* Redes y Enlaces */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Instagram (Usuario o Link)
                      </label>
                      <input
                        type="text"
                        value={instagram}
                        onChange={(e) => setInstagram(e.target.value)}
                        placeholder="@minegocio o enlace"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm outline-hidden"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Facebook (Página o Link)
                      </label>
                      <input
                        type="text"
                        value={facebook}
                        onChange={(e) => setFacebook(e.target.value)}
                        placeholder="minegocio o enlace"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm outline-hidden"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        TikTok (Usuario o Link)
                      </label>
                      <input
                        type="text"
                        value={tiktok}
                        onChange={(e) => setTiktok(e.target.value)}
                        placeholder="@minegocio"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm outline-hidden"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Sitio Web Oficial
                      </label>
                      <input
                        type="url"
                        value={sitioWeb}
                        onChange={(e) => setSitioWeb(e.target.value)}
                        placeholder="https://minegocio.com"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm outline-hidden"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Enlace de Catálogo o Menú Digital
                    </label>
                    <input
                      type="url"
                      value={catalogoUrl}
                      onChange={(e) => setCatalogoUrl(e.target.value)}
                      placeholder="https://drive.google.com/... o enlace de menú"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm outline-hidden"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Horario de Atención
                      </label>
                      <input
                        type="text"
                        value={horario}
                        onChange={(e) => setHorario(e.target.value)}
                        placeholder="Lun a Sáb: 8:00 AM - 6:00 PM"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm outline-hidden"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Año de Fundación o Experiencia
                      </label>
                      <input
                        type="text"
                        value={anioFundacion}
                        onChange={(e) => setAnioFundacion(e.target.value)}
                        placeholder="Ej. Desde 2018 / 5 años de trayectoria"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm outline-hidden"
                      />
                    </div>
                  </div>

                  {/* Tipo de atención */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-2">
                      Tipo de Atención (Selecciona los que apliquen)
                    </label>
                    <div className="flex flex-wrap gap-3">
                      {[
                        { id: 'local_fisico', label: 'Local Físico / Tienda' },
                        { id: 'a_domicilio', label: 'A Domicilio' },
                        { id: 'en_linea', label: 'En Línea / Virtual' },
                      ].map((tipoItem) => (
                        <label
                          key={tipoItem.id}
                          className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-medium cursor-pointer transition-colors ${
                            tiposAtencion.includes(tipoItem.id)
                              ? 'bg-blue-50 border-blue-500 text-blue-900'
                              : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={tiposAtencion.includes(tipoItem.id)}
                            onChange={() => toggleTipoAtencion(tipoItem.id)}
                            className="rounded-sm text-blue-600 focus:ring-blue-500"
                          />
                          <span>{tipoItem.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Servicios Destacados (Tags) */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Servicios o Productos Destacados (Etiquetas)
                    </label>
                    <div className="flex gap-2 mb-2">
                      <input
                        type="text"
                        value={nuevoServicio}
                        onChange={(e) => setNuevoServicio(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            agregarServicio();
                          }
                        }}
                        placeholder="Ej. Tortas para bodas, Cambio de aceite, etc."
                        className="flex-1 px-3 py-2 rounded-xl border border-gray-300 text-sm outline-hidden"
                      />
                      <button
                        type="button"
                        onClick={agregarServicio}
                        className="px-3.5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-semibold inline-flex items-center gap-1"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Agregar</span>
                      </button>
                    </div>
                    {serviciosDestacados.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {serviciosDestacados.map((s) => (
                          <span
                            key={s}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-800 rounded-lg text-xs font-medium"
                          >
                            <span>{s}</span>
                            <button
                              type="button"
                              onClick={() => eliminarServicio(s)}
                              className="text-blue-600 hover:text-red-600"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Beneficio o Descuento para Miembros */}
                  <div className="p-4 bg-green-50/60 border border-green-200 rounded-xl space-y-2">
                    <label className="block text-xs font-bold text-green-900">
                      Promoción o Descuento Especial para Miembros de Iglesia Tu Palabra (Opcional)
                    </label>
                    <input
                      type="text"
                      value={promocionMiembros}
                      onChange={(e) => setPromocionMiembros(e.target.value)}
                      placeholder="Ej. 10% de descuento para miembros de la congregación."
                      className="w-full px-3 py-2 rounded-lg border border-green-300 bg-white text-sm outline-hidden"
                    />
                    <p className="text-[11px] text-green-800">
                      Esta promoción destacará de forma visual en la tarjeta de tu negocio en el directorio.
                    </p>
                  </div>

                  {/* Pertenencia a la iglesia */}
                  <div className="pt-2">
                    <label className="flex items-start gap-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={esMiembroIglesia}
                        onChange={(e) => setEsMiembroIglesia(e.target.checked)}
                        className="mt-1 rounded-sm text-blue-600 focus:ring-blue-500 w-4 h-4"
                      />
                      <div>
                        <span className="text-xs font-semibold text-gray-800">
                          Soy miembro o asisto activamente a la Iglesia Cristiana Tu Palabra
                        </span>
                        <p className="text-[11px] text-gray-500">
                          Esto colocará una insignia de verificación de congregante en tu perfil público.
                        </p>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Navegación Paso 2 */}
                <div className="pt-6 border-t border-gray-100 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setPaso(1)}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 text-xs font-semibold"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Atrás</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (validarPaso2()) {
                        setPaso(3);
                      }
                    }}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-tupalabra-700 hover:bg-tupalabra-800 text-white font-semibold text-sm shadow-sm transition-all"
                  >
                    <span>Continuar a categorías</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* ================= PASO 3: CATEGORÍAS & CONFIRMACIÓN ================= */}
            {paso === 3 && (
              <form onSubmit={handleSubmit} className="space-y-8">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    Paso 3: Categorías y Autorización Legal
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Selecciona entre 1 y 5 categorías para clasificar tu negocio.
                  </p>
                </div>

                {/* Contador e Indicador de categorías */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-tupalabra-50/80 p-3.5 rounded-xl border border-tupalabra-200">
                  <div className="flex items-center gap-2 text-xs font-semibold text-tupalabra-900">
                    <Info className="w-4 h-4 text-tupalabra-700 shrink-0" />
                    <span>Selecciona entre 1 y 5 categorías para tu negocio (Mínimo 1, Máximo 5)</span>
                  </div>
                  <span
                    className={`text-xs font-bold px-3 py-1 rounded-full self-start sm:self-auto ${
                      categoriasSeleccionadas.length >= 1 && categoriasSeleccionadas.length <= 5
                        ? 'bg-tupalabra-700 text-white shadow-2xs'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {categoriasSeleccionadas.length} de 5 seleccionadas
                  </span>
                </div>

                {/* Chips de categorías actualmente seleccionadas */}
                {categoriasSeleccionadas.length > 0 && (
                  <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 space-y-2">
                    <p className="text-xs font-bold text-gray-700">
                      Tus categorías elegidas ({categoriasSeleccionadas.length}/5):
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {categoriasSeleccionadas.map((catId) => {
                        const cat = listaCategorias.find((c) => c.id === catId);
                        if (!cat) return null;
                        return (
                          <button
                            key={cat.id}
                            type="button"
                            onClick={() => toggleCategoria(cat.id)}
                            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-tupalabra-700 text-white text-xs font-semibold hover:bg-red-600 transition-colors group shadow-2xs"
                            title="Clic para quitar categoría"
                          >
                            <span>{cat.nombre}</span>
                            <X className="w-3.5 h-3.5 opacity-80 group-hover:opacity-100" />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Buscador de categorías */}
                <div className="relative">
                  <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3 pointer-events-none" />
                  <input
                    type="text"
                    value={busquedaCategoria}
                    onChange={(e) => setBusquedaCategoria(e.target.value)}
                    placeholder="Filtrar categorías (ej. Alimentos, Tecnología, Comercio, Servicios)..."
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 text-xs focus:ring-1 focus:ring-blue-600 outline-hidden bg-white"
                  />
                  {busquedaCategoria && (
                    <button
                      type="button"
                      onClick={() => setBusquedaCategoria('')}
                      className="absolute right-3 top-2.5 text-xs text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Grid de Categorías oficiales */}
                {cargandoCategorias ? (
                  <div className="py-12 flex flex-col items-center justify-center text-gray-500 gap-2">
                    <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                    <span className="text-xs font-medium">Cargando 23 categorías oficiales...</span>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[380px] overflow-y-auto pr-1">
                    {listaCategorias
                      .filter(
                        (c) =>
                          !busquedaCategoria.trim() ||
                          c.nombre.toLowerCase().includes(busquedaCategoria.toLowerCase()) ||
                          c.descripcion.toLowerCase().includes(busquedaCategoria.toLowerCase())
                      )
                      .map((cat) => {
                        const seleccionada = categoriasSeleccionadas.includes(cat.id);
                        const deshabilitada = !seleccionada && categoriasSeleccionadas.length >= 5;

                        return (
                          <label
                            key={cat.id}
                            className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all flex items-start gap-3 select-none ${
                              seleccionada
                                ? 'border-tupalabra-700 bg-tupalabra-50/80 ring-1 ring-tupalabra-700 shadow-2xs'
                                : deshabilitada
                                ? 'border-gray-200 bg-gray-50 opacity-40 cursor-not-allowed'
                                : 'border-gray-200 hover:border-tupalabra-300 hover:bg-gray-50/80'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={seleccionada}
                              disabled={deshabilitada}
                              onChange={() => toggleCategoria(cat.id)}
                              className="mt-0.5 rounded-sm text-tupalabra-700 focus:ring-tupalabra-600 w-4 h-4 cursor-pointer shrink-0"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-1">
                                <p className="text-xs font-bold text-gray-900 leading-tight">
                                  {cat.nombre}
                                </p>
                                {seleccionada && (
                                  <span className="text-[10px] font-bold text-tupalabra-700 bg-tupalabra-100 px-1.5 py-0.5 rounded-sm shrink-0 flex items-center gap-0.5">
                                    <Check className="w-3 h-3 text-tupalabra-700" />
                                    <span>Elegida</span>
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-gray-500 leading-normal line-clamp-2 mt-1">
                                {cat.descripcion}
                              </p>
                            </div>
                          </label>
                        );
                      })}
                  </div>
                )}

                {/* Autorización Legal Obligatoria - Ley 1581 de 2012 */}
                <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 space-y-3">
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      id="aceptaDatos"
                      checked={aceptaDatos}
                      onChange={(e) => setAceptaDatos(e.target.checked)}
                      className="mt-1 rounded-sm text-tupalabra-700 focus:ring-tupalabra-600 w-4 h-4 shrink-0"
                    />
                    <label htmlFor="aceptaDatos" className="text-xs text-gray-700 leading-relaxed cursor-pointer">
                      <span className="font-semibold text-gray-900">
                        Autorización de Tratamiento de Datos Personales (Obligatorio) <span className="text-red-500">*</span>:
                      </span>{' '}
                      En cumplimiento de la Ley 1581 de 2012 (Habeas Data Colombia) y normas concordantes, autorizo de manera libre, previa y voluntaria a la Iglesia Cristiana Tu Palabra para almacenar mis datos y publicar comercialmente la información de contacto de mi negocio en este directorio público. He leído y acepto la{' '}
                      <Link
                        href="/politica-de-privacidad"
                        target="_blank"
                        className="text-tupalabra-700 font-semibold underline hover:text-tupalabra-900"
                      >
                        Política de Privacidad y Tratamiento de Datos
                      </Link>
                      .
                    </label>
                  </div>
                </div>

                {/* Navegación Paso 3 */}
                <div className="pt-6 border-t border-gray-100 flex items-center justify-between">
                  <button
                    type="button"
                    disabled={enviando}
                    onClick={() => setPaso(2)}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 text-xs font-semibold"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Atrás</span>
                  </button>

                  <button
                    type="submit"
                    disabled={enviando || categoriasSeleccionadas.length === 0 || !aceptaDatos}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-green-700 hover:bg-green-800 text-white font-bold text-sm shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {enviando ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Enviando registro...</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4" />
                        <span>Enviar registro para aprobación</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* ================= PASO 4: PANTALLA FINAL DE CONFIRMACIÓN ================= */}
            {paso === 4 && (
              <div className="text-center py-8 space-y-6 animate-in zoom-in-95 duration-300">
                <div className="w-16 h-16 rounded-full bg-green-100 text-green-700 flex items-center justify-center mx-auto shadow-inner">
                  <CheckCircle2 className="w-10 h-10" />
                </div>

                <div className="space-y-2 max-w-lg mx-auto">
                  <h2 className="text-2xl font-extrabold text-gray-900">
                    ¡Tu registro fue recibido y está pendiente de aprobación!
                  </h2>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    Gracias por postular tu negocio en el Directorio Empresarial de la <strong>Iglesia Cristiana Tu Palabra</strong>. Nuestro equipo administrativo revisará la información y te notificaremos al correo <strong>{correo}</strong> una vez sea aprobado.
                  </p>
                </div>

                <div className="bg-blue-50/70 border border-blue-100 p-5 rounded-2xl max-w-md mx-auto text-left text-xs text-blue-950 space-y-2">
                  <p className="font-bold flex items-center gap-1.5 text-blue-900">
                    <Info className="w-4 h-4 text-blue-700" />
                    Resumen de tu solicitud:
                  </p>
                  <p><strong>Negocio:</strong> {nombreNegocio}</p>
                  <p><strong>Tipo:</strong> {tipo === 'empresa' ? 'Empresa' : 'Persona natural'}</p>
                  <p><strong>Teléfono:</strong> {telefono}</p>
                  <p><strong>Fotos subidas:</strong> {imagenes.length} imágenes</p>
                  <p><strong>Categorías:</strong> {categoriasSeleccionadas.length} seleccionadas</p>
                </div>

                <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
                  <Link
                    href="/"
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-semibold text-sm shadow-sm transition-all"
                  >
                    <span>Explorar el Directorio Público</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>

                  <button
                    type="button"
                    onClick={() => {
                      setPaso(1);
                      setNombreNegocio('');
                      setDireccion('');
                      setTelefono('');
                      setCorreo('');
                      setImagenes([]);
                      setCategoriasSeleccionadas([]);
                      setAceptaDatos(false);
                    }}
                    className="w-full sm:w-auto px-5 py-3 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 text-xs font-semibold"
                  >
                    Registrar otro negocio
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
