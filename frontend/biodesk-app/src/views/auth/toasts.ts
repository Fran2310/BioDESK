import { useToast } from 'vuestic-ui';

const { init } = useToast();

export function warningFieldsToast() {
  init({
    title: 'Campos erroneos',
    message: 'Por favor, complete todos los campos en el formato requerido',
    color: 'warning',
    duration: 3000,
    closeable: true,
  });
}

export function successLoginToast() {
  init({
    title: 'Bienvenido',
    message: 'Inicio de sesión exitoso',
    color: 'success',
    duration: 3000,
    closeable: true,
  });
}

export function failedLoginToast(message: string) {
  init({
    title: 'Datos erroneos',
    message,
    color: 'danger',
    duration: 3000,
    closeable: true,
  });
}

export function sessionNotFoundToast() {
  init({
    title: 'Error de Sesion',
    message: 'Sesion no encontrada',
    color: 'danger',
    duration: 3000,
    closeable: true,
  });
}

export function labNotFoundToast() {
  init({
    title: 'Error de Sesion',
    message: 'Laboratorio actual no encontrado, vuelva a iniciar sesion',
    color: 'danger',
    duration: 3000,
    closeable: true,
  });
}

export function errorFileUploadToast(message: string) {
  init({
    title: 'Archivo incorrecto',
    message,
    color: 'warning',
    duration: 4000,
    closeable: true,
  });
}
