<script setup lang="ts">
// PersonForm — add or edit a person (used in modal)
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useVacationStore } from '@/stores/vacationStore'
import type { Person, PersonDraft } from '@/domains/people/types'

const props = defineProps<{
  person?: Person | null
}>()

const emit = defineEmits<{
  save: [draft: PersonDraft]
  cancel: []
}>()

const { t } = useI18n()
const vacationStore = useVacationStore()

const name = ref(props.person?.name ?? '')
const shares = ref(props.person?.shares ?? 1)
const arrivalDate = ref(props.person?.arrivalDate ?? vacationStore.vacation?.startDate ?? '')
const departureDate = ref(props.person?.departureDate ?? vacationStore.vacation?.endDate ?? '')
const errors = ref<Record<string, string>>({})

watch(
  () => props.person,
  (p) => {
    name.value = p?.name ?? ''
    shares.value = p?.shares ?? 1
    arrivalDate.value = p?.arrivalDate ?? vacationStore.vacation?.startDate ?? ''
    departureDate.value = p?.departureDate ?? vacationStore.vacation?.endDate ?? ''
    errors.value = {}
  },
)

function validate(): boolean {
  errors.value = {}
  if (!name.value.trim()) errors.value.name = t('people.errors.nameRequired')
  if (shares.value < 1) errors.value.shares = t('people.errors.sharesMin')
  if (!arrivalDate.value) errors.value.arrivalDate = t('people.errors.arrivalRequired')
  if (!departureDate.value) errors.value.departureDate = t('people.errors.departureRequired')
  if (arrivalDate.value && departureDate.value && arrivalDate.value > departureDate.value) {
    errors.value.departureDate = t('people.errors.departureBeforeArrival')
  }
  return Object.keys(errors.value).length === 0
}

function submit(): void {
  if (!validate()) return
  const draft: PersonDraft = {
    name: name.value.trim(),
    shares: shares.value,
    arrivalDate: arrivalDate.value,
    departureDate: departureDate.value,
  }
  emit('save', draft)
}
</script>

<template>
  <div class="person-form">
    <div class="field">
      <label for="person-name">{{ t('people.fields.name') }}</label>
      <input
        id="person-name"
        v-model="name"
        type="text"
        :class="{ error: errors.name }"
        :placeholder="t('people.fields.name')"
        autocomplete="off"
      />
      <span v-if="errors.name" class="field-error">{{ errors.name }}</span>
    </div>

    <div class="field">
      <label for="person-shares">{{ t('people.fields.shares') }}</label>
      <input
        id="person-shares"
        v-model.number="shares"
        type="number"
        min="1"
        step="0.5"
        :class="{ error: errors.shares }"
      />
      <span v-if="errors.shares" class="field-error">{{ errors.shares }}</span>
    </div>

    <div class="field-row">
      <div class="field">
        <label for="person-arrival">{{ t('people.fields.arrivalDate') }}</label>
        <input
          id="person-arrival"
          v-model="arrivalDate"
          type="date"
          :class="{ error: errors.arrivalDate }"
        />
        <span v-if="errors.arrivalDate" class="field-error">{{ errors.arrivalDate }}</span>
      </div>
      <div class="field">
        <label for="person-departure">{{ t('people.fields.departureDate') }}</label>
        <input
          id="person-departure"
          v-model="departureDate"
          type="date"
          :class="{ error: errors.departureDate }"
        />
        <span v-if="errors.departureDate" class="field-error">{{ errors.departureDate }}</span>
      </div>
    </div>

    <div class="form-actions">
      <button type="button" class="btn-secondary" @click="emit('cancel')">
        {{ t('common.cancel') }}
      </button>
      <button type="button" class="btn-primary" @click="submit">
        {{ t('common.save') }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.person-form {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.field {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
}

.field label {
  font-size: var(--font-size-sm);
  font-weight: 500;
  color: var(--text);
}

.field-row {
  display: flex;
  gap: var(--space-md);
}

.field-row .field {
  flex: 1;
}

.field-error {
  font-size: var(--font-size-xs);
  color: #cf222e;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-sm);
  padding-top: var(--space-xs);
}

@media (max-width: 600px) {
  .field-row {
    flex-direction: column;
  }
}
</style>
