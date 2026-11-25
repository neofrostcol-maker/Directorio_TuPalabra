'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Instagram, Heart, ShieldCheck, Mail, MapPin } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-tupalabra-950 text-gray-300 border-t border-tupalabra-900">
      {/* Sección del Versículo Bíblico */}
      <div className="bg-tupalabra-900/60 border-b border-tupalabra-800/50 py-8 px-4 text-center">
        <div className="max-w-3xl mx-auto">
          <p className="text-base sm:text-lg font-serif italic text-tupalabra-100">
            &ldquo;Encomienda a Jehová tus obras, y tus pensamientos serán afirmados.&rdquo;
          </p>
          <p className="text-xs font-semibold tracking-[0.25em] uppercase text-tupalabra-300 mt-2">
            Proverbios 16:3 • Iglesia Cristiana Tu Palabra
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          {/* Columna 1: Identidad Oficial con Manual de Marca */}
          <div className="md:col-span-2 space-y-4">
            <div className="space-y-3">
              <div className="relative h-12 w-44">
                <Image
                  src="/brand/logo-tupalabra-blanco.png"
                  alt="Iglesia Cristiana Tu Palabra"
                  width={220}
                  height={100}
                  referrerPolicy="no-referrer"
                  className="w-full h-auto object-contain"
                />
              </div>
              <div className="pl-0.5">
                <p className="text-xs font-black uppercase tracking-[0.25em] text-white">
                  Directorio Empresarial
                </p>
                <p className="text-[10px] uppercase tracking-[0.2em] text-tupalabra-300 font-medium mt-0.5">
                  Un Encuentro de Gracia
                </p>
              </div>
            </div>

            <p className="text-sm text-gray-300 max-w-md leading-relaxed">
              Un espacio creado para bendecir, visibilizar y conectar a los emprendedores, profesionales y empresarios de la congregación y comunidad. Apoyémonos mutuamente en fe, gracia y excelencia.
            </p>

            <div className="flex items-center gap-4 pt-1">
              <a
                href="https://www.instagram.com/iglesiatupalabra"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-xs font-medium text-pink-300 hover:text-white transition-colors bg-pink-950/50 border border-pink-800/50 px-3.5 py-1.5 rounded-full"
              >
                <Instagram className="w-4 h-4 text-pink-400" />
                <span>Síguenos en @iglesiatupalabra</span>
              </a>
            </div>
          </div>

          {/* Columna 2: Enlaces Rápidos */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-tupalabra-200 mb-3">
              Navegación
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/" className="hover:text-tupalabra-300 transition-colors">
                  Inicio / Directorio
                </Link>
              </li>
              <li>
                <Link href="/registro" className="hover:text-tupalabra-300 transition-colors">
                  Registrar mi Negocio
                </Link>
              </li>
              <li>
                <Link href="/politica-de-privacidad" className="hover:text-tupalabra-300 transition-colors">
                  Tratamiento de Datos (Habeas Data)
                </Link>
              </li>
              <li>
                <Link href="/admin" className="text-gray-400 hover:text-tupalabra-300 transition-colors">
                  Acceso Administrativo
                </Link>
              </li>
            </ul>
          </div>

          {/* Columna 3: Información & Compromiso */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-tupalabra-200 mb-3">
              Compromiso
            </h4>
            <div className="space-y-2.5 text-xs text-gray-300">
              <div className="flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-tupalabra-400 shrink-0 mt-0.5" />
                <span>Todos los registros son verificados antes de su publicación.</span>
              </div>
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-tupalabra-300 shrink-0 mt-0.5" />
                <span>Colombia • Cobertura nacional y local.</span>
              </div>
              <div className="flex items-start gap-2">
                <Mail className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span>Contacto directo con emprendedores y empresas.</span>
              </div>
            </div>
          </div>
        </div>

        {/* Barra inferior */}
        <div className="border-t border-tupalabra-900 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-400">
          <p>
            © {new Date().getFullYear()} Iglesia Cristiana Tu Palabra • Un Encuentro de Gracia. Todos los derechos reservados.
          </p>
          <div className="flex items-center gap-1.5 text-gray-400">
            <span>Honrando a Dios con excelencia</span>
            <Heart className="w-3.5 h-3.5 text-tupalabra-400 fill-tupalabra-400 mx-0.5" />
          </div>
        </div>
      </div>
    </footer>
  );
}
