<script setup lang="ts">
import { ref } from 'vue'
import { useStores } from '~/composables/useStores'

const { stores, addStore } = useStores()
const isModalOpen = ref(false)
const storeName = ref('')
const storeType = ref('retail')
const storeCurrency = ref('THB')

const handleCreateStore = () => {
  if (!storeName.value) return
  addStore({
    name: storeName.value,
    type: storeType.value,
    currency: storeCurrency.value
  })
  storeName.value = ''
  storeType.value = 'retail'
  isModalOpen.value = false
}

definePageMeta({
  layout: 'dashboard'
})

const getStoreIcon = (type: string) => {
  switch (type) {
    case 'retail': return '🛍️'
    case 'restaurant': return '☕'
    case 'services': return '🛠️'
    default: return '🏪'
  }
}

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}
</script>

<template>
  <div class="p-8">
    <!-- Header -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
      <div>
        <h1 class="text-3xl font-black text-slate-900 tracking-tight">Your Business Portal</h1>
        <p class="text-slate-500 font-medium mt-1">Manage all your stores or create a new one to get started.</p>
      </div>
      <button @click="isModalOpen = true"
        class="flex items-center space-x-2 bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all hover:-translate-y-0.5">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clip-rule="evenodd" />
        </svg>
        <span>Add New Store</span>
      </button>
    </div>

    <!-- Store Grid -->
    <div v-if="stores.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div v-for="store in stores" :key="store.id" 
        class="bg-white group p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl hover:border-indigo-100 transition-all flex flex-col">
        <div class="flex items-start justify-between mb-6">
          <div class="flex items-center space-x-4">
            <div class="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-2xl group-hover:bg-indigo-50 transition-colors">
              {{ getStoreIcon(store.type) }}
            </div>
            <div>
              <h3 class="text-xl font-bold text-slate-900">{{ store.name }}</h3>
              <p class="text-slate-500 text-sm font-medium capitalize">{{ store.type }}</p>
            </div>
          </div>
          <span class="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-600">
            {{ store.status }}
          </span>
        </div>
        
        <div class="grid grid-cols-2 gap-4 mb-8">
          <div class="bg-slate-50 rounded-2xl p-4">
            <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Revenue</p>
            <p class="text-lg font-black text-slate-900">{{ store.currency }} {{ store.revenue.toLocaleString() }}</p>
          </div>
          <div class="bg-slate-50 rounded-2xl p-4">
            <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Orders</p>
            <p class="text-lg font-black text-slate-900">{{ store.orders }}</p>
          </div>
        </div>

        <div class="mt-auto flex items-center justify-between pt-4 border-t border-slate-50">
          <p class="text-xs text-slate-400 font-medium">Added: {{ formatDate(store.createdAt) }}</p>
          <NuxtLink :to="`/dashboard/store/${store.id}`" 
            class="flex items-center space-x-2 bg-slate-900 text-white px-4 py-2 rounded-xl font-bold text-sm hover:bg-indigo-600 transition-all">
            <span>Open Dashboard</span>
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clip-rule="evenodd" />
            </svg>
          </NuxtLink>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else class="bg-white rounded-3xl border-2 border-dashed border-slate-200 p-20 text-center animate-in fade-in zoom-in duration-500">
      <div class="max-w-md mx-auto text-center">
        <div class="w-24 h-24 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600 mx-auto mb-8">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        </div>
        <h2 class="text-2xl font-black text-slate-900 mb-4">You don't have any stores yet</h2>
        <p class="text-slate-500 mb-8 leading-relaxed font-medium">Create your first store to start managing inventory, processing sales, and tracking your business performance.</p>
        <button @click="isModalOpen = true"
          class="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-bold shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all hover:-translate-y-1">
          Create Your First Store
        </button>
      </div>
    </div>

    <!-- Create Store Modal -->
    <div v-if="isModalOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div class="bg-white rounded-[32px] shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-300">
        <div class="p-10">
          <div class="flex justify-between items-center mb-8">
            <h3 class="text-2xl font-black text-slate-900">Create New Store</h3>
            <button @click="isModalOpen = false" class="text-slate-400 hover:text-slate-600 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <form @submit.prevent="handleCreateStore" class="space-y-6">
            <div>
              <label class="block text-sm font-bold text-slate-700 mb-2">Store Name</label>
              <input type="text" required v-model="storeName"
                class="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                placeholder="e.g. Downtown Coffee Shop" />
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-bold text-slate-700 mb-2">Store Type</label>
                <select v-model="storeType"
                  class="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all appearance-none">
                  <option value="retail">🛍️ Retail</option>
                  <option value="restaurant">☕ Restaurant</option>
                  <option value="services">🛠️ Services</option>
                  <option value="other">🏪 Other</option>
                </select>
              </div>
              <div>
                <label class="block text-sm font-bold text-slate-700 mb-2">Currency</label>
                <select v-model="storeCurrency"
                  class="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all appearance-none">
                  <option value="THB">THB (฿)</option>
                  <option value="USD">USD ($)</option>
                </select>
              </div>
            </div>
            
            <div class="pt-6 flex space-x-4">
              <button type="button" @click="isModalOpen = false"
                class="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-200 transition-all">
                Cancel
              </button>
              <button type="submit"
                class="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all">
                Create Store
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>
