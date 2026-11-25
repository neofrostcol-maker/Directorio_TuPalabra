import { put, del } from '@vercel/blob';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

export interface UploadResult {
  url: string;
  pathname: string;
}

/**
 * Sube una imagen a Vercel Blob con acceso público.
 * Si no hay token configurado (ej. desarrollo local), almacena localmente en /public/uploads
 */
export async function subirImagenBlob(
  buffer: Buffer,
  nombreArchivoOriginal: string,
  negocioId: string
): Promise<UploadResult> {
  const extension = path.extname(nombreArchivoOriginal).toLowerCase() || '.webp';
  const fileUuid = crypto.randomUUID();
  const blobPathname = `negocios/${negocioId}/${fileUuid}${extension}`;

  // Si tenemos token de Vercel Blob disponible
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    try {
      const blob = await put(blobPathname, buffer, {
        access: 'public',
        addRandomSuffix: false,
      });
      return {
        url: blob.url,
        pathname: blob.pathname,
      };
    } catch (err) {
      console.warn('Error subiendo a Vercel Blob, usando almacenamiento local de respaldo:', err);
    }
  }

  // Almacenamiento local de respaldo para desarrollo / preview
  try {
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'negocios', negocioId);
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const fileName = `${fileUuid}${extension}`;
    const filePath = path.join(uploadDir, fileName);
    fs.writeFileSync(filePath, buffer);

    const localUrl = `/uploads/negocios/${negocioId}/${fileName}`;
    return {
      url: localUrl,
      pathname: blobPathname,
    };
  } catch (error) {
    console.error('Error guardando imagen localmente:', error);
    // Como último recurso para evitar fallos de build/test, data-uri
    const mime = extension === '.png' ? 'image/png' : extension === '.jpg' || extension === '.jpeg' ? 'image/jpeg' : 'image/webp';
    return {
      url: `data:${mime};base64,${buffer.toString('base64')}`,
      pathname: blobPathname,
    };
  }
}

/**
 * Elimina una imagen de Vercel Blob o de almacenamiento local
 */
export async function eliminarImagenBlob(url: string, pathname?: string) {
  if (!url) return;

  // Si es Vercel Blob
  if (process.env.BLOB_READ_WRITE_TOKEN && url.includes('blob.vercel-storage.com')) {
    try {
      await del(url);
      return;
    } catch (error) {
      console.warn('Error eliminando de Vercel Blob:', error);
    }
  }

  // Si es local
  if (url.startsWith('/uploads/')) {
    try {
      const localPath = path.join(process.cwd(), 'public', url.replace(/^\//, ''));
      if (fs.existsSync(localPath)) {
        fs.unlinkSync(localPath);
      }
    } catch (error) {
      console.warn('Error eliminando imagen local:', error);
    }
  }
}
