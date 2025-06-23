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
};
