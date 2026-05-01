<script setup lang="ts">
import { useOrders } from '~/composables/useOrders'
import { useSettings } from '~/composables/useSettings'

const { orders, getBestSellers } = useOrders()
const { settings } = useSettings()

definePageMeta({
  layout: 'dashboard'
})

// --- State ---
const selectedDate = ref(new Date().toISOString().split('T')[0])

// --- Computed ---
const dailyStats = computed(() => {
  const targetDate = new Date(selectedDate.value).toDateString()
  const dayOrders = orders.value.filter(o => new Date(o.timestamp).toDateString() === targetDate)
  
  const revenue = dayOrders.reduce((sum, o) => sum + o.total, 0)
  const count = dayOrders.length
  const avg = count > 0 ? revenue / count : 0
  
  return { revenue, count, avg, orders: dayOrders }
})

const bestSellers = computed(() => getBestSellers(5))

const formatCurrency = (val: number) => {
  return new Intl.NumberFormat('th-TH', { style: 'currency', currency: settings.value.currency || 'THB' }).format(val)
}

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })
}
</script>

<template>
  <div class="p-4 sm:p-6 lg:p-8">
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 lg:gap-6 mb-8 lg:mb-10">
      <div>
        <h1 class="text-2xl lg:text-3xl font-black text-slate-900 tracking-tight">Sales Reports</h1>
        <p class="text-slate-500 font-medium text-xs lg:text-sm mt-1">Track your business performance.</p>
      </div>
      <div class="flex items-center gap-3 bg-white p-2 rounded-2xl border border-slate-100 shadow-sm w-full md:w-auto">
        <span class="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">Date:</span>
        <input type="date" v-model="selectedDate" 
          class="bg-slate-50 border-none rounded-xl px-3 py-2 font-bold text-slate-900 focus:ring-0 text-sm flex-1 md:flex-none" />
      </div>
    </div>

    <!-- Summary Cards -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 lg:gap-6 mb-8 lg:mb-10">
      <div class="bg-indigo-600 p-6 lg:p-8 rounded-3xl lg:rounded-[2rem] text-white shadow-xl shadow-indigo-100 relative overflow-hidden">
        <div class="relative z-10">
          <p class="text-[10px] lg:text-xs font-bold opacity-70 uppercase tracking-widest mb-1 lg:mb-2">Total Revenue</p>
          <p class="text-2xl lg:text-4xl font-black truncate">{{ formatCurrency(dailyStats.revenue) }}</p>
          <div class="mt-4 flex items-center text-[10px] font-bold bg-white/20 w-max px-2 py-0.5 rounded-full">
            Today
          </div>
        </div>
        <div class="absolute -right-4 -bottom-4 opacity-10">
           <svg xmlns="http://www.w3.org/2000/svg" class="h-24 w-24 lg:h-32 lg:w-32" fill="none" viewBox="0 0 24 24" stroke="currentColor">
             <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
           </svg>
        </div>
      </div>

      <div class="bg-white p-6 lg:p-8 rounded-3xl lg:rounded-[2rem] border border-slate-100 shadow-sm">
        <p class="text-[10px] lg:text-xs font-bold text-slate-400 uppercase tracking-widest mb-1 lg:mb-2">Orders Today</p>
        <p class="text-2xl lg:text-4xl font-black text-slate-900">{{ dailyStats.count }}</p>
        <p class="text-[10px] lg:text-sm text-slate-500 font-medium mt-3 lg:mt-4">Avg: <span class="font-bold text-slate-900">{{ formatCurrency(dailyStats.avg) }}</span></p>
      </div>

      <div class="bg-white p-6 lg:p-8 rounded-3xl lg:rounded-[2rem] border border-slate-100 shadow-sm">
        <p class="text-[10px] lg:text-xs font-bold text-slate-400 uppercase tracking-widest mb-1 lg:mb-2">Life-time Orders</p>
        <p class="text-2xl lg:text-4xl font-black text-slate-900">{{ orders.length }}</p>
        <p class="text-[10px] lg:text-sm text-slate-500 font-medium mt-3 lg:mt-4">Rev: <span class="font-bold text-indigo-600">{{ formatCurrency(orders.reduce((s,o) => s+o.total, 0)) }}</span></p>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
      <!-- Recent Orders -->
      <div class="lg:col-span-2 space-y-4 lg:space-y-6">
        <div class="flex items-center justify-between px-2 lg:px-0">
           <h2 class="text-xl font-black text-slate-900">Transactions</h2>
           <span class="text-[10px] font-black text-slate-400 uppercase tracking-widest">{{ dailyStats.orders.length }} Items</span>
        </div>
        
        <div class="bg-white rounded-[1.5rem] lg:rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
          <div class="overflow-x-auto custom-scrollbar">
            <table class="w-full text-left min-w-[600px] lg:min-w-0">
              <thead>
                <tr class="bg-slate-50/50 border-b border-slate-100">
                  <th class="px-6 lg:px-8 py-4 lg:py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Time / ID</th>
                  <th class="px-6 lg:px-8 py-4 lg:py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Items</th>
                  <th class="px-6 lg:px-8 py-4 lg:py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Total</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-50">
                <tr v-if="dailyStats.orders.length === 0">
                  <td colspan="3" class="px-6 lg:px-8 py-10 text-center text-slate-400 font-bold">No transactions for this date.</td>
                </tr>
                <tr v-for="order in dailyStats.orders.slice().reverse()" :key="order.id" class="hover:bg-slate-50/50 transition-colors">
                  <td class="px-6 lg:px-8 py-4 lg:py-5">
                    <div class="flex flex-col min-w-0">
                      <span class="font-bold text-slate-900 text-xs lg:text-sm">{{ formatDate(order.timestamp) }}</span>
                      <span class="text-[9px] lg:text-[10px] text-slate-400 font-bold truncate">{{ order.id }}</span>
                    </div>
                  </td>
                  <td class="px-6 lg:px-8 py-4 lg:py-5">
                    <span class="text-xs lg:text-sm font-medium text-slate-600">{{ order.items.length }} items</span>
                    <span class="ml-2 px-1.5 py-0.5 bg-slate-100 rounded text-[8px] font-black uppercase text-slate-500">{{ order.paymentMethod }}</span>
                  </td>
                  <td class="px-6 lg:px-8 py-4 lg:py-5 text-right font-black text-slate-900 text-xs lg:text-sm">
                    {{ formatCurrency(order.total) }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Best Sellers -->
      <div class="space-y-4 lg:space-y-6">
        <h2 class="text-xl font-black text-slate-900 px-2 lg:px-0">Top Products</h2>
        <div class="bg-white p-6 lg:p-8 rounded-[1.5rem] lg:rounded-[2rem] border border-slate-100 shadow-sm space-y-4 lg:space-y-6">
          <div v-if="bestSellers.length === 0" class="text-center py-10 text-slate-400 font-bold">No data yet.</div>
          <div v-for="(item, index) in bestSellers" :key="index" class="flex items-center gap-3 lg:gap-4">
            <div class="w-8 h-8 lg:w-10 lg:h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center font-black text-xs lg:text-sm flex-shrink-0">
              {{ index + 1 }}
            </div>
            <div class="flex-1 min-w-0">
              <p class="font-bold text-slate-900 text-xs lg:text-sm truncate">{{ item.name }}</p>
              <p class="text-[9px] lg:text-[10px] text-slate-400 font-bold uppercase truncate">{{ item.quantity }} units sold</p>
            </div>
            <div class="text-right flex-shrink-0">
               <p class="font-black text-slate-900 text-xs lg:text-sm">{{ formatCurrency(item.revenue) }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
