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
