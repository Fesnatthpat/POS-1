import { ref, onMounted, watch } from 'vue'

export interface Customer {
  id: number
  name: string
  phone: string
  points: number
  level: string
  joinDate: string
  history: any[]
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
        // Default mock data if empty
        customers.value = [
          { 
            id: 1, 
            name: 'Somchai Rakdee', 
            phone: '081-234-5678', 
            points: 1250, 
            level: 'Gold',
            joinDate: '2025-01-15',
            history: []
          },
          { 
            id: 2, 
            name: 'Somsri Deeai', 
            phone: '089-876-5432', 
            points: 450, 
            level: 'Silver',
            joinDate: '2025-03-20',
            history: []
          }
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

  const addCustomer = (customer: Omit<Customer, 'id' | 'joinDate' | 'points' | 'history'>) => {
    const newCustomer: Customer = {
      ...customer,
      id: Date.now(),
      points: 0,
      joinDate: new Date().toISOString().split('T')[0],
      history: []
    }
    customers.value.push(newCustomer)
    saveCustomers()
  }

  const addPoints = (customerId: number, points: number) => {
    const customer = customers.value.find(c => c.id === customerId)
    if (customer) {
      customer.points += Math.floor(points)
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
