import { MetadataRoute } from 'next';
import { db } from '@/lib/db';
import { negocios } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.APP_URL || 'http://localhost:3000';

  const paginasEstaticas: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/registro`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/politica-de-privacidad`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
  ];

  try {
    const aprobados = await db
      .select({
        id: negocios.id,
        actualizadoEn: negocios.actualizadoEn,
      })
      .from(negocios)
      .where(eq(negocios.estado, 'aprobado'))
      .all();

    const paginasNegocios: MetadataRoute.Sitemap = aprobados.map((item) => ({
      url: `${baseUrl}/negocio/${item.id}`,
      lastModified: new Date(item.actualizadoEn || Date.now()),
      changeFrequency: 'weekly',
      priority: 0.7,
    }));

    return [...paginasEstaticas, ...paginasNegocios];
  } catch {
    return paginasEstaticas;
  }
}
