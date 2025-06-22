// @fileoverview Utility functions for handling authentication data in local storage.
import {useToast } from 'vuestic-ui'
const { init } = useToast()


export function getAuthData() {
  return {
    labId: localStorage.getItem('Id'),
    token: localStorage.getItem('token'),
  };
}


export function ensureAuthContext(labId: string | null, token: string | null): boolean {
  if (!labId) {
    init({ message: 'Debes seleccionar un laboratorio.', color: 'danger' });
    return false;
  }

  if (!token) {
    init({ message: 'Tu sesión ha expirado o es inválida.', color: 'danger' });
    return false;
  }

  return true;
}
