import { ref, onMounted, watch } from 'vue'

export interface Customer {
  id: number
  name: string
  phone: string
  points: number
  level: string
  joinDate: string
}

export const useCustomers = () => {
  const customers = ref<Customer[]>([])
  const isInitialLoad = ref(true)

  const loadCustomers = () => {
    if (process.client) {
      const saved = localStorage.getItem('pos_customers')
      if (saved) {
        customers.value = JSON.parse(saved)
      } else {
        customers.value = [
          { id: 1, name: 'สมชาย ดีเลิศ', phone: '081-234-5678', points: 1250, level: 'Platinum', joinDate: '2025-01-15' },
          { id: 2, name: 'สมศรี รักดี', phone: '089-876-5432', points: 450, level: 'Gold', joinDate: '2025-02-10' },
          { id: 3, name: 'วิชัย ชื่นใจ', phone: '082-333-4444', points: 120, level: 'Silver', joinDate: '2025-03-05' },
          { id: 4, name: 'อนันยา ศรีสุข', phone: '085-111-2222', points: 2800, level: 'Platinum', joinDate: '2025-01-20' },
          { id: 5, name: 'กิตติ วัฒนา', phone: '086-444-5555', points: 85, level: 'Silver', joinDate: '2025-04-12' },
        ]
      }
      isInitialLoad.value = false
    }
  }

  const saveCustomers = () => {
    if (process.client) {
      localStorage.setItem('pos_customers', JSON.stringify(customers.value))
    }
  }

  const addCustomer = (customer: Omit<Customer, 'id' | 'points' | 'joinDate'>) => {
    const newCustomer: Customer = {
      ...customer,
      id: Date.now(),
      points: 0,
      joinDate: new Date().toISOString().split('T')[0]
    }
    customers.value.push(newCustomer)
    saveCustomers()
  }

  const addPoints = (id: number, amount: number) => {
    const customer = customers.value.find(c => c.id === id)
    if (customer) {
      // Rule: 1 point for every 20 THB
      customer.points += Math.floor(amount / 20)
      saveCustomers()
    }
  }

  watch(customers, () => {
    if (!isInitialLoad.value) {
      saveCustomers()
    }
  }, { deep: true })

  onMounted(() => {
    loadCustomers()
  })

  return {
    customers,
    addCustomer,
    addPoints,
    saveCustomers
  }
}
