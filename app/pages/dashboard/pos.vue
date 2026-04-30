<script setup lang="ts">
import { useCustomers } from '~/composables/useCustomers'

const { customers, addPoints } = useCustomers()

definePageMeta({
  layout: 'dashboard'
})

// --- State ---
const products = ref([
  { id: 1, name: 'Premium Coffee Beans', category: 'Beverages', price: 450, stock: 12 },
  { id: 2, name: 'Organic Green Tea', category: 'Beverages', price: 280, stock: 45 },
  { id: 3, name: 'Artisan Sourdough', category: 'Bakery', price: 120, stock: 5 },
  { id: 4, name: 'Dark Chocolate Bar', category: 'Snacks', price: 95, stock: 10 },
  { id: 5, name: 'Fresh Milk', category: 'Beverages', price: 65, stock: 20 },
  { id: 6, name: 'Blueberry Muffin', category: 'Bakery', price: 85, stock: 15 },
])

const cart = ref<any[]>([])
const searchQuery = ref('')

// --- Product Modal State ---
const isProductModalOpen = ref(false)
const selectedProduct = ref<any>(null)
const selectedQuantity = ref(1)

// --- Checkout Modal State ---
const isCheckoutModalOpen = ref(false)
const paymentMethod = ref<'cash' | 'transfer'>('cash')
const amountReceived = ref<number | null>(null)
const paymentSlip = ref<string | null>(null)
const notes = ref('')
const selectedCustomerId = ref<number | null>(null)

// --- Computed ---
const filteredProducts = computed(() => {
  return products.value.filter(p => 
    p.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
    p.category.toLowerCase().includes(searchQuery.value.toLowerCase())
  )
})

const cartTotal = computed(() => {
  return cart.value.reduce((total, item) => total + (item.price * item.quantity), 0)
})

const changeDue = computed(() => {
  if (paymentMethod.value === 'cash' && amountReceived.value !== null) {
    return Math.max(0, amountReceived.value - cartTotal.value)
  }
  return 0
})

// --- Actions ---
const openProductModal = (product: any) => {
  if (product.stock <= 0) {
    alert('Out of stock!')
    return
  }
  selectedProduct.value = product
  selectedQuantity.value = 1
  isProductModalOpen.value = true
}

const closeProductModal = () => {
  isProductModalOpen.value = false
  selectedProduct.value = null
}

const confirmAddToCart = () => {
  if (!selectedProduct.value) return
  
  const product = selectedProduct.value
  const quantity = selectedQuantity.value
  
  const existingItem = cart.value.find(item => item.id === product.id)
  if (existingItem) {
    const totalQty = existingItem.quantity + quantity
    if (totalQty <= product.stock) {
      existingItem.quantity = totalQty
    } else {
      alert(`Only ${product.stock} items available in stock.`)
      return
    }
  } else {
    cart.value.push({ ...product, quantity })
  }
  
  closeProductModal()
}

const removeFromCart = (productId: number) => {
  cart.value = cart.value.filter(item => item.id !== productId)
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

const openCheckout = () => {
  if (cart.value.length === 0) return
  amountReceived.value = paymentMethod.value === 'cash' ? null : cartTotal.value
  paymentSlip.value = null
  notes.value = ''
  selectedCustomerId.value = null
  isCheckoutModalOpen.value = true
}

const handleSlipUpload = (event: any) => {
  const file = event.target.files[0]
  if (file) {
    const reader = new FileReader()
    reader.onload = (e) => {
      paymentSlip.value = e.target?.result as string
    }
    reader.readAsDataURL(file)
  }
}

const completeCheckout = () => {
  if (paymentMethod.value === 'cash' && (amountReceived.value || 0) < cartTotal.value) {
    alert('Received amount is less than total!')
    return
  }
  if (paymentMethod.value === 'transfer' && !paymentSlip.value) {
    alert('Please upload/take a photo of the payment slip!')
    return
  }

  // Award points if customer is selected
  if (selectedCustomerId.value) {
    addPoints(selectedCustomerId.value, cartTotal.value)
  }

  alert(`Order Completed! 
Total: ${formatCurrency(cartTotal.value)}
Method: ${paymentMethod.value}
Points Awarded: ${selectedCustomerId.value ? Math.floor(cartTotal.value) : 0}`)

  cart.value = []
  isCheckoutModalOpen.value = false
  selectedCustomerId.value = null
}

const formatCurrency = (val: number) => {
  return new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB' }).format(val)
}
</script>

<template>
  <div class="h-full flex flex-col lg:flex-row gap-8">
    <!-- Products Selection Area -->
    <div class="flex-1 flex flex-col min-w-0">
      <div class="mb-6">
        <h1 class="text-3xl font-black text-slate-900 tracking-tight">Point of Sale</h1>
        <p class="text-slate-500 font-medium mt-1">Select products to create a new order.</p>
      </div>

      <!-- Search & Filters -->
      <div class="mb-8 relative">
        <span class="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-400">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </span>
        <input type="text" v-model="searchQuery" placeholder="Search products by name or category..." 
          class="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all" />
      </div>

      <!-- Products Grid -->
      <div class="flex-1 overflow-y-auto pr-2">
        <div class="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4 pb-8">
          <button v-for="product in filteredProducts" :key="product.id" @click="openProductModal(product)"
            class="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all text-left group relative overflow-hidden">
            <div class="w-full aspect-square bg-slate-50 rounded-2xl mb-4 flex items-center justify-center text-slate-300 group-hover:bg-indigo-50 group-hover:text-indigo-400 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <h3 class="font-bold text-slate-900 truncate">{{ product.name }}</h3>
            <p class="text-xs font-bold text-slate-400 uppercase mb-2">{{ product.category }}</p>
            <div class="flex items-center justify-between">
              <span class="text-indigo-600 font-black">{{ formatCurrency(product.price) }}</span>
              <span class="text-[10px] font-bold text-slate-400">{{ product.stock }} left</span>
            </div>
          </button>
        </div>
      </div>
    </div>

    <!-- Cart Area -->
    <div class="w-full lg:w-[400px] flex-shrink-0 flex flex-col h-[600px] lg:h-full bg-white rounded-3xl border border-slate-100 shadow-xl overflow-hidden">
      <div class="p-6 border-b border-slate-100 bg-slate-50/50">
        <h2 class="text-xl font-black text-slate-900">Current Order</h2>
        <p class="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">{{ cart.length }} items selected</p>
      </div>

      <div class="flex-1 overflow-y-auto p-6 space-y-4">
        <div v-if="cart.length === 0" class="h-full flex flex-col items-center justify-center text-center opacity-40">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
          </svg>
          <p class="font-bold">Your cart is empty</p>
        </div>

        <div v-for="item in cart" :key="item.id" class="flex items-center space-x-4">
          <div class="w-12 h-12 bg-slate-50 rounded-xl flex-shrink-0 flex items-center justify-center text-slate-400">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <div class="flex-1 min-w-0">
            <h4 class="font-bold text-slate-900 truncate text-sm">{{ item.name }}</h4>
            <p class="text-indigo-600 font-bold text-xs">{{ formatCurrency(item.price) }}</p>
          </div>
          <div class="flex items-center space-x-2">
            <button @click="updateQuantity(item.id, -1)" class="w-7 h-7 flex items-center justify-center rounded-lg bg-slate-100">-</button>
            <span class="w-6 text-center font-bold text-sm">{{ item.quantity }}</span>
            <button @click="updateQuantity(item.id, 1)" class="w-7 h-7 flex items-center justify-center rounded-lg bg-slate-100">+</button>
            <button @click="removeFromCart(item.id)" class="ml-2 text-slate-300 hover:text-rose-500">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <div class="p-6 bg-slate-900 text-white">
        <div class="flex justify-between items-center mb-6">
          <span class="text-slate-400 font-bold">Total Amount</span>
          <span class="text-3xl font-black">{{ formatCurrency(cartTotal) }}</span>
        </div>
        <button @click="openCheckout" :disabled="cart.length === 0"
          class="w-full py-4 bg-indigo-600 rounded-2xl font-black shadow-lg shadow-indigo-900/50 hover:bg-indigo-500 disabled:bg-slate-800 transition-all">
          Review Payment & Checkout
        </button>
      </div>
    </div>

    <!-- Checkout Modal -->
    <div v-if="isCheckoutModalOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div class="bg-white rounded-[32px] shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div class="p-8 border-b border-slate-100 flex justify-between items-center">
          <h3 class="text-2xl font-black text-slate-900">Checkout</h3>
          <button @click="isCheckoutModalOpen = false" class="text-slate-400 hover:text-slate-600">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div class="flex-1 overflow-y-auto p-8 space-y-8">
          <div class="bg-slate-50 rounded-2xl p-6 flex justify-between items-center">
            <div>
              <p class="text-xs font-bold text-slate-400 uppercase tracking-widest">Payable Amount</p>
              <p class="text-3xl font-black text-slate-900">{{ formatCurrency(cartTotal) }}</p>
            </div>
            <div class="text-right">
              <p class="text-xs font-bold text-slate-400 uppercase tracking-widest">Items</p>
              <p class="text-xl font-bold text-slate-900">{{ cart.length }}</p>
            </div>
          </div>

          <div>
            <label class="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wider">Select Customer (for Points)</label>
            <div class="relative">
              <select v-model="selectedCustomerId"
                class="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none">
                <option :value="null">Walking Customer (No Points)</option>
                <option v-for="c in customers" :key="c.id" :value="c.id">
                  {{ c.name }} ({{ c.phone }})
                </option>
              </select>
            </div>
            <p v-if="selectedCustomerId" class="mt-2 text-xs font-bold text-emerald-600">
              This customer will receive {{ Math.floor(cartTotal) }} points
            </p>
          </div>

          <div>
            <label class="block text-sm font-bold text-slate-700 mb-4 uppercase tracking-wider">Select Payment Method</label>
            <div class="grid grid-cols-2 gap-4">
              <button @click="paymentMethod = 'cash'; amountReceived = null"
                class="flex flex-col items-center justify-center p-6 rounded-2xl border-2 transition-all"
                :class="[paymentMethod === 'cash' ? 'border-indigo-600 bg-indigo-50 text-indigo-600' : 'border-slate-100 text-slate-400']">
                <span class="text-3xl mb-2">💵</span>
                <span class="font-bold">Cash</span>
              </button>
              <button @click="paymentMethod = 'transfer'; amountReceived = cartTotal"
                class="flex flex-col items-center justify-center p-6 rounded-2xl border-2 transition-all"
                :class="[paymentMethod === 'transfer' ? 'border-indigo-600 bg-indigo-50 text-indigo-600' : 'border-slate-100 text-slate-400']">
                <span class="text-3xl mb-2">📱</span>
                <span class="font-bold">Transfer</span>
              </button>
            </div>
          </div>

          <div class="space-y-6">
            <div v-if="paymentMethod === 'cash'">
              <label class="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wider">Amount Received</label>
              <input type="number" v-model="amountReceived" placeholder="0.00"
                class="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-xl font-black focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              <div v-if="amountReceived" class="mt-4 p-4 bg-emerald-50 rounded-xl flex justify-between items-center">
                <span class="text-sm font-bold text-emerald-600 uppercase">Change Due:</span>
                <span class="text-xl font-black text-emerald-600">{{ formatCurrency(changeDue) }}</span>
              </div>
            </div>

            <div v-if="paymentMethod === 'transfer'" class="space-y-4">
              <label class="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wider">Payment Slip / Proof</label>
              <div class="flex flex-col items-center justify-center p-8 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50 relative overflow-hidden group">
                <template v-if="!paymentSlip">
                  <p class="text-xs font-bold text-slate-400 uppercase">Click to Take Photo or Upload Slip</p>
                  <input type="file" accept="image/*" capture="environment" @change="handleSlipUpload" class="absolute inset-0 opacity-0 cursor-pointer" />
                </template>
                <template v-else>
                  <img :src="paymentSlip" class="h-48 w-full object-cover rounded-xl mb-4" />
                  <button @click="paymentSlip = null" class="absolute top-4 right-4 bg-rose-500 text-white p-2 rounded-full">X</button>
                </template>
              </div>
            </div>

            <div>
              <label class="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wider">Remarks / Notes</label>
              <textarea v-model="notes" rows="3" placeholder="Add any extra information..."
                class="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500"></textarea>
            </div>
          </div>
        </div>

        <div class="p-8 border-t border-slate-100 bg-slate-50/30">
          <button @click="completeCheckout"
            class="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black text-lg shadow-xl hover:bg-indigo-700 transition-all">
            Finalize Order
          </button>
        </div>
      </div>
    </div>

    <!-- Product Detail Modal -->
    <div v-if="isProductModalOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div class="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
        <div class="p-8">
          <div class="flex justify-between items-start mb-6">
            <div>
              <p class="text-xs font-bold text-indigo-600 uppercase tracking-widest mb-1">{{ selectedProduct?.category }}</p>
              <h3 class="text-2xl font-black text-slate-900 tracking-tight">{{ selectedProduct?.name }}</h3>
            </div>
            <button @click="closeProductModal" class="p-2 text-slate-400 hover:text-slate-600">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div class="bg-slate-50 rounded-2xl p-6 mb-8 flex flex-col items-center justify-center text-slate-300">
            <span class="text-3xl font-black text-indigo-600">{{ formatCurrency(selectedProduct?.price) }}</span>
          </div>

          <div class="space-y-6">
            <div>
              <div class="flex justify-between items-center mb-4">
                <label class="text-sm font-bold text-slate-700">Quantity</label>
                <span class="text-xs font-bold text-slate-400">Available: {{ selectedProduct?.stock }}</span>
              </div>
              <div class="flex items-center justify-center space-x-6 bg-slate-50 p-4 rounded-2xl">
                <button @click="selectedQuantity > 1 ? selectedQuantity-- : null" class="w-12 h-12 bg-white rounded-xl shadow-sm">-</button>
                <span class="text-2xl font-black text-slate-900 w-12 text-center">{{ selectedQuantity }}</span>
                <button @click="selectedQuantity < selectedProduct?.stock ? selectedQuantity++ : null" class="w-12 h-12 bg-white rounded-xl shadow-sm">+</button>
              </div>
            </div>

            <button @click="confirmAddToCart"
              class="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-xl hover:bg-indigo-700 transition-all">
              Add to Order — {{ formatCurrency(selectedProduct?.price * selectedQuantity) }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
