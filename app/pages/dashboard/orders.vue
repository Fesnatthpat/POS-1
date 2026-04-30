<script setup lang="ts">
definePageMeta({
  layout: 'dashboard'
})

const orders = [
  { id: '#ORD-7742', customer: 'Jane Smith', date: '2026-04-30', total: '฿1,250.00', status: 'Completed' },
  { id: '#ORD-7741', customer: 'Mike Johnson', date: '2026-04-30', total: '฿890.00', status: 'Pending' },
  { id: '#ORD-7740', customer: 'Sarah Connor', date: '2026-04-29', total: '฿2,100.00', status: 'Completed' },
  { id: '#ORD-7739', customer: 'James Bond', date: '2026-04-29', total: '฿4,500.00', status: 'Cancelled' },
]
</script>

<template>
  <div class="p-8">
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
      <div>
        <h1 class="text-3xl font-black text-slate-900 tracking-tight">Orders</h1>
        <p class="text-slate-500 font-medium mt-1">Track and manage your customer orders.</p>
      </div>
      <div class="flex space-x-3">
        <button class="bg-white border border-slate-200 text-slate-700 px-6 py-3 rounded-xl font-bold shadow-sm hover:bg-slate-50 transition-all">
          Export
        </button>
        <button class="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all">
          New Order
        </button>
      </div>
    </div>

    <div class="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
      <table class="w-full text-left border-collapse">
        <thead>
          <tr class="bg-slate-50 border-b border-slate-100">
            <th class="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Order ID</th>
            <th class="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Customer</th>
            <th class="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Date</th>
            <th class="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Total</th>
            <th class="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
            <th class="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-50">
          <tr v-for="order in orders" :key="order.id" class="hover:bg-slate-50 transition-colors group">
            <td class="px-6 py-4 font-bold text-indigo-600">{{ order.id }}</td>
            <td class="px-6 py-4 text-sm text-slate-900 font-bold">{{ order.customer }}</td>
            <td class="px-6 py-4 text-sm text-slate-600 font-medium">{{ order.date }}</td>
            <td class="px-6 py-4 text-sm text-slate-900 font-black">{{ order.total }}</td>
            <td class="px-6 py-4">
              <span class="px-3 py-1 rounded-full text-xs font-bold" 
                :class="{
                  'bg-emerald-50 text-emerald-600': order.status === 'Completed',
                  'bg-amber-50 text-amber-600': order.status === 'Pending',
                  'bg-rose-50 text-rose-600': order.status === 'Cancelled'
                }">
                {{ order.status }}
              </span>
            </td>
            <td class="px-6 py-4 text-right">
              <button class="text-slate-400 hover:text-indigo-600 transition-colors p-2">
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
</template>
