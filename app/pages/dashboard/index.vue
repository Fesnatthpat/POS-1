<script setup lang="ts">
import { useOrders } from '~/composables/useOrders'
import { useProducts } from '~/composables/useProducts'
import { useCustomers } from '~/composables/useCustomers'
import { useSettings } from '~/composables/useSettings'

const { orders } = useOrders()
const { products } = useProducts()
const { customers } = useCustomers()
const { settings } = useSettings()

definePageMeta({
  layout: 'dashboard'
})

// --- Computed ---
const today = new Date().toDateString()
const todayOrders = computed(() => orders.value.filter(o => new Date(o.timestamp).toDateString() === today))
const todayRevenue = computed(() => todayOrders.value.reduce((sum, o) => sum + o.total, 0))

const lowStockItems = computed(() => products.value.filter(p => p.stock > 0 && p.stock <= 5))
const outOfStockItems = computed(() => products.value.filter(p => p.stock === 0))

// Sales Trend Data (Last 7 Days)
const salesTrend = computed(() => {
  const days = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const dateStr = d.toDateString()
    const dayName = d.toLocaleDateString('en-US', { weekday: 'short' })
    const dayOrders = orders.value.filter(o => new Date(o.timestamp).toDateString() === dateStr)
    const total = dayOrders.reduce((sum, o) => sum + o.total, 0)
    days.push({ dayName, total })
  }
  
  const max = Math.max(...days.map(d => d.total), 1)
  return days.map(d => ({ ...d, height: (d.total / max) * 100 }))
})

const formatCurrency = (val: number) => {
  return new Intl.NumberFormat('th-TH', { style: 'currency', currency: settings.value.currency || 'THB' }).format(val)
}
</script>

<template>
  <div class="p-8">
    <div class="mb-10">
      <h1 class="text-3xl font-black text-slate-900 tracking-tight">Dashboard Overview</h1>
      <p class="text-slate-500 font-medium mt-1">Welcome back! Here's what's happening today.</p>
    </div>

    <!-- Quick Stats -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-8 lg:mb-10">
      <div class="bg-white p-5 lg:p-6 rounded-3xl lg:rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-4">
         <div class="w-12 h-12 lg:w-14 lg:h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center text-xl lg:text-2xl flex-shrink-0">💰</div>
         <div class="min-w-0">
            <p class="text-[9px] lg:text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate">Today's Sales</p>
            <p class="text-lg lg:text-xl font-black text-slate-900 truncate">{{ formatCurrency(todayRevenue) }}</p>
         </div>
      </div>
      <div class="bg-white p-5 lg:p-6 rounded-3xl lg:rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-4">
         <div class="w-12 h-12 lg:w-14 lg:h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center text-xl lg:text-2xl flex-shrink-0">📦</div>
         <div class="min-w-0">
            <p class="text-[9px] lg:text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate">Orders Today</p>
            <p class="text-lg lg:text-xl font-black text-slate-900 truncate">{{ todayOrders.length }}</p>
         </div>
      </div>
      <div class="bg-white p-5 lg:p-6 rounded-3xl lg:rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-4">
         <div class="w-12 h-12 lg:w-14 lg:h-14 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center text-xl lg:text-2xl flex-shrink-0">👥</div>
         <div class="min-w-0">
            <p class="text-[9px] lg:text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate">Total Customers</p>
            <p class="text-lg lg:text-xl font-black text-slate-900 truncate">{{ customers.length }}</p>
         </div>
      </div>
      <div class="bg-white p-5 lg:p-6 rounded-3xl lg:rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-4">
         <div class="w-12 h-12 lg:w-14 lg:h-14 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center text-xl lg:text-2xl flex-shrink-0">⚠️</div>
         <div class="min-w-0">
            <p class="text-[9px] lg:text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate">Inventory</p>
            <p class="text-lg lg:text-xl font-black text-slate-900 truncate">{{ products.length }} items</p>
         </div>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
      <!-- Alerts -->
      <div class="lg:col-span-1 space-y-4 lg:space-y-6 order-2 lg:order-1">
         <div class="flex items-center justify-between">
            <h2 class="text-xl font-black text-slate-900">Inventory Alerts</h2>
            <span class="px-2 py-1 bg-rose-100 text-rose-600 rounded text-[9px] lg:text-[10px] font-black uppercase">{{ lowStockItems.length + outOfStockItems.length }} Issues</span>
         </div>
         <div class="space-y-3 lg:space-y-4">
            <div v-if="lowStockItems.length === 0 && outOfStockItems.length === 0" 
              class="p-6 lg:p-8 bg-emerald-50 rounded-3xl lg:rounded-[2rem] border border-emerald-100 text-center">
               <p class="text-emerald-600 font-bold text-sm lg:text-base">All stock levels are healthy! ✨</p>
            </div>
            
            <div v-for="item in outOfStockItems" :key="item.id" class="p-3 lg:p-4 bg-rose-50 rounded-2xl border border-rose-100 flex items-center gap-3 lg:gap-4">
               <div class="w-8 h-8 lg:w-10 lg:h-10 bg-rose-100 text-rose-600 rounded-xl flex items-center justify-center font-black text-sm lg:text-base">!</div>
               <div class="flex-1 min-w-0">
                  <p class="font-bold text-slate-900 text-xs lg:text-sm truncate">{{ item.name }}</p>
                  <p class="text-[9px] lg:text-[10px] font-black text-rose-500 uppercase">Out of Stock</p>
               </div>
               <NuxtLink to="/dashboard/products" class="text-[10px] lg:text-xs font-bold text-indigo-600 underline">Restock</NuxtLink>
            </div>

            <div v-for="item in lowStockItems" :key="item.id" class="p-3 lg:p-4 bg-amber-50 rounded-2xl border border-amber-100 flex items-center gap-3 lg:gap-4">
               <div class="w-8 h-8 lg:w-10 lg:h-10 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center font-black text-sm lg:text-base">!</div>
               <div class="flex-1 min-w-0">
                  <p class="font-bold text-slate-900 text-xs lg:text-sm truncate">{{ item.name }}</p>
                  <p class="text-[9px] lg:text-[10px] font-black text-amber-500 uppercase">Only {{ item.stock }} left</p>
               </div>
               <NuxtLink to="/dashboard/products" class="text-[10px] lg:text-xs font-bold text-indigo-600 underline">Restock</NuxtLink>
            </div>
         </div>
      </div>

      <!-- Quick Actions & Charts -->
      <div class="lg:col-span-2 space-y-6 lg:space-y-8 order-1 lg:order-2">
         <h2 class="text-xl font-black text-slate-900">Quick Actions</h2>
         <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 lg:gap-4">
            <NuxtLink to="/dashboard/pos" class="aspect-square bg-indigo-600 text-white p-4 lg:p-6 rounded-2xl lg:rounded-[2rem] flex flex-col items-center justify-center gap-2 lg:gap-3 hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100">
               <span class="text-2xl lg:text-3xl">🛒</span>
               <span class="font-bold text-xs lg:text-sm">Open POS</span>
            </NuxtLink>
            <NuxtLink to="/dashboard/products" class="aspect-square bg-white border border-slate-100 p-4 lg:p-6 rounded-2xl lg:rounded-[2rem] flex flex-col items-center justify-center gap-2 lg:gap-3 hover:bg-slate-50 transition-all shadow-sm">
               <span class="text-2xl lg:text-3xl">➕</span>
               <span class="font-bold text-xs lg:text-sm text-slate-900">Add Product</span>
            </NuxtLink>
            <NuxtLink to="/dashboard/reports" class="aspect-square bg-white border border-slate-100 p-4 lg:p-6 rounded-2xl lg:rounded-[2rem] flex flex-col items-center justify-center gap-2 lg:gap-3 hover:bg-slate-50 transition-all shadow-sm">
               <span class="text-2xl lg:text-3xl">📊</span>
               <span class="font-bold text-xs lg:text-sm text-slate-900">Reports</span>
            </NuxtLink>
            <NuxtLink to="/dashboard/customers" class="aspect-square bg-white border border-slate-100 p-4 lg:p-6 rounded-2xl lg:rounded-[2rem] flex flex-col items-center justify-center gap-2 lg:gap-3 hover:bg-slate-50 transition-all shadow-sm">
               <span class="text-2xl lg:text-3xl">👥</span>
               <span class="font-bold text-xs lg:text-sm text-slate-900">Customers</span>
            </NuxtLink>
         </div>

         <div class="bg-slate-900 p-6 lg:p-10 rounded-3xl lg:rounded-[2.5rem] text-white overflow-hidden relative">
            <h3 class="text-xl lg:text-2xl font-black mb-1 lg:mb-2">Sales Summary</h3>
            <p class="text-xs lg:text-sm text-slate-400 font-medium mb-6 lg:mb-8">Performance for the last 7 days.</p>
            
            <div class="flex items-end justify-between h-32 lg:h-40 gap-2 lg:gap-4">
               <div v-for="day in salesTrend" :key="day.dayName" class="flex-1 flex flex-col items-center gap-2 lg:gap-4 group">
                  <div class="w-full bg-indigo-500/20 rounded-full relative overflow-hidden flex flex-col justify-end h-full">
                     <div class="w-full bg-indigo-500 rounded-full transition-all duration-1000 group-hover:bg-indigo-400" :style="{ height: day.height + '%' }"></div>
                     <div class="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <span class="bg-white text-slate-900 text-[8px] lg:text-[10px] font-black px-1.5 py-1 rounded shadow-xl">{{ formatCurrency(day.total) }}</span>
                     </div>
                  </div>
                  <span class="text-[8px] lg:text-[10px] font-black text-slate-500 uppercase tracking-widest">{{ day.dayName }}</span>
               </div>
            </div>
         </div>
      </div>
    </div>
  </div>
</template>
