<script setup lang="ts">
import { useCustomers } from '~/composables/useCustomers'
import { useProducts } from '~/composables/useProducts'
import { useOrders } from '~/composables/useOrders'
import { useSettings } from '~/composables/useSettings'

const { customers, addPoints } = useCustomers()
const { products, deductStock } = useProducts()
const { addOrder, holdBill, heldBills, resumeBill, deleteHeldBill } = useOrders()
const { settings } = useSettings()

definePageMeta({
  layout: 'dashboard'
})

// --- State ---
const cart = ref<any[]>([])
const searchQuery = ref('')
const barcodeInput = ref('')

// --- Discount State ---
const discountType = ref<'amount' | 'percent'>('percent')
const discountValue = ref(0)

// --- Modal States ---
const isProductModalOpen = ref(false)
const selectedProduct = ref<any>(null)
const selectedQuantity = ref(1)

const isCheckoutModalOpen = ref(false)
const isReceiptModalOpen = ref(false)
const isHeldBillsModalOpen = ref(false)
const isCartOpenMobile = ref(false)

const paymentMethod = ref<'cash' | 'transfer' | 'qr'>('cash')
const amountReceived = ref<number | null>(null)
const paymentSlip = ref<string | null>(null)
const notes = ref('')
const selectedCustomerId = ref<number | null>(null)
const lastOrder = ref<any>(null)

// --- Computed ---
const filteredProducts = computed(() => {
  return products.value.filter(p => 
    p.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
    p.category.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
    p.barcode?.includes(searchQuery.value) ||
    p.sku?.toLowerCase().includes(searchQuery.value.toLowerCase())
  )
})

const subtotal = computed(() => {
  return cart.value.reduce((total, item) => total + (item.price * item.quantity), 0)
})

const discountAmount = computed(() => {
  if (discountType.value === 'percent') {
    return (subtotal.value * discountValue.value) / 100
  }
  return discountValue.value
})

const cartTotal = computed(() => {
  return Math.max(0, subtotal.value - discountAmount.value)
})

const changeDue = computed(() => {
  if (paymentMethod.value === 'cash' && amountReceived.value !== null) {
    return Math.max(0, amountReceived.value - cartTotal.value)
  }
  return 0
})

// --- Actions ---
const handleSlipUpload = (event: any) => {
  const file = event.target.files[0]
  if (file) {
    if (file.size > 1000000) {
      alert('File too large (Limit: 1MB)')
      return
    }
    const reader = new FileReader()
    reader.onload = (e) => {
      paymentSlip.value = e.target?.result as string
    }
    reader.readAsDataURL(file)
  }
}

const handleBarcodeScan = () => {
  const product = products.value.find(p => p.barcode === barcodeInput.value)
  if (product) {
    if (product.stock > 0) {
      addToCart(product, 1)
      barcodeInput.value = ''
    } else {
      alert('Out of stock!')
    }
  }
}

const openProductModal = (product: any) => {
  if (product.stock <= 0) {
    alert('Out of stock!')
    return
  }
  selectedProduct.value = product
  selectedQuantity.value = 1
  isProductModalOpen.value = true
}

const addToCart = (product: any, quantity: number) => {
  const existingItem = cart.value.find(item => item.id === product.id)
  if (existingItem) {
    const totalQty = existingItem.quantity + quantity
    if (totalQty <= product.stock) {
      existingItem.quantity = totalQty
    } else {
      alert(`Only ${product.stock} items available in stock.`)
    }
  } else {
    cart.value.push({ ...product, quantity })
  }
}

const confirmAddToCart = () => {
  if (!selectedProduct.value) return
  addToCart(selectedProduct.value, selectedQuantity.value)
  isProductModalOpen.value = false
}

const updateQuantity = (productId: number, delta: number) => {
  const item = cart.value.find(i => i.id === productId)
  const product = products.value.find(p => p.id === productId)
  if (item && product) {
    const newQty = item.quantity + delta
    if (newQty > 0 && newQty <= product.stock) {
      item.quantity = newQty
    }
  }
}

const removeFromCart = (productId: number) => {
  cart.value = cart.value.filter(item => item.id !== productId)
}

const clearCart = () => {
  if (confirm('Clear current order?')) {
    cart.value = []
    discountValue.value = 0
  }
}

const handleHoldBill = () => {
  if (cart.value.length === 0) return
  const note = prompt('Enter a note for this bill:') || ''
  holdBill(cart.value, note)
  cart.value = []
  discountValue.value = 0
}

const handleResumeBill = (id: number) => {
  const bill = resumeBill(id)
  if (bill) {
    cart.value = bill.items
    isHeldBillsModalOpen.value = false
    isCartOpenMobile.value = true
  }
}

const openCheckout = () => {
  if (cart.value.length === 0) return
  amountReceived.value = paymentMethod.value === 'cash' ? null : cartTotal.value
  paymentSlip.value = null
  notes.value = ''
  selectedCustomerId.value = null
  isCheckoutModalOpen.value = true
}

const completeCheckout = () => {
  if (paymentMethod.value === 'cash' && (amountReceived.value || 0) < cartTotal.value) {
    alert('Received amount is less than total!')
    return
  }

  if ((paymentMethod.value === 'qr' || paymentMethod.value === 'transfer') && !paymentSlip.value) {
    alert('Please capture/upload payment slip!')
    return
  }
  
  // Create Order
  const orderData = {
    items: cart.value.map(item => ({
      id: item.id,
      name: item.name,
      price: item.price,
      quantity: item.quantity
    })),
    subtotal: subtotal.value,
    discount: discountAmount.value,
    total: cartTotal.value,
    paymentMethod: paymentMethod.value,
    customerId: selectedCustomerId.value || undefined,
    receivedAmount: amountReceived.value || undefined,
    changeDue: changeDue.value,
    notes: notes.value,
    paymentSlip: paymentSlip.value || undefined
  }

  const order = addOrder(orderData)
  
  // Deduct Stock
  cart.value.forEach(item => {
    deductStock(item.id, item.quantity)
  })

  // Award points
  if (selectedCustomerId.value) {
    addPoints(selectedCustomerId.value, cartTotal.value)
  }

  lastOrder.value = order
  isCheckoutModalOpen.value = false
  isReceiptModalOpen.value = true
  cart.value = []
  discountValue.value = 0
  isCartOpenMobile.value = false
}

const formatCurrency = (val: number) => {
  return new Intl.NumberFormat('th-TH', { style: 'currency', currency: settings.value.currency || 'THB' }).format(val)
}

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleString('th-TH')
}
</script>

<template>
  <div class="h-full flex flex-col lg:flex-row gap-4 lg:gap-8 relative overflow-hidden">
    <!-- Products Selection Area -->
    <div class="flex-1 flex flex-col min-w-0">
      <div class="mb-4 lg:mb-6 flex justify-between items-end px-2 lg:px-0">
        <div>
          <h1 class="text-2xl lg:text-3xl font-black text-slate-900 tracking-tight">POS</h1>
          <p class="text-slate-500 font-medium text-xs lg:text-sm mt-1">{{ settings.name }}</p>
        </div>
        <div class="flex gap-2">
          <button @click="isHeldBillsModalOpen = true" class="px-3 py-2 lg:px-4 lg:py-2 bg-amber-100 text-amber-700 rounded-xl font-bold text-xs lg:text-sm flex items-center gap-2">
            <span class="relative flex h-2 w-2 lg:h-3 lg:w-3" v-if="heldBills.length > 0">
              <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span class="relative inline-flex rounded-full h-2 w-2 lg:h-3 lg:w-3 bg-amber-500"></span>
            </span>
            Held ({{ heldBills.length }})
          </button>
        </div>
      </div>

      <!-- Search & Barcode -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4 lg:mb-8 px-2 lg:px-0">
        <div class="md:col-span-2 relative">
          <span class="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-400">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </span>
          <input type="text" v-model="searchQuery" placeholder="Search products..." 
            class="w-full pl-11 pr-4 py-3 lg:py-4 bg-white border border-slate-200 rounded-2xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm lg:text-base" />
        </div>
        <div class="relative hidden md:block">
          <span class="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-400">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
            </svg>
          </span>
          <input type="text" v-model="barcodeInput" @keyup.enter="handleBarcodeScan" placeholder="Scan Barcode..." 
            class="w-full pl-11 pr-4 py-3 lg:py-4 bg-white border border-slate-200 rounded-2xl shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm lg:text-base" />
        </div>
      </div>

      <!-- Products Grid -->
      <div class="flex-1 overflow-y-auto pr-2 px-2 lg:px-0">
        <div class="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 lg:gap-4 pb-20 lg:pb-8">
          <button v-for="product in filteredProducts" :key="product.id" @click="openProductModal(product)"
            class="bg-white p-3 lg:p-4 rounded-[1.5rem] lg:rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl transition-all text-left group relative overflow-hidden flex flex-col">
            <div class="w-full aspect-square bg-slate-50 rounded-xl lg:rounded-2xl mb-3 flex items-center justify-center text-slate-300 group-hover:bg-indigo-50 group-hover:text-indigo-400 transition-colors overflow-hidden">
              <img v-if="product.image" :src="product.image" class="w-full h-full object-cover" />
              <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 lg:h-10 lg:w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <h3 class="font-bold text-slate-900 truncate text-sm lg:text-base mb-0.5">{{ product.name }}</h3>
            <p class="text-[9px] lg:text-[10px] font-bold text-slate-400 uppercase mb-2">{{ product.category }}</p>
            <div class="mt-auto flex items-center justify-between">
              <span class="text-indigo-600 font-black text-sm lg:text-base">{{ formatCurrency(product.price) }}</span>
              <span class="text-[9px] lg:text-[10px] font-bold" :class="product.stock <= 5 ? 'text-rose-500' : 'text-slate-400'">{{ product.stock }} left</span>
            </div>
          </button>
        </div>
      </div>
    </div>

    <!-- Cart Overlay for Mobile -->
    <div v-if="isCartOpenMobile" @click="isCartOpenMobile = false" class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 lg:hidden"></div>

    <!-- Cart Area (Responsive Panel) -->
    <div class="fixed inset-y-0 right-0 w-[85%] sm:w-[400px] bg-white z-50 transform transition-transform duration-300 lg:static lg:w-[400px] lg:translate-x-0 lg:flex-shrink-0 flex flex-col h-full border-l border-slate-100 lg:border-none lg:rounded-3xl lg:shadow-xl shadow-2xl overflow-hidden"
      :class="[isCartOpenMobile ? 'translate-x-0' : 'translate-x-full lg:translate-x-0']">
      <div class="p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
        <div>
          <h2 class="text-xl font-black text-slate-900">Current Order</h2>
          <p class="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">{{ cart.length }} items</p>
        </div>
        <div class="flex gap-2">
          <button @click="clearCart" class="text-rose-500 hover:bg-rose-50 p-2 rounded-xl transition-all">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
          <button @click="isCartOpenMobile = false" class="lg:hidden p-2 text-slate-400">X</button>
        </div>
      </div>

      <div class="flex-1 overflow-y-auto p-4 lg:p-6 space-y-4">
        <div v-if="cart.length === 0" class="h-full flex flex-col items-center justify-center text-center opacity-40">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 lg:h-16 lg:w-16 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
          </svg>
          <p class="font-bold text-sm lg:text-base">Cart is empty</p>
        </div>

        <div v-for="item in cart" :key="item.id" class="flex items-center space-x-3 lg:space-x-4">
          <div class="w-10 h-10 lg:w-12 lg:h-12 bg-slate-50 rounded-xl flex-shrink-0 flex items-center justify-center text-slate-400 overflow-hidden">
            <img v-if="item.image" :src="item.image" class="w-full h-full object-cover" />
            <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 lg:h-6 lg:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <div class="flex-1 min-w-0">
            <h4 class="font-bold text-slate-900 truncate text-xs lg:text-sm">{{ item.name }}</h4>
            <p class="text-indigo-600 font-bold text-[10px] lg:text-xs">{{ formatCurrency(item.price) }}</p>
          </div>
          <div class="flex items-center space-x-1 lg:space-x-2">
            <button @click="updateQuantity(item.id, -1)" class="w-6 h-6 lg:w-7 lg:h-7 flex items-center justify-center rounded-lg bg-slate-100 hover:bg-slate-200 text-xs">-</button>
            <span class="w-5 lg:w-6 text-center font-bold text-xs lg:text-sm">{{ item.quantity }}</span>
            <button @click="updateQuantity(item.id, 1)" class="w-6 h-6 lg:w-7 lg:h-7 flex items-center justify-center rounded-lg bg-slate-100 hover:bg-slate-200 text-xs">+</button>
            <button @click="removeFromCart(item.id)" class="ml-1 lg:ml-2 text-slate-300 hover:text-rose-500">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 lg:h-5 lg:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <div class="p-6 bg-slate-50 border-t border-slate-100">
        <div class="flex justify-between text-xs lg:text-sm mb-2">
          <span class="text-slate-500 font-bold uppercase tracking-wider">Subtotal</span>
          <span class="text-slate-900 font-black">{{ formatCurrency(subtotal) }}</span>
        </div>
        
        <div class="flex items-center justify-between mb-4">
          <div class="flex items-center gap-2">
            <span class="text-slate-500 font-bold uppercase tracking-wider text-xs lg:text-sm">Discount</span>
            <select v-model="discountType" class="text-[10px] bg-white border border-slate-200 rounded px-1">
              <option value="percent">%</option>
              <option value="amount">฿</option>
            </select>
          </div>
          <div class="flex items-center gap-2">
            <input type="number" v-model="discountValue" class="w-14 lg:w-16 text-right text-xs lg:text-sm font-black bg-white border border-slate-200 rounded px-2 py-1" />
            <span class="text-rose-500 font-bold text-[10px] lg:text-xs">(-{{ formatCurrency(discountAmount) }})</span>
          </div>
        </div>

        <div class="flex justify-between items-center mb-6 pt-4 border-t border-slate-200">
          <span class="text-slate-900 font-black text-base lg:text-lg">Total</span>
          <span class="text-2xl lg:text-3xl font-black text-indigo-600">{{ formatCurrency(cartTotal) }}</span>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <button @click="handleHoldBill" :disabled="cart.length === 0"
            class="py-3 bg-amber-500 text-white rounded-2xl font-black text-sm lg:text-base shadow-lg shadow-amber-900/20 hover:bg-amber-600 disabled:opacity-50 transition-all">
            Hold Bill
          </button>
          <button @click="openCheckout" :disabled="cart.length === 0"
            class="py-3 bg-indigo-600 text-white rounded-2xl font-black text-sm lg:text-base shadow-lg shadow-indigo-900/30 hover:bg-indigo-700 disabled:opacity-50 transition-all">
            Checkout
          </button>
        </div>
      </div>
    </div>

    <!-- Mobile View Cart Floating Button -->
    <button v-if="!isCartOpenMobile" @click="isCartOpenMobile = true"
      class="lg:hidden fixed bottom-6 right-6 w-16 h-16 bg-indigo-600 text-white rounded-full shadow-2xl z-40 flex items-center justify-center animate-bounce-slow">
       <div class="relative">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
          </svg>
          <span v-if="cart.length > 0" class="absolute -top-2 -right-2 w-6 h-6 bg-rose-500 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white">
            {{ cart.length }}
          </span>
       </div>
    </button>

    <!-- Modals (Already built to be responsive with fixed positioning and max-width) -->
    <!-- Checkout Modal -->
    <div v-if="isCheckoutModalOpen" class="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div class="bg-white rounded-[2rem] lg:rounded-[32px] shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[95vh]">
        <div class="p-6 lg:p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h3 class="text-xl lg:text-2xl font-black text-slate-900">Checkout</h3>
          <button @click="isCheckoutModalOpen = false" class="text-slate-400 hover:text-slate-600 transition-all">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 lg:h-8 lg:w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div class="flex-1 overflow-y-auto p-6 lg:p-8 space-y-6 lg:space-y-8">
          <div class="bg-indigo-600 rounded-2xl lg:rounded-3xl p-6 lg:p-8 flex justify-between items-center text-white shadow-xl shadow-indigo-200">
            <div>
              <p class="text-[10px] lg:text-xs font-bold opacity-70 uppercase tracking-widest mb-1">Grand Total</p>
              <p class="text-2xl lg:text-4xl font-black">{{ formatCurrency(cartTotal) }}</p>
            </div>
            <div class="text-right">
              <p class="text-[10px] lg:text-xs font-bold opacity-70 uppercase tracking-widest mb-1">Items</p>
              <p class="text-xl lg:text-2xl font-black">{{ cart.length }}</p>
            </div>
          </div>

          <div class="space-y-4 lg:space-y-6">
            <div>
              <label class="block text-xs font-bold text-slate-700 mb-2 lg:mb-3 uppercase tracking-wider">Select Customer</label>
              <select v-model="selectedCustomerId"
                class="w-full px-4 py-3 lg:px-5 lg:py-4 bg-slate-50 border border-slate-200 rounded-xl lg:rounded-2xl text-slate-900 font-bold focus:ring-2 focus:ring-indigo-500 appearance-none text-sm">
                <option :value="null">Walking Customer</option>
                <option v-for="c in customers" :key="c.id" :value="c.id">
                  {{ c.name }} ({{ c.phone }})
                </option>
              </select>
            </div>

            <div>
              <label class="block text-xs font-bold text-slate-700 mb-3 lg:mb-4 uppercase tracking-wider">Payment Method</label>
              <div class="grid grid-cols-3 gap-2 lg:gap-4">
                <button @click="paymentMethod = 'cash'; amountReceived = null"
                  class="flex flex-col items-center justify-center p-3 lg:p-6 rounded-2xl lg:rounded-3xl border-2 transition-all"
                  :class="[paymentMethod === 'cash' ? 'border-indigo-600 bg-indigo-50 text-indigo-600 shadow-lg' : 'border-slate-100 text-slate-400']">
                  <span class="text-2xl lg:text-3xl mb-1 lg:mb-2">💵</span>
                  <span class="font-bold text-[10px] lg:text-sm">Cash</span>
                </button>
                <button @click="paymentMethod = 'qr'; amountReceived = cartTotal"
                  class="flex flex-col items-center justify-center p-3 lg:p-6 rounded-2xl lg:rounded-3xl border-2 transition-all"
                  :class="[paymentMethod === 'qr' ? 'border-indigo-600 bg-indigo-50 text-indigo-600 shadow-lg' : 'border-slate-100 text-slate-400']">
                  <span class="text-2xl lg:text-3xl mb-1 lg:mb-2">🔳</span>
                  <span class="font-bold text-[10px] lg:text-sm">QR Pay</span>
                </button>
                <button @click="paymentMethod = 'transfer'; amountReceived = cartTotal"
                  class="flex flex-col items-center justify-center p-3 lg:p-6 rounded-2xl lg:rounded-3xl border-2 transition-all"
                  :class="[paymentMethod === 'transfer' ? 'border-indigo-600 bg-indigo-50 text-indigo-600 shadow-lg' : 'border-slate-100 text-slate-400']">
                  <span class="text-2xl lg:text-3xl mb-1 lg:mb-2">📱</span>
                  <span class="font-bold text-[10px] lg:text-sm">Bank</span>
                </button>
              </div>
            </div>

            <div v-if="paymentMethod === 'cash'" class="space-y-4 lg:space-y-6">
              <div>
                <label class="block text-xs font-bold text-slate-700 mb-2 lg:mb-3 uppercase tracking-wider">Amount Received</label>
                <div class="grid grid-cols-4 gap-2 mb-3 lg:mb-4">
                  <button v-for="amt in [100, 500, 1000]" :key="amt" @click="amountReceived = (amountReceived || 0) + amt"
                    class="py-2 bg-slate-100 rounded-xl font-bold hover:bg-slate-200 text-xs lg:text-sm">+{{ amt }}</button>
                  <button @click="amountReceived = cartTotal" class="py-2 bg-indigo-50 text-indigo-600 rounded-xl font-bold border border-indigo-100 text-xs lg:text-sm">Exact</button>
                </div>
                <input type="number" v-model="amountReceived" placeholder="0.00"
                  class="w-full px-4 py-4 lg:px-6 lg:py-5 bg-slate-50 border border-slate-200 rounded-[1.5rem] lg:rounded-[2rem] text-2xl lg:text-3xl font-black focus:ring-2 focus:ring-indigo-500 text-center" />
              </div>
              <div v-if="amountReceived" class="p-4 lg:p-6 bg-emerald-50 rounded-2xl lg:rounded-3xl flex justify-between items-center border border-emerald-100">
                <span class="text-sm lg:text-lg font-bold text-emerald-600 uppercase">Change</span>
                <span class="text-2xl lg:text-4xl font-black text-emerald-700">{{ formatCurrency(changeDue) }}</span>
              </div>
            </div>

            <div v-if="paymentMethod === 'qr' || paymentMethod === 'transfer'" class="space-y-4 lg:space-y-6">
              <div v-if="paymentMethod === 'qr'" class="flex flex-col items-center p-4 lg:p-6 bg-slate-50 rounded-2xl lg:rounded-3xl border border-slate-200">
                <p class="font-bold text-slate-500 mb-3 lg:mb-4 uppercase tracking-widest text-[9px] lg:text-xs text-center">Scan to pay {{ formatCurrency(cartTotal) }}</p>
                <div class="w-32 h-32 lg:w-40 lg:h-40 bg-white p-3 lg:p-4 border-2 border-slate-100 rounded-xl lg:rounded-2xl flex items-center justify-center relative shadow-sm mb-2 lg:mb-4">
                  <div class="grid grid-cols-4 grid-rows-4 gap-1 w-full h-full opacity-80">
                    <div v-for="n in 16" :key="n" :class="Math.random() > 0.5 ? 'bg-slate-900' : 'bg-transparent'" class="rounded-sm"></div>
                  </div>
                  <div class="absolute inset-0 flex items-center justify-center pointer-events-none">
                     <div class="bg-white p-1 rounded-md shadow-md font-black text-indigo-600 text-[8px] lg:text-[10px] uppercase border border-indigo-50">PROMPT PAY</div>
                  </div>
                </div>
              </div>

              <div class="space-y-2 lg:space-y-3">
                <label class="block text-xs lg:text-sm font-bold text-slate-700 uppercase tracking-wider">Evidence / Slip Capture</label>
                <div class="relative w-full aspect-video bg-slate-100 border-2 border-dashed border-slate-300 rounded-2xl lg:rounded-3xl overflow-hidden group flex items-center justify-center">
                   <img v-if="paymentSlip" :src="paymentSlip" class="w-full h-full object-cover" />
                   <div v-else class="text-center p-4 lg:p-6">
                      <span class="text-3xl lg:text-4xl block mb-2">📸</span>
                      <span class="text-[10px] lg:text-xs font-bold text-slate-400 uppercase">Take Photo or Upload Slip</span>
                   </div>
                   <input type="file" accept="image/*" capture="environment" @change="handleSlipUpload" class="absolute inset-0 opacity-0 cursor-pointer" />
                   <div v-if="paymentSlip" class="absolute top-2 lg:top-4 right-2 lg:right-4 flex gap-2">
                      <button @click="paymentSlip = null" class="bg-rose-500 text-white p-1.5 lg:p-2 rounded-lg lg:rounded-xl shadow-lg text-xs">X</button>
                   </div>
                </div>
              </div>
            </div>

            <div>
              <label class="block text-xs font-bold text-slate-700 mb-2 lg:mb-3 uppercase tracking-wider">Order Notes</label>
              <textarea v-model="notes" rows="2" placeholder="Notes..."
                class="w-full px-4 py-3 lg:px-5 lg:py-4 bg-slate-50 border border-slate-200 rounded-xl lg:rounded-2xl focus:ring-2 focus:ring-indigo-500 text-sm"></textarea>
            </div>
          </div>
        </div>

        <div class="p-6 lg:p-8 bg-slate-50 border-t border-slate-100">
          <button @click="completeCheckout"
            class="w-full py-4 lg:py-6 bg-indigo-600 text-white rounded-[1.5rem] lg:rounded-[2rem] font-black text-lg lg:text-xl shadow-2xl shadow-indigo-200 hover:bg-indigo-700 active:translate-y-0 transition-all">
            Finalize Transaction
          </button>
        </div>
      </div>
    </div>

    <!-- Other modals (Product, Receipt, Held) are handled similarly with max-width and fixed positioning -->
    <!-- Product Detail Modal -->
    <div v-if="isProductModalOpen" class="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div class="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
        <div class="p-6 lg:p-8">
          <div class="flex justify-between items-start mb-4 lg:mb-6">
            <div>
              <p class="text-[9px] lg:text-[10px] font-bold text-indigo-600 uppercase tracking-widest mb-1">{{ selectedProduct?.category }}</p>
              <h3 class="text-xl lg:text-2xl font-black text-slate-900 tracking-tight">{{ selectedProduct?.name }}</h3>
              <p class="text-[10px] lg:text-xs font-bold text-slate-400 mt-1">SKU: {{ selectedProduct?.sku || '-' }}</p>
            </div>
            <button @click="isProductModalOpen = false" class="p-2 text-slate-400 hover:text-slate-600 font-bold">X</button>
          </div>

          <div class="bg-indigo-50 rounded-2xl p-6 mb-6 lg:mb-8 flex flex-col items-center justify-center">
             <img v-if="selectedProduct?.image" :src="selectedProduct.image" class="w-32 h-32 object-cover rounded-xl shadow-lg mb-4" />
             <span class="text-2xl lg:text-3xl font-black text-indigo-600">{{ formatCurrency(selectedProduct?.price) }}</span>
          </div>

          <div class="space-y-4 lg:space-y-6">
            <div>
              <div class="flex justify-between items-center mb-3 lg:mb-4">
                <label class="text-xs lg:text-sm font-bold text-slate-700">Quantity</label>
                <span class="text-[10px] lg:text-xs font-bold" :class="selectedProduct?.stock <= 5 ? 'text-rose-500' : 'text-slate-400'">
                   Available: {{ selectedProduct?.stock }}
                </span>
              </div>
              <div class="flex items-center justify-center space-x-4 lg:space-x-6 bg-slate-50 p-3 lg:p-4 rounded-2xl">
                <button @click="selectedQuantity > 1 ? selectedQuantity-- : null" class="w-10 h-10 lg:w-12 lg:h-12 bg-white rounded-xl shadow-sm font-black">-</button>
                <span class="text-xl lg:text-2xl font-black text-slate-900 w-10 lg:w-12 text-center">{{ selectedQuantity }}</span>
                <button @click="selectedQuantity < selectedProduct?.stock ? selectedQuantity++ : null" class="w-10 h-10 lg:w-12 lg:h-12 bg-white rounded-xl shadow-sm font-black">+</button>
              </div>
            </div>

            <button @click="confirmAddToCart"
              class="w-full py-4 lg:py-5 bg-indigo-600 text-white rounded-xl lg:rounded-2xl font-black shadow-xl hover:bg-indigo-700 transition-all text-sm lg:text-base">
              Add to Order — {{ formatCurrency(selectedProduct?.price * selectedQuantity) }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Receipt Modal (Same responsive pattern) -->
    <div v-if="isReceiptModalOpen" class="fixed inset-0 z-[70] flex items-center justify-center p-2 lg:p-4 bg-slate-900/40 backdrop-blur-sm">
      <div class="bg-white rounded-[2rem] shadow-2xl w-full max-w-sm overflow-hidden flex flex-col max-h-[98vh]">
        <div class="p-6 lg:p-8 text-center border-b border-dashed border-slate-200 flex-shrink-0">
           <div class="w-16 h-16 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto mb-3 text-2xl">✓</div>
           <h3 class="text-xl lg:text-2xl font-black text-slate-900">Success!</h3>
           <p class="text-slate-400 font-bold uppercase tracking-widest text-[10px] mt-1">Payment Received</p>
        </div>
        
        <div class="flex-1 overflow-y-auto p-6 lg:p-8 bg-slate-50/50">
          <div class="space-y-4 font-mono text-[10px] lg:text-xs border-b border-dashed border-slate-300 pb-4 mb-4 lg:pb-6 lg:mb-6">
            <div class="text-center font-bold mb-4">
               <p class="text-base lg:text-lg">{{ settings.name }}</p>
               <p>{{ settings.address }}</p>
               <p>Tel: {{ settings.phone }}</p>
            </div>
            <div class="flex justify-between">
              <span>Receipt:</span>
              <span>{{ lastOrder?.id }}</span>
            </div>
            <div class="flex justify-between">
              <span>Date:</span>
              <span>{{ formatDate(lastOrder?.timestamp) }}</span>
            </div>
            <div class="py-3 lg:py-4 border-y border-dashed border-slate-300">
              <div v-for="item in lastOrder?.items" :key="item.id" class="flex justify-between mb-1">
                <span>{{ item.name }} x{{ item.quantity }}</span>
                <span>{{ formatCurrency(item.price * item.quantity) }}</span>
              </div>
            </div>
            <div class="flex justify-between">
              <span>Subtotal:</span>
              <span>{{ formatCurrency(lastOrder?.subtotal) }}</span>
            </div>
            <div v-if="lastOrder?.discount" class="flex justify-between text-rose-500">
              <span>Discount:</span>
              <span>-{{ formatCurrency(lastOrder?.discount) }}</span>
            </div>
            <div class="flex justify-between text-base lg:text-lg font-black pt-2">
              <span>Total:</span>
              <span>{{ formatCurrency(lastOrder?.total) }}</span>
            </div>
            <div class="flex justify-between pt-4">
               <span class="uppercase">{{ lastOrder?.paymentMethod }}</span>
               <span v-if="lastOrder?.paymentMethod === 'cash'">Paid: {{ formatCurrency(lastOrder?.receivedAmount) }}</span>
            </div>
            <div v-if="lastOrder?.paymentMethod === 'cash'" class="flex justify-between font-bold">
               <span>Change:</span>
               <span>{{ formatCurrency(lastOrder?.changeDue) }}</span>
            </div>
          </div>

          <div v-if="lastOrder?.paymentSlip" class="mb-4">
             <p class="text-[9px] font-black text-slate-400 uppercase text-center mb-2">Evidence</p>
             <div class="rounded-xl overflow-hidden border border-slate-200">
                <img :src="lastOrder.paymentSlip" class="w-full h-auto" />
             </div>
          </div>
          
          <div class="text-center text-[10px] text-slate-400 font-bold uppercase tracking-widest">
            {{ settings.receiptNote }}
          </div>
        </div>

        <div class="p-6 lg:p-8 grid grid-cols-2 gap-3 lg:gap-4 flex-shrink-0">
           <button @click="isReceiptModalOpen = false" class="py-3 lg:py-4 bg-slate-100 text-slate-600 rounded-xl lg:rounded-2xl font-black text-sm lg:text-base">Close</button>
           <button @click="window.print()" class="py-3 lg:py-4 bg-indigo-600 text-white rounded-xl lg:rounded-2xl font-black shadow-lg shadow-indigo-100 text-sm lg:text-base">Print</button>
        </div>
      </div>
    </div>

    <!-- Held Bills Modal -->
    <div v-if="isHeldBillsModalOpen" class="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div class="bg-white rounded-[2rem] shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[80vh]">
        <div class="p-6 lg:p-8 border-b border-slate-100 flex justify-between items-center">
          <h3 class="text-xl lg:text-2xl font-black text-slate-900">Held Bills</h3>
          <button @click="isHeldBillsModalOpen = false" class="text-slate-400 font-bold">X</button>
        </div>
        <div class="p-6 lg:p-8 overflow-y-auto space-y-4">
          <div v-if="heldBills.length === 0" class="text-center py-10 text-slate-400 font-bold text-sm lg:text-base">No held bills found.</div>
          <div v-for="bill in heldBills" :key="bill.id" class="p-4 bg-slate-50 rounded-2xl flex justify-between items-center group">
            <div class="min-w-0 flex-1 pr-4">
              <p class="font-bold text-slate-900 truncate text-sm lg:text-base">{{ bill.note || 'No description' }}</p>
              <p class="text-[10px] lg:text-xs text-slate-400 font-medium">{{ formatDate(bill.timestamp) }} • {{ bill.items.length }} items</p>
            </div>
            <div class="flex gap-2">
              <button @click="deleteHeldBill(bill.id)" class="p-2 text-rose-500 hover:bg-rose-100 rounded-xl transition-all">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
              <button @click="handleResumeBill(bill.id)" class="px-3 py-1.5 lg:px-4 lg:py-2 bg-indigo-600 text-white rounded-lg lg:rounded-xl font-bold text-xs lg:text-sm">Resume</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.animate-bounce-slow {
  animation: bounce 2s infinite;
}
@keyframes bounce {
  0%, 100% { transform: translateY(-5%); animation-timing-function: cubic-bezier(0.8,0,1,1); }
  50% { transform: none; animation-timing-function: cubic-bezier(0,0,0.2,1); }
}
</style>
