<script setup lang="ts">
definePageMeta({
  layout: 'dashboard'
})

// --- State ---
const products = ref([
  { id: 1, name: 'Premium Coffee Beans', category: 'Beverages', price: 450, stock: 12, status: 'In Stock' },
  { id: 2, name: 'Organic Green Tea', category: 'Beverages', price: 280, stock: 45, status: 'In Stock' },
  { id: 3, name: 'Artisan Sourdough', category: 'Bakery', price: 120, stock: 5, status: 'Low Stock' },
  { id: 4, name: 'Dark Chocolate Bar', category: 'Snacks', price: 95, stock: 0, status: 'Out of Stock' },
])

const isModalOpen = ref(false)
const isEditing = ref(false)
const currentProduct = ref({
  id: 0,
  name: '',
  category: 'Beverages',
  price: 0,
  stock: 0
})

// --- Actions ---
const openAddModal = () => {
  isEditing.value = false
  currentProduct.value = { id: Date.now(), name: '', category: 'Beverages', price: 0, stock: 0 }
  isModalOpen.value = true
}

const openEditModal = (product: any) => {
  isEditing.value = true
  currentProduct.value = { ...product }
  isModalOpen.value = true
}

const closeModal = () => {
  isModalOpen.value = false
}

const saveProduct = () => {
  // Simple status calculation
  let status = 'In Stock'
  if (currentProduct.value.stock === 0) status = 'Out of Stock'
  else if (currentProduct.value.stock <= 5) status = 'Low Stock'

  const productData = { ...currentProduct.value, status }

  if (isEditing.value) {
    const index = products.value.findIndex(p => p.id === productData.id)
    if (index !== -1) products.value[index] = productData
  } else {
    products.value.push(productData)
  }
  closeModal()
}

const deleteProduct = (id: number) => {
  if (confirm('Are you sure you want to delete this product?')) {
    products.value = products.value.filter(p => p.id !== id)
  }
}

const formatCurrency = (val: number) => {
  return new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB' }).format(val)
}
</script>

<template>
  <div class="p-8">
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
      <div>
        <h1 class="text-3xl font-black text-slate-900 tracking-tight">Products</h1>
        <p class="text-slate-500 font-medium mt-1">Manage your inventory and product listings.</p>
      </div>
      <button @click="openAddModal" class="flex items-center space-x-2 bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all hover:-translate-y-0.5">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clip-rule="evenodd" />
        </svg>
        <span>Add Product</span>
      </button>
    </div>

    <!-- Product Table -->
    <div class="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
      <table class="w-full text-left border-collapse text-sm">
        <thead>
          <tr class="bg-slate-50 border-b border-slate-100">
            <th class="px-6 py-4 font-bold text-slate-500 uppercase tracking-wider">Product</th>
            <th class="px-6 py-4 font-bold text-slate-500 uppercase tracking-wider">Category</th>
            <th class="px-6 py-4 font-bold text-slate-500 uppercase tracking-wider">Price</th>
            <th class="px-6 py-4 font-bold text-slate-500 uppercase tracking-wider">Stock</th>
            <th class="px-6 py-4 font-bold text-slate-500 uppercase tracking-wider">Status</th>
            <th class="px-6 py-4 font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-50">
          <tr v-for="product in products" :key="product.id" class="hover:bg-slate-50/80 transition-colors">
            <td class="px-6 py-4">
              <div class="flex items-center space-x-3">
                <div class="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-400">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
                <span class="font-bold text-slate-900">{{ product.name }}</span>
              </div>
            </td>
            <td class="px-6 py-4 text-slate-600 font-medium">{{ product.category }}</td>
            <td class="px-6 py-4 text-slate-900 font-black">{{ formatCurrency(product.price) }}</td>
            <td class="px-6 py-4 text-slate-600 font-medium">{{ product.stock }}</td>
            <td class="px-6 py-4">
              <span class="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider" 
                :class="{
                  'bg-emerald-50 text-emerald-600': product.status === 'In Stock',
                  'bg-amber-50 text-amber-600': product.status === 'Low Stock',
                  'bg-rose-50 text-rose-600': product.status === 'Out of Stock'
                }">
                {{ product.status }}
              </span>
            </td>
            <td class="px-6 py-4 text-right">
              <div class="flex justify-end space-x-2">
                <button @click="openEditModal(product)" class="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </button>
                <button @click="deleteProduct(product.id)" class="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Add/Edit Product Modal -->
    <div v-if="isModalOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div class="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
        <div class="p-8">
          <div class="flex justify-between items-center mb-6">
            <h3 class="text-2xl font-black text-slate-900 tracking-tight">
              {{ isEditing ? 'Edit Product' : 'Add New Product' }}
            </h3>
            <button @click="closeModal" class="text-slate-400 hover:text-slate-600 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <form @submit.prevent="saveProduct" class="space-y-5">
            <div>
              <label class="block text-sm font-bold text-slate-700 mb-2">Product Name</label>
              <input type="text" required v-model="currentProduct.name"
                class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                placeholder="Enter product name" />
            </div>
            
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-bold text-slate-700 mb-2">Category</label>
                <select v-model="currentProduct.category"
                  class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all appearance-none">
                  <option>Beverages</option>
                  <option>Bakery</option>
                  <option>Snacks</option>
                  <option>Main Course</option>
                </select>
              </div>
              <div>
                <label class="block text-sm font-bold text-slate-700 mb-2">Price (฿)</label>
                <input type="number" required v-model="currentProduct.price"
                  class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all" />
              </div>
            </div>

            <div>
              <label class="block text-sm font-bold text-slate-700 mb-2">Stock Quantity</label>
              <input type="number" required v-model="currentProduct.stock"
                class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all" />
            </div>
            
            <div class="pt-4 flex space-x-3">
              <button type="button" @click="closeModal"
                class="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-all">
                Cancel
              </button>
              <button type="submit"
                class="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all">
                {{ isEditing ? 'Update Product' : 'Add Product' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

