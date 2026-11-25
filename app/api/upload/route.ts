import { NextRequest, NextResponse } from 'next/server';
import { subirImagenBlob } from '@/lib/storage/blob';

// Tamaño máximo: 5 MB
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const negocioId = (formData.get('negocioId') as string) || 'temp';

    if (!file) {
      return NextResponse.json({ error: 'No se envió ningún archivo de imagen.' }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'El archivo excede el tamaño máximo permitido de 5 MB.' },
        { status: 400 }
      );
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Formato no permitido. Solo se aceptan imágenes JPG, PNG o WebP.' },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Verificación de cabeceras de bytes mágicos reales
    const esJpeg = buffer[0] === 0xff && buffer[1] === 0xd8;
    const esPng = buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47;
    const esWebp =
      buffer[0] === 0x52 &&
      buffer[1] === 0x49 &&
      buffer[2] === 0x46 &&
      buffer[3] === 0x46 &&
      buffer[8] === 0x57 &&
      buffer[9] === 0x45 &&
      buffer[10] === 0x42 &&
      buffer[11] === 0x50;

    if (!esJpeg && !esPng && !esWebp) {
      return NextResponse.json(
        { error: 'El archivo no es una imagen válida o está corrupto.' },
        { status: 400 }
      );
    }

    const resultado = await subirImagenBlob(buffer, file.name, negocioId);

    return NextResponse.json({
      success: true,
      url: resultado.url,
      pathname: resultado.pathname,
    });
  } catch (error) {
    console.error('Error en endpoint de subida:', error);
    return NextResponse.json(
      { error: 'Error al procesar y almacenar la imagen.' },
      { status: 500 }
    );
  }
}
