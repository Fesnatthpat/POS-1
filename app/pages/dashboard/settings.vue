<script setup lang="ts">
import { useSettings, type StoreSettings } from '~/composables/useSettings'

const { settings, saveSettings } = useSettings()

definePageMeta({
  layout: 'dashboard'
})

// --- State ---
const form = ref<StoreSettings>({ ...settings.value })
const isSaving = ref(false)
const showSuccess = ref(false)

// Watch for initial load of settings from composable
watch(settings, (newVal) => {
  form.value = { ...newVal }
}, { immediate: true })

const handleSave = async () => {
  isSaving.value = true
  saveSettings(form.value)
  
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 800))
  
  isSaving.value = false
  showSuccess.value = true
  setTimeout(() => showSuccess.value = false, 3000)
}
</script>

<template>
  <div class="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">
    <div class="mb-8 lg:mb-10">
      <h1 class="text-2xl lg:text-3xl font-black text-slate-900 tracking-tight">การตั้งค่า</h1>
      <p class="text-slate-500 font-medium text-xs lg:text-sm mt-1">ตั้งค่าโปรไฟล์ร้านค้าและค่าเริ่มต้นสำหรับการใช้งาน</p>
    </div>

    <div class="space-y-8 lg:space-y-12">
      <!-- Store Profile -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-8">
        <div class="md:col-span-1">
          <h3 class="text-lg font-bold text-slate-900 mb-1 lg:mb-2">โปรไฟล์ร้านค้า</h3>
          <p class="text-xs lg:text-sm text-slate-500">ข้อมูลร้านค้าที่จะแสดงบนใบเสร็จ</p>
        </div>
        
        <div class="md:col-span-2 space-y-4 lg:space-y-6">
          <div class="bg-white p-6 lg:p-8 rounded-[1.5rem] lg:rounded-[2rem] border border-slate-100 shadow-sm space-y-4 lg:space-y-6">
            <div>
              <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">ชื่อร้านค้า</label>
              <input type="text" v-model="form.name" 
                class="w-full px-4 py-3 lg:px-5 lg:py-4 bg-slate-50 border border-slate-200 rounded-xl lg:rounded-2xl focus:ring-2 focus:ring-indigo-500 text-sm" />
            </div>
            
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
               <div>
                  <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">เบอร์โทรศัพท์</label>
                  <input type="text" v-model="form.phone" 
                    class="w-full px-4 py-3 lg:px-5 lg:py-4 bg-slate-50 border border-slate-200 rounded-xl lg:rounded-2xl focus:ring-2 focus:ring-indigo-500 text-sm" />
               </div>
               <div>
                  <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">สกุลเงิน</label>
                  <select v-model="form.currency" 
                    class="w-full px-4 py-3 lg:px-5 lg:py-4 bg-slate-50 border border-slate-200 rounded-xl lg:rounded-2xl focus:ring-2 focus:ring-indigo-500 text-sm">
                    <option value="THB">THB (฿)</option>
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                  </select>
               </div>
            </div>

            <div>
              <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">ที่อยู่ร้านค้า</label>
              <textarea v-model="form.address" rows="3"
                class="w-full px-4 py-3 lg:px-5 lg:py-4 bg-slate-50 border border-slate-200 rounded-xl lg:rounded-2xl focus:ring-2 focus:ring-indigo-500 text-sm"></textarea>
            </div>
          </div>
        </div>
      </div>

      <!-- Tax & Compliance -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-8 border-t border-slate-100 pt-8 lg:pt-12">
        <div class="md:col-span-1">
          <h3 class="text-lg font-bold text-slate-900 mb-1 lg:mb-2">ภาษีและการเรียกเก็บเงิน</h3>
          <p class="text-xs lg:text-sm text-slate-500">จัดการการคำนวณภาษีมูลค่าเพิ่ม</p>
        </div>

        <div class="md:col-span-2 space-y-4 lg:space-y-6">
          <div class="bg-white p-6 lg:p-8 rounded-[1.5rem] lg:rounded-[2rem] border border-slate-100 shadow-sm space-y-4 lg:space-y-6">
            <div class="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
               <div class="min-w-0 pr-4">
                  <p class="font-bold text-slate-900 text-sm lg:text-base">ราคารวมภาษีแล้ว</p>
                  <p class="text-[9px] lg:text-[10px] text-slate-400 font-bold uppercase truncate">แสดงราคาที่รวม VAT แล้ว</p>
               </div>
               <button @click="form.includeTax = !form.includeTax" 
                 class="w-12 h-6 rounded-full transition-colors relative flex-shrink-0"
                 :class="form.includeTax ? 'bg-indigo-600' : 'bg-slate-300'">
                 <div class="absolute top-1 w-4 h-4 bg-white rounded-full transition-all"
                   :class="form.includeTax ? 'right-1' : 'left-1'"></div>
               </button>
            </div>

            <div>
              <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">อัตราภาษี (%)</label>
              <input type="number" v-model="form.taxRate" 
                class="w-full px-4 py-3 lg:px-5 lg:py-4 bg-slate-50 border border-slate-200 rounded-xl lg:rounded-2xl focus:ring-2 focus:ring-indigo-500 text-sm" />
            </div>
          </div>
        </div>
      </div>

      <!-- Receipt Note -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-8 border-t border-slate-100 pt-8 lg:pt-12">
        <div class="md:col-span-1">
          <h3 class="text-lg font-bold text-slate-900 mb-1 lg:mb-2">ข้อความท้ายใบเสร็จ</h3>
          <p class="text-xs lg:text-sm text-slate-500">ข้อความที่จะแสดงที่ส่วนท้ายของใบเสร็จ</p>
        </div>

        <div class="md:col-span-2">
          <div class="bg-white p-6 lg:p-8 rounded-[1.5rem] lg:rounded-[2rem] border border-slate-100 shadow-sm">
             <textarea v-model="form.receiptNote" rows="2"
               class="w-full px-4 py-3 lg:px-5 lg:py-4 bg-slate-50 border border-slate-200 rounded-xl lg:rounded-2xl focus:ring-2 focus:ring-indigo-500 text-sm"
               placeholder="ขอบคุณที่ใช้บริการ"></textarea>
          </div>
        </div>
      </div>
    </div>

    <!-- Save Bar -->
    <div class="mt-12 flex flex-col sm:flex-row items-center justify-end gap-4 border-t border-slate-100 pt-8">
      <p v-if="showSuccess" class="text-emerald-600 font-bold text-xs lg:text-sm animate-bounce order-2 sm:order-1">✓ บันทึกสำเร็จ!</p>
      <button @click="handleSave" :disabled="isSaving"
        class="w-full sm:w-auto px-10 py-4 bg-indigo-600 text-white rounded-xl lg:rounded-2xl font-black shadow-xl shadow-indigo-100 hover:bg-indigo-700 disabled:opacity-50 transition-all flex items-center justify-center gap-2 order-1 sm:order-2">
        <span v-if="isSaving" class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
        {{ isSaving ? 'กำลังบันทึก...' : 'บันทึกการเปลี่ยนแปลง' }}
      </button>
    </div>
  </div>
</template>
