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

const exportToExcel = () => {
  if (dailyStats.value.orders.length === 0) {
    alert('No data to export for this date.')
    return
  }

  const headers = ['Order ID', 'Time', 'Customer ID', 'Items Count', 'Subtotal', 'Discount', 'Total', 'Total Cost', 'Profit', 'Payment Method']
  const rows = dailyStats.value.orders.map(o => [
    o.id,
    new Date(o.timestamp).toLocaleTimeString(),
    o.customerId || 'Walking',
    o.items.length,
    o.subtotal,
    o.discount,
    o.total,
    o.totalCost || 0,
    o.profit || 0,
    o.paymentMethod
  ])

  const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.setAttribute('href', url)
  link.setAttribute('download', `sales_report_${selectedDate.value}.csv`)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

const profitStats = computed(() => {
  const dayOrders = dailyStats.value.orders
  const totalCost = dayOrders.reduce((sum, o) => sum + (o.totalCost || 0), 0)
  const totalProfit = dayOrders.reduce((sum, o) => sum + (o.profit || 0), 0)
  const margin = dailyStats.value.revenue > 0 ? (totalProfit / dailyStats.value.revenue) * 100 : 0
  
  return { totalCost, totalProfit, margin }
})

const hourlyTrend = computed(() => {
  const hours = Array.from({ length: 12 }, (_, i) => i + 9) // 9:00 to 20:00
  const data = hours.map(h => {
    const hourOrders = dailyStats.value.orders.filter(o => new Date(o.timestamp).getHours() === h)
    const total = hourOrders.reduce((sum, o) => sum + o.total, 0)
    return { hour: `${h}:00`, total }
  })
  
  const max = Math.max(...data.map(d => d.total), 1)
  return data.map(d => ({ ...d, height: (d.total / max) * 100 }))
})
</script>

<template>
  <div class="p-4 sm:p-6 lg:p-8">
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 lg:gap-6 mb-8 lg:mb-10">
      <div>
        <h1 class="text-2xl lg:text-3xl font-black text-slate-900 tracking-tight">รายงานการขาย</h1>
        <p class="text-slate-500 font-medium text-xs lg:text-sm mt-1">ติดตามผลการดำเนินงานของธุรกิจคุณ</p>
      </div>
      <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div class="flex items-center gap-3 bg-white p-2 rounded-2xl border border-slate-100 shadow-sm">
          <span class="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">วันที่:</span>
          <input type="date" v-model="selectedDate" 
            class="bg-slate-50 border-none rounded-xl px-3 py-2 font-bold text-slate-900 focus:ring-0 text-sm flex-1 md:flex-none" />
        </div>
        <button @click="exportToExcel" class="bg-emerald-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-emerald-100 hover:bg-emerald-700 transition-all flex items-center justify-center gap-2">
           <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
           </svg>
           <span>ส่งออก CSV</span>
        </button>
      </div>
    </div>

    <!-- Summary Cards -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-8 lg:mb-10">
      <div class="bg-indigo-600 p-6 lg:p-8 rounded-3xl lg:rounded-[2rem] text-white shadow-xl shadow-indigo-100 relative overflow-hidden">
        <div class="relative z-10">
          <p class="text-[10px] lg:text-xs font-bold opacity-70 uppercase tracking-widest mb-1">รายได้รวม</p>
          <p class="text-2xl lg:text-3xl font-black truncate">{{ formatCurrency(dailyStats.revenue) }}</p>
        </div>
      </div>

      <div class="bg-white p-6 lg:p-8 rounded-3xl lg:rounded-[2rem] border border-slate-100 shadow-sm">
        <p class="text-[10px] lg:text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">ต้นทุนรวม</p>
        <p class="text-2xl lg:text-3xl font-black text-slate-900">{{ formatCurrency(profitStats.totalCost) }}</p>
      </div>

      <div class="bg-white p-6 lg:p-8 rounded-3xl lg:rounded-[2rem] border border-slate-100 shadow-sm">
        <p class="text-[10px] lg:text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">กำไรขั้นต้น</p>
        <p class="text-2xl lg:text-3xl font-black" :class="profitStats.totalProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'">
           {{ formatCurrency(profitStats.totalProfit) }}
        </p>
      </div>

      <div class="bg-slate-900 p-6 lg:p-8 rounded-3xl lg:rounded-[2rem] text-white shadow-xl">
        <p class="text-[10px] lg:text-xs font-bold opacity-50 uppercase tracking-widest mb-1">อัตรากำไร</p>
        <p class="text-2xl lg:text-3xl font-black text-indigo-400">{{ profitStats.margin.toFixed(1) }}%</p>
      </div>
    </div>

    <!-- Charts Row -->
    <div class="mb-10">
       <div class="bg-white p-6 lg:p-10 rounded-3xl lg:rounded-[2.5rem] border border-slate-100 shadow-sm">
          <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
             <div>
                <h3 class="text-xl font-black text-slate-900">แนวโน้มการขายรายชั่วโมง</h3>
                <p class="text-xs text-slate-500 font-medium">การกระจายรายได้ตามช่วงเวลาที่เปิดทำการ</p>
             </div>
          </div>
          
          <div class="flex items-end justify-between h-48 lg:h-64 gap-2 lg:gap-4 pt-10">
             <div v-for="item in hourlyTrend" :key="item.hour" class="flex-1 flex flex-col items-center gap-3 group h-full">
                <div class="w-full bg-slate-50 rounded-xl lg:rounded-2xl relative overflow-hidden flex flex-col justify-end h-full">
                   <div class="w-full bg-indigo-500 rounded-xl lg:rounded-2xl transition-all duration-700 group-hover:bg-indigo-400" :style="{ height: item.height + '%' }"></div>
                   <div class="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <span class="bg-slate-900 text-white text-[8px] font-black px-1.5 py-0.5 rounded shadow-xl">{{ formatCurrency(item.total) }}</span>
                   </div>
                </div>
                <span class="text-[8px] lg:text-[10px] font-black text-slate-400 uppercase tracking-tighter">{{ item.hour }}</span>
             </div>
          </div>
       </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
      <!-- Recent Orders -->
      <div class="lg:col-span-2 space-y-4 lg:space-y-6">
        <div class="flex items-center justify-between px-2 lg:px-0">
           <h2 class="text-xl font-black text-slate-900">รายการธุรกรรม</h2>
           <span class="text-[10px] font-black text-slate-400 uppercase tracking-widest">{{ dailyStats.orders.length }} รายการ</span>
        </div>
        
        <div class="bg-white rounded-[1.5rem] lg:rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
          <div class="overflow-x-auto custom-scrollbar">
            <table class="w-full text-left min-w-[600px] lg:min-w-0">
              <thead>
                <tr class="bg-slate-50/50 border-b border-slate-100">
                  <th class="px-6 lg:px-8 py-4 lg:py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">เวลา / รหัสอ้างอิง</th>
                  <th class="px-6 lg:px-8 py-4 lg:py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">จำนวนสินค้า</th>
                  <th class="px-6 lg:px-8 py-4 lg:py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">ยอดรวม</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-50">
                <tr v-if="dailyStats.orders.length === 0">
                  <td colspan="3" class="px-6 lg:px-8 py-10 text-center text-slate-400 font-bold">ไม่พบรายการธุรกรรมในวันที่เลือก</td>
                </tr>
                <tr v-for="order in dailyStats.orders.slice().reverse()" :key="order.id" class="hover:bg-slate-50/50 transition-colors">
                  <td class="px-6 lg:px-8 py-4 lg:py-5">
                    <div class="flex flex-col min-w-0">
                      <span class="font-bold text-slate-900 text-xs lg:text-sm">{{ formatDate(order.timestamp) }}</span>
                      <span class="text-[9px] lg:text-[10px] text-slate-400 font-bold truncate">{{ order.id }}</span>
                    </div>
                  </td>
                  <td class="px-6 lg:px-8 py-4 lg:py-5">
                    <span class="text-xs lg:text-sm font-medium text-slate-600">{{ order.items.length }} รายการ</span>
                    <span class="ml-2 px-1.5 py-0.5 bg-slate-100 rounded text-[8px] font-black uppercase text-slate-500">{{ order.paymentMethod === 'cash' ? 'เงินสด' : order.paymentMethod === 'qr' ? 'คิวอาร์' : 'โอนเงิน' }}</span>
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
        <h2 class="text-xl font-black text-slate-900 px-2 lg:px-0">สินค้าขายดี</h2>
        <div class="bg-white p-6 lg:p-8 rounded-[1.5rem] lg:rounded-[2rem] border border-slate-100 shadow-sm space-y-4 lg:space-y-6">
          <div v-if="bestSellers.length === 0" class="text-center py-10 text-slate-400 font-bold">ยังไม่มีข้อมูล</div>
          <div v-for="(item, index) in bestSellers" :key="index" class="flex items-center gap-3 lg:gap-4">
            <div class="w-8 h-8 lg:w-10 lg:h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center font-black text-xs lg:text-sm flex-shrink-0">
              {{ index + 1 }}
            </div>
            <div class="flex-1 min-w-0">
              <p class="font-bold text-slate-900 text-xs lg:text-sm truncate">{{ item.name }}</p>
              <p class="text-[9px] lg:text-[10px] text-slate-400 font-bold uppercase truncate">ขายแล้ว {{ item.quantity }} ชิ้น</p>
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
