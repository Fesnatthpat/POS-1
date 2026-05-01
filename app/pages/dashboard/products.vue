<script setup lang="ts">
import { useProducts, type Product } from '~/composables/useProducts'
import { useSettings } from '~/composables/useSettings'

const { products, categories, addProduct, updateProduct, deleteProduct, addStock, stockMovements } = useProducts()
const { settings } = useSettings()

definePageMeta({
  layout: 'dashboard'
})

// --- State ---
const isModalOpen = ref(false)
const isStockModalOpen = ref(false)
const isMovementModalOpen = ref(false)
const isEditing = ref(false)
const searchQuery = ref('')

const currentProduct = ref<Omit<Product, 'id'>>({
  name: '',
  category: 'Beverages',
  price: 0,
  stock: 0,
  barcode: '',
  sku: '',
  image: ''
})
const editingId = ref<number | null>(null)

const stockAdjustment = ref(0)
const stockProductId = ref<number | null>(null)
const selectedProductForMovement = ref<Product | null>(null)

// --- Computed ---
const filteredMovements = computed(() => {
  if (!stockProductId.value) return []
  return stockMovements.value.filter(m => m.productId === stockProductId.value).slice().reverse()
})

const filteredProducts = computed(() => {
  return products.value.filter(p => 
    p.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
    p.category.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
    p.barcode?.includes(searchQuery.value) ||
    p.sku?.toLowerCase().includes(searchQuery.value.toLowerCase())
  )
})

// --- Actions ---
const handleImageUpload = (event: any) => {
  const file = event.target.files[0]
  if (file) {
    if (file.size > 500000) {
      alert('Image size is too large (Limit: 500KB)')
      return
    }
    const reader = new FileReader()
    reader.onload = (e) => {
      currentProduct.value.image = e.target?.result as string
    }
    reader.readAsDataURL(file)
  }
}

const openAddModal = () => {
  isEditing.value = false
  editingId.value = null
  currentProduct.value = {
    name: '',
    category: categories.value[0],
    price: 0,
    stock: 0,
    barcode: '',
    sku: '',
    image: ''
  }
  isModalOpen.value = true
}

const openEditModal = (product: Product) => {
  isEditing.value = true
  editingId.value = product.id
  currentProduct.value = {
    name: product.name,
    category: product.category,
    price: product.price,
    stock: product.stock,
    barcode: product.barcode || '',
    sku: product.sku || '',
    image: product.image || ''
  }
  isModalOpen.value = true
}

const saveProduct = () => {
  if (isEditing.value && editingId.value) {
    updateProduct(editingId.value, currentProduct.value)
  } else {
    addProduct(currentProduct.value)
  }
  isModalOpen.value = false
}

const openStockModal = (product: Product) => {
  stockProductId.value = product.id
  stockAdjustment.value = 0
  isStockModalOpen.value = true
}

const handleAddStock = () => {
  if (stockProductId.value && stockAdjustment.value !== 0) {
    addStock(stockProductId.value, stockAdjustment.value)
    isStockModalOpen.value = false
  }
}

const openMovementModal = (product: Product) => {
  stockProductId.value = product.id
  selectedProductForMovement.value = product
  isMovementModalOpen.value = true
}

const formatCurrency = (val: number) => {
  return new Intl.NumberFormat('th-TH', { style: 'currency', currency: settings.value.currency || 'THB' }).format(val)
}

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleString('th-TH')
}
</script>

<template>
  <div class="p-8">
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
      <div>
        <h1 class="text-3xl font-black text-slate-900 tracking-tight">Products & Inventory</h1>
        <p class="text-slate-500 font-medium mt-1">Manage your catalog, pricing, and stock levels.</p>
      </div>
      <div class="flex gap-3">
        <div class="relative">
          <span class="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </span>
          <input type="text" v-model="searchQuery" placeholder="Search product, barcode..." 
            class="pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 w-64" />
        </div>
        <button @click="openAddModal" class="flex items-center space-x-2 bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clip-rule="evenodd" />
          </svg>
          <span>New Product</span>
        </button>
      </div>
    </div>

    <!-- Stats Row -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 mb-8">
       <div class="bg-white p-4 lg:p-6 rounded-2xl lg:rounded-3xl border border-slate-100 shadow-sm">
          <p class="text-[9px] lg:text-xs font-bold text-slate-400 uppercase tracking-widest mb-1 truncate">Total Products</p>
          <p class="text-xl lg:text-2xl font-black text-slate-900">{{ products.length }}</p>
       </div>
       <div class="bg-white p-4 lg:p-6 rounded-2xl lg:rounded-3xl border border-slate-100 shadow-sm">
          <p class="text-[9px] lg:text-xs font-bold text-slate-400 uppercase tracking-widest mb-1 truncate">Low Stock</p>
          <p class="text-xl lg:text-2xl font-black text-amber-500">{{ products.filter(p => p.stock > 0 && p.stock <= 5).length }}</p>
       </div>
       <div class="bg-white p-4 lg:p-6 rounded-2xl lg:rounded-3xl border border-slate-100 shadow-sm">
          <p class="text-[9px] lg:text-xs font-bold text-slate-400 uppercase tracking-widest mb-1 truncate">Out of Stock</p>
          <p class="text-xl lg:text-2xl font-black text-rose-500">{{ products.filter(p => p.stock === 0).length }}</p>
       </div>
       <div class="bg-white p-4 lg:p-6 rounded-2xl lg:rounded-3xl border border-slate-100 shadow-sm">
          <p class="text-[9px] lg:text-xs font-bold text-slate-400 uppercase tracking-widest mb-1 truncate">Inv. Value</p>
          <p class="text-xl lg:text-2xl font-black text-indigo-600 truncate">{{ formatCurrency(products.reduce((sum, p) => sum + (p.price * p.stock), 0)) }}</p>
       </div>
    </div>

    <!-- Product Table -->
    <div class="bg-white rounded-[1.5rem] lg:rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
      <div class="overflow-x-auto custom-scrollbar">
        <table class="w-full text-left border-collapse min-w-[800px] lg:min-w-0">
          <thead>
            <tr class="bg-slate-50/50 border-b border-slate-100">
              <th class="px-6 lg:px-8 py-4 lg:py-5 font-bold text-slate-500 uppercase tracking-wider text-[10px]">Product Details</th>
              <th class="px-6 lg:px-8 py-4 lg:py-5 font-bold text-slate-500 uppercase tracking-wider text-[10px]">Inventory</th>
              <th class="px-6 lg:px-8 py-4 lg:py-5 font-bold text-slate-500 uppercase tracking-wider text-[10px]">Price</th>
              <th class="px-6 lg:px-8 py-4 lg:py-5 font-bold text-slate-500 uppercase tracking-wider text-[10px]">Status</th>
              <th class="px-6 lg:px-8 py-4 lg:py-5 font-bold text-slate-500 uppercase tracking-wider text-[10px] text-right">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-50">
            <tr v-for="product in filteredProducts" :key="product.id" class="hover:bg-slate-50/50 transition-colors group">
              <td class="px-6 lg:px-8 py-4 lg:py-5">
                <div class="flex items-center space-x-3 lg:space-x-4">
                  <div class="w-10 h-10 lg:w-12 lg:h-12 bg-slate-100 rounded-xl lg:rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-500 transition-colors overflow-hidden flex-shrink-0">
                    <img v-if="product.image" :src="product.image" class="w-full h-full object-cover" />
                    <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 lg:h-6 lg:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                  </div>
                  <div class="min-w-0">
                    <span class="font-bold text-slate-900 block truncate text-sm lg:text-base">{{ product.name }}</span>
                    <span class="text-[9px] lg:text-[10px] font-black text-slate-400 uppercase tracking-tighter truncate block">{{ product.category }} • {{ product.sku || 'NO SKU' }}</span>
                  </div>
                </div>
              </td>
              <td class="px-6 lg:px-8 py-4 lg:py-5">
                <div class="flex flex-col">
                  <span class="text-slate-900 font-bold text-xs lg:text-sm">{{ product.stock }} units</span>
                  <span class="text-[9px] lg:text-[10px] text-slate-400 font-bold uppercase truncate">{{ product.barcode || '-' }}</span>
                </div>
              </td>
              <td class="px-6 lg:px-8 py-4 lg:py-5 text-indigo-600 font-black text-xs lg:text-sm">{{ formatCurrency(product.price) }}</td>
              <td class="px-6 lg:px-8 py-4 lg:py-5">
                <span class="px-2 lg:px-3 py-1 rounded-full text-[9px] lg:text-[10px] font-black uppercase tracking-wider whitespace-nowrap" 
                  :class="{
                    'bg-emerald-50 text-emerald-600': product.stock > 5,
                    'bg-amber-50 text-amber-600': product.stock > 0 && product.stock <= 5,
                    'bg-rose-50 text-rose-600': product.stock === 0
                  }">
                  {{ product.stock === 0 ? 'Out of Stock' : (product.stock <= 5 ? 'Low Stock' : 'In Stock') }}
                </span>
              </td>
              <td class="px-6 lg:px-8 py-4 lg:py-5 text-right">
                <div class="flex justify-end space-x-1 lg:space-x-2">
                  <button @click="openMovementModal(product)" class="p-1.5 lg:p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg lg:rounded-xl transition-all" title="Movement History">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 lg:h-5 lg:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </button>
                  <button @click="openStockModal(product)" class="p-1.5 lg:p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg lg:rounded-xl transition-all" title="Adjust Stock">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 lg:h-5 lg:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </button>
                  <button @click="openEditModal(product)" class="p-1.5 lg:p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg lg:rounded-xl transition-all">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 lg:h-5 lg:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </button>
                  <button @click="deleteProduct(product.id)" class="p-1.5 lg:p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg lg:rounded-xl transition-all">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 lg:h-5 lg:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Add/Edit Product Modal -->
    <div v-if="isModalOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div class="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <div class="p-10">
          <div class="flex justify-between items-center mb-8">
            <h3 class="text-3xl font-black text-slate-900 tracking-tight">
              {{ isEditing ? 'Edit Product' : 'Create New Product' }}
            </h3>
            <button @click="isModalOpen = false" class="text-slate-400 hover:text-slate-600 transition-colors">X</button>
          </div>
          
          <form @submit.prevent="saveProduct" class="space-y-6">
            <!-- Image Upload -->
            <div class="flex flex-col items-center mb-6">
              <div class="w-32 h-32 bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl flex items-center justify-center relative overflow-hidden group">
                <img v-if="currentProduct.image" :src="currentProduct.image" class="w-full h-full object-cover" />
                <div v-else class="text-center p-4">
                  <span class="text-2xl mb-1 block">📸</span>
                  <span class="text-[10px] font-bold text-slate-400 uppercase">Upload Image</span>
                </div>
                <input type="file" accept="image/*" @change="handleImageUpload" class="absolute inset-0 opacity-0 cursor-pointer" />
                <div v-if="currentProduct.image" class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                   <span class="text-white text-[10px] font-bold uppercase">Change Image</span>
                </div>
              </div>
              <button v-if="currentProduct.image" type="button" @click="currentProduct.image = ''" class="mt-2 text-rose-500 text-[10px] font-bold uppercase hover:underline">Remove Image</button>
            </div>

            <div class="grid grid-cols-2 gap-6">
              <div class="col-span-2">
                <label class="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wider">Product Name</label>
                <input type="text" required v-model="currentProduct.name"
                  class="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500"
                  placeholder="e.g. Cold Brew Coffee" />
              </div>
              
              <div>
                <label class="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wider">Category</label>
                <select v-model="currentProduct.category"
                  class="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 appearance-none">
                  <option v-for="cat in categories" :key="cat" :value="cat">{{ cat }}</option>
                </select>
              </div>
              
              <div>
                <label class="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wider">Price (฿)</label>
                <input type="number" required v-model="currentProduct.price" step="0.01"
                  class="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 font-black text-indigo-600" />
              </div>

              <div>
                <label class="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wider">Barcode</label>
                <input type="text" v-model="currentProduct.barcode"
                  class="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500"
                  placeholder="885..." />
              </div>

              <div>
                <label class="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wider">SKU</label>
                <input type="text" v-model="currentProduct.sku"
                  class="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500"
                  placeholder="COF-001" />
              </div>

              <div v-if="!isEditing">
                <label class="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wider">Initial Stock</label>
                <input type="number" required v-model="currentProduct.stock"
                  class="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500" />
              </div>
            </div>
            
            <div class="pt-6 flex space-x-4">
              <button type="button" @click="isModalOpen = false"
                class="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black hover:bg-slate-200 transition-all">
                Cancel
              </button>
              <button type="submit"
                class="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all">
                {{ isEditing ? 'Update Product' : 'Add to Catalog' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- Stock Adjustment Modal -->
    <div v-if="isStockModalOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
       <div class="bg-white rounded-[2rem] shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-200">
          <div class="p-10">
             <h3 class="text-2xl font-black text-slate-900 mb-6">Adjust Stock</h3>
             <div class="space-y-6">
                <div>
                   <label class="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wider">Quantity to Add/Remove</label>
                   <div class="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                      <button @click="stockAdjustment--" class="w-10 h-10 bg-white rounded-xl shadow-sm font-black">-</button>
                      <input type="number" v-model="stockAdjustment" class="flex-1 bg-transparent text-center font-black text-xl outline-none" />
                      <button @click="stockAdjustment++" class="w-10 h-10 bg-white rounded-xl shadow-sm font-black">+</button>
                   </div>
                   <p class="text-[10px] font-bold text-slate-400 mt-2 text-center uppercase">Use negative numbers to reduce stock</p>
                </div>
                <div class="flex gap-3">
                   <button @click="isStockModalOpen = false" class="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold">Cancel</button>
                   <button @click="handleAddStock" class="flex-1 py-3 bg-emerald-500 text-white rounded-xl font-bold shadow-lg shadow-emerald-100">Update</button>
                </div>
             </div>
          </div>
       </div>
    </div>

    <!-- Stock Movement History Modal -->
    <div v-if="isMovementModalOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
       <div class="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in duration-200">
          <div class="p-10 border-b border-slate-100 flex justify-between items-center">
             <div>
                <h3 class="text-2xl font-black text-slate-900">Stock History</h3>
                <p class="text-sm font-medium text-slate-500 mt-1">{{ selectedProductForMovement?.name }}</p>
             </div>
             <button @click="isMovementModalOpen = false" class="text-slate-400 hover:text-slate-600 font-bold">X</button>
          </div>
          <div class="p-10 overflow-y-auto">
             <div v-if="filteredMovements.length === 0" class="text-center py-20 opacity-40 font-bold">
                No movements recorded yet.
             </div>
             <div class="space-y-4">
                <div v-for="m in filteredMovements" :key="m.id" class="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                   <div class="flex items-center gap-4">
                      <div class="w-10 h-10 rounded-xl flex items-center justify-center font-black"
                         :class="{
                            'bg-emerald-100 text-emerald-600': m.type === 'In',
                            'bg-rose-100 text-rose-600': m.type === 'Out' || m.type === 'Sale',
                            'bg-amber-100 text-amber-600': m.type === 'Adjustment'
                         }">
                         {{ m.type === 'In' ? '+' : '-' }}
                      </div>
                      <div>
                         <p class="font-bold text-slate-900">{{ m.type }} ({{ m.quantity }})</p>
                         <p class="text-[10px] text-slate-400 font-bold uppercase">{{ formatDate(m.timestamp) }}</p>
                      </div>
                   </div>
                   <div class="text-right">
                      <p class="text-xs font-bold text-slate-400 uppercase tracking-widest">Balance</p>
                      <p class="font-black text-slate-900">{{ m.newStock }}</p>
                   </div>
                </div>
             </div>
          </div>
       </div>
    </div>
  </div>
</template>
