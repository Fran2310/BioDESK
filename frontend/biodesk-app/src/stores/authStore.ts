// /src/stores/authStore.ts

import { defineStore } from 'pinia';

/**
 * Estado de autenticación de la aplicación.
 * - token: almacena el token JWT o de sesión del usuario autenticado.
 */
interface AuthState {
  token: string | null;
}

/**
 * Store de autenticación usando Pinia.
 *
 * Esta store gestiona el token de autenticación del usuario.
 * El token se guarda en sessionStorage para que:
 *  - Se mantenga la sesión mientras la pestaña esté abierta.
 *  - Se elimine automáticamente al cerrar la pestaña o el navegador.
 *
 * Esto es útil para mayor seguridad, ya que el token no persiste si el usuario cierra el navegador,
 * evitando accesos no deseados si otra persona abre la misma máquina después.
 */
export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    token: sessionStorage.getItem('token'),
  }),

  actions: {
    /**
     * Guarda el token en el estado y en sessionStorage.
     * @param token Token de autenticación recibido del backend.
     */
    setToken(token: string) {
      this.token = token;
      sessionStorage.setItem('token', token);
    },

    /**
     * Limpia el token del estado y de sessionStorage.
     */
    clearAuth() {
      this.token = null;
      sessionStorage.removeItem('token');
    },
  },
});
