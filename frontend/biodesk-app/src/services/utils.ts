import { errorFileUploadToast } from '@/views/auth/toasts';

export const validator = {
  email: (v: string) => {
    const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return pattern.test(v) || 'Por favor, introduzca un correo válido.';
  },
  required: (v: string) => !!v || 'Campo requerido.',
  minLength: (v: string) =>
    v.length >= 8 || 'Debe tener al menos 8 caracteres.',
  hasUppercase: (v: string) =>
    /[A-Z]/.test(v) || 'Debe contener al menos una letra mayúscula.',
  hasNumber: (v: string) => /\d/.test(v) || 'Debe contener al menos un número.',
  alphanumericUppercase: (v: string) => {
    if (v.length < 6) return 'Debe tener al menos 6 caracteres.';
    if (!/^[A-Z0-9]+$/.test(v))
      return 'Solo se permiten números y letras mayúsculas.';
    return true;
  },
};

export function mapPermissionsFormat(permissions: any[] = []) {
  return permissions.map((perm) => ({
    ...perm,
    actions: Array.isArray(perm.actions)
      ? perm.actions.join(',')
      : perm.actions,
    fields: Array.isArray(perm.fields) ? perm.fields.join(',') : perm.fields,
  }));
}

/**
 * Valida el archivo de logo antes de subirlo.
 * - Solo permite SVG y PNG.
 * - Peso máximo: 5MB.
 * - Dimensiones máximas: 512x512px.
 * @param file Archivo a validar.
 * @throws Error si el archivo no cumple las restricciones.
 */
export async function validateLogoFile(file: File) {
  const allowedTypes = ['image/png', 'image/svg+xml'];
  const maxSize = 5 * 1024 * 1024; // 5MB

  try {
    if (!allowedTypes.includes(file.type)) {
      throw new Error('Solo se permiten archivos PNG o SVG.');
    }
    if (file.size > maxSize) {
      throw new Error('El archivo no debe superar los 5MB.');
    }

    // Validar dimensiones solo para PNG (SVG no tiene dimensiones fijas)
    if (file.type === 'image/png') {
      const img = new Image();
      const url = URL.createObjectURL(file);
      await new Promise<void>((resolve, reject) => {
        img.onload = () => {
          if (img.width > 512 || img.height > 512) {
            reject(new Error('La imagen no debe superar 512x512 píxeles.'));
          } else {
            resolve();
          }
          URL.revokeObjectURL(url);
        };
        img.onerror = () => {
          URL.revokeObjectURL(url);
          reject(new Error('No se pudo leer la imagen.'));
        };
        img.src = url;
      });
    }
  } catch (error: any) {
    errorFileUploadToast(error.message || 'Archivo no válido');
    throw error;
  }
}
