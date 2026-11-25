import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Directorio Empresarial Tu Palabra | Iglesia Cristiana Tu Palabra',
  description:
    'Directorio comercial y de emprendimientos de la Iglesia Cristiana Tu Palabra en Colombia. Descubre y apoya a empresarios, negocios y profesionales de nuestra comunidad.',
  keywords: [
    'Iglesia Tu Palabra',
    'Directorio Empresarial',
    'Emprendimientos Cristianos',
    'Colombia',
    'Negocios Iglesia Cristiana',
    'Bogotá',
  ],
  authors: [{ name: 'Iglesia Cristiana Tu Palabra' }],
  openGraph: {
    title: 'Directorio Empresarial Tu Palabra',
    description:
      'Directorio comercial y de emprendimientos de la Iglesia Cristiana Tu Palabra en Colombia.',
    type: 'website',
    locale: 'es_CO',
    images: [
      {
        url: '/brand/logo-tupalabra-azul.png',
        width: 1200,
        height: 560,
        alt: 'Directorio Empresarial Tu Palabra - Un Encuentro de Gracia',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Directorio Empresarial Tu Palabra • Un Encuentro de Gracia',
    description:
      'Directorio comercial y de emprendimientos de la Iglesia Cristiana Tu Palabra en Colombia.',
    images: ['/brand/logo-tupalabra-azul.png'],
  },
  icons: {
    icon: '/brand/favicon.png',
    shortcut: '/brand/favicon.png',
    apple: '/brand/icon-192.png',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className="scroll-smooth">
      <body suppressHydrationWarning className="min-h-screen bg-[#f8fbfb] text-gray-900 antialiased font-sans">
        {children}
      </body>
    </html>
  );
}
