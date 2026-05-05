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
const todayProfit = computed(() => todayOrders.value.reduce((sum, o) => sum + (o.profit || 0), 0))

const lowStockItems = computed(() => products.value.filter(p => p.stock > 0 && p.stock <= 5))
const outOfStockItems = computed(() => products.value.filter(p => p.stock === 0))

// Sales Trend Data (Last 7 Days)
const salesTrend = computed(() => {
  const days = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const dateStr = d.toDateString()
    const dayName = d.toLocaleDateString('th-TH', { weekday: 'short' })
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
      <h1 class="text-3xl font-black text-slate-900 tracking-tight">ภาพรวมแผงควบคุม</h1>
      <p class="text-slate-500 font-medium mt-1">ยินดีต้อนรับกลับมา! นี่คือสิ่งที่เกิดขึ้นในวันนี้</p>
    </div>

    <!-- Quick Stats -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-8 lg:mb-10">
      <div class="bg-indigo-600 p-5 lg:p-6 rounded-3xl lg:rounded-[2rem] text-white shadow-xl shadow-indigo-100 flex items-center gap-4">
         <div class="w-12 h-12 lg:w-14 lg:h-14 bg-white/20 rounded-2xl flex items-center justify-center text-xl lg:text-2xl flex-shrink-0">💰</div>
         <div class="min-w-0">
            <p class="text-[9px] lg:text-[10px] font-bold opacity-70 uppercase tracking-widest truncate">ยอดขายวันนี้</p>
            <p class="text-lg lg:text-xl font-black truncate">{{ formatCurrency(todayRevenue) }}</p>
         </div>
      </div>
      <div class="bg-white p-5 lg:p-6 rounded-3xl lg:rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-4">
         <div class="w-12 h-12 lg:w-14 lg:h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center text-xl lg:text-2xl flex-shrink-0">📈</div>
         <div class="min-w-0">
            <p class="text-[9px] lg:text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate">กำไรวันนี้</p>
            <p class="text-lg lg:text-xl font-black text-emerald-600 truncate">{{ formatCurrency(todayProfit) }}</p>
         </div>
      </div>
      <div class="bg-white p-5 lg:p-6 rounded-3xl lg:rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-4">
         <div class="w-12 h-12 lg:w-14 lg:h-14 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center text-xl lg:text-2xl flex-shrink-0">📦</div>
         <div class="min-w-0">
            <p class="text-[9px] lg:text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate">คำสั่งซื้อวันนี้</p>
            <p class="text-lg lg:text-xl font-black text-slate-900 truncate">{{ todayOrders.length }}</p>
         </div>
      </div>
      <div class="bg-white p-5 lg:p-6 rounded-3xl lg:rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-4">
         <div class="w-12 h-12 lg:w-14 lg:h-14 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center text-xl lg:text-2xl flex-shrink-0">⚠️</div>
         <div class="min-w-0">
            <p class="text-[9px] lg:text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate">สินค้าใกล้หมด</p>
            <p class="text-lg lg:text-xl font-black text-rose-600 truncate">{{ lowStockItems.length + outOfStockItems.length }} รายการ</p>
         </div>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
      <!-- Chart Area -->
      <div class="lg:col-span-2 space-y-6">
         <div class="bg-slate-900 p-6 lg:p-10 rounded-3xl lg:rounded-[2.5rem] text-white overflow-hidden relative">
            <h3 class="text-xl lg:text-2xl font-black mb-1 lg:mb-2">ประสิทธิภาพการขาย</h3>
            <p class="text-xs lg:text-sm text-slate-400 font-medium mb-8">การแสดงแนวโน้มรายได้รายสัปดาห์</p>
            
            <div class="flex items-end justify-between h-48 lg:h-64 gap-2 lg:gap-6 pt-10">
               <div v-for="day in salesTrend" :key="day.dayName" class="flex-1 flex flex-col items-center gap-3 lg:gap-4 group h-full">
                  <div class="w-full bg-white/10 rounded-2xl lg:rounded-3xl relative overflow-hidden flex flex-col justify-end h-full">
                     <div class="w-full bg-indigo-500 rounded-2xl lg:rounded-3xl transition-all duration-1000 group-hover:bg-indigo-400 shadow-[0_0_20px_rgba(99,102,241,0.3)]" :style="{ height: day.height + '%' }"></div>
                     <!-- Tooltip -->
                     <div class="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <span class="bg-white text-slate-900 text-[9px] lg:text-xs font-black px-2 py-1 rounded-lg shadow-2xl whitespace-nowrap">{{ formatCurrency(day.total) }}</span>
                     </div>
                  </div>
                  <span class="text-[9px] lg:text-[10px] font-black text-slate-500 uppercase tracking-widest">{{ day.dayName }}</span>
               </div>
            </div>
         </div>

         <div class="grid grid-cols-2 md:grid-cols-4 gap-3 lg:gap-4">
            <NuxtLink to="/dashboard/pos" class="aspect-square bg-white border border-slate-100 p-4 lg:p-6 rounded-2xl lg:rounded-[2rem] flex flex-col items-center justify-center gap-2 lg:gap-3 hover:bg-slate-50 transition-all shadow-sm">
               <span class="text-2xl lg:text-3xl">🛒</span>
               <span class="font-bold text-[10px] lg:text-sm text-slate-900">ระบบขาย POS</span>
            </NuxtLink>
            <NuxtLink to="/dashboard/products" class="aspect-square bg-white border border-slate-100 p-4 lg:p-6 rounded-2xl lg:rounded-[2rem] flex flex-col items-center justify-center gap-2 lg:gap-3 hover:bg-slate-50 transition-all shadow-sm">
               <span class="text-2xl lg:text-3xl">➕</span>
               <span class="font-bold text-[10px] lg:text-sm text-slate-900">เพิ่มสินค้า</span>
            </NuxtLink>
            <NuxtLink to="/dashboard/reports" class="aspect-square bg-white border border-slate-100 p-4 lg:p-6 rounded-2xl lg:rounded-[2rem] flex flex-col items-center justify-center gap-2 lg:gap-3 hover:bg-slate-50 transition-all shadow-sm">
               <span class="text-2xl lg:text-3xl">📊</span>
               <span class="font-bold text-[10px] lg:text-sm text-slate-900">รายงาน</span>
            </NuxtLink>
            <NuxtLink to="/dashboard/customers" class="aspect-square bg-white border border-slate-100 p-4 lg:p-6 rounded-2xl lg:rounded-[2rem] flex flex-col items-center justify-center gap-2 lg:gap-3 hover:bg-slate-50 transition-all shadow-sm">
               <span class="text-2xl lg:text-3xl">👥</span>
               <span class="font-bold text-[10px] lg:text-sm text-slate-900">ลูกค้า</span>
            </NuxtLink>
         </div>
      </div>

      <!-- Inventory Alerts Sidebar -->
      <div class="space-y-6">
         <div class="flex items-center justify-between">
            <h2 class="text-xl font-black text-slate-900">สถานะคลังสินค้า</h2>
            <span class="px-2 py-1 bg-rose-100 text-rose-600 rounded text-[9px] font-black uppercase">{{ lowStockItems.length + outOfStockItems.length }} การแจ้งเตือน</span>
         </div>
         <div class="space-y-3">
            <div v-if="lowStockItems.length === 0 && outOfStockItems.length === 0" 
              class="p-8 bg-emerald-50 rounded-[2rem] border border-emerald-100 text-center">
               <p class="text-emerald-600 font-bold text-sm">คลังสินค้าปกติดี! ✨</p>
            </div>
            
            <div v-for="item in outOfStockItems" :key="item.id" class="p-3 lg:p-4 bg-rose-50 rounded-2xl border border-rose-100 flex items-center gap-3">
               <div class="w-8 h-8 lg:w-10 lg:h-10 bg-rose-100 text-rose-600 rounded-xl flex items-center justify-center font-black text-sm lg:text-base flex-shrink-0">!</div>
               <div class="flex-1 min-w-0">
                  <p class="font-bold text-slate-900 text-xs lg:text-sm truncate">{{ item.name }}</p>
                  <p class="text-[9px] font-black text-rose-500 uppercase">สินค้าหมด</p>
               </div>
               <NuxtLink to="/dashboard/products" class="text-[10px] font-bold text-indigo-600 underline whitespace-nowrap">เติมสินค้า</NuxtLink>
            </div>

            <div v-for="item in lowStockItems" :key="item.id" class="p-3 lg:p-4 bg-amber-50 rounded-2xl border border-amber-100 flex items-center gap-3">
               <div class="w-8 h-8 lg:w-10 lg:h-10 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center font-black text-sm lg:text-base flex-shrink-0">!</div>
               <div class="flex-1 min-w-0">
                  <p class="font-bold text-slate-900 text-xs lg:text-sm truncate">{{ item.name }}</p>
                  <p class="text-[9px] font-black text-amber-500 uppercase">เหลือเพียง {{ item.stock }} ชิ้น</p>
               </div>
               <NuxtLink to="/dashboard/products" class="text-[10px] font-bold text-indigo-600 underline whitespace-nowrap">เติมสินค้า</NuxtLink>
            </div>
         </div>

         <!-- Quick Summary -->
         <div class="bg-indigo-50 p-6 rounded-[2rem] border border-indigo-100">
            <h4 class="text-sm font-black text-indigo-900 mb-4 uppercase tracking-widest">สรุปธุรกิจ</h4>
            <div class="space-y-3">
               <div class="flex justify-between items-center text-xs">
                  <span class="text-indigo-600/60 font-bold">กำไรขั้นต้นวันนี้</span>
                  <span class="font-black text-indigo-900">{{ todayRevenue > 0 ? ((todayProfit / todayRevenue) * 100).toFixed(1) : 0 }}%</span>
               </div>
               <div class="flex justify-between items-center text-xs">
                  <span class="text-indigo-600/60 font-bold">พนักงานที่ปฏิบัติงาน</span>
                  <span class="font-black text-indigo-900">2 คน</span>
               </div>
            </div>
         </div>
      </div>
    </div>
  </div>
</template>
