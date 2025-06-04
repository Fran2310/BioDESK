/**
 * Valida que todas las variables de entorno requeridas estén definidas.
 *
 * @param requiredVars - Arreglo de nombres de variables de entorno a verificar.
 * @throws Error si alguna variable requerida no está definida en process.env.
 */
export function validateEnvVars(requiredVars: string[]) {
  /**
   * Funcion para validar variabls de entorno, esta preparado para validar varias a la vez
   */
  const missing = requiredVars.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(
      `❌ Missing required environment variables: ${missing.join(', ')}`,
    );
  }
}
