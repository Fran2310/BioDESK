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
  options: {
    take?: number;
    skip?: number;
    where?: Prisma.Args<T, 'findMany'>['where'];
    select?: Prisma.Args<T, 'findMany'>['select'];
    include?: Prisma.Args<T, 'findMany'>['include'];
    omit?: Record<string, boolean>;
    enumFields?: { [fieldName: string]: object };
    inclusive?: boolean; // <- ¡Nuevo!
  } = {},
  searchTerm?: string, // TODO pasar a array y modificar los DTOs
  searchFields?: string[],
): Promise<{ results: T[]; total: number }> {
  try {
    const {
      take = 20,
      skip = 0,
      where,
      enumFields,
      inclusive = false, // default: intersección
      ...restOptions
    } = options;

    if (!searchTerm?.trim() || !searchFields?.length) {
      const [total, results] = await Promise.all([
        model.count({ where }),
        model.findMany({ where, ...restOptions }),
      ]);
      return { results, total };
    }

    const normalizedTerms = searchTerm
      .split(',')
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean);

    const termConditions: any[] = [];

    for (const term of normalizedTerms) {
      const termCondition: any[] = [];

      for (const field of searchFields) {
        const enumType = enumFields?.[field];

        if (enumType) {
          const matchKey = Object.keys(enumType).find(
            (key) => key.toLowerCase() === term,
          );
          if (matchKey) {
            termCondition.push({
              [field]: { equals: (enumType as any)[matchKey] },
            });
          }
        } else {
          // Coincidencia exacta + por palabra
          termCondition.push({
            [field]: {
              equals: term,
              mode: 'insensitive',
            },
          });

          termCondition.push({
            [field]: {
              contains: term,
              mode: 'insensitive',
            },
          });
        }
      }

      if (termCondition.length > 0) {
        termConditions.push({ OR: termCondition });
      }
    }

    if (termConditions.length === 0) {
      return { results: [], total: 0 };
    }

    const baseWhere = where ?? {}; // nunca undefined

    const whereClause: Prisma.Args<T, 'findMany'>['where'] = inclusive
      ? {
          AND: [baseWhere, { OR: termConditions }],
        }
      : {
          AND: [baseWhere, ...termConditions], // ya son objetos AND internos
        };

    const allMatchingResults = await model.findMany({
      where: whereClause,
      ...restOptions,
    });

    const total = allMatchingResults.length;
    const sortedResults = sortByRelevance(
      allMatchingResults,
      searchFields,
      normalizedTerms,
    );
    const paginatedResults = sortedResults.slice(skip, skip + take);

    return {
      results: paginatedResults,
      total,
    };
  } catch (error) {
    // Cacha el error
    console.error('❌ Error en la función intelligentSearch:', error);
    // Relanza el error para que el código que llama a esta función
    // pueda manejarlo. Esto es crucial para la gestión de errores en promesas.
    throw new Error(`Ocurrió un error durante la búsqueda inteligente`);
  }
}

// ====== FUNCIONES INTERNAS ======
/**
 * Ordena los resultados por relevancia basado en múltiples términos
 */
function sortByRelevance<T>(
  items: T[],
  searchFields: string[],
  searchTerms: string[],
): T[] {
  return [...items].sort((a, b) => {
    const aScore = calculateRelevanceScore(a, searchFields, searchTerms);
    const bScore = calculateRelevanceScore(b, searchFields, searchTerms);
    return bScore - aScore; // Mayor puntuación primero
  });
}

/**
 * Calcula un puntaje de relevancia basado en múltiples términos
 */
function calculateRelevanceScore<T>(
  item: T,
  searchFields: string[],
  searchTerms: string[],
): number {
  let score = 0;

  for (const term of searchTerms) {
    for (const field of searchFields) {
      const fieldValue = String((item as any)[field] || '').toLowerCase();

      // Coincidencia exacta
      if (fieldValue === term) score += 100;

      // Coincidencias parciales
      if (fieldValue.includes(term)) score += 10;
      if (fieldValue.startsWith(term)) score += 15;
      if (fieldValue.endsWith(term)) score += 5;

      // Levenshtein similarity
      if (fieldValue.length > 0) {
        const distance = levenshteinDistance(fieldValue, term);
        const maxLength = Math.max(fieldValue.length, term.length);
        const similarity = 1 - distance / maxLength;
        score += similarity * 20;
      }
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
        matrix[j - 1][i - 1] + substitutionCost,
      );
    }
  }

  return matrix[b.length][a.length];
}
