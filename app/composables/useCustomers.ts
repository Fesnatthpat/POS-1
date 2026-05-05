import { ref, onMounted, watch } from 'vue'

export interface PointLog {
  id: number
  date: string
  amount: number
  before: number
  after: number
  note: string
}

export interface RewardRecord {
  id: number
  date: string
  pointsExchanged: number
}

export interface Customer {
  id: number
  name: string
  phone: string
  points: number
  level: string
  joinDate: string
  rewardsEarned?: number
  rewardHistory?: RewardRecord[]
  pointHistory?: PointLog[]
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
          { id: 1, name: 'สมชาย ดีเลิศ', phone: '081-234-5678', points: 5, level: 'Platinum', joinDate: '2025-01-15', rewardsEarned: 2, rewardHistory: [], pointHistory: [] },
          { id: 2, name: 'สมศรี รักดี', phone: '089-876-5432', points: 8, level: 'Gold', joinDate: '2025-02-10', rewardsEarned: 0, rewardHistory: [], pointHistory: [] },
          { id: 3, name: 'วิชัย ชื่นใจ', phone: '082-333-4444', points: 2, level: 'Silver', joinDate: '2025-03-05', rewardsEarned: 0, rewardHistory: [], pointHistory: [] },
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

  const addCustomer = (customer: Omit<Customer, 'id' | 'points' | 'joinDate' | 'rewardsEarned' | 'rewardHistory' | 'pointHistory'>) => {
    const newCustomer: Customer = {
      ...customer,
      id: Date.now(),
      points: 0,
      rewardsEarned: 0,
      rewardHistory: [],
      pointHistory: [],
      joinDate: new Date().toISOString().split('T')[0]
    }
    customers.value.push(newCustomer)
    saveCustomers()
  }

  const addPoints = (id: number, points: number) => {
    const customer = customers.value.find(c => c.id === id)
    if (customer) {
      const originalPoints = Number(customer.points)
      const changeAmount = Number(points)
      let newPoints = originalPoints + changeAmount
      
      if (!customer.pointHistory) customer.pointHistory = []

      // Clamp at 0
      newPoints = Math.max(0, newPoints)

      // Record History
      customer.pointHistory.unshift({
        id: Date.now(),
        date: new Date().toISOString(),
        amount: changeAmount,
        before: originalPoints,
        after: newPoints,
        note: changeAmount >= 0 ? 'สะสมแต้ม' : 'ลดแต้ม/ปรับปรุง'
      })
      
      if (customer.pointHistory.length > 50) customer.pointHistory.pop()

      customer.points = newPoints
      saveCustomers()
    }
  }

  const redeemReward = (id: number, threshold: number) => {
    const customer = customers.value.find(c => c.id === id)
    if (customer && customer.points >= threshold) {
      const originalPoints = customer.points
      customer.points -= threshold
      
      if (customer.rewardsEarned === undefined) customer.rewardsEarned = 0
      if (!customer.rewardHistory) customer.rewardHistory = []
      if (!customer.pointHistory) customer.pointHistory = []

      customer.rewardsEarned++
      customer.rewardHistory.unshift({
        id: Date.now(),
        date: new Date().toISOString(),
        pointsExchanged: threshold
      })

      customer.pointHistory.unshift({
        id: Date.now() + 1,
        date: new Date().toISOString(),
        amount: -threshold,
        before: originalPoints,
        after: customer.points,
        note: 'แลกรางวัล (ครบกำหนด)'
      })

      saveCustomers()
      return true
    }
    return false
  }

  const updateCustomer = (id: number, data: Partial<Customer>) => {
    const index = customers.value.findIndex(c => c.id === id)
    if (index !== -1) {
      customers.value[index] = { ...customers.value[index], ...data }
      saveCustomers()
    }
  }

  const deleteCustomer = (id: number) => {
    customers.value = customers.value.filter(c => c.id !== id)
    saveCustomers()
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
    redeemReward,
    updateCustomer,
    deleteCustomer,
    saveCustomers
  }
}
