import { ref, reactive, watch } from 'vue';
import {
  fetchEntidades,
  fetchMunicipios,
  fetchParroquias,
  fetchComunidades,
} from '@/services/apiDPT';
import type { SelectOptionApiDPT } from '@/services/types/global.type';

export function useCascadingDPT() {
  const entityOptions = ref<SelectOptionApiDPT[]>([]);
  const municipalityOptions = ref<SelectOptionApiDPT[]>([]);
  const parishOptions = ref<SelectOptionApiDPT[]>([]);
  const communityOptions = ref<SelectOptionApiDPT[]>([]);

  const dirInput = reactive({
    entity: null as SelectOptionApiDPT | null,
    municipality: null as SelectOptionApiDPT | null,
    parish: null as SelectOptionApiDPT | null,
    community: null as SelectOptionApiDPT | null,
    restDir: '',
  });

  watch(
    () => dirInput.entity,
    async (newVal) => {
      dirInput.municipality = null;
      dirInput.parish = null;
      dirInput.community = null;
      municipalityOptions.value = [];
      parishOptions.value = [];
      communityOptions.value = [];

      if (newVal) {
        municipalityOptions.value = await fetchMunicipios(newVal.value);
      }
    }
  );

  watch(
    () => dirInput.municipality,
    async (newVal) => {
      dirInput.parish = null;
      dirInput.community = null;
      parishOptions.value = [];
      communityOptions.value = [];

      if (newVal && dirInput.entity) {
        parishOptions.value = await fetchParroquias(
          dirInput.entity.value,
          newVal.value
        );
      }
    }
  );

  watch(
    () => dirInput.parish,
    async (newVal) => {
      dirInput.community = null;
      communityOptions.value = [];

      if (newVal && dirInput.entity && dirInput.municipality) {
        communityOptions.value = await fetchComunidades(
          dirInput.entity.value,
          dirInput.municipality.value,
          newVal.value
        );
      }
    }
  );

  const loadEntities = async () => {
    entityOptions.value = await fetchEntidades();
  };

  return {
    dirInput,
    entityOptions,
    municipalityOptions,
    parishOptions,
    communityOptions,
    loadEntities,
  };
}
