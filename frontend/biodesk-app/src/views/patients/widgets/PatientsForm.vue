<script setup lang="ts">
  import type { PropType } from 'vue';
  import { computed, ref, watch } from 'vue';
  import { useForm } from 'vuestic-ui';

  import type { Patient } from '@/services/types/patientType';
  import { validator } from '../../../services/utils';
  import { useCascadingDPT } from '@/composables/useCascadingDPT.ts';
  import { loginApiDPT } from '@/services/apiDPT';
  import { onMounted } from 'vue';

  function isDate(val: unknown): val is Date {
    return val instanceof Date;
  }

  const props = defineProps({
    patient: {
      type: Object as PropType<Patient | null>,
      default: null,
    },
    saveButtonLabel: {
      type: String,
      default: 'Save',
    },
  });

  // New default user with patient fields
  const defaultNewPatient = {
    id: 0, // will be filled later
    ci: '',
    name: '',
    lastName: '',
    secondName: '',
    secondLastName: '',
    gender: 'MALE',
    email: '',
    phoneNums: [''],
    dir: '',
    birthDate: null,
  };

  const newUser = ref<Patient>({ ...defaultNewPatient } as Patient);

  // Dirección DPT
  const {
    dirInput,
    entityOptions,
    municipalityOptions,
    parishOptions,
    communityOptions,
    loadEntities,
  } = useCascadingDPT();

  onMounted(async () => {
    await loginApiDPT();
    await loadEntities();
  });

  // CI letter select (V or E)
  const ciLetter = ref('V');
  const ciNumber = ref('');

  const isFormHasUnsavedChanges = computed(() => {
    return (
      newUser.value.name !== (props.patient?.name || '') ||
      newUser.value.lastName !== (props.patient?.lastName || '') ||
      newUser.value.ci !== (props.patient?.ci || '') ||
      newUser.value.dir !== (props.patient?.dir || '')
    );
  });

  defineExpose({
    isFormHasUnsavedChanges,
    resetForm: () => {
      newUser.value = { ...defaultNewPatient } as Patient;
    },
  });

  watch(
    [() => props.patient],
    () => {
      console.log('Watcher fired! props.patient:', props.patient);
      if (!props.patient) {
        newUser.value = { ...defaultNewPatient } as Patient;
        ciLetter.value = 'V';
        ciNumber.value = '';
        console.log('newUser reset to default:', newUser.value);
        return;
      }

      newUser.value = {
        ...defaultNewPatient,
        ...props.patient,
        phoneNums: props.patient?.phoneNums?.length ? [...props.patient.phoneNums] : [''],
      } as Patient;
      // Parse CI into letter and number if possible
      if (props.patient?.ci && typeof props.patient.ci === 'string') {
        const match = props.patient.ci.match(/^([VEve])[- ]?(\d+)$/);
        if (match) {
          ciLetter.value = match[1].toUpperCase();
          ciNumber.value = match[2];
        } else {
          ciLetter.value = 'V';
          ciNumber.value = props.patient.ci.replace(/[^0-9]/g, '');
        }
      } else {
        ciLetter.value = 'V';
        ciNumber.value = '';
      }
      console.log('newUser set to patient:', newUser.value);
    },
    { immediate: true }
  );

  const form = useForm('add-patient-form');

  const emit = defineEmits(['close', 'save']);

  function formatDir(input) {
    const parts = [
      input.entity?.label,
      input.municipality?.label,
      input.parish?.label,
      input.community?.label,
      input.restDir,
    ].filter(Boolean);
    return parts.join(', ');
  }

  const onSave = () => {
    console.log('onSave called, newUser.value:', newUser.value);
    if (form.validate()) {
      // Concatenate CI letter and number before saving
      newUser.value.ci = ciLetter.value + ciNumber.value;
      // Concatenate DPT dirección
      newUser.value.dir = formatDir(dirInput);
      // Ensure birthDate is in ISO 8601 UTC format
      if (newUser.value.birthDate) {
        const birthDate = newUser.value.birthDate;
        let iso = '';
        if (isDate(birthDate)) {
          iso = birthDate.toISOString();
        } else if (typeof birthDate === 'string') {
          const d = new Date(birthDate);
          if (!isNaN(d.getTime())) {
            iso = d.toISOString();
          }
        }
        // Remove milliseconds: 2025-06-15T14:30:00.000Z -> 2025-06-15T14:30:00Z
        if (iso) {
          newUser.value.birthDate = iso.replace(/\.\d{3}Z$/, 'Z');
        }
      }
      emit('save', newUser.value);
    }
  };

  const addPhone = () => {
    newUser.value.phoneNums.push('');
  };

  const removePhone = (index: number) => {
    if (newUser.value.phoneNums.length > 1) {
      newUser.value.phoneNums.splice(index, 1);
    }
  };
</script>

<template>
  <div class="w-full max-w-3x1 mx-auto">
    <VaForm
      v-slot="{ isValid }"
      ref="add-patient-form"
      class="flex-col justify-start items-start gap-4 inline-flex w-full"
    >
      <!-- <VaFileUpload
        v-model="avatar"
        type="single"
        hide-file-list
        class="self-stretch justify-start items-center gap-4 inline-flex"
      >
        <UserAvatar :user="newUser" size="large" />
        <VaButton preset="primary" size="small">Add image</VaButton>
        <VaButton
          v-if="avatar"
          preset="primary"
          color="danger"
          size="small"
          icon="delete"
          class="z-10"
          @click.stop="avatar = undefined"
        />
      </VaFileUpload>
 -->
      <div class="self-stretch flex-col justify-start items-start gap-4 flex">
        <div class="flex gap-4 flex-col sm:flex-row w-full items-start">
          <div class="flex flex-col w-full sm:w-1/2">
            <VaInput
              v-model="newUser.name"
              label="Nombre"
              :rules="[validator.required]"
              name="name"
            />
            <div style="min-height: 20px;"></div>
          </div>
          <div class="flex flex-col w-full sm:w-1/2">
            <VaInput
              v-model="newUser.lastName"
              label="Apellido"
              :rules="[validator.required]"
              name="lastName"
            />
            <div style="height: 20px;"></div>
          </div>
        </div>

        <div class="flex gap-4 flex-col sm:flex-row w-full items-start">
          <div class="flex flex-col w-full sm:w-1/2">
            <VaInput
              v-model="newUser.secondName"
              label="Segundo Nombre"
              name="secondName"
            />
            <div style="min-height: 20px;"></div>
          </div>
          <div class="flex flex-col w-full sm:w-1/2">
            <VaInput
              v-model="newUser.secondLastName"
              label="Segundo Apellido"
              name="secondLastName"
            />
            <div style="min-height: 20px;"></div>
          </div>
        </div>

        <div class="flex gap-4 flex-col sm:flex-row w-full items-centera ver, ">
          <div class="flex flex-col w-full sm:w-1/2">
            <VaInput
              v-model="newUser.email"
              label="Email"
              :rules="[validator.required, validator.email]"
              name="email"
              type="email"
            />
            <div style="min-height: 20px;"></div>
          </div>
          <div class="flex gap-2 items-center w-full sm:w-1/2">
            <VaSelect
              v-model="ciLetter"
              :options="['V', 'E']"
              class="w-16"
             
              name="ciLetter"
            />
            <div style="height: 20px;"></div>

            <VaInput
              v-model="ciNumber"
              label="CI"
              :rules="[validator.required, validator.onlyNumbers, validator.onlyLength7to8]"
              name="ci"
              maxlength="10"
              :messages="['\u00A0']"
            />
          </div>
        </div>

        <div class="flex gap-4 flex-col sm:flex-row w-full items-start">
          <VaDateInput
            v-model="newUser.birthDate"
            label="Fecha de Nacimiento"
            class="w-full sm:w-1/2"
            name="birthDate"
            clearable
            manual-input
          />
          <VaSelect
            v-model="newUser.gender"
            label="Género"
            class="w-full sm:w-1/2"
            :options="['MALE', 'FEMALE']"
            name="gender"
          />
        </div>

        <div class="flex gap-4 flex-col sm:flex-row w-full">
          <div class="flex flex-col w-full sm:w-1/2">
            <!-- Dirección DPT -->
            <div class="flex flex-col gap-2 w-full">
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
            </div>
            <div style="min-height: 70px;"></div>
          </div>
          <div class="w-full sm:w-1/2 pr-10">
            <label class="block mb-1 font-semibold">Números de Teléfono</label>
            <div
              v-for="(_, index) in newUser.phoneNums"
              :key="index"
              class="flex items-center gap-2 mb-2"
            >
              
                <VaInput
                  v-model="newUser.phoneNums[index]"
                  label="Teléfono"
                  :rules="[validator.required, validator.onlyNumbers]"
                  :name="`phone-${index}`"
                  class="self-start"
                />
                <div style="height: 70px;"></div>
              
              <VaButton
                icon="delete"
                color="danger"
                size="small"
                class="self-center"
                @click="removePhone(index)"
                v-if="newUser.phoneNums.length > 1"
              />
          
            </div>
            <VaButton size="small" @click="addPhone">Add Phone</VaButton>
          </div>
        </div>

        <!-- Removed Active checkbox and Notes textarea -->

        <div
          class="flex gap-2 flex-col-reverse items-stretch justify-end w-full sm:flex-row sm:items-center"
        >
          <VaButton preset="secondary" color="secondary" @click="$emit('close')"
            >Cancel</VaButton
          >
          <VaButton :disabled="!isValid" @click="onSave">{{
            saveButtonLabel
          }}</VaButton>
        </div>
      </div>
    </VaForm>
  </div>
</template>
