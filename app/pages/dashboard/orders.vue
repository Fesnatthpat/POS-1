<script setup lang="ts">
import { useOrders } from '~/composables/useOrders'
import { useCustomers } from '~/composables/useCustomers'
import { useSettings } from '~/composables/useSettings'

const { orders } = useOrders()
const { customers } = useCustomers()
const { settings } = useSettings()

definePageMeta({
  layout: 'dashboard'
})

// --- State ---
const searchQuery = ref('')
const isReceiptModalOpen = ref(false)
const selectedOrder = ref<any>(null)

// --- Computed ---
const filteredOrders = computed(() => {
  return orders.value.filter(o => 
    o.id.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
    o.paymentMethod.toLowerCase().includes(searchQuery.value.toLowerCase())
  ).slice().reverse()
})

const getCustomerName = (id?: number) => {
  if (!id) return 'Walking Customer'
  const customer = customers.value.find(c => c.id === id)
  return customer ? customer.name : 'Unknown'
}

const formatCurrency = (val: number) => {
  return new Intl.NumberFormat('th-TH', { style: 'currency', currency: settings.value.currency || 'THB' }).format(val)
}

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleString('th-TH', {
    dateStyle: 'medium',
    timeStyle: 'short'
  })
}

// --- Actions ---
const viewReceipt = (order: any) => {
  selectedOrder.value = order
  isReceiptModalOpen.value = true
}
</script>

<template>
  <div class="p-4 sm:p-6 lg:p-8">
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 lg:gap-6 mb-8 lg:mb-10">
      <div>
        <h1 class="text-2xl lg:text-3xl font-black text-slate-900 tracking-tight">Order History</h1>
        <p class="text-slate-500 font-medium text-xs lg:text-sm mt-1">Review and manage all past transactions.</p>
      </div>
      <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div class="relative">
          <span class="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </span>
          <input type="text" v-model="searchQuery" placeholder="Search order ID..." 
            class="pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 w-full sm:w-64 transition-all" />
        </div>
        <NuxtLink to="/dashboard/pos" class="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2">
           <span>New Order</span>
        </NuxtLink>
      </div>
    </div>

    <div class="bg-white rounded-[1.5rem] lg:rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
      <div class="overflow-x-auto custom-scrollbar">
        <table class="w-full text-left border-collapse min-w-[800px] lg:min-w-0">
          <thead>
            <tr class="bg-slate-50/50 border-b border-slate-100">
              <th class="px-6 lg:px-8 py-4 lg:py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Order ID</th>
              <th class="px-6 lg:px-8 py-4 lg:py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Customer</th>
              <th class="px-6 lg:px-8 py-4 lg:py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Date & Time</th>
              <th class="px-6 lg:px-8 py-4 lg:py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Payment</th>
              <th class="px-6 lg:px-8 py-4 lg:py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Total</th>
              <th class="px-6 lg:px-8 py-4 lg:py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-50">
            <tr v-if="filteredOrders.length === 0">
               <td colspan="6" class="px-8 py-10 text-center text-slate-400 font-bold">No orders found.</td>
            </tr>
            <tr v-for="order in filteredOrders" :key="order.id" class="hover:bg-slate-50/50 transition-colors group">
              <td class="px-6 lg:px-8 py-4 lg:py-5 font-bold text-indigo-600 text-xs lg:text-sm">{{ order.id }}</td>
              <td class="px-6 lg:px-8 py-4 lg:py-5">
                 <div class="flex items-center gap-2">
                    <div class="w-7 h-7 lg:w-8 lg:h-8 bg-slate-100 rounded-full flex items-center justify-center text-[10px] lg:text-xs text-slate-500 font-bold flex-shrink-0">
                       {{ getCustomerName(order.customerId).charAt(0) }}
                    </div>
                    <span class="text-xs lg:text-sm text-slate-900 font-bold truncate max-w-[120px] lg:max-w-none">{{ getCustomerName(order.customerId) }}</span>
                 </div>
              </td>
              <td class="px-6 lg:px-8 py-4 lg:py-5 text-xs lg:text-sm text-slate-600 font-medium">{{ formatDate(order.timestamp) }}</td>
              <td class="px-6 lg:px-8 py-4 lg:py-5">
                <span class="px-2 lg:px-3 py-1 bg-slate-100 rounded-full text-[9px] lg:text-[10px] font-black uppercase text-slate-600 whitespace-nowrap">
                  {{ order.paymentMethod }}
                </span>
              </td>
              <td class="px-6 lg:px-8 py-4 lg:py-5 text-xs lg:text-sm text-slate-900 font-black">{{ formatCurrency(order.total) }}</td>
              <td class="px-6 lg:px-8 py-4 lg:py-5 text-right">
                <button @click="viewReceipt(order)" class="text-slate-400 hover:text-indigo-600 transition-colors p-2">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Receipt Modal (Built-in Responsive) -->
    <div v-if="isReceiptModalOpen" class="fixed inset-0 z-50 flex items-center justify-center p-2 lg:p-4 bg-slate-900/40 backdrop-blur-sm">
      <div class="bg-white rounded-[2rem] lg:rounded-[32px] shadow-2xl w-full max-w-sm overflow-hidden flex flex-col max-h-[95vh]">
        <div class="p-6 lg:p-8 text-center border-b border-dashed border-slate-200 flex-shrink-0">
           <div class="w-14 h-14 lg:w-16 lg:h-16 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-3 text-xl lg:text-2xl">📋</div>
           <h3 class="text-xl lg:text-2xl font-black text-slate-900">Order Receipt</h3>
           <p class="text-slate-400 font-bold uppercase tracking-widest text-[9px] lg:text-[10px] mt-1">Transaction History</p>
        </div>
        
        <div class="flex-1 overflow-y-auto p-6 lg:p-8 bg-slate-50/50">
          <div class="space-y-4 font-mono text-[10px] lg:text-xs border-b border-dashed border-slate-300 pb-4 lg:pb-6 mb-4 lg:mb-6">
            <div class="text-center font-bold mb-4">
               <p class="text-base lg:text-lg">{{ settings.name }}</p>
               <p>{{ settings.address }}</p>
               <p>Tel: {{ settings.phone }}</p>
            </div>
            <div class="flex justify-between">
              <span>Receipt:</span>
              <span class="font-bold">{{ selectedOrder?.id }}</span>
            </div>
            <div class="flex justify-between">
              <span>Date:</span>
              <span>{{ formatDate(selectedOrder?.timestamp) }}</span>
            </div>
            <div class="flex justify-between">
              <span>Customer:</span>
              <span class="truncate ml-4">{{ getCustomerName(selectedOrder?.customerId) }}</span>
            </div>
            <div class="py-3 lg:py-4 border-y border-dashed border-slate-300">
              <div v-for="item in selectedOrder?.items" :key="item.id" class="flex justify-between mb-1 gap-4">
                <span class="truncate">{{ item.name }} x{{ item.quantity }}</span>
                <span class="flex-shrink-0">{{ formatCurrency(item.price * item.quantity) }}</span>
              </div>
            </div>
            <div class="flex justify-between">
              <span>Subtotal:</span>
              <span>{{ formatCurrency(selectedOrder?.subtotal) }}</span>
            </div>
            <div v-if="selectedOrder?.discount" class="flex justify-between text-rose-500">
              <span>Discount:</span>
              <span>-{{ formatCurrency(selectedOrder?.discount) }}</span>
            </div>
            <div class="flex justify-between text-base lg:text-lg font-black pt-2 border-t border-slate-200 mt-2">
              <span>Total:</span>
              <span>{{ formatCurrency(selectedOrder?.total) }}</span>
            </div>
            <div class="flex justify-between pt-4 uppercase text-[9px] font-black">
               <span>Method: {{ selectedOrder?.paymentMethod }}</span>
            </div>
            <div v-if="selectedOrder?.paymentMethod === 'cash'" class="flex justify-between">
               <span>Paid:</span>
               <span>{{ formatCurrency(selectedOrder?.receivedAmount) }}</span>
            </div>
            <div v-if="selectedOrder?.paymentMethod === 'cash'" class="flex justify-between font-bold">
               <span>Change:</span>
               <span>{{ formatCurrency(selectedOrder?.changeDue) }}</span>
            </div>
            <div v-if="selectedOrder?.notes" class="mt-3 pt-3 border-t border-dashed border-slate-300 text-[9px] text-slate-500">
               <p class="font-bold uppercase mb-1">Notes:</p>
               <p>{{ selectedOrder.notes }}</p>
            </div>
          </div>
          
          <!-- Payment Slip Evidence -->
          <div v-if="selectedOrder?.paymentSlip" class="mb-6">
             <p class="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 text-center">Payment Evidence</p>
             <div class="rounded-xl overflow-hidden border border-slate-200 shadow-sm">
                <img :src="selectedOrder.paymentSlip" class="w-full h-auto" />
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
  </div>
</template>
