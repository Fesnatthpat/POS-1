import { ref, onMounted, watch } from 'vue'

export interface Staff {
  id: number
  name: string
  username: string
  role: 'Admin' | 'Cashier'
  joinDate: string
  status: 'Active' | 'Inactive'
}

export const useStaff = () => {
  const staffMembers = ref<Staff[]>([])
  const isInitialLoad = ref(true)

  const loadStaff = () => {
    if (process.client) {
      const saved = localStorage.getItem('pos_staff')
      if (saved) {
        staffMembers.value = JSON.parse(saved)
      } else {
        staffMembers.value = [
          { id: 1, name: 'ผู้ดูแลระบบ', username: 'admin', role: 'Admin', joinDate: '2025-01-01', status: 'Active' },
          { id: 2, name: 'สมชาย ใจดี', username: 'cashier1', role: 'Cashier', joinDate: '2025-03-01', status: 'Active' }
        ]
      }
      isInitialLoad.value = false
    }
  }

  const saveStaff = () => {
    if (process.client) {
      localStorage.setItem('pos_staff', JSON.stringify(staffMembers.value))
    }
  }

  const addStaff = (staff: Omit<Staff, 'id' | 'joinDate' | 'status'>) => {
    const newStaff: Staff = {
      ...staff,
      id: Date.now(),
      joinDate: new Date().toISOString().split('T')[0],
      status: 'Active'
    }
    staffMembers.value.push(newStaff)
    saveStaff()
  }

  const updateStaff = (id: number, updates: Partial<Staff>) => {
    const index = staffMembers.value.findIndex(s => s.id === id)
    if (index !== -1) {
      staffMembers.value[index] = { ...staffMembers.value[index], ...updates }
      saveStaff()
    }
  }

  const deleteStaff = (id: number) => {
    staffMembers.value = staffMembers.value.filter(s => s.id !== id)
    saveStaff()
  }

  watch(staffMembers, () => {
    if (!isInitialLoad.value) {
      saveStaff()
    }
  }, { deep: true })

  onMounted(() => {
    loadStaff()
  })

  return {
    staffMembers,
    addStaff,
    updateStaff,
    deleteStaff
  }
}
