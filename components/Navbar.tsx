'use client';

import Link from 'next/link';
import { useState } from 'react';
import { PlusCircle, Instagram, Menu, X, Shield, Search } from 'lucide-react';
import LogoTuPalabra from '@/components/LogoTuPalabra';

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo y Nombre con Manual de Imagen */}
          <Link href="/" className="group flex items-center">
            <LogoTuPalabra variant="navbar" />
          </Link>

          {/* Enlaces de escritorio */}
          <nav className="hidden md:flex items-center gap-6">
            <Link
              href="/"
              className="text-sm font-medium text-gray-700 hover:text-tupalabra-700 transition-colors flex items-center gap-1.5"
            >
              <Search className="w-4 h-4 text-gray-400 group-hover:text-tupalabra-700" />
              Explorar Directorio
            </Link>

            <a
              href="https://www.instagram.com/iglesiatupalabra"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-semibold text-pink-700 hover:text-pink-800 transition-colors flex items-center gap-1.5 bg-pink-50 hover:bg-pink-100/70 px-3 py-1.5 rounded-full"
            >
              <Instagram className="w-3.5 h-3.5 text-pink-600" />
              <span>@iglesiatupalabra</span>
            </a>

            <Link
              href="/admin"
              className="text-xs font-medium text-gray-500 hover:text-tupalabra-800 transition-colors flex items-center gap-1 px-2.5 py-1.5 rounded-md hover:bg-tupalabra-50"
              title="Acceso Administración"
            >
              <Shield className="w-3.5 h-3.5 text-gray-400" />
              <span>Admin</span>
            </Link>

            <Link
              href="/registro"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-tupalabra-700 hover:bg-tupalabra-800 text-white font-medium text-sm shadow-sm hover:shadow transition-all hover:-translate-y-0.5 active:translate-y-0"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Registra tu Negocio</span>
            </Link>
          </nav>

          {/* Botón Menú móvil */}
          <div className="flex md:hidden items-center gap-2">
            <Link
              href="/registro"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-tupalabra-700 text-white font-medium text-xs shadow-xs"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Registrar</span>
            </Link>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:outline-hidden"
              aria-label="Abrir menú"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Menú Móvil desplegable */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white px-4 pt-3 pb-5 space-y-3 shadow-lg animate-in slide-in-from-top duration-150">
          <Link
            href="/"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-base font-medium text-gray-800 hover:bg-gray-50"
          >
            Explorar Directorio
          </Link>
          <a
            href="https://www.instagram.com/iglesiatupalabra"
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-base font-medium text-pink-700 hover:bg-pink-50"
          >
            <Instagram className="w-5 h-5 text-pink-600" />
            Instagram Iglesia Tu Palabra
          </a>
          <Link
            href="/registro"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-tupalabra-700 hover:bg-tupalabra-800 text-white font-semibold text-sm shadow-xs"
          >
            <PlusCircle className="w-5 h-5" />
            Registrar mi Negocio o Servicio
          </Link>
          <div className="border-t border-gray-100 pt-2">
            <Link
              href="/admin"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-gray-500 hover:text-gray-800"
            >
              <Shield className="w-4 h-4 text-gray-400" />
              Panel de Administración
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
