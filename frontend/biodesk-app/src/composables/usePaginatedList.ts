import { ref, readonly } from 'vue';

type FetcherFunction<T> = (params: { offset: number, limit: number }) => Promise<{ data: T[], total: number }>;

export function usePaginatedList<T>(fetcher: FetcherFunction<T>, initialLimit = 10) {
  const data = ref<T[]>([]) as import('vue').Ref<T[]>; // Usar ref explícito de Vue a veces ayuda a TS
  const loading = ref(false);
  const loadingMore = ref(false);
  const error = ref<string | null>(null);
  const offset = ref(0);
  const limit = initialLimit;
  const total = ref(0);

  const hasMore = ref(true);

  async function load(isLoadMore = false) {
    if (isLoadMore) {
      loadingMore.value = true;
    } else {
      loading.value = true;
      offset.value = 0;
      data.value = []; // Reiniciar para cargas iniciales
    }
    error.value = null;

    try {
      const res = await fetcher({ offset: offset.value, limit });
      
      // --- LA LÍNEA CORREGIDA ---
      // En lugar de mutar el array con .push(), creamos uno nuevo.
      // Esto es más seguro con la reactividad de Vue y soluciona el error de TypeScript.
      data.value = [...data.value, ...res.data];
      
      total.value = res.total;
      offset.value = data.value.length; // Usamos el length actual para mayor seguridad
      hasMore.value = offset.value < res.total;
    } catch (e: any) {
      console.error('Error fetching list:', e);
      error.value = e.message || 'Ocurrió un error al cargar los datos.';
    } finally {
      loading.value = false;
      loadingMore.value = false;
    }
  }

  // Carga inicial
  load();

  return {
    data: readonly(data),
    loading,
    loadingMore,
    error,
    hasMore,
    total,
    loadMore: () => load(true),
    reload: () => load(false),
  };
}