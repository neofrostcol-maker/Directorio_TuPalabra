'use client';

import Image from 'next/image';

interface LogoProps {
  /**
   * Variantes según el fondo y contexto:
   * - 'navbar': Logo azul sobre fondo claro con descriptor horizontal del directorio.
   * - 'white': Logo blanco con texto blanco/dorado para fondos oscuros (Hero, Footer, Admin).
   * - 'full': Logo centrado completo con descriptor "Directorio Empresarial" y lema "Un Encuentro de Gracia".
   * - 'emblem': Versión compacta para botones, avatares o móviles.
   * - 'negro': Versión en positivo negro según manual de marca.
   */
  variant?: 'navbar' | 'white' | 'full' | 'emblem' | 'negro';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showSubtitle?: boolean;
  darkBackground?: boolean;
  className?: string;
}

export default function LogoTuPalabra({
  variant = 'navbar',
  size = 'md',
  showSubtitle = true,
  darkBackground = false,
  className = '',
}: LogoProps) {
  // Dimensiones según el tamaño solicitado
  const dimensions = {
    sm: { width: 140, height: 65, emblemSize: 32 },
    md: { width: 190, height: 88, emblemSize: 42 },
    lg: { width: 260, height: 120, emblemSize: 56 },
    xl: { width: 340, height: 158, emblemSize: 72 },
  }[size];

  // Selección del recurso gráfico oficial según variante
  const src =
    variant === 'white' || (variant === 'emblem' && darkBackground)
      ? '/brand/logo-tupalabra-blanco.png'
      : variant === 'negro'
      ? '/brand/logo-tupalabra-negro.png'
      : '/brand/logo-tupalabra-azul.png';

  // Variante solo emblema (icono circular)
  if (variant === 'emblem') {
    return (
      <div
        className={`relative rounded-xl overflow-hidden flex items-center justify-center p-1.5 transition-transform ${
          darkBackground
            ? 'bg-tupalabra-800/80 border border-tupalabra-600/40'
            : 'bg-tupalabra-50 border border-tupalabra-200'
        } ${className}`}
        style={{ width: dimensions.emblemSize, height: dimensions.emblemSize }}
      >
        <Image
          src={src}
          alt="Emblema Iglesia Cristiana Tu Palabra"
          width={dimensions.emblemSize * 2}
          height={dimensions.emblemSize}
          className="object-contain -translate-x-1/4 scale-150"
          priority
        />
      </div>
    );
  }

  // Variante Navbar (Horizontal, balanceado con "DIRECTORIO EMPRESARIAL")
  if (variant === 'navbar') {
    return (
      <div className={`flex items-center gap-3.5 ${className}`}>
        {/* Marca gráfica oficial */}
        <div className="relative h-11 w-32 sm:h-12 sm:w-36 shrink-0 flex items-center">
          <Image
            src="/brand/logo-tupalabra-azul.png"
            alt="Iglesia Tu Palabra - Un Encuentro de Gracia"
            width={180}
            height={84}
            className="w-full h-auto object-contain"
            priority
          />
        </div>

        {/* Separador vertical sutil */}
        <div className="hidden sm:block h-9 w-px bg-tupalabra-200" aria-hidden="true" />

        {/* Descriptor oficial adaptado para el Directorio */}
        <div className="flex flex-col justify-center">
          <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-[0.2em] text-tupalabra-700 leading-none">
            Directorio Empresarial
          </span>
          {showSubtitle && (
            <span className="text-[10px] text-gray-500 font-medium tracking-wider uppercase mt-1 leading-none">
              Un Encuentro de Gracia
            </span>
          )}
        </div>
      </div>
    );
  }

  // Variante Blanca (para Hero dark, Footer y Admin)
  if (variant === 'white') {
    return (
      <div className={`flex flex-col items-center text-center ${className}`}>
        <div className="relative h-16 w-44 sm:h-20 sm:w-56 mb-2">
          <Image
            src="/brand/logo-tupalabra-blanco.png"
            alt="Iglesia Cristiana Tu Palabra"
            width={280}
            height={130}
            className="w-full h-auto object-contain"
            priority
          />
        </div>
        <div className="space-y-1">
          <p className="text-xs sm:text-sm font-black uppercase tracking-[0.28em] text-white">
            Directorio Empresarial
          </p>
          {showSubtitle && (
            <p className="text-[10px] sm:text-[11px] uppercase tracking-[0.22em] text-tupalabra-300 font-medium">
              Un Encuentro de Gracia
            </p>
          )}
        </div>
      </div>
    );
  }

  // Variante Full (Centrada con placa de identidad)
  return (
    <div className={`flex flex-col items-center text-center ${className}`}>
      <div
        className="relative"
        style={{ width: dimensions.width, height: dimensions.height }}
      >
        <Image
          src={src}
          alt="Iglesia Tu Palabra"
          fill
          className="object-contain"
          priority
        />
      </div>
      <div className="mt-2 text-center">
        <h2 className="text-xs sm:text-sm font-black uppercase tracking-[0.25em] text-tupalabra-700">
          Directorio Empresarial
        </h2>
        {showSubtitle && (
          <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500 font-medium mt-0.5">
            Un Encuentro de Gracia
          </p>
        )}
      </div>
    </div>
  );
}
