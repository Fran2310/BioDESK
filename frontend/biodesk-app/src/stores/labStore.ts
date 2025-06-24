import type { LabData, LabsUserData } from '@/services/interfaces/lab';
import { defineStore } from 'pinia';

/**
 * Store global para la gestión de laboratorios del usuario.
 *
 * - labs: Lista de laboratorios asociados al usuario.
 * - currentLab: Laboratorio actualmente seleccionado.
 *
 * Acciones:
 * - setLabs: Actualiza la lista de laboratorios.
 * - setCurrentLab: Selecciona el laboratorio activo.
 * - addLab: Agrega un laboratorio a la lista.
 * - clearLabs: Limpia la lista y el laboratorio seleccionado.
 *
 * Esta store permite centralizar el manejo de laboratorios, facilitando el acceso y la actualización
 * de la información desde cualquier componente de la aplicación.
 */
export const useLabStore = defineStore('lab', {
  state: (): LabsUserData => ({
    labs: [],
    currentLab: null,
  }),

  actions: {
    /**
     * Actualiza la lista de laboratorios del usuario.
     * @param labs Array de laboratorios.
     */
    setLabs(labs: LabData[]) {
      this.labs = labs;
    },
    /**
     * Selecciona el laboratorio activo.
     * @param lab Laboratorio a establecer como actual.
     */
    setCurrentLab(lab: LabData) {
      this.currentLab = lab;
    },
    /**
     * Agrega un laboratorio a la lista.
     * @param lab Laboratorio a agregar.
     */
    addLab(lab: LabData) {
      this.labs.push(lab);
    },
    /**
     * Limpia la lista de laboratorios y el laboratorio seleccionado.
     */
    clearLabs() {
      this.labs = [];
      this.currentLab = null;
    },
  },
});
