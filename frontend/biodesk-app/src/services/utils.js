export const validator = {
  email: (v) => {
    const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return pattern.test(v) || 'Por favor, introduzca un correo válido.';
  },
  required: (v) => !!v || 'Campo requerido.',
  minLength: (v) => v.length >= 8 || 'Debe tener al menos 8 caracteres.',
  hasUppercase: (v) =>
    /[A-Z]/.test(v) || 'Debe contener al menos una letra mayúscula.',
  hasNumber: (v) => /\d/.test(v) || 'Debe contener al menos un número.',
};
