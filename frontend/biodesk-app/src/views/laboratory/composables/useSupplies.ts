// Composable para manejar los insumos del formulario de examen

// Recibe el estado reactivo del formulario de examen como argumento
export function useSupplies(examForm: any) {
  // Agrega un insumo a la lista si no está repetido y limpia el input
  function addSupplies() {
    const value = examForm.newSupply?.trim()
    if (value && !examForm.supplies.includes(value)) {
      examForm.supplies.push(value)
      examForm.newSupply = '' // Limpia el input después de agregar
    }
  }

  // Elimina un insumo de la lista por índice
  function removeSupply(index: number) {
    examForm.supplies.splice(index, 1)
  }

  // Exporta las funciones para ser usadas en el formulario
  return { addSupplies, removeSupply }
}