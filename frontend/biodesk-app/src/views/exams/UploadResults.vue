<script setup lang="ts">
  import { ref, onMounted } from 'vue';
  import { useRoute, useRouter } from 'vue-router';
  import { useToast } from 'vuestic-ui';
  import { medicTestRequestApi, medicTestCatalogApi } from '@/services/api';
  import type { PatchMedicTestRequestData } from '@/services/interfaces/medicTestRequest';

  const route = useRoute();
  const router = useRouter();
  const { init: notify } = useToast();

  const id = Number(route.params.id);

  const request = ref<PatchMedicTestRequestData | null>(null);
  const catalog = ref<any>(null);

  const isLoading = ref(true);
  const error = ref<string | null>(null);

  function goToExams() {
    router.push({ name: 'Exams' });
  }

  const form = ref({
    resultProperties: {} as Record<string, string>,
    observation: '',
  });

  const fetchRequest = async () => {
    try {
      const res = await medicTestRequestApi.getMedicTestRequestById(String(id));
      request.value = res.data;
      form.value.observation = request.value.observation || '';

      await fetchCatalog(res.data.medicTestCatalogId);

      // Inicializar campos dinámicamente desde propiedades del catálogo
      catalog.value.properties.forEach((prop: any) => {
        const propName = String(prop.name); // Asegurar que es string
        form.value.resultProperties[propName] =
          request.value.resultProperties?.[propName] || '';
      });
    } catch (e: any) {
      error.value = e.message || 'Error al cargar los resultados.';
      notify({ message: error.value, color: 'danger' });
    } finally {
      isLoading.value = false;
    }
  };

  const fetchCatalog = async (catalogId: number) => {
    try {
      const res = await medicTestCatalogApi.getMedicTestCatalogById(
        String(catalogId),
        true
      );
      catalog.value = res.data;
    } catch (e: any) {
      error.value = e.message || 'Error al cargar el catálogo.';
      notify({ message: error.value, color: 'danger' });
    }
  };

  onMounted(() => {
    fetchRequest();
  });

  const submitForm = async () => {
    isLoading.value = true;
    error.value = null;

    try {
      const payload = {
        resultProperties: Object.fromEntries(
          Object.entries(form.value.resultProperties).filter(
            ([_, v]) => v.trim() !== ''
          )
        ),
        observation: form.value.observation,
      };

      await medicTestRequestApi.updateMedicTestRequest(String(id), payload);
      await medicTestRequestApi.updateMedicTestRequestState(
        String(id),
        'TO_VERIFY'
      ); // De una vez actualizar su estado

      notify({
        message: 'Resultados actualizados correctamente.',
        color: 'success',
      });
      goToExams();
    } catch (e: any) {
      error.value = e.message || 'Error al actualizar los resultados.';
      notify({ message: error.value, color: 'danger' });
    } finally {
      isLoading.value = false;
    }
  };
</script>

<template>
  <div class="p-6 md:p-10 max-w-5xl mx-auto">
    <h1 class="text-center text-3xl font-bold mb-6 text-primary">
      Subir Resultados del Examen
    </h1>

    <VaCard class="shadow-2xl border border-gray-100 rounded-2xl">
      <VaCardContent>
        <div v-if="isLoading" class="flex justify-center items-center py-20">
          <VaProgressCircle indeterminate size="large" color="primary" />
        </div>

        <div v-else class="space-y-10 animate-fade-in">
          <!-- Result Properties Dinámicos -->
          <div>
            <h2
              class="text-xl font-semibold text-primary mb-4 flex items-center gap-2"
            >
              <i class="va-icon va-icon-lab" /> Parámetros del Examen
            </h2>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div
                v-for="property in catalog?.properties"
                :key="`prop-${property.id}-${property.name}`"
                class="p-5 bg-white border border-gray-200 rounded-xl shadow transition hover:shadow-md"
              >
                <div class="flex justify-between items-center mb-2">
                  <h3 class="font-medium text-lg text-primary">
                    {{ property.name }}
                  </h3>
                  <span
                    v-if="property.unit"
                    class="text-sm text-gray-500 italic"
                  >
                    {{ property.unit }}
                  </span>
                </div>

                <VaInput
                  v-model="form.resultProperties[property.name]"
                  :placeholder="`Ingrese valor de ${property.name}`"
                  type="text"
                  class="mb-2"
                />

                <div
                  v-if="property.valueReferences?.length"
                  class="text-xs text-gray-600 mt-1"
                >
                  <strong>Valores de referencia:</strong>
                  <ul class="list-disc ml-5 mt-1">
                    <li v-for="(ref, i) in property.valueReferences" :key="i">
                      {{ ref.range }} ({{ ref.gender }}, {{ ref.ageGroup }})
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <!-- Notas / Observaciones -->
          <div class="w-full">
            <h2
              class="text-xl font-semibold text-primary mb-2 flex items-center gap-2"
            >
              <i class="va-icon va-icon-edit-note" /> Observaciones
            </h2>

            <VaTextarea
              v-model="form.observation"
              placeholder="Notas adicionales del laboratorio"
              auto-grow
              :rows="4"
              max-length="500"
              class="w-full"
            />
          </div>

          <!-- Acciones -->
          <div class="flex justify-end gap-4 pt-4">
            <VaButton
              color="danger"
              size="medium"
              class="rounded font-semibold"
              @click="router.back()"
            >
              <template #prepend>
                <va-icon name="va-close" class="mr-2" />
              </template>
              Cancelar
            </VaButton>

            <VaButton
              color="primary"
              size="medium"
              class="rounded font-semibold"
              :loading="isLoading"
              @click="submitForm"
            >
              <template #prepend>
                <va-icon name="va-check-circle" class="mr-2" />
              </template>
              Guardar Resultados
            </VaButton>
          </div>
        </div>
      </VaCardContent>
    </VaCard>
  </div>
</template>
