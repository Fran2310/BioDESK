<!-- RIF - Reemplazar la div existente -->
<div
  class="grid gap-2"
  :class="{
    'grid-cols-1': !isDesktop,
    'grid-cols-[auto_1fr]': isDesktop,
  }"
  style="min-height: 5rem"
>
  <VaSelect
    label="RIF"
    required-mark
    v-model="formData.rifType"
    :options="['V', 'J', 'G']"
    class="w-full sm:w-20"
    color="primary"
  />
  <VaInput
    v-model="formData.rif"
    :label="isDesktop ? ' ' : 'Número RIF'"
    :rules="[
      validator.required,
      validator.onlyNumbers,
      validator.minLengthCi,
    ]"
    placeholder="123456789"
    type="text"
    color="primary"
    class="w-full"
    style="min-height: 5rem"
  >
  </VaInput>
</div>

<!-- TELEFONOS - Reemplazar la div existente -->
<div
  class="grid gap-2 mb-2"
  :class="{
    'grid-cols-1': !isDesktop,
    'grid-cols-[auto_1fr]': isDesktop,
  }"
>
  <VaSelect
    label="Cod área"
    required-mark
    v-model="phoneInput.areaCode"
    :options="areaCodes"
    class="w-full sm:w-20"
    color="primary"
    searchable
    :rules="[phoneAreaCodeValidator]"
  />
  <VaInput
    v-model="phoneInput.number"
    :label="isDesktop ? 'N° Teléfono' : 'Número'"
    :rules="[phoneNumberValidator]"
    placeholder="1234567"
    type="tel"
    color="primary"
    class="w-full"
    @keyup.enter="addPhone"
  >
    <template #prependInner>
      <VaIcon name="call" color="secondary" />
    </template>
    <template #appendInner>
      <VaButton
        icon="add"
        color="primary"
        @click="addPhone"
        @keyup.enter="addPhone"
        :disabled="!canAddPhone"
        aria-label="Agregar teléfono"
      />
    </template>
  </VaInput>
</div>
