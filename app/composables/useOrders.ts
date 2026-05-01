import { ref, onMounted, watch } from 'vue'

export interface OrderItem {
  id: number
  name: string
  price: number
  quantity: number
}

export interface Order {
  id: string
  items: OrderItem[]
  subtotal: number
  discount: number
  total: number
  paymentMethod: 'cash' | 'transfer' | 'qr'
  timestamp: string
  customerId?: number
  receivedAmount?: number
  changeDue?: number
  notes?: string
  paymentSlip?: string
}

export const useOrders = () => {
  const orders = ref<Order[]>([])
  const heldBills = ref<{ id: number, items: OrderItem[], timestamp: string, note: string }[]>([])
  const isInitialLoad = ref(true)

  const loadOrders = () => {
    if (process.client) {
      const savedOrders = localStorage.getItem('pos_orders')
      if (savedOrders) orders.value = JSON.parse(savedOrders)
      
      const savedHeld = localStorage.getItem('pos_held_bills')
      if (savedHeld) heldBills.value = JSON.parse(savedHeld)
      
      isInitialLoad.value = false
    }
  }

  const saveOrders = () => {
    if (process.client) {
      localStorage.setItem('pos_orders', JSON.stringify(orders.value))
    }
  }

  const saveHeldBills = () => {
    if (process.client) {
      localStorage.setItem('pos_held_bills', JSON.stringify(heldBills.value))
    }
  }

  const addOrder = (order: Omit<Order, 'id' | 'timestamp'>) => {
    const newOrder: Order = {
      ...order,
      id: `ORD-${Date.now()}`,
      timestamp: new Date().toISOString()
    }
    orders.value.push(newOrder)
    saveOrders()
    return newOrder
  }

  const holdBill = (items: OrderItem[], note: string = '') => {
    heldBills.value.push({
      id: Date.now(),
      items: JSON.parse(JSON.stringify(items)),
      timestamp: new Date().toISOString(),
      note
    })
    saveHeldBills()
  }

  const resumeBill = (id: number) => {
    const index = heldBills.value.findIndex(b => b.id === id)
    if (index !== -1) {
      const bill = heldBills.value[index]
      heldBills.value.splice(index, 1)
      saveHeldBills()
      return bill
    }
    return null
  }

  const deleteHeldBill = (id: number) => {
    heldBills.value = heldBills.value.filter(b => b.id !== id)
    saveHeldBills()
  }

  const getDailyStats = (date: string) => {
    const targetDate = new Date(date).toDateString()
    const dayOrders = orders.value.filter(o => new Date(o.timestamp).toDateString() === targetDate)
    
    const totalSales = dayOrders.reduce((sum, o) => sum + o.total, 0)
    const orderCount = dayOrders.length
    
    return {
      totalSales,
      orderCount,
      orders: dayOrders
    }
  }

  const getBestSellers = (limit = 5) => {
    const itemSales: Record<number, { name: string, quantity: number, revenue: number }> = {}
    
    orders.value.forEach(order => {
      order.items.forEach(item => {
        if (!itemSales[item.id]) {
          itemSales[item.id] = { name: item.name, quantity: 0, revenue: 0 }
        }
        itemSales[item.id].quantity += item.quantity
        itemSales[item.id].revenue += (item.price * item.quantity)
      })
    })

    return Object.values(itemSales)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, limit)
  }

  onMounted(() => {
    loadOrders()
  })

  return {
    orders,
    heldBills,
    addOrder,
    holdBill,
    resumeBill,
    deleteHeldBill,
    getDailyStats,
    getBestSellers
  }
}
