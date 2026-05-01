import { ref, onMounted } from 'vue'

export interface StoreSettings {
  name: string
  logo: string
  address: string
  phone: string
  taxRate: number
  includeTax: boolean
  currency: string
  receiptNote: string
}

export const useSettings = () => {
  const settings = ref<StoreSettings>({
    name: 'Gemini POS Store',
    logo: '',
    address: '123 Tech Avenue, Digital City',
    phone: '02-123-4567',
    taxRate: 7,
    includeTax: true,
    currency: 'THB',
    receiptNote: 'Thank you for your business!'
  })

  const loadSettings = () => {
    if (process.client) {
      const saved = localStorage.getItem('pos_settings')
      if (saved) {
        settings.value = JSON.parse(saved)
      }
    }
  }

  const saveSettings = (newSettings: StoreSettings) => {
    settings.value = { ...newSettings }
    if (process.client) {
      localStorage.setItem('pos_settings', JSON.stringify(settings.value))
    }
  }

  onMounted(() => {
    loadSettings()
  })

  return {
    settings,
    saveSettings
  }
}
