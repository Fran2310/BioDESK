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
