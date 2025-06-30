export const sleep = (ms = 0) => {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/** Validation */
export const validators = {
  email: (v: string) => {
    const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return pattern.test(v) || 'Por favor, introduzca un correo válido.'
  },
  required: (v: any) => !!v || 'Campo requerido.',
}

//SE DEBE USAR  i18n