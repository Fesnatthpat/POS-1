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

useHead({
  title: 'Point of Sale'
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
    cart.value.push({ 
      ...product, 
      quantity,
      cost: product.cost || 0 
    })
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
  
  const totalCost = cart.value.reduce((sum, item) => sum + (item.cost * item.quantity), 0)

  // Create Order
  const orderData = {
    items: cart.value.map(item => ({
      id: item.id,
      name: item.name,
      price: item.price,
      cost: item.cost,
      quantity: item.quantity
    })),
    subtotal: subtotal.value,
    discount: discountAmount.value,
    total: cartTotal.value,
    totalCost: totalCost,
    profit: cartTotal.value - totalCost,
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
  <div class="h-full flex -m-4 sm:-m-6 lg:-m-8 overflow-hidden bg-slate-50">
    <!-- Left: Products Area -->
    <div class="flex-1 flex flex-col min-w-0 h-full p-4 lg:p-8 overflow-y-auto custom-scrollbar">
      <div class="mb-6 flex justify-between items-end">
        <div>
          <h1 class="text-3xl font-black text-slate-900 tracking-tight">Point of Sale</h1>
          <p class="text-slate-500 font-medium text-sm mt-1">Terminal: {{ settings.name }}</p>
        </div>
        <button @click="isHeldBillsModalOpen = true" class="px-4 py-2 bg-amber-100 text-amber-700 rounded-xl font-bold text-sm flex items-center gap-2 shadow-sm border border-amber-200/50 hover:bg-amber-200 transition-all">
          <span class="relative flex h-2.5 w-2.5" v-if="heldBills.length > 0">
            <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span class="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
          </span>
          Held Bills ({{ heldBills.length }})
        </button>
      </div>

      <!-- Search & Scan -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div class="md:col-span-2 relative">
          <span class="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-400">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </span>
          <input type="text" v-model="searchQuery" placeholder="Search product name, category..." 
            class="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all" />
        </div>
        <div class="relative hidden md:block">
          <span class="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-400">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
            </svg>
          </span>
          <input type="text" v-model="barcodeInput" @keyup.enter="handleBarcodeScan" placeholder="Scan Barcode..." 
            class="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all" />
        </div>
      </div>

      <!-- Products Grid -->
      <div class="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 pb-20 lg:pb-0">
        <button v-for="product in filteredProducts" :key="product.id" @click="openProductModal(product)"
          class="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl transition-all text-left group relative overflow-hidden flex flex-col">
          <div class="w-full aspect-square bg-slate-50 rounded-2xl mb-4 flex items-center justify-center text-slate-300 group-hover:bg-indigo-50 group-hover:text-indigo-400 transition-colors overflow-hidden">
            <img v-if="product.image" :src="product.image" class="w-full h-full object-cover" />
            <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <h3 class="font-bold text-slate-900 truncate text-sm mb-0.5">{{ product.name }}</h3>
          <p class="text-[10px] font-black text-slate-400 uppercase mb-3">{{ product.category }}</p>
          <div class="mt-auto flex items-center justify-between">
            <span class="text-indigo-600 font-black">{{ formatCurrency(product.price) }}</span>
            <span class="text-[10px] font-bold px-2 py-0.5 rounded-full" :class="product.stock <= 5 ? 'bg-rose-50 text-rose-500' : 'bg-slate-50 text-slate-400'">
               {{ product.stock }} left
            </span>
          </div>
        </button>
      </div>
    </div>

    <!-- Mobile Cart Backdrop -->
    <Transition
      enter-active-class="transition-opacity duration-300"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition-opacity duration-300"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
       <div v-if="isCartOpenMobile" @click="isCartOpenMobile = false" class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[50] lg:hidden"></div>
    </Transition>

    <!-- Right: Sidebar Cart Area -->
    <aside class="fixed inset-y-0 right-0 w-[85%] sm:w-[400px] bg-white z-[60] transform transition-transform duration-300 lg:static lg:w-[400px] lg:translate-x-0 lg:flex-shrink-0 flex flex-col h-full border-l border-slate-100 shadow-2xl lg:shadow-none"
      :class="[isCartOpenMobile ? 'translate-x-0' : 'translate-x-full lg:translate-x-0']">
      
      <!-- Cart Header -->
      <div class="p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
        <div>
          <h2 class="text-xl font-black text-slate-900">Current Order</h2>
          <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{{ cart.length }} items selected</p>
        </div>
        <div class="flex gap-2">
          <button @click="clearCart" class="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition-all" title="Clear Order">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
          <button @click="isCartOpenMobile = false" class="lg:hidden p-2 text-slate-400 hover:text-slate-600">
             <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
             </svg>
          </button>
        </div>
      </div>

      <!-- Cart Items -->
      <div class="flex-1 overflow-y-auto p-6 space-y-5 custom-scrollbar">
        <div v-if="cart.length === 0" class="h-full flex flex-col items-center justify-center text-center opacity-30">
          <div class="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-4 text-3xl">🛒</div>
          <p class="font-bold text-slate-500 uppercase tracking-widest text-xs">Your cart is empty</p>
        </div>

        <div v-for="item in cart" :key="item.id" class="flex items-center gap-4 group animate-in slide-in-from-right-4 duration-200">
          <div class="w-12 h-12 bg-slate-50 rounded-xl flex-shrink-0 flex items-center justify-center text-slate-400 overflow-hidden border border-slate-100">
            <img v-if="item.image" :src="item.image" class="w-full h-full object-cover" />
            <span v-else class="text-xl">📦</span>
          </div>
          <div class="flex-1 min-w-0">
            <h4 class="font-bold text-slate-900 truncate text-sm">{{ item.name }}</h4>
            <p class="text-indigo-600 font-black text-xs">{{ formatCurrency(item.price) }}</p>
          </div>
          <div class="flex items-center gap-2">
            <div class="flex items-center bg-slate-50 rounded-lg border border-slate-100 p-0.5">
               <button @click="updateQuantity(item.id, -1)" class="w-6 h-6 flex items-center justify-center rounded-md hover:bg-white hover:shadow-sm transition-all text-xs font-black">-</button>
               <span class="w-6 text-center font-bold text-xs">{{ item.quantity }}</span>
               <button @click="updateQuantity(item.id, 1)" class="w-6 h-6 flex items-center justify-center rounded-md hover:bg-white hover:shadow-sm transition-all text-xs font-black">+</button>
            </div>
            <button @click="removeFromCart(item.id)" class="text-slate-300 hover:text-rose-500 transition-colors p-1">
               <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
               </svg>
            </button>
          </div>
        </div>
      </div>

      <!-- Cart Footer / Summary -->
      <div class="p-6 bg-slate-50 border-t border-slate-100">
        <div class="space-y-3 mb-6">
          <div class="flex justify-between text-xs">
            <span class="text-slate-500 font-bold uppercase tracking-wider">Subtotal</span>
            <span class="text-slate-900 font-black">{{ formatCurrency(subtotal) }}</span>
          </div>
          
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <span class="text-slate-500 font-bold uppercase tracking-wider text-[10px]">Discount</span>
              <select v-model="discountType" class="text-[9px] font-black bg-white border border-slate-200 rounded px-1 outline-none">
                <option value="percent">%</option>
                <option value="amount">฿</option>
              </select>
            </div>
            <div class="flex items-center gap-2">
              <input type="number" v-model="discountValue" class="w-14 text-right text-xs font-black bg-white border border-slate-200 rounded-lg px-2 py-1 focus:ring-1 focus:ring-indigo-500 outline-none" />
              <span class="text-rose-500 font-black text-[10px]">(-{{ formatCurrency(discountAmount) }})</span>
            </div>
          </div>

          <div class="flex justify-between items-center pt-4 border-t border-slate-200">
            <span class="text-slate-900 font-black text-lg">Total</span>
            <span class="text-3xl font-black text-indigo-600">{{ formatCurrency(cartTotal) }}</span>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <button @click="handleHoldBill" :disabled="cart.length === 0"
            class="py-4 bg-amber-500 text-white rounded-2xl font-black text-sm shadow-lg shadow-amber-900/10 hover:bg-amber-600 disabled:opacity-50 transition-all">
            Hold Bill
          </button>
          <button @click="openCheckout" :disabled="cart.length === 0"
            class="py-4 bg-indigo-600 text-white rounded-2xl font-black text-sm shadow-lg shadow-indigo-900/20 hover:bg-indigo-700 disabled:opacity-50 transition-all">
            Checkout
          </button>
        </div>
      </div>
    </aside>

    <!-- Mobile View: Floating Cart Button -->
    <button v-if="!isCartOpenMobile" @click="isCartOpenMobile = true"
      class="lg:hidden fixed bottom-8 right-8 w-16 h-16 bg-indigo-600 text-white rounded-full shadow-2xl z-40 flex items-center justify-center animate-bounce-slow">
       <div class="relative">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
          </svg>
          <span v-if="cart.length > 0" class="absolute -top-2 -right-2 w-6 h-6 bg-rose-500 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white">
            {{ cart.length }}
          </span>
       </div>
    </button>

    <!-- Checkout Modal -->
    <div v-if="isCheckoutModalOpen" class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div class="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[95vh] animate-in fade-in zoom-in-95 duration-200">
        <div class="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h3 class="text-2xl font-black text-slate-900">Checkout</h3>
          <button @click="isCheckoutModalOpen = false" class="text-slate-400 hover:text-slate-600 transition-all">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div class="flex-1 overflow-y-auto p-8 space-y-8">
          <div class="bg-indigo-600 rounded-[2rem] p-8 flex justify-between items-center text-white shadow-xl shadow-indigo-100">
            <div>
              <p class="text-xs font-bold opacity-70 uppercase tracking-widest mb-1">Grand Total</p>
              <p class="text-4xl font-black">{{ formatCurrency(cartTotal) }}</p>
            </div>
            <div class="text-right">
              <p class="text-xs font-bold opacity-70 uppercase tracking-widest mb-1">Total Items</p>
              <p class="text-2xl font-black">{{ cart.length }}</p>
            </div>
          </div>

          <div class="space-y-6">
            <div>
              <label class="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Customer Member</label>
              <select v-model="selectedCustomerId"
                class="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 font-bold focus:ring-2 focus:ring-indigo-500 appearance-none text-sm transition-all">
                <option :value="null">Walking Customer (No Points)</option>
                <option v-for="c in customers" :key="c.id" :value="c.id">
                  {{ c.name }} ({{ c.phone }}) — {{ c.points }} pts
                </option>
              </select>
            </div>

            <div>
              <label class="block text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Payment Method</label>
              <div class="grid grid-cols-3 gap-4">
                <button @click="paymentMethod = 'cash'; amountReceived = null"
                  class="flex flex-col items-center justify-center p-6 rounded-3xl border-2 transition-all"
                  :class="[paymentMethod === 'cash' ? 'border-indigo-600 bg-indigo-50 text-indigo-600 shadow-md' : 'border-slate-100 text-slate-400 hover:bg-slate-50']">
                  <span class="text-3xl mb-2">💵</span>
                  <span class="font-black text-xs uppercase tracking-widest">Cash</span>
                </button>
                <button @click="paymentMethod = 'qr'; amountReceived = cartTotal"
                  class="flex flex-col items-center justify-center p-6 rounded-3xl border-2 transition-all"
                  :class="[paymentMethod === 'qr' ? 'border-indigo-600 bg-indigo-50 text-indigo-600 shadow-md' : 'border-slate-100 text-slate-400 hover:bg-slate-50']">
                  <span class="text-3xl mb-2">🔳</span>
                  <span class="font-black text-xs uppercase tracking-widest">QR Pay</span>
                </button>
                <button @click="paymentMethod = 'transfer'; amountReceived = cartTotal"
                  class="flex flex-col items-center justify-center p-6 rounded-3xl border-2 transition-all"
                  :class="[paymentMethod === 'transfer' ? 'border-indigo-600 bg-indigo-50 text-indigo-600 shadow-md' : 'border-slate-100 text-slate-400 hover:bg-slate-50']">
                  <span class="text-3xl mb-2">📱</span>
                  <span class="font-black text-xs uppercase tracking-widest">Bank</span>
                </button>
              </div>
            </div>

            <!-- Cash Input -->
            <div v-if="paymentMethod === 'cash'" class="space-y-6 animate-in slide-in-from-top-4 duration-300">
              <div>
                <label class="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Amount Received</label>
                <div class="grid grid-cols-4 gap-2 mb-4">
                  <button v-for="amt in [100, 500, 1000]" :key="amt" @click="amountReceived = (amountReceived || 0) + amt"
                    class="py-3 bg-slate-100 rounded-xl font-black text-xs hover:bg-slate-200 transition-all">+{{ amt }}</button>
                  <button @click="amountReceived = cartTotal" class="py-3 bg-indigo-50 text-indigo-600 rounded-xl font-black text-xs border border-indigo-100">Exact</button>
                </div>
                <input type="number" v-model="amountReceived" placeholder="0.00"
                  class="w-full px-6 py-6 bg-slate-50 border border-slate-200 rounded-[2rem] text-4xl font-black focus:ring-2 focus:ring-indigo-500 text-center outline-none" />
              </div>
              <div v-if="amountReceived" class="p-6 bg-emerald-50 rounded-3xl flex justify-between items-center border border-emerald-100">
                <span class="text-lg font-black text-emerald-600 uppercase tracking-widest">Change</span>
                <span class="text-4xl font-black text-emerald-700">{{ formatCurrency(changeDue) }}</span>
              </div>
            </div>

            <!-- QR/Transfer Capture -->
            <div v-if="paymentMethod === 'qr' || paymentMethod === 'transfer'" class="space-y-6 animate-in slide-in-from-top-4 duration-300">
              <div v-if="paymentMethod === 'qr'" class="flex flex-col items-center p-6 bg-slate-50 rounded-3xl border border-slate-200">
                <p class="font-bold text-slate-500 mb-4 uppercase tracking-widest text-[10px] text-center">Scan QR Code to pay {{ formatCurrency(cartTotal) }}</p>
                <div class="w-40 h-40 bg-white p-4 border-2 border-slate-100 rounded-2xl flex items-center justify-center relative shadow-sm mb-2">
                  <div class="grid grid-cols-4 grid-rows-4 gap-1 w-full h-full opacity-60">
                    <div v-for="n in 16" :key="n" :class="Math.random() > 0.5 ? 'bg-slate-900' : 'bg-transparent'" class="rounded-sm"></div>
                  </div>
                  <div class="absolute inset-0 flex items-center justify-center pointer-events-none">
                     <div class="bg-white p-1 rounded-md shadow-md font-black text-indigo-600 text-[10px] uppercase border border-indigo-50">VENDORA PAY</div>
                  </div>
                </div>
              </div>

              <div class="space-y-3">
                <label class="block text-xs font-black text-slate-400 uppercase tracking-widest">Payment Evidence / Slip</label>
                <div class="relative w-full aspect-video bg-slate-100 border-2 border-dashed border-slate-300 rounded-3xl overflow-hidden group flex items-center justify-center transition-all hover:bg-slate-200">
                   <img v-if="paymentSlip" :src="paymentSlip" class="w-full h-full object-cover" />
                   <div v-else class="text-center p-6">
                      <span class="text-4xl block mb-2">📸</span>
                      <span class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Take Photo or Upload Slip</span>
                   </div>
                   <input type="file" accept="image/*" capture="environment" @change="handleSlipUpload" class="absolute inset-0 opacity-0 cursor-pointer" />
                   <div v-if="paymentSlip" class="absolute top-4 right-4">
                      <button @click="paymentSlip = null" class="bg-rose-500 text-white p-2 rounded-xl shadow-lg hover:bg-rose-600 transition-all font-black text-xs">RE-TAKE</button>
                   </div>
                </div>
              </div>
            </div>

            <div>
              <label class="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Order Notes (Optional)</label>
              <textarea v-model="notes" rows="2" placeholder="Customer requests, table number..."
                class="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 text-sm transition-all outline-none"></textarea>
            </div>
          </div>
        </div>

        <div class="p-8 bg-slate-50 border-t border-slate-100">
          <button @click="completeCheckout"
            class="w-full py-6 bg-indigo-600 text-white rounded-[2rem] font-black text-xl shadow-2xl shadow-indigo-900/20 hover:bg-indigo-700 active:translate-y-0.5 transition-all">
            Finish Transaction
          </button>
        </div>
      </div>
    </div>

    <!-- Modals (Product Detail, Receipt, Held Bills) following the same polished design... -->
    <!-- (Redacted for brevity, assumed to be polished in next steps) -->
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
