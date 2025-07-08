<template>
  <div class="p-6 relative">
    <VaCard class="mb-4 shadow-2xl min-w-full" v-if="lab">
      <VaCardTitle class="flex justify-between items-center">
        <div class="flex items-center gap-2">
          <template v-if="!lab.logoPath">
            <svg
              version="1.0"
              xmlns="http://www.w3.org/2000/svg"
              width="48.000000pt"
              height="48.000000pt"
              viewBox="0 0 512.000000 512.000000"
              preserveAspectRatio="xMidYMid meet"
              class="min-w-16 w-16 min-h-16 h-16"
            >
              <g
                transform="translate(0.000000,512.000000) scale(0.100000,-0.100000)"
                fill="#215A6D"
                stroke="none"
              >
                <path
                  d="M2169 5097 c-25 -17 -166 -228 -547 -822 -282 -439 -517 -816 -523
                      -837 -12 -45 1 -102 32 -141 11 -15 47 -43 80 -63 33 -21 58 -40 57 -44 -2 -3
                      -34 -54 -71 -113 -79 -122 -89 -162 -62 -233 15 -39 29 -53 93 -95 41 -27 86
                      -52 99 -55 38 -10 116 1 145 20 14 9 59 68 98 131 l72 113 61 -39 c34 -22 72
                      -42 85 -46 38 -9 112 3 141 24 14 11 120 166 236 346 l209 326 18 -47 c27 -72
                      96 -152 168 -194 206 -121 467 -43 572 170 31 63 33 72 33 179 0 91 3 112 13
                      108 41 -15 177 -121 253 -195 205 -201 336 -451 385 -733 12 -70 15 -132 11
                      -257 -6 -208 -38 -343 -121 -516 -74 -153 -141 -249 -261 -370 -146 -146 -304
                      -248 -488 -313 l-89 -31 -277 0 c-271 0 -279 1 -321 23 -50 26 -90 90 -90 144
                      l0 33 -380 0 -380 0 0 -362 0 -363 1167 2 c827 2 1180 6 1208 14 93 26 188
                      110 234 208 23 49 26 68 26 161 0 98 -2 110 -32 170 -18 36 -45 78 -61 93
                      l-30 29 59 81 c79 110 179 307 227 448 186 539 109 1131 -207 1600 -176 263
                      -425 479 -706 615 -183 89 -225 77 -340 -97 -68 -103 -71 -107 -100 -100 -16
                      3 -60 6 -97 6 -58 0 -65 2 -57 17 5 9 64 101 130 205 67 103 131 208 142 232
                      26 60 17 121 -26 167 -18 19 -169 122 -336 229 l-303 195 -58 0 c-43 0 -65 -6
                      -91 -23z m672 -1310 c74 -49 86 -135 27 -202 -64 -74 -180 -59 -222 28 -28 61
                      -16 116 36 163 45 41 108 45 159 11z m890 -2442 c63 -33 87 -120 50 -181 -20
                      -33 -75 -64 -113 -64 -31 0 -83 33 -105 66 -37 57 -15 135 50 174 39 24 78 25
                      118 5z"
                />
                <path
                  d="M874 2000 c-44 -18 -64 -58 -64 -127 0 -61 2 -67 34 -99 l34 -34 922
                      0 922 0 35 35 c35 35 35 36 31 105 -3 60 -8 74 -31 98 l-27 27 -918 2 c-504 1
                      -927 -2 -938 -7z"
                />
                <path
                  d="M1322 655 c-35 -8 -103 -33 -150 -56 -70 -33 -103 -58 -168 -123
                      -120 -120 -182 -247 -199 -409 l-7 -67 1414 0 1415 0 34 23 c66 44 69 59 69
                      370 l0 277 -1172 -1 c-955 0 -1185 -3 -1236 -14z"
                />
              </g>
            </svg>
          </template>
          <template v-else>
            <!-- Imagen del logo -->
            <img
              :src="logoUrlDinamic"
              alt="Logo del laboratorio"
              class="h-auto object-contain"
              style="width: 48px"
              loading="lazy"
            />
          </template>

          <div class="text-2xl font-bold">
            {{ lab.name }}
          </div>
        </div>
        <VaChip
          :color="lab.status === 'active' ? 'success' : 'danger'"
          size="small"
        >
          {{ lab.status === 'active' ? 'Activo' : 'Inactivo' }}
        </VaChip>
      </VaCardTitle>

      <VaCardContent class="space-y-2">
        <div class="flex flex-col sm:flex-row sm:items-center sm:gap-4">
          <VaIcon name="badge" color="primary" />
          <span class="text-sm text-gray-600">RIF:</span>
          <span class="font-medium">{{ formatRif(lab.rif) }}</span>
        </div>

        <div class="flex flex-col sm:flex-row sm:items-center sm:gap-4">
          <VaIcon name="place" color="primary" />
          <span class="text-sm text-gray-600">Dirección:</span>
          <span class="font-medium">{{ lab.dir }}</span>
        </div>

        <div class="flex flex-col sm:flex-row sm:items-start sm:gap-4">
          <VaIcon name="call" color="primary" class="mt-1" />
          <div>
            <span class="text-sm text-gray-600">Teléfonos:</span>
            <div class="font-medium">
              <VaChip
                v-for="(phone, idx) in lab.phoneNums.filter((p) => p)"
                :key="idx"
                class="items-center mr-2 h-6"
                color="primary"
              >
                <VaIcon name="call" class="mr-1" />
                {{ phone.slice(0, 4) + '-' + phone.slice(4) }}
              </VaChip>
            </div>
          </div>
        </div>

        <div class="flex flex-col sm:flex-row sm:items-center sm:gap-4">
          <VaIcon name="calendar_today" color="primary" />
          <span class="text-sm text-gray-600">Registrado en:</span>
          <span class="font-medium">{{ formatDate(lab.createdAt) }}</span>
        </div>
      </VaCardContent>

      <VaCardActions align="right">
        <VaButton icon="edit" color="primary" @click="onEditLab">
          Editar datos
        </VaButton>
        <VaButton icon="upload" color="info" @click="onOpenUpload">
          Subir logo
        </VaButton>
      </VaCardActions>
    </VaCard>

    <!-- Loading overlay -->
    <div
      v-else-if="loading"
      class="text-center text-gray-500 mt-6 flex justify-center items-center"
    >
      <VaProgressCircle indeterminate size="large" color="primary" />
    </div>

    <!-- Modal editar -->
    <VaModal
      v-model="isEditModalOpen"
      title="Editar laboratorio"
      ok-text="Guardar"
      cancel-text="Cancelar"
      size="large"
      @ok="submitEdit"
      close-button
      blur
    >
      <VaForm ref="editFormRef" class="space-y-3 flex flex-col">
        <!-- Nombre -->
        <VaInput
          v-model="editableForm.name"
          label="Nombre"
          :rules="[validator.validateOnlyLettersAndSpaces]"
        />

        <!-- RIF -->
        <div class="flex flex-wrap gap-2 items-start">
          <VaSelect
            v-model="editableForm.rifType"
            :options="['V', 'J', 'G']"
            class="w-24"
            label="Tipo"
          />
          <VaInput
            v-model="editableForm.rif"
            label="N° RIF"
            :rules="[validator.onlyNumbers, validator.minLengthCi]"
            class="flex-1"
          />
        </div>

        <!-- Teléfonos -->
        <div class="flex flex-wrap gap-2 items-start">
          <VaSelect
            v-model="phoneInput.areaCode"
            :options="areaCodes"
            class="w-24"
            label="Cod área"
            :rules="[phoneAreaCodeValidator]"
          />
          <VaInput
            v-model="phoneInput.number"
            label="N° Teléfono"
            :rules="[phoneNumberValidator]"
            class="flex-1"
            @keyup.enter="addPhone"
          >
            <template #appendInner>
              <VaButton
                icon="add"
                @click="addPhone"
                :disabled="!canAddPhone"
                size="small"
              />
            </template>
          </VaInput>
        </div>
        <!-- Tags de teléfonos añadidos -->
        <div class="flex flex-wrap gap-1" style="min-height: 2rem">
          <VaChip
            v-for="(phone, idx) in editableForm.phoneNums
              .slice(0, 2)
              .filter((p) => p)"
            :key="phone"
            class="items-center"
            color="primary"
          >
            <VaIcon name="call" class="mr-1" />
            {{ phone }}
            <VaButton
              icon="close"
              size="small"
              color="primary"
              class="ml-2"
              round
              @click="removePhone(idx)"
              aria-label="Eliminar teléfono"
              flat
            />
          </VaChip>

          <!-- Botón para mostrar el menú si hay más de 3 teléfonos -->
          <VaMenu
            v-if="editableForm.phoneNums.length > 2"
            v-model="showPhonesMenu"
            :close-on-content-click="false"
            placement="bottom"
          >
            <template #anchor>
              <VaButton
                icon="add"
                color="primary"
                size="small"
                class="w-12"
                aria-label="Ver más teléfonos"
                round
              >
                {{ editableForm.phoneNums.length - 2 }}
              </VaButton>
            </template>
            <div class="flex flex-col gap-1 p-2 min-w-[180px]">
              <VaChip
                v-for="(phone, idx) in editableForm.phoneNums.slice(2)"
                :key="phone"
                class="items-center"
                color="primary"
              >
                <VaIcon name="call" class="mr-2" />
                {{ phone }}
                <VaButton
                  icon="close"
                  size="small"
                  color="primary"
                  class="ml-2"
                  round
                  @click="removePhone(idx + 2)"
                  aria-label="Eliminar teléfono"
                  flat
                />
              </VaChip>
            </div>
          </VaMenu>
        </div>

        <!-- Dirección (DPT dependientes) -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-2">
          <VaSelect
            v-model="dirInput.entity"
            :options="entityOptions"
            track-by="value"
            text-by="label"
            label="Estado"
            searchable
          />
          <VaSelect
            v-model="dirInput.municipality"
            :options="municipalityOptions"
            track-by="value"
            text-by="label"
            label="Municipio"
            searchable
          />
          <VaSelect
            v-model="dirInput.parish"
            :options="parishOptions"
            track-by="value"
            text-by="label"
            label="Parroquia"
            searchable
          />
          <VaSelect
            v-model="dirInput.community"
            :options="communityOptions"
            track-by="value"
            text-by="label"
            label="Comunidad"
            searchable
          />
        </div>
        <VaTextarea
          v-model="dirInput.restDir"
          label="Dirección detallada"
          :min-rows="1"
          :max-rows="2"
        />
      </VaForm>
    </VaModal>

    <!-- Modal subir logo -->
    <VaModal
      v-model="isUploadModalOpen"
      title="Subir logo del laboratorio"
      ok-text="Subir"
      cancel-text="Cancelar"
      size="small"
      @ok="submitLogoUpload"
      close-button
      blur
    >
      <VaFileUpload
        v-model="selectedFile"
        type="gallery"
        dropzone
        :dropZoneText="'Arrastra el logo aqui para subirlo'"
        file-types="svg,png"
        label="Subir logo del laboratorio"
        :max-size="5 * 1024 * 1024"
        class="w-full"
      />
      <small class="text-gray-500 italic">
        Formato PNG o SVG, máximo 512x512 px y 5MB
      </small>
    </VaModal>
  </div>
</template>

<script setup lang="ts">
  import { ref, reactive, onMounted, computed } from 'vue';
  import { labApi } from '@/services/api';
  import dayjs from 'dayjs';
  import { initToast } from '@/services/toast';
  import { useLabStore } from '@/stores/labStore';
  import { formatRif, validateLogoFile, validator } from '@/services/utils';
  import { useCascadingDPT } from '@/composables/useCascadingDPT.ts';
  import { loginApiDPT } from '@/services/apiDPT';
  import { RegisterLabData } from '@/services/interfaces/lab';

  const {
    dirInput,
    entityOptions,
    municipalityOptions,
    parishOptions,
    communityOptions,
    loadEntities,
  } = useCascadingDPT();

  const loading = ref(true);
  const lab = ref<any>(null);
  const selectedFile = ref<File[]>([]);
  const isEditModalOpen = ref(false);
  const isUploadModalOpen = ref(false);
  const editFormRef = ref();
  const showPhonesMenu = ref(false);
  const logoKey = ref(Date.now());

  const editableForm = reactive({
    name: '',
    rif: '',
    rifType: 'J',
    dir: '',
    phoneNums: [] as string[],
  });

  const logoUrlDinamic = computed(() => {
    if (!lab.value?.logoPath) return '';
    // Agregar un query único para evitar caché
    return lab.value.logoPath + '?t=' + logoKey.value;
  });

  const formatDate = (dateStr: string) =>
    dayjs(dateStr).format('DD MMM YYYY HH:mm');

  const areaCodes = ['0414', '0424', '0416', '0426', '0412'];
  const phoneInput = reactive({ areaCode: '0412', number: '' });

  // 🧠 Computed: validación para habilitar botón de agregar teléfono
  const canAddPhone = computed(() => {
    return (
      phoneInput.areaCode &&
      phoneInput.number &&
      validator.onlyNumbers(phoneInput.number) === true &&
      validator.onlyLength7to8(phoneInput.number) === true &&
      !editableForm.phoneNums.includes(
        `${phoneInput.areaCode}-${phoneInput.number}`
      )
    );
  });

  // ➕ Agrega teléfono a la lista
  function addPhone() {
    if (!canAddPhone.value) return;
    const fullPhone = `${phoneInput.areaCode}-${phoneInput.number}`;
    editableForm.phoneNums.push(fullPhone);
    phoneInput.number = '';
  }

  // ❌ Elimina teléfono
  function removePhone(idx: number) {
    editableForm.phoneNums.splice(idx, 1);
  }

  // 🧼 Capitaliza cada palabra en un string
  function capitalizeWords(str: string) {
    return str.toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());
  }

  // 🧾 Formatea dirección uniendo valores seleccionados
  function formatDir(input: typeof dirInput): string {
    const parts = [
      input.entity?.label,
      input.municipality?.label,
      input.parish?.label,
      input.community?.label,
      input.restDir,
    ].filter(Boolean);

    return capitalizeWords(parts.join(', '));
  }

  // ✅ Validadores condicionales para los teléfonos
  const phoneAreaCodeValidator = (v: any) =>
    editableForm.phoneNums.length > 0 ? true : validator.required(v);

  const phoneNumberValidator = (v: string) =>
    editableForm.phoneNums.length > 0
      ? true
      : validator.onlyNumbers(v) === true &&
        validator.onlyLength7to8(v) === true;

  const onEditLab = () => {
    if (!lab.value) return;
    editableForm.name = lab.value.name;
    editableForm.rifType = lab.value.rif?.[0]?.toUpperCase() || 'J';
    editableForm.rif = lab.value.rif?.slice(1) || '';
    editableForm.dir = lab.value.dir;
    editableForm.phoneNums = Array.isArray(lab.value.phoneNums)
      ? [...lab.value.phoneNums]
      : [];
    isEditModalOpen.value = true;
  };

  async function submitEdit() {
    loading.value = true;
    const isValid = await editFormRef.value?.validate?.();
    if (!isValid) return;

    const data: Partial<RegisterLabData> = {
      name: editableForm.name,
      rif: `${editableForm.rifType.toLowerCase()}${editableForm.rif}`,
      phoneNums: editableForm.phoneNums,
      dir: formatDir(dirInput),
    };

    Object.keys(data).forEach((key) => {
      // Elimina si es string vacío, array vacío o null/undefined
      if (
        data[key] === '' ||
        data[key] === null ||
        data[key] === undefined ||
        (Array.isArray(data[key]) && data[key].length === 0)
      ) {
        delete data[key];
      }
    });

    try {
      const response = await labApi.updateLab(data);
      lab.value = response.data;
      useLabStore().setCurrentLab(response.data);

      initToast(
        'Laboratorio actualizado',
        'Cambios guardados correctamente',
        'success'
      );
      isEditModalOpen.value = false;
    } catch (e) {
      initToast('Error', 'No se pudo actualizar', 'danger');
    } finally {
      loading.value = false;
    }
  }

  const onOpenUpload = () => {
    isUploadModalOpen.value = true;
  };

  const submitLogoUpload = async () => {
    loading.value = true;
    const file = selectedFile.value?.[0];
    if (!file) {
      loading.value = false;
      return;
    }
    try {
      await validateLogoFile(file);
      const res = await labApi.uploadLogo(file);
      lab.value.logoPath = res.data.logoUrl;
      logoKey.value = Date.now();
      useLabStore().setCurrentLab({ ...lab.value });
      initToast(
        'Logo actualizado',
        'Se subió el nuevo logo exitosamente',
        'success'
      );
    } catch (e) {
      // El toast de error ya lo maneja validateLogoFile
      console.error('Error al subir logo', e);
      if (!e.message?.includes('Archivo no válido')) {
        initToast('Error', 'No se pudo subir el logo', 'danger');
      }
    } finally {
      loading.value = false;
    }
  };

  onMounted(async () => {
    try {
      const res = await labApi.getDataLab();
      lab.value = res.data;
    } catch (e) {
      console.error('No se pudo cargar el laboratorio', e);
    } finally {
      loading.value = false;
    }

    try {
      await loginApiDPT();
      await loadEntities();
    } catch (e) {
      console.error('Error al cargar datos de API DPT', e);
    }
  });
</script>

<style scoped>
  .va-card {
    max-width: 600px;
    margin: auto;
  }

  ::v-deep(.va-file-upload-list--gallery) {
    display: flex;
    justify-content: center;
    align-items: center;
  }
</style>
