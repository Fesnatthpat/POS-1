<script setup lang="ts">
import { useStaff, type Staff } from '~/composables/useStaff'

const { staffMembers, addStaff, updateStaff, deleteStaff } = useStaff()

definePageMeta({
  layout: 'dashboard',
  middleware: ['feature-gate']
})

// --- State ---
const isModalOpen = ref(false)
const isEditing = ref(false)
const editingId = ref<number | null>(null)

const form = ref({
  name: '',
  username: '',
  role: 'Cashier' as 'Admin' | 'Cashier'
})

// --- Actions ---
const openAddModal = () => {
  isEditing.value = false
  editingId.value = null
  form.value = { name: '', username: '', role: 'Cashier' }
  isModalOpen.value = true
}

const openEditModal = (staff: Staff) => {
  isEditing.value = true
  editingId.value = staff.id
  form.value = { 
    name: staff.name, 
    username: staff.username, 
    role: staff.role 
  }
  isModalOpen.value = true
}

const handleSubmit = () => {
  if (isEditing.value && editingId.value) {
    updateStaff(editingId.value, form.value)
  } else {
    addStaff(form.value)
  }
  isModalOpen.value = false
}

const toggleStatus = (staff: Staff) => {
  updateStaff(staff.id, { 
    status: staff.status === 'Active' ? 'Inactive' : 'Active' 
  })
}

const handleDelete = (id: number) => {
  if (confirm('Are you sure you want to delete this staff member?')) {
    deleteStaff(id)
  }
}
</script>

<template>
  <div class="p-4 sm:p-6 lg:p-8">
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 lg:gap-6 mb-8 lg:mb-10">
      <div>
        <h1 class="text-2xl lg:text-3xl font-black text-slate-900 tracking-tight">การจัดการพนักงาน</h1>
        <p class="text-slate-500 font-medium text-xs lg:text-sm mt-1">จัดการข้อมูลผู้ใช้งานและสิทธิ์การเข้าถึงระบบ</p>
      </div>
      <button @click="openAddModal" class="flex items-center space-x-2 bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all justify-center">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clip-rule="evenodd" />
        </svg>
        <span>เพิ่มพนักงาน</span>
      </button>
    </div>

    <!-- Staff Table -->
    <div class="bg-white rounded-[1.5rem] lg:rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
      <div class="overflow-x-auto custom-scrollbar">
        <table class="w-full text-left border-collapse min-w-[700px] lg:min-w-0">
          <thead>
            <tr class="bg-slate-50/50 border-b border-slate-100">
              <th class="px-6 lg:px-8 py-4 lg:py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">ชื่อ / ชื่อผู้ใช้งาน</th>
              <th class="px-6 lg:px-8 py-4 lg:py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">บทบาท</th>
              <th class="px-6 lg:px-8 py-4 lg:py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">วันที่เริ่มงาน</th>
              <th class="px-6 lg:px-8 py-4 lg:py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">สถานะ</th>
              <th class="px-6 lg:px-8 py-4 lg:py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">การจัดการ</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-50">
            <tr v-for="staff in staffMembers" :key="staff.id" class="hover:bg-slate-50/50 transition-colors">
              <td class="px-6 lg:px-8 py-4 lg:py-5">
                 <div class="flex items-center gap-3">
                    <div class="w-9 h-9 lg:w-10 lg:h-10 rounded-full bg-indigo-50 flex items-center justify-center font-bold text-indigo-600 text-xs lg:text-sm flex-shrink-0">
                       {{ staff.name.charAt(0) }}
                    </div>
                    <div class="min-w-0">
                       <p class="font-bold text-slate-900 text-sm lg:text-base truncate">{{ staff.name }}</p>
                       <p class="text-[10px] lg:text-xs text-slate-400 font-medium truncate">@{{ staff.username }}</p>
                    </div>
                 </div>
              </td>
              <td class="px-6 lg:px-8 py-4 lg:py-5">
                 <span class="px-2 lg:px-3 py-1 rounded-full text-[9px] lg:text-[10px] font-black uppercase tracking-wider whitespace-nowrap"
                    :class="staff.role === 'Admin' ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-600'">
                    {{ staff.role === 'Admin' ? 'ผู้ดูแลระบบ' : 'พนักงานขาย' }}
                 </span>
              </td>
              <td class="px-6 lg:px-8 py-4 lg:py-5 text-xs lg:text-sm text-slate-600 font-medium whitespace-nowrap">{{ staff.joinDate }}</td>
              <td class="px-6 lg:px-8 py-4 lg:py-5">
                 <button @click="toggleStatus(staff)"
                    class="px-2 lg:px-3 py-1 rounded-full text-[9px] lg:text-[10px] font-black uppercase tracking-wider transition-all whitespace-nowrap"
                    :class="staff.status === 'Active' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'">
                    {{ staff.status === 'Active' ? 'เปิดใช้งาน' : 'ระงับการใช้งาน' }}
                 </button>
              </td>
              <td class="px-6 lg:px-8 py-4 lg:py-5 text-right">
                 <div class="flex justify-end gap-1 lg:gap-2">
                    <button @click="openEditModal(staff)" class="p-1.5 lg:p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg lg:rounded-xl transition-all">
                       <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 lg:h-5 lg:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                       </svg>
                    </button>
                    <button @click="handleDelete(staff.id)" class="p-1.5 lg:p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg lg:rounded-xl transition-all">
                       <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 lg:h-5 lg:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                       </svg>
                    </button>
                 </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modal (Built-in Responsive) -->
    <div v-if="isModalOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div class="bg-white rounded-[2rem] lg:rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden">
        <div class="p-6 lg:p-10">
          <div class="flex justify-between items-center mb-6 lg:mb-8">
            <h3 class="text-xl lg:text-3xl font-black text-slate-900 tracking-tight">
              {{ isEditing ? 'แก้ไขข้อมูลพนักงาน' : 'เพิ่มพนักงานใหม่' }}
            </h3>
            <button @click="isModalOpen = false" class="text-slate-400 font-bold">X</button>
          </div>
          
          <form @submit.prevent="handleSubmit" class="space-y-4 lg:space-y-6">
            <div>
               <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 lg:mb-2">ชื่อ-นามสกุล</label>
               <input type="text" required v-model="form.name"
                  class="w-full px-4 py-3 lg:px-5 lg:py-4 bg-slate-50 border border-slate-200 rounded-xl lg:rounded-2xl focus:ring-2 focus:ring-indigo-500 text-sm"
                  placeholder="ชื่อ-นามสกุล" />
            </div>

            <div>
               <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 lg:mb-2">ชื่อผู้ใช้งาน</label>
               <input type="text" required v-model="form.username"
                  class="w-full px-4 py-3 lg:px-5 lg:py-4 bg-slate-50 border border-slate-200 rounded-xl lg:rounded-2xl focus:ring-2 focus:ring-indigo-500 text-sm"
                  placeholder="Username" />
            </div>

            <div>
               <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 lg:mb-2">บทบาท</label>
               <div class="grid grid-cols-2 gap-3 lg:gap-4">
                  <button type="button" @click="form.role = 'Admin'"
                     class="py-3 lg:py-4 rounded-xl lg:rounded-2xl border-2 font-bold transition-all text-xs lg:text-sm"
                     :class="form.role === 'Admin' ? 'border-indigo-600 bg-indigo-50 text-indigo-600 shadow-sm' : 'border-slate-100 text-slate-400'">
                     ผู้ดูแลระบบ
                  </button>
                  <button type="button" @click="form.role = 'Cashier'"
                     class="py-3 lg:py-4 rounded-xl lg:rounded-2xl border-2 font-bold transition-all text-xs lg:text-sm"
                     :class="form.role === 'Cashier' ? 'border-indigo-600 bg-indigo-50 text-indigo-600 shadow-sm' : 'border-slate-100 text-slate-400'">
                     พนักงานขาย
                  </button>
               </div>
            </div>

            <div class="pt-4 lg:pt-6 flex gap-3 lg:gap-4">
              <button type="button" @click="isModalOpen = false"
                class="flex-1 py-3 lg:py-4 bg-slate-100 text-slate-600 rounded-xl lg:rounded-2xl font-black hover:bg-slate-200 transition-all text-sm">
                ยกเลิก
              </button>
              <button type="submit"
                class="flex-1 py-3 lg:py-4 bg-indigo-600 text-white rounded-xl lg:rounded-2xl font-black shadow-xl text-sm hover:bg-indigo-700 transition-all">
                {{ isEditing ? 'อัปเดต' : 'บันทึก' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>
