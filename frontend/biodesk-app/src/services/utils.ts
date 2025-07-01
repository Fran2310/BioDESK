import { errorFileUploadToast } from '@/views/auth/toasts';

export const validator = {
  email: (v: string) => {
    const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return pattern.test(v) || 'Por favor, introduzca un correo válido.';
  },
  required: (v: any) => !!v || 'Campo requerido.',
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
  onlyLetters: (v: string) =>
    /^[A-Za-z]+$/.test(v) || 'Solo se permiten letras.',
  onlyNumbers: (v: string) => /^[0-9]+$/.test(v) || 'Solo se permiten números.',
  minLengthCi: (v: string) => v.length >= 7 || 'Debe tener al menos 7 números.',
  noWhitespace: (v: string) =>
    !/\s/.test(v) || 'No se permiten espacios en blanco.',
  onlyLength7to8: (v: string) =>
    (v.length >= 7 && v.length <= 8) || 'Debe tener entre 7 y 8 digitos.',
  validateOnlyLettersAndSpaces(value) {
    if (!value) return 'El nombre es requerido';
    // Solo letras (mayúsculas/minúsculas) y espacios
    return (
      /^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]+$/.test(value) ||
      'Solo se permiten letras y espacios'
    );
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

/**
 * Formatea el RIF a Letra-numeros-ultimoNumero.
 * @param rif RIF a formatear.
 * @returns RIF formateado.
 */
export function formatRif(rif: string): string {
  // Elimina espacios y guiones
  const clean = rif.replace(/[\s-]/g, '');
  // Extrae la letra inicial (si existe)
  const letterMatch = clean.match(/^[A-Za-z]/);
  const letter = letterMatch ? letterMatch[0].toUpperCase() : 'J';
  // Extrae todos los dígitos
  const digits = clean.replace(/[^0-9]/g, '');
  if (!digits.length) return rif; // Si no hay dígitos, retorna el original

  // Si hay solo 1 dígito, lo pone como último
  if (digits.length === 1) return `${letter}-0-${digits}`;

  // Si hay menos de 9, toma todo menos el último como cuerpo, el último como dígito final
  const cuerpo = digits.length > 1 ? digits.slice(0, -1) : '';
  const ultimo = digits[digits.length - 1];

  return `${letter}-${cuerpo}-${ultimo}`;
}

// Formatea cédulas: separa la letra inicial (si existe) con guion y agrega puntos a los números
export function formatCi(ci: string): string {
  // Elimina espacios, puntos y guiones
  const clean = ci.replace(/[\s.-]/g, '');
  // Si empieza con letra, sepárala
  const letterMatch = clean.match(/^[A-Za-z]/);
  let letter = '';
  let numbers = clean;
  if (letterMatch) {
    letter = letterMatch[0].toUpperCase();
    numbers = clean.slice(1);
  }
  // Agrega puntos cada 3 dígitos desde la derecha
  const formattedNumbers = numbers.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  // Retorna con o sin letra
  return letter ? `${letter}-${formattedNumbers}` : formattedNumbers;
}
