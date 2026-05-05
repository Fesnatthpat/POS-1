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
    name: 'เวนโดร่า (Vendora)',
    logo: '',
    address: '123 ถนนเทคโนโลยี แขวงดิจิทัล เขตไอที กรุงเทพมหานคร',
    phone: '02-123-4567',
    taxRate: 7,
    includeTax: true,
    currency: 'THB',
    receiptNote: 'ขอบคุณที่ใช้บริการ!'
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
