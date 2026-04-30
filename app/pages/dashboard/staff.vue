<script setup lang="ts">
definePageMeta({
  layout: 'dashboard'
})

// --- State ---
const roles = ref([
  { id: 1, name: 'Admin', permissions: ['All Access', 'Management', 'Reports', 'Settings'] },
  { id: 2, name: 'Manager', permissions: ['Inventory', 'Orders', 'Reports', 'Staff View'] },
  { id: 3, name: 'Cashier', permissions: ['POS Access', 'Orders View'] },
])

const staffList = ref([
  { id: 1, name: 'John Doe', email: 'john@pos.com', role: 'Admin', status: 'Active', joinDate: '2024-01-01' },
  { id: 2, name: 'Alice Smith', email: 'alice@pos.com', role: 'Manager', status: 'Active', joinDate: '2024-05-12' },
  { id: 3, name: 'Bob Johnson', email: 'bob@pos.com', role: 'Cashier', status: 'Away', joinDate: '2025-02-20' },
])

const isAddModalOpen = ref(false)
const newStaff = ref({
  name: '',
  email: '',
  role: 'Cashier'
})

// --- Actions ---
const openAddModal = () => {
  newStaff.value = { name: '', email: '', role: 'Cashier' }
  isAddModalOpen.value = true
}

const addStaff = () => {
  staffList.value.push({
    id: Date.now(),
    ...newStaff.value,
    status: 'Active',
    joinDate: new Date().toISOString().split('T')[0]
  })
  isAddModalOpen.value = false
}

const toggleStatus = (id: number) => {
  const staff = staffList.value.find(s => s.id === id)
  if (staff) {
    staff.status = staff.status === 'Active' ? 'Inactive' : 'Active'
  }
}
</script>

<template>
  <div class="p-4 sm:p-8 space-y-10">
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <h1 class="text-3xl font-black text-slate-900 tracking-tight">Staff Management</h1>
        <p class="text-slate-500 font-medium mt-1">Manage team members and access permissions.</p>
      </div>
      <button @click="openAddModal" class="flex items-center justify-center space-x-2 bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all hover:-translate-y-0.5">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clip-rule="evenodd" />
        </svg>
        <span>Add Staff</span>
      </button>
    </div>

    <!-- Roles & Permissions Summary -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div v-for="role in roles" :key="role.id" class="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
        <div class="flex items-center space-x-3 mb-4">
          <div class="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <h3 class="text-lg font-black text-slate-900">{{ role.name }}</h3>
        </div>
        <div class="flex flex-wrap gap-2">
          <span v-for="perm in role.permissions" :key="perm" class="px-2 py-1 bg-slate-50 text-slate-500 text-[10px] font-bold rounded-lg uppercase tracking-wider border border-slate-100">
            {{ perm }}
          </span>
        </div>
      </div>
    </div>

    <!-- Staff Table -->
    <div class="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden overflow-x-auto">
      <table class="w-full text-left border-collapse text-sm min-w-[700px]">
        <thead>
          <tr class="bg-slate-50 border-b border-slate-100">
            <th class="px-6 py-4 font-bold text-slate-500 uppercase tracking-wider">Staff Member</th>
            <th class="px-6 py-4 font-bold text-slate-500 uppercase tracking-wider">Role</th>
            <th class="px-6 py-4 font-bold text-slate-500 uppercase tracking-wider">Joined Date</th>
            <th class="px-6 py-4 font-bold text-slate-500 uppercase tracking-wider">Status</th>
            <th class="px-6 py-4 font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-50">
          <tr v-for="staff in staffList" :key="staff.id" class="hover:bg-slate-50/80 transition-colors">
            <td class="px-6 py-4">
              <div class="flex items-center space-x-3">
                <div class="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold">
                  {{ staff.name.charAt(0) }}
                </div>
                <div>
                  <p class="font-bold text-slate-900">{{ staff.name }}</p>
                  <p class="text-xs text-slate-400">{{ staff.email }}</p>
                </div>
              </div>
            </td>
            <td class="px-6 py-4">
              <span class="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border"
                :class="{
                  'bg-indigo-50 text-indigo-600 border-indigo-100': staff.role === 'Admin',
                  'bg-amber-50 text-amber-600 border-amber-100': staff.role === 'Manager',
                  'bg-slate-50 text-slate-600 border-slate-100': staff.role === 'Cashier',
                }">
                {{ staff.role }}
              </span>
            </td>
            <td class="px-6 py-4 text-slate-600 font-medium">{{ staff.joinDate }}</td>
            <td class="px-6 py-4">
              <div class="flex items-center space-x-2">
                <div class="w-2 h-2 rounded-full" 
                  :class="staff.status === 'Active' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-slate-300'"></div>
                <span class="font-bold" :class="staff.status === 'Active' ? 'text-slate-900' : 'text-slate-400'">{{ staff.status }}</span>
              </div>
            </td>
            <td class="px-6 py-4 text-right">
              <button @click="toggleStatus(staff.id)" class="text-indigo-600 font-bold text-xs hover:underline">
                {{ staff.status === 'Active' ? 'Deactivate' : 'Activate' }}
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Add Staff Modal -->
    <div v-if="isAddModalOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div class="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
        <div class="p-8">
          <h3 class="text-2xl font-black text-slate-900 tracking-tight mb-6">Add New Staff</h3>
          <form @submit.prevent="addStaff" class="space-y-5">
            <div>
              <label class="block text-sm font-bold text-slate-700 mb-2">Full Name</label>
              <input type="text" required v-model="newStaff.name"
                class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                placeholder="Enter staff name" />
            </div>
            <div>
              <label class="block text-sm font-bold text-slate-700 mb-2">Email Address</label>
              <input type="email" required v-model="newStaff.email"
                class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                placeholder="email@pos.com" />
            </div>
            <div>
              <label class="block text-sm font-bold text-slate-700 mb-2">Assign Role</label>
              <select v-model="newStaff.role"
                class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all appearance-none">
                <option v-for="role in roles" :key="role.id">{{ role.name }}</option>
              </select>
            </div>
            <div class="pt-4 flex space-x-3">
              <button type="button" @click="isAddModalOpen = false"
                class="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-all">
                Cancel
              </button>
              <button type="submit"
                class="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all">
                Add Staff Member
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>
