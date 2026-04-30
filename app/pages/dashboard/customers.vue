<script setup lang="ts">
import { useCustomers } from '~/composables/useCustomers'

const { customers, addCustomer, saveCustomers } = useCustomers()

definePageMeta({
  layout: 'dashboard'
})

// --- State ---
const isAddModalOpen = ref(false)
const isDetailsModalOpen = ref(false)
const isPointsModalOpen = ref(false)
const selectedCustomer = ref<any>(null)
const pointsToAdd = ref(0)

const newCustomer = ref({
  name: '',
  phone: '',
  level: 'Silver'
})

// --- Actions ---
const openAddModal = () => {
  newCustomer.value = { name: '', phone: '', level: 'Silver' }
  isAddModalOpen.value = true
}

const handleAddCustomer = () => {
  addCustomer({
    name: newCustomer.value.name,
    phone: newCustomer.value.phone,
    level: newCustomer.value.level
  })
  isAddModalOpen.value = false
}

const showDetails = (customer: any) => {
  selectedCustomer.value = customer
  isDetailsModalOpen.value = true
}

const openPointsModal = (customer: any) => {
  selectedCustomer.value = customer
  pointsToAdd.value = 0
  isPointsModalOpen.value = true
}

const handleAdjustPoints = () => {
  if (!selectedCustomer.value) return
  selectedCustomer.value.points += pointsToAdd.value
  if (selectedCustomer.value.points < 0) selectedCustomer.value.points = 0
  saveCustomers() // Explicitly save since we modified an object property
  isPointsModalOpen.value = false
}

const formatCurrency = (val: number) => {
  return new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB' }).format(val)
}
</script>

<template>
  <div class="p-4 sm:p-8">
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
      <div>
        <h1 class="text-3xl font-black text-slate-900 tracking-tight">Customer Management</h1>
        <p class="text-slate-500 font-medium mt-1">Manage members and track loyalty points.</p>
      </div>
      <button @click="openAddModal" class="flex items-center justify-center space-x-2 bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all hover:-translate-y-0.5">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clip-rule="evenodd" />
        </svg>
        <span>Add Member</span>
      </button>
    </div>

    <!-- Customers Grid/List -->
    <div class="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden overflow-x-auto">
      <table class="w-full text-left border-collapse text-sm min-w-[600px]">
        <thead>
          <tr class="bg-slate-50 border-b border-slate-100">
            <th class="px-6 py-4 font-bold text-slate-500 uppercase tracking-wider">Member</th>
            <th class="px-6 py-4 font-bold text-slate-500 uppercase tracking-wider">Contact</th>
            <th class="px-6 py-4 font-bold text-slate-500 uppercase tracking-wider">Level</th>
            <th class="px-6 py-4 font-bold text-slate-500 uppercase tracking-wider">Points</th>
            <th class="px-6 py-4 font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-50">
          <tr v-for="customer in customers" :key="customer.id" class="hover:bg-slate-50/80 transition-colors">
            <td class="px-6 py-4">
              <div class="flex items-center space-x-3">
                <div class="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold">
                  {{ customer.name.charAt(0) }}
                </div>
                <div>
                  <p class="font-bold text-slate-900">{{ customer.name }}</p>
                  <p class="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Joined: {{ customer.joinDate }}</p>
                </div>
              </div>
            </td>
            <td class="px-6 py-4 text-slate-600 font-medium">{{ customer.phone }}</td>
            <td class="px-6 py-4">
              <span class="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider"
                :class="{
                  'bg-yellow-50 text-yellow-600 border border-yellow-100': customer.level === 'Gold',
                  'bg-slate-50 text-slate-600 border border-slate-100': customer.level === 'Silver',
                  'bg-indigo-50 text-indigo-600 border border-indigo-100': customer.level === 'Platinum',
                }">
                {{ customer.level }}
              </span>
            </td>
            <td class="px-6 py-4">
              <div class="flex items-center space-x-1 text-indigo-600 font-black">
                <span>{{ customer.points.toLocaleString() }}</span>
                <span class="text-[10px] uppercase">pts</span>
              </div>
            </td>
            <td class="px-6 py-4 text-right">
              <div class="flex items-center justify-end space-x-3">
                <button @click="openPointsModal(customer)" class="text-emerald-600 font-bold text-xs hover:underline flex items-center space-x-1">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clip-rule="evenodd" />
                  </svg>
                  <span>Points</span>
                </button>
                <button @click="showDetails(customer)" class="text-indigo-600 font-bold text-xs hover:underline">
                  History
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Add Customer Modal -->
    <div v-if="isAddModalOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div class="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
        <div class="p-8">
          <h3 class="text-2xl font-black text-slate-900 tracking-tight mb-6">New Membership</h3>
          <form @submit.prevent="addCustomer" class="space-y-5">
            <div>
              <label class="block text-sm font-bold text-slate-700 mb-2">Full Name</label>
              <input type="text" required v-model="newCustomer.name"
                class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                placeholder="Enter customer name" />
            </div>
            <div>
              <label class="block text-sm font-bold text-slate-700 mb-2">Phone Number</label>
              <input type="tel" required v-model="newCustomer.phone"
                class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                placeholder="0xx-xxx-xxxx" />
            </div>
            <div>
              <label class="block text-sm font-bold text-slate-700 mb-2">Member Level</label>
              <select v-model="newCustomer.level"
                class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all appearance-none">
                <option>Silver</option>
                <option>Gold</option>
                <option>Platinum</option>
              </select>
            </div>
            <div class="pt-4 flex space-x-3">
              <button type="button" @click="isAddModalOpen = false"
                class="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-all">
                Cancel
              </button>
              <button type="submit"
                class="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all">
                Register Member
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- Adjust Points Modal -->
    <div v-if="isPointsModalOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div class="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-200">
        <div class="p-8 text-center">
          <div class="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 class="text-xl font-black text-slate-900 mb-2">Adjust Points</h3>
          <p class="text-sm text-slate-500 font-medium mb-6">Modifying points for <span class="text-indigo-600 font-bold">{{ selectedCustomer?.name }}</span></p>
          
          <div class="bg-slate-50 rounded-2xl p-6 mb-6">
            <p class="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Current Balance</p>
            <p class="text-2xl font-black text-slate-900">{{ selectedCustomer?.points.toLocaleString() }} <span class="text-sm">pts</span></p>
          </div>

          <div class="flex items-center space-x-4 mb-8">
            <button @click="pointsToAdd -= 100" class="w-12 h-12 bg-slate-100 text-slate-600 rounded-xl flex items-center justify-center hover:bg-slate-200 transition-all">-</button>
            <input type="number" v-model="pointsToAdd" 
              class="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-center font-black text-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all" />
            <button @click="pointsToAdd += 100" class="w-12 h-12 bg-slate-100 text-slate-600 rounded-xl flex items-center justify-center hover:bg-slate-200 transition-all">+</button>
          </div>

          <div class="flex space-x-3">
            <button @click="isPointsModalOpen = false"
              class="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-all">
              Cancel
            </button>
            <button @click="handleAdjustPoints"
              class="flex-1 py-3 bg-emerald-600 text-white rounded-xl font-bold shadow-lg shadow-emerald-100 hover:bg-emerald-700 transition-all">
              Update
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Customer History Modal -->
    <div v-if="isDetailsModalOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div class="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
        <div class="p-8 border-b border-slate-100">
          <div class="flex justify-between items-start">
            <div>
              <h3 class="text-2xl font-black text-slate-900 tracking-tight">{{ selectedCustomer?.name }}</h3>
              <p class="text-sm font-medium text-slate-500">{{ selectedCustomer?.phone }} — {{ selectedCustomer?.level }} Member</p>
            </div>
            <button @click="isDetailsModalOpen = false" class="p-2 text-slate-400 hover:text-slate-600">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        
        <div class="flex-1 overflow-y-auto p-8">
          <h4 class="font-black text-slate-900 uppercase tracking-widest text-xs mb-6">Purchase History</h4>
          
          <div v-if="selectedCustomer?.history.length === 0" class="text-center py-12 opacity-40">
            <p class="font-bold">No records found</p>
          </div>

          <div v-else class="space-y-6">
            <div v-for="record in selectedCustomer.history" :key="record.id" class="border border-slate-100 rounded-2xl p-5 bg-slate-50/50">
              <div class="flex justify-between items-center mb-4">
                <span class="text-xs font-black text-indigo-600 uppercase tracking-widest">Order #{{ record.id }}</span>
                <span class="text-xs font-bold text-slate-400">{{ record.date }}</span>
              </div>
              <ul class="space-y-2 mb-4">
                <li v-for="item in record.items" :key="item.name" class="flex justify-between text-sm">
                  <span class="text-slate-600">{{ item.name }} <span class="text-xs font-bold text-slate-400">x{{ item.qty }}</span></span>
                </li>
              </ul>
              <div class="pt-4 border-t border-slate-200 flex justify-between items-center">
                <span class="text-xs font-bold text-slate-500">Total Spent</span>
                <span class="font-black text-slate-900">{{ formatCurrency(record.total) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
