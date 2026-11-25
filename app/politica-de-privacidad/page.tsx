import Link from 'next/link';
import { ArrowLeft, Shield, Lock, CheckCircle2 } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export const metadata = {
  title: 'Política de Privacidad y Tratamiento de Datos | Directorio Tu Palabra',
  description:
    'Política de tratamiento de datos personales y autorización según la Ley 1581 de 2012 (Habeas Data Colombia) para el Directorio Empresarial Tu Palabra.',
};

export default function PoliticaPrivacidadPage() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />

      <main className="flex-1 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xs border border-gray-100 p-8 sm:p-12">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-blue-700 hover:text-blue-800 mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver al inicio
          </Link>

          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-blue-50 text-blue-700 rounded-xl">
              <Shield className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
                Política de Tratamiento de Datos Personales
              </h1>
              <p className="text-sm text-gray-500">
                En cumplimiento de la Ley Estatutaria 1581 de 2012 y el Decreto 1377 de 2013 (Colombia)
              </p>
            </div>
          </div>

          <div className="prose prose-blue max-w-none text-gray-700 space-y-6 text-sm sm:text-base leading-relaxed">
            <section className="bg-blue-50/50 border border-blue-100 rounded-xl p-5">
              <h2 className="text-base font-semibold text-blue-900 mb-2 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-blue-600 shrink-0" />
                Resumen de la Autorización
              </h2>
              <p className="text-blue-800 text-sm">
                Al registrar tu emprendimiento o empresa en el <strong>Directorio Empresarial Tu Palabra</strong>, autorizas de manera previa, libre, expresa e informada a la Iglesia Cristiana Tu Palabra para recolectar, almacenar y publicar tus datos de contacto comercial (nombre comercial, teléfono, dirección, ciudad, redes sociales y catálogo) con fines exclusivos de visibilización e intermediación comunitaria. Tu documento de identidad o NIT se almacena de forma privada para fines internos y nunca se expone al público.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-bold text-gray-900">1. Responsable del Tratamiento</h3>
              <p>
                <strong>Iglesia Cristiana Tu Palabra</strong>, con sede en Colombia, portal oficial de divulgación y contacto:{' '}
                <a
                  href="https://www.instagram.com/iglesiatupalabra"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  instagram.com/iglesiatupalabra
                </a>.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-bold text-gray-900">2. Finalidad del Tratamiento de los Datos</h3>
              <p>Los datos solicitados a través de esta plataforma tienen los siguientes propósitos:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>
                  <strong>Publicación en el directorio:</strong> Divulgar públicamente los servicios, productos y vías de contacto directo (WhatsApp, llamada, correo, redes sociales) para facilitar que miembros y público general consuman de sus negocios.
                </li>
                <li>
                  <strong>Moderación comunitaria:</strong> Validar la autenticidad del negocio y asegurar el cumplimiento de valores cristianos y éticos.
                </li>
                <li>
                  <strong>Comunicaciones:</strong> Notificar vía correo electrónico o WhatsApp sobre el estado de la aprobación o novedades del directorio empresarial.
                </li>
              </ul>
            </section>

            <section>
              <h3 className="text-lg font-bold text-gray-900">3. Tratamiento de Datos Privados y Sensibles</h3>
              <p>
                El número de identificación (cédula de ciudadanía o NIT del responsable) es recolectado exclusivamente con fines de validación administrativa y auditoría interna. <strong>Este dato tiene carácter estrictamente confidencial y bajo ninguna circunstancia se publicará en el directorio público</strong> ni será cedido a terceros con fines comerciales ajenos.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-bold text-gray-900">4. Derechos del Titular (Habeas Data)</h3>
              <p>Como titular de los datos, te asisten los derechos previstos en la Ley 1581 de 2012:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Conocer, actualizar y rectificar tus datos personales en cualquier momento.</li>
                <li>Solicitar prueba de la autorización otorgada.</li>
                <li>Revocar la autorización o solicitar la supresión definitiva de tu negocio del directorio cuando así lo decidas.</li>
                <li>Acceder de forma gratuita a los datos personales que hayan sido objeto de tratamiento.</li>
              </ul>
            </section>

            <section>
              <h3 className="text-lg font-bold text-gray-900">5. Canales para Ejercer tus Derechos</h3>
              <p>
                Para solicitar la actualización, corrección o eliminación definitiva de tu negocio del directorio, puedes comunicarte con el equipo de administración de la iglesia a través del canal oficial de Instagram o correo de administración: <code>jhocamolu2010@gmail.com</code> indicando el nombre del negocio registrado.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-bold text-gray-900">6. Seguridad de la Información</h3>
              <p>
                Implementamos estándares modernos de seguridad informática, incluyendo cifrado de contraseñas con bcrypt (factor de trabajo 12), tokens seguros JWT, cookies con directiva HttpOnly y SameSite estricto, protección contra inyección SQL parametrizada mediante ORM y limitación de peticiones por dirección IP para prevenir abusos.
              </p>
            </section>

            <div className="pt-6 border-t border-gray-200 text-xs text-gray-500 flex items-center gap-2">
              <Lock className="w-4 h-4 text-gray-400" />
              <span>Última actualización: Octubre de 2026 • República de Colombia</span>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
