// Estado reactivo para el formulario de examen (debería ser compartido o recibido como prop/argumento)

export function useSupplies(examForm: any) {
  function addSupplies() {
    const value = examForm.newSupply?.trim()
    if (value && !examForm.supplies.includes(value)) {
      examForm.supplies.push(value)
      examForm.newSupply = '' // Limpia el input después de agregar
    }
  }

  function removeSupply(index: number) {
    examForm.supplies.splice(index, 1)
  }

  return { addSupplies, removeSupply }
}