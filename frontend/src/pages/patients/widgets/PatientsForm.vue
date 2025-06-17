<script setup lang="ts">
import { PropType, computed, ref, watch } from 'vue'
import { useForm } from 'vuestic-ui'


import { Patient } from './patients.types'
import { validators } from '../../../services/utils'

const props = defineProps({
  patient: {
    type: Object as PropType<Patient | null>,
    default: null,
  },
  saveButtonLabel: {
    type: String,
    default: 'Save',
  },
})

// New default user with patient fields
const defaultNewPatient = {
  id: 0, // will be filled later
  ci: '',
  name: '',
  lastName: '',
  secondName: '',
  secondLastName: '',
  gender:'',
  email: '',
  phoneNums: [''],
  dir: '',
  birthDate: null,
  notes: '',
  active: true,
  medicHistory: null,
}

const newUser = ref<Patient>({ ...defaultNewPatient } as Patient)

const isFormHasUnsavedChanges = computed(() => {
  return (
    newUser.value.name !== (props.patient?.name || '') ||
    newUser.value.lastName !== (props.patient?.lastName || '') ||
    newUser.value.ci !== (props.patient?.ci || '') ||
    newUser.value.dir !== (props.patient?.dir || '')
    // Add more comparisons if needed
  )
})

defineExpose({
  isFormHasUnsavedChanges,
})



watch(
  [() => props.patient],
  () => {
    if (!props.patient) {
      newUser.value = { ...defaultNewPatient } as Patient
      return
    }

    newUser.value = {
      ...defaultNewPatient,
      ...props.patient,
      phoneNums: props.patient?.phoneNums?.length ? [...props.patient.phoneNums] : ['']
    } as Patient
  },
  { immediate: true }
)


const form = useForm('add-patient-form')

const emit = defineEmits(['close', 'save'])

const onSave = () => {
  if (form.validate()) {
    emit('save', newUser.value)
  }
}


const addPhone = () => {
  newUser.value.phoneNums.push('')
}

const removePhone = (index: number) => {
  if (newUser.value.phoneNums.length > 1) {
    newUser.value.phoneNums.splice(index, 1)
  }
}
</script>

<template>
  <div>
    <VaForm v-slot="{ isValid }" ref="add-patient-form" class="flex-col justify-start items-start gap-4 inline-flex w-full">



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

        <div class="flex gap-4 flex-col sm:flex-row w-full">
          <VaInput
            v-model="newUser.name"
            label="Name"
            class="w-full sm:w-1/2"
            :rules="[validators.required]"
            name="name"
          />
          <VaInput
            v-model="newUser.lastName"
            label="Last Name"
            class="w-full sm:w-1/2"
            :rules="[validators.required]"
            name="lastName"
          />
        </div>

        <div class="flex gap-4 flex-col sm:flex-row w-full">
          <VaInput
            v-model="newUser.secondName"
            label="Second Name"
            class="w-full sm:w-1/2"
            name="secondName"
          />
          <VaInput
            v-model="newUser.secondLastName"
            label="Second Last Name"
            class="w-full sm:w-1/2"
            name="secondLastName"
          />
        </div>

        <div class="flex gap-4 flex-col sm:flex-row w-full">
          <VaInput
            v-model="newUser.ci"
            label="CI"
            class="w-full sm:w-1/2"
            :rules="[validators.required]"
            name="ci"
          />
          <VaDateInput
            v-model="newUser.birthDate"
            label="Birth Date"
            class="w-full sm:w-1/2"
            name="birthDate"
            clearable
            manual-input
          />
        </div>

        <div class="flex gap-4 flex-col sm:flex-row w-full">
          <VaInput
            v-model="newUser.dir"
            label="Address"
            class="w-full sm:w-1/2"
            name="dir"
          />
          <div class="w-full sm:w-1/2">
            <label class="block mb-1 font-semibold">Phone Numbers</label>
            <div v-for="(phone, index) in newUser.phoneNums" :key="index" class="flex items-center gap-2 mb-2">
              <VaInput
                v-model="newUser.phoneNums[index]"
                label="Phone"
                :rules="[validators.required]"
                :name="`phone-${index}`"
              />
              <VaButton icon="delete" color="danger" size="small" @click="removePhone(index)" v-if="newUser.phoneNums.length > 1" />
            </div>
            <VaButton size="small" @click="addPhone">Add Phone</VaButton>
          </div>
        </div>

        <div class="flex gap-4 w-full">
          <div class="flex items-center w-1/2 mt-4">
            <VaCheckbox v-model="newUser.active" label="Active" class="w-full" name="active" />
          </div>
        </div>

        <VaTextarea v-model="newUser.notes" label="Notes" class="w-full" name="notes" />

        <div class="flex gap-2 flex-col-reverse items-stretch justify-end w-full sm:flex-row sm:items-center">
          <VaButton preset="secondary" color="secondary" @click="$emit('close')">Cancel</VaButton>
          <VaButton :disabled="!isValid" @click="onSave">{{ saveButtonLabel }}</VaButton>
        </div>
      </div>
    </VaForm>
  </div>
</template>

