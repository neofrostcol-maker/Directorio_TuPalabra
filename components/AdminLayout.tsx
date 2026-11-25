'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Store,
  History,
  KeyRound,
  LogOut,
  ExternalLink,
  Menu,
  X,
  Shield,
} from 'lucide-react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [cerrandoSesion, setCerrandoSesion] = useState(false);

  const handleLogout = async () => {
    setCerrandoSesion(true);
    try {
      await fetch('/api/admin/logout', { method: 'POST' });
      router.push('/admin/login');
      router.refresh();
    } catch {
      window.location.href = '/admin/login';
    }
  };

  const navItems = [
    {
      href: '/admin',
      label: 'Panel Principal',
      icon: LayoutDashboard,
      active: pathname === '/admin',
    },
    {
      href: '/admin/negocios',
      label: 'Gestión de Negocios',
      icon: Store,
      active: pathname.startsWith('/admin/negocios'),
    },
    {
      href: '/admin/auditoria',
      label: 'Registro de Auditoría',
      icon: History,
      active: pathname === '/admin/auditoria',
    },
    {
      href: '/admin/perfil',
      label: 'Seguridad / Contraseña',
      icon: KeyRound,
      active: pathname === '/admin/perfil',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col md:flex-row">
      {/* BARRA LATERAL (Desktop) */}
      <aside className="hidden md:flex flex-col w-64 bg-tupalabra-950 text-white shrink-0 border-r border-tupalabra-900">
        {/* Cabecera Sidebar con Manual de Imagen */}
        <div className="p-5 border-b border-tupalabra-900 space-y-2">
          <div className="relative h-10 w-36">
            <Image
              src="/brand/logo-tupalabra-blanco.png"
              alt="Logo Tu Palabra"
              width={180}
              height={84}
              referrerPolicy="no-referrer"
              className="w-full h-auto object-contain"
              priority
            />
          </div>
          <div>
            <h2 className="font-bold text-xs uppercase tracking-[0.18em] text-white">Panel de Control</h2>
            <p className="text-[10px] uppercase tracking-[0.15em] text-tupalabra-300">Directorio Empresarial</p>
          </div>
        </div>

        {/* Menú de navegación */}
        <nav className="flex-1 p-4 space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors ${
                  item.active
                    ? 'bg-tupalabra-700 text-white shadow-xs'
                    : 'text-gray-300 hover:text-white hover:bg-tupalabra-900'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Pie Sidebar */}
        <div className="p-4 border-t border-tupalabra-900 space-y-2">
          <Link
            href="/"
            target="_blank"
            className="flex items-center justify-between px-3.5 py-2 rounded-xl text-xs text-tupalabra-200 hover:text-white hover:bg-tupalabra-900 transition-colors"
          >
            <span className="flex items-center gap-2">
              <ExternalLink className="w-4 h-4" />
              <span>Ver Directorio Público</span>
            </span>
          </Link>

          <button
            type="button"
            disabled={cerrandoSesion}
            onClick={handleLogout}
            className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-red-400 hover:text-red-300 hover:bg-red-950/40 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* HEADER MÓVIL */}
      <header className="md:hidden bg-tupalabra-950 text-white p-4 flex items-center justify-between border-b border-tupalabra-900">
        <div className="flex items-center gap-2.5">
          <div className="relative h-8 w-28">
            <Image
              src="/brand/logo-tupalabra-blanco.png"
              alt="Logo"
              width={140}
              height={60}
              referrerPolicy="no-referrer"
              className="w-full h-auto object-contain"
            />
          </div>
          <span className="font-bold text-xs uppercase tracking-wider text-tupalabra-200">Admin</span>
        </div>

        <button
          type="button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 text-gray-300 hover:text-white"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </header>

      {/* Menú Móvil Desplegable */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-tupalabra-950 border-b border-tupalabra-900 p-4 space-y-2">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileMenuOpen(false)}
              className={`block px-3 py-2 rounded-lg text-xs font-semibold ${
                item.active ? 'bg-tupalabra-700 text-white' : 'text-gray-300 hover:bg-tupalabra-900'
              }`}
            >
              {item.label}
            </Link>
          ))}
          <button
            type="button"
            onClick={handleLogout}
            className="w-full text-left px-3 py-2 text-xs font-semibold text-red-400 hover:bg-tupalabra-900 rounded-lg"
          >
            Cerrar Sesión
          </button>
        </div>
      )}

      {/* CONTENIDO PRINCIPAL */}
      <div className="flex-1 flex flex-col min-h-screen overflow-x-hidden">
        {children}
      </div>
    </div>
  );
}
