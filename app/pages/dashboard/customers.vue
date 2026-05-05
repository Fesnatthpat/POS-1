<script setup lang="ts">
import { useCustomers } from '~/composables/useCustomers'
import { useOrders } from '~/composables/useOrders'
import { useSettings } from '~/composables/useSettings'

const { customers, addCustomer, saveCustomers } = useCustomers()
const { orders } = useOrders()
const { settings } = useSettings()

definePageMeta({
  layout: 'dashboard',
  middleware: ['feature-gate']
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

// --- Computed ---
const customerHistory = computed(() => {
  if (!selectedCustomer.value) return []
  return orders.value.filter(o => o.customerId === selectedCustomer.value.id).slice().reverse()
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
  saveCustomers()
  isPointsModalOpen.value = false
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
</script>

<template>
  <div class="p-4 sm:p-6 lg:p-8">
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 lg:mb-10">
      <div>
        <h1 class="text-2xl lg:text-3xl font-black text-slate-900 tracking-tight">ลูกค้า</h1>
        <p class="text-slate-500 font-medium text-xs lg:text-sm mt-1">จัดการข้อมูลสมาชิกและระบบสะสมแต้ม</p>
      </div>
      <button @click="openAddModal" class="flex items-center justify-center space-x-2 bg-indigo-600 text-white px-5 py-3 rounded-xl font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all text-sm sm:text-base">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clip-rule="evenodd" />
        </svg>
        <span class="whitespace-nowrap">เพิ่มสมาชิกใหม่</span>
      </button>
    </div>

    <!-- Customers Grid/List -->
    <div class="bg-white rounded-[1.5rem] lg:rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
      <div class="overflow-x-auto custom-scrollbar">
        <table class="w-full text-left border-collapse min-w-[700px] lg:min-w-0">
          <thead>
            <tr class="bg-slate-50 border-b border-slate-100">
              <th class="px-6 py-4 font-bold text-slate-500 uppercase tracking-wider text-[10px]">สมาชิก</th>
              <th class="px-6 py-4 font-bold text-slate-500 uppercase tracking-wider text-[10px]">ติดต่อ</th>
              <th class="px-6 py-4 font-bold text-slate-500 uppercase tracking-wider text-[10px]">ระดับ</th>
              <th class="px-6 py-4 font-bold text-slate-500 uppercase tracking-wider text-[10px]">คะแนนสะสม</th>
              <th class="px-6 py-4 font-bold text-slate-500 uppercase tracking-wider text-right text-[10px]">การจัดการ</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-50">
            <tr v-for="customer in customers" :key="customer.id" class="hover:bg-slate-50/80 transition-colors">
              <td class="px-6 py-4">
                <div class="flex items-center space-x-3">
                  <div class="w-9 h-9 lg:w-10 lg:h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold flex-shrink-0">
                    {{ customer.name.charAt(0) }}
                  </div>
                  <div class="min-w-0">
                    <p class="font-bold text-slate-900 truncate text-sm lg:text-base">{{ customer.name }}</p>
                    <p class="text-[9px] lg:text-[10px] text-slate-400 font-bold uppercase tracking-widest truncate">วันที่เริ่ม: {{ customer.joinDate }}</p>
                  </div>
                </div>
              </td>
              <td class="px-6 py-4 text-slate-600 font-medium text-xs lg:text-sm">{{ customer.phone }}</td>
              <td class="px-6 py-4">
                <span class="px-2 lg:px-3 py-1 rounded-full text-[9px] lg:text-[10px] font-black uppercase tracking-wider whitespace-nowrap"
                  :class="{
                    'bg-yellow-50 text-yellow-600 border border-yellow-100': customer.level === 'Gold',
                    'bg-slate-50 text-slate-600 border border-slate-100': customer.level === 'Silver',
                    'bg-indigo-50 text-indigo-600 border border-indigo-100': customer.level === 'Platinum',
                  }">
                  {{ customer.level }}
                </span>
              </td>
              <td class="px-6 py-4">
                <div class="flex items-center space-x-1 text-indigo-600 font-black text-xs lg:text-sm">
                  <span>{{ customer.points.toLocaleString() }}</span>
                  <span class="text-[9px] lg:text-[10px] uppercase">คะแนน</span>
                </div>
              </td>
              <td class="px-6 py-4 text-right">
                <div class="flex items-center justify-end space-x-2 lg:space-x-3">
                  <button @click="openPointsModal(customer)" class="text-emerald-600 font-bold text-[10px] lg:text-xs hover:underline flex items-center space-x-1 whitespace-nowrap">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                      <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clip-rule="evenodd" />
                    </svg>
                    <span>ปรับแต้ม</span>
                  </button>
                  <button @click="showDetails(customer)" class="text-indigo-600 font-bold text-[10px] lg:text-xs hover:underline">
                    ประวัติ
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modals -->
    <!-- Add Customer Modal -->
    <div v-if="isAddModalOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div class="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
        <div class="p-6 lg:p-8">
          <h3 class="text-xl lg:text-2xl font-black text-slate-900 tracking-tight mb-6">สมัครสมาชิกใหม่</h3>
          <form @submit.prevent="handleAddCustomer" class="space-y-5">
            <div>
              <label class="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wider">ชื่อ-นามสกุล</label>
              <input type="text" required v-model="newCustomer.name"
                class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                placeholder="ระบุชื่อ" />
            </div>
            <div>
              <label class="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wider">เบอร์โทรศัพท์</label>
              <input type="tel" required v-model="newCustomer.phone"
                class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                placeholder="0xx-xxx-xxxx" />
            </div>
            <div>
              <label class="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wider">ระดับสมาชิก</label>
              <select v-model="newCustomer.level"
                class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm appearance-none">
                <option>Silver</option>
                <option>Gold</option>
                <option>Platinum</option>
              </select>
            </div>
            <div class="pt-4 flex space-x-3">
              <button type="button" @click="isAddModalOpen = false"
                class="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 text-sm transition-all">
                ยกเลิก
              </button>
              <button type="submit"
                class="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-bold shadow-lg text-sm hover:bg-indigo-700 transition-all">
                ลงทะเบียน
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- Adjust Points Modal -->
    <div v-if="isPointsModalOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div class="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden">
        <div class="p-8 text-center">
          <div class="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 class="text-xl font-black text-slate-900 mb-2">ปรับปรุงคะแนนสะสม</h3>
          <p class="text-sm text-slate-500 font-medium mb-6">สำหรับ <span class="text-indigo-600 font-bold">{{ selectedCustomer?.name }}</span></p>
          
          <div class="bg-slate-50 rounded-2xl p-6 mb-6">
            <p class="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">คะแนนปัจจุบัน</p>
            <p class="text-2xl font-black text-slate-900">{{ selectedCustomer?.points.toLocaleString() }} <span class="text-sm">แต้ม</span></p>
          </div>

          <div class="flex items-center space-x-4 mb-8">
            <button @click="pointsToAdd -= 100" class="w-10 h-10 bg-slate-100 rounded-lg">-</button>
            <input type="number" v-model="pointsToAdd" class="flex-1 text-center font-black text-indigo-600 border-b-2 border-indigo-100 focus:border-indigo-500 outline-none text-xl" />
            <button @click="pointsToAdd += 100" class="w-10 h-10 bg-slate-100 rounded-lg">+</button>
          </div>

          <div class="flex space-x-3">
            <button @click="isPointsModalOpen = false" class="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold">ยกเลิก</button>
            <button @click="handleAdjustPoints" class="flex-1 py-3 bg-emerald-600 text-white rounded-xl font-bold shadow-lg">อัปเดต</button>
          </div>
        </div>
      </div>
    </div>

    <!-- History Modal -->
    <div v-if="isDetailsModalOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div class="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
        <div class="p-6 lg:p-8 border-b border-slate-100 flex justify-between items-center">
           <h3 class="text-xl lg:text-2xl font-black text-slate-900">ประวัติของ {{ selectedCustomer?.name }}</h3>
           <button @click="isDetailsModalOpen = false" class="text-slate-400 font-bold">X</button>
        </div>
        <div class="flex-1 overflow-y-auto p-6 lg:p-8 space-y-4">
           <div v-if="customerHistory.length === 0" class="text-center py-20 opacity-40 font-bold">ไม่พบประวัติการซื้อสินค้า</div>
           <div v-for="order in customerHistory" :key="order.id" class="p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <div class="flex justify-between items-center mb-3">
                 <span class="text-[10px] font-black text-indigo-600 uppercase">{{ order.id }}</span>
                 <span class="text-[10px] font-bold text-slate-400">{{ formatDate(order.timestamp) }}</span>
              </div>
              <ul class="space-y-1 mb-3">
                 <li v-for="item in order.items" :key="item.id" class="text-xs flex justify-between">
                    <span class="text-slate-600">{{ item.name }} x{{ item.quantity }}</span>
                    <span class="font-bold">{{ formatCurrency(item.price * item.quantity) }}</span>
                 </li>
              </ul>
              <div class="pt-3 border-t border-slate-200 flex justify-between items-center">
                 <span class="text-[10px] font-bold text-slate-400 uppercase">ยอดรวมทั้งหมด</span>
                 <span class="font-black text-slate-900">{{ formatCurrency(order.total) }}</span>
              </div>
           </div>
        </div>
      </div>
    </div>
  </div>
</template>
