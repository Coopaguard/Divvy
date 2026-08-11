// Devise active — une seule pour toute l'application
//
// Un ref partagé au niveau du module, à l'image de la locale tenue par vue-i18n :
// tous les composants lisent la même valeur et réagissent ensemble.

import { readonly, ref, type Ref } from 'vue'
import {
  persistCurrency,
  resolveInitialCurrency,
  type SupportedCurrency,
} from '@/domains/shared/currency'

const current = ref<SupportedCurrency>(resolveInitialCurrency())

export function useCurrency(): {
  currency: Readonly<Ref<SupportedCurrency>>
  setCurrency: (value: SupportedCurrency) => void
} {
  return {
    currency: readonly(current) as Readonly<Ref<SupportedCurrency>>,
    setCurrency(value: SupportedCurrency) {
      current.value = value
      persistCurrency(value)
    },
  }
}
