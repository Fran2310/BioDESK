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
    $name: string;
  },
  searchTerm: string,
  searchFields: string[],
  options: {
    limit?: number;
    offset?: number;
    where?: Prisma.Args<T, 'findMany'>['where'];
    select?: Prisma.Args<T, 'findMany'>['select'];
    include?: Prisma.Args<T, 'findMany'>['include'];
    omit?: Record<string, boolean>;
  } = {}
): Promise<{ results: T[]; total: number }> {
  if (!searchTerm || searchTerm.trim() === '') {
    // Si no hay término de búsqueda, devolver todos los resultados
    const [total, results] = await Promise.all([
      model.count({ where: options.where }),
      model.findMany({
        where: options.where,
        skip: options.offset,
        take: options.limit,
        select: options.select,
        include: options.include,
        omit: options.omit,
      }),
    ]);
    return { results, total };
  }

  // Normalizar el término de búsqueda
  const normalizedSearchTerm = searchTerm.trim().toLowerCase();
  const searchWords = normalizedSearchTerm.split(/\s+/).filter(Boolean);

  // Construir condiciones de búsqueda para cada palabra en cada campo
  const searchConditions = [] as any[];

  for (const field of searchFields) {
    for (const word of searchWords) {
      searchConditions.push({
        [field]: {
          contains: word,
          mode: 'insensitive',
        },
      });

      // Condiciones adicionales para campos de texto
      searchConditions.push({
        [field]: {
          startsWith: word,
          mode: 'insensitive',
        },
      });
    }

    // Condición para coincidencia exacta
    searchConditions.push({
      [field]: {
        equals: normalizedSearchTerm,
        mode: 'insensitive',
      },
    });
  }

  // Consulta para obtener resultados
  const whereClause: Prisma.Args<T, 'findMany'>['where'] = {
    AND: [
      options.where || {},
      { OR: searchConditions },
    ],
  };

  const [total, results] = await Promise.all([
    model.count({ where: whereClause }),
    model.findMany({
      where: whereClause,
      skip: options.offset,
      take: options.limit,
      select: options.select,
      include: options.include,
      omit: options.omit,
    }),
  ]);

  // Ordenar resultados por relevancia
  const sortedResults = sortByRelevance(results, searchFields, normalizedSearchTerm);

  return {
    results: sortedResults,
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