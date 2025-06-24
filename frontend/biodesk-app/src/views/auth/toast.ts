import { useToast } from 'vuestic-ui';

const { init } = useToast();

export function initToast(title: string, message: string, color: string) {
  init({
    title,
    message,
    color,
    duration: 4000,
    closeable: true,
  });
}

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
