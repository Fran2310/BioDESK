/**
 * Genera una URL completa para una base de datos específica, combinando la URL base y el nombre de la base de datos.
 *
 * @param baseUrl - La URL base del servidor.
 * @param dbName - El nombre de la base de datos a agregar al path.
 * @returns La URL resultante como string.
 */
export function generateLabDbUrl(baseUrl: string, dbName: string): string {
  const url = new URL(baseUrl);
  url.pathname = `${url.pathname.replace(/\/$/, '')}/${dbName}`;
  return url.toString();
}
