<script setup lang="ts">
  import type { PropType } from 'vue';
  import { computed, ref, watch } from 'vue';
  import { useForm } from 'vuestic-ui';

  import type { Patient } from '@/services/types/patientType';
  import { validator } from '../../../services/utils';

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

      // Omit medicHistory, notes, and active if present in props.patient
      const { medicHistory, notes, active, ...rest } = props.patient || {};
      newUser.value = {
        ...defaultNewPatient,
        ...rest,
        phoneNums: rest?.phoneNums?.length ? [...rest.phoneNums] : [''],
      } as Patient;
      // Parse CI into letter and number if possible
      if (rest.ci && typeof rest.ci === 'string') {
        const match = rest.ci.match(/^([VEve])[- ]?(\d+)$/);
        if (match) {
          ciLetter.value = match[1].toUpperCase();
          ciNumber.value = match[2];
        } else {
          ciLetter.value = 'V';
          ciNumber.value = rest.ci.replace(/[^0-9]/g, '');
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

  const onSave = () => {
    console.log('onSave called, newUser.value:', newUser.value);
    if (form.validate()) {
      // Concatenate CI letter and number before saving
      newUser.value.ci = ciLetter.value + ciNumber.value;
      // Ensure birthDate is in ISO 8601 UTC format
      if (newUser.value.birthDate) {
        let iso = '';
        if (newUser.value.birthDate instanceof Date) {
          iso = newUser.value.birthDate.toISOString();
        } else if (typeof newUser.value.birthDate === 'string') {
          const d = new Date(newUser.value.birthDate);
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
  <div>
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

        <div class="flex gap-4 flex-col sm:flex-row w-full items-start">
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
          <div class="w-full sm:w-1/2 flex gap-2 items-start">
            <VaSelect
              v-model="ciLetter"
              :options="['V', 'E']"
              class="w-16 self-center"
              name="ciLetter"
              style="min-width: 60px; max-width: 60px; height: 35px;"
            />
            <div class="flex flex-col flex-1">
              <VaInput
                v-model="ciNumber"
                label="CI"
                :rules="[validator.required, validator.onlyNumbers, validator.onlyLength7to8]"
                name="ci"
                maxlength="8"
                style="max-width: 190px;"
              />
              <div style="min-height: 6px;"></div>
            </div>
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
            <VaInput
              v-model="newUser.dir"
              label="Dirección"
              class="w-full"
              name="dir"
            />
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
