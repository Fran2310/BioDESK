import { Prisma } from '@prisma/client-lab';

/**
 * Realiza una búsqueda inteligente en un modelo Prisma
 * @param model - Modelo Prisma (ej: prisma.patient)
 * @param searchTerm - Término de búsqueda
 * @param searchFields - Campos donde buscar
 * @param options - Opciones adicionales (paginación, etc)
 * @returns Resultados ordenados por relevancia
 */

export async function intelligentSearch<T>(
  model: {
    count: (args?: any) => Promise<number>;
    findMany: (args?: any) => Promise<T[]>;
  },
  searchTerm: string,
  searchFields: string[],
  // Cambiamos 'limit' y 'offset' por 'take' y 'skip' para ser consistentes con Prisma
  options: {
    take?: number;
    skip?: number;
    where?: Prisma.Args<T, 'findMany'>['where'];
    select?: Prisma.Args<T, 'findMany'>['select'];
    include?: Prisma.Args<T, 'findMany'>['include'];
    omit?: Record<string, boolean>;
  } = {}
): Promise<{ results: T[]; total: number }> {
  const { take = 20, skip = 0, where, ...restOptions } = options;

  if (!searchTerm || searchTerm.trim() === '' || searchFields.length === 0) {
    // Si no hay término de búsqueda O NO HAY CAMPOS DONDE BUSCAR, devuelve una lista vacía
    return { results: [], total: 0 };
  }

  // Normalizar el término de búsqueda
  const normalizedSearchTerm = searchTerm.trim().toLowerCase();
  const searchWords = normalizedSearchTerm.split(/\s+/).filter(Boolean);

  // Construir condiciones de búsqueda
  const searchConditions: any[] = [];
  for (const field of searchFields) {
    // Coincidencia exacta (mayor prioridad)
    searchConditions.push({
      [field]: {
        equals: normalizedSearchTerm,
        mode: 'insensitive',
      },
    });

    for (const word of searchWords) {
      searchConditions.push({
        [field]: {
          contains: word,
          mode: 'insensitive',
        },
      });
    }
  }

  const whereClause: Prisma.Args<T, 'findMany'>['where'] = {
    AND: [
      where || {},
      { OR: searchConditions },
    ],
  };

  // 1. Obtener TODOS los resultados que coinciden con el criterio
  const allMatchingResults = await model.findMany({
    where: whereClause,
    ...restOptions, // Aplicar select, include, omit
  });

  // 2. Obtener el conteo total para la paginación
  const total = allMatchingResults.length;

  // 3. Ordenar TODOS los resultados por relevancia
  const sortedResults = sortByRelevance(allMatchingResults, searchFields, normalizedSearchTerm);

  // 4. Aplicar la paginación (skip/take) a la lista YA ORDENADA
  const paginatedResults = sortedResults.slice(skip, skip + take);

  return {
    results: paginatedResults,
    total,
  };
}

/**
 * Ordena los resultados por relevancia
 */
function sortByRelevance<T>(
  items: T[],
  searchFields: string[],
  searchTerm: string
): T[] {
  return [...items].sort((a, b) => {
    const aScore = calculateRelevanceScore(a, searchFields, searchTerm);
    const bScore = calculateRelevanceScore(b, searchFields, searchTerm);
    return bScore - aScore; // Orden descendente (mayor puntuación primero)
  });
}

/**
 * Calcula la puntuación de relevancia para un item
 */
function calculateRelevanceScore<T>(
  item: T,
  searchFields: string[],
  searchTerm: string
): number {
  let score = 0;
  const searchTermLower = searchTerm.toLowerCase();
  const searchWords = searchTermLower.split(/\s+/).filter(Boolean);

  for (const field of searchFields) {
    const fieldValue = String((item as any)[field] || '').toLowerCase();

    // Puntos por coincidencia exacta
    if (fieldValue === searchTermLower) {
      score += 100;
    }

    // Puntos por coincidencias de palabras
    for (const word of searchWords) {
      if (fieldValue.includes(word)) {
        score += 10;
      }

      if (fieldValue.startsWith(word)) {
        score += 15;
      }

      if (fieldValue.endsWith(word)) {
        score += 5;
      }
    }

    // Puntos adicionales por proximidad (Levenshtein distance)
    if (fieldValue.length > 0) {
      const distance = levenshteinDistance(fieldValue, searchTermLower);
      const maxLength = Math.max(fieldValue.length, searchTermLower.length);
      const similarity = 1 - distance / maxLength;
      score += similarity * 20;
    }
  }

  return score;
}

/**
 * Calcula la distancia de Levenshtein (para búsqueda aproximada)
 */
function levenshteinDistance(a: string, b: string): number {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const matrix = Array(b.length + 1)
    .fill(null)
    .map(() => Array(a.length + 1).fill(null));

  for (let i = 0; i <= a.length; i++) {
    matrix[0][i] = i;
  }

  for (let j = 0; j <= b.length; j++) {
    matrix[j][0] = j;
  }

  for (let j = 1; j <= b.length; j++) {
    for (let i = 1; i <= a.length; i++) {
      const substitutionCost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1,
        matrix[j - 1][i] + 1,
        matrix[j - 1][i - 1] + substitutionCost
      );
    }
  }

  return matrix[b.length][a.length];
}