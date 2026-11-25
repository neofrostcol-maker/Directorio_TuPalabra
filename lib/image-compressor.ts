/**
 * Comprime y redimensiona imágenes en el cliente a un máximo de 1600px
 * preservando la relación de aspecto y convirtiendo a WebP o JPEG de alta calidad.
 */
export async function comprimirImagen(file: File, maxDimension = 1600, calidad = 0.85): Promise<File> {
  return new Promise((resolve, reject) => {
    // Si no es imagen soportada por canvas
    if (!file.type.startsWith('image/')) {
      resolve(file);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = document.createElement('img');
      img.onload = () => {
        let { width, height } = img;

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(file);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        // Preferir WebP si el navegador lo soporta, o JPEG
        const outputMime = file.type === 'image/png' ? 'image/png' : 'image/webp';

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              resolve(file);
              return;
            }
            const extension = outputMime === 'image/png' ? '.png' : '.webp';
            const nuevoNombre = file.name.replace(/\.[^/.]+$/, '') + extension;
            const nuevoArchivo = new File([blob], nuevoNombre, {
              type: outputMime,
              lastModified: Date.now(),
            });
            resolve(nuevoArchivo);
          },
          outputMime,
          calidad
        );
      };
      img.onerror = () => resolve(file);
      img.src = e.target?.result as string;
    };
    reader.onerror = () => resolve(file);
    reader.readAsDataURL(file);
  });
}
