// @fileoverview Utility functions for handling authentication data in local storage.
import { useToast} from '../composables/useToast';

export function getAuthData() {
  return {
    labId: localStorage.getItem('Id'),
    token: localStorage.getItem('token'),
  };
}


const { init: showToast } = useToast();

export function ensureAuthContext(labId: string | null, token: string | null): boolean {
  if (!labId) {
    showToast({ message: 'Debes seleccionar un laboratorio.', color: 'error' });
    return false;
  }

  if (!token) {
    showToast({ message: 'Tu sesión ha expirado o es inválida.', color: 'error' });
    return false;
  }

  return true;
}
