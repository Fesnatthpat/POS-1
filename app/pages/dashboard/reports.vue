<script setup lang="ts">
definePageMeta({
  layout: 'dashboard'
})

const reports = [
  { title: 'Total Sales', value: '฿152,400.00', trend: '+14%', period: 'Last 30 days' },
  { title: 'Average Order Value', value: '฿850.00', trend: '+5.2%', period: 'Last 30 days' },
  { title: 'Top Category', value: 'Food & Beverage', trend: 'Stable', period: 'Last 30 days' },
  { title: 'Refund Rate', value: '0.8%', trend: '-2%', period: 'Last 30 days' },
]

const topProducts = [
  { name: 'Espresso Roast', sales: 450, revenue: '฿24,500' },
  { name: 'Whole Wheat Bread', sales: 320, revenue: '฿12,800' },
  { name: 'Organic Honey', sales: 180, revenue: '฿9,900' },
  { name: 'Green Tea Pack', sales: 150, revenue: '฿7,500' },
]
</script>

<template>
  <div class="p-8">
    <div class="mb-10">
      <h1 class="text-3xl font-black text-slate-900 tracking-tight">Reports & Analytics</h1>
      <p class="text-slate-500 font-medium mt-1">Deep dive into your business performance and trends.</p>
    </div>

    <!-- Stats Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
      <div v-for="report in reports" :key="report.title" 
        class="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
        <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{{ report.title }}</p>
        <h3 class="text-2xl font-black text-slate-900 mb-2">{{ report.value }}</h3>
        <div class="flex items-center space-x-2">
          <span :class="[report.trend.startsWith('+') ? 'text-emerald-600 bg-emerald-50' : report.trend.startsWith('-') ? 'text-rose-600 bg-rose-50' : 'text-slate-500 bg-slate-50']" 
            class="text-[10px] font-black px-2 py-0.5 rounded-md">
            {{ report.trend }}
          </span>
          <span class="text-[10px] text-slate-400 font-bold uppercase">{{ report.period }}</span>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <!-- Sales Chart Placeholder -->
      <div class="lg:col-span-2 bg-white p-8 rounded-3xl border border-slate-100 shadow-sm flex flex-col min-h-[400px]">
        <div class="flex items-center justify-between mb-8">
          <h3 class="text-xl font-bold text-slate-900">Revenue Growth</h3>
          <select class="bg-slate-50 border-none rounded-xl text-xs font-bold text-slate-600 px-4 py-2 focus:ring-0">
            <option>Last 7 Days</option>
            <option>Last 30 Days</option>
            <option>Last 12 Months</option>
          </select>
        </div>
        <div class="flex-1 bg-slate-50 rounded-2xl border border-dashed border-slate-200 flex items-center justify-center relative overflow-hidden">
          <div class="absolute inset-0 flex items-end px-8 pb-8 space-x-4">
            <div v-for="i in 12" :key="i" 
              class="flex-1 bg-indigo-500/20 rounded-t-lg transition-all hover:bg-indigo-500"
              :style="{ height: `${Math.random() * 60 + 20}%` }">
            </div>
          </div>
          <span class="relative z-10 text-slate-400 font-medium italic">Monthly Revenue Visualization</span>
        </div>
      </div>

      <!-- Top Products -->
      <div class="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
        <h3 class="text-xl font-bold text-slate-900 mb-6">Top Selling Products</h3>
        <div class="space-y-6">
          <div v-for="product in topProducts" :key="product.name" class="flex items-center justify-between">
            <div class="flex items-center space-x-3">
              <div class="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-lg">📦</div>
              <div>
                <p class="text-sm font-bold text-slate-900">{{ product.name }}</p>
                <p class="text-xs text-slate-500 font-medium">{{ product.sales }} sales</p>
              </div>
            </div>
            <p class="text-sm font-black text-slate-900">{{ product.revenue }}</p>
          </div>
        </div>
        <button class="w-full mt-8 py-3 text-sm font-bold text-indigo-600 bg-indigo-50 rounded-xl hover:bg-indigo-100 transition-colors">
          View All Products
        </button>
      </div>
    </div>
  </div>
</template>
