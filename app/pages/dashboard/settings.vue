<script setup lang="ts">
definePageMeta({
  layout: 'dashboard'
})

const settingsSections = [
  {
    title: 'Store Information',
    description: 'Basic details about your business.',
    fields: [
      { label: 'Store Name', type: 'text', placeholder: 'My Awesome Shop', value: 'My Awesome Shop' },
      { label: 'Business Email', type: 'email', placeholder: 'contact@shop.com', value: 'contact@shop.com' },
      { label: 'Phone Number', type: 'tel', placeholder: '081-234-5678', value: '081-234-5678' },
    ]
  },
  {
    title: 'Localization',
    description: 'Currency, timezone, and language.',
    fields: [
      { label: 'Currency', type: 'select', options: ['THB (฿)', 'USD ($)', 'EUR (€)'], value: 'THB (฿)' },
      { label: 'Timezone', type: 'select', options: ['(GMT+07:00) Bangkok', '(GMT+00:00) London'], value: '(GMT+07:00) Bangkok' },
    ]
  },
  {
    title: 'Taxes & Invoicing',
    description: 'Manage tax rates and invoice formatting.',
    fields: [
      { label: 'VAT Rate (%)', type: 'number', placeholder: '7', value: '7' },
      { label: 'Tax ID', type: 'text', placeholder: '1234567890123', value: '1234567890123' },
    ]
  }
]
</script>

<template>
  <div class="p-8 max-w-4xl">
    <div class="mb-10">
      <h1 class="text-3xl font-black text-slate-900 tracking-tight">Store Settings</h1>
      <p class="text-slate-500 font-medium mt-1">Configure your store preferences and business details.</p>
    </div>

    <div class="space-y-8">
      <div v-for="section in settingsSections" :key="section.title" 
        class="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div class="p-8 border-b border-slate-50">
          <h3 class="text-xl font-bold text-slate-900">{{ section.title }}</h3>
          <p class="text-sm text-slate-500 font-medium mt-1">{{ section.description }}</p>
        </div>
        
        <div class="p-8 space-y-6">
          <div v-for="field in section.fields" :key="field.label" class="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
            <label class="text-sm font-bold text-slate-700">{{ field.label }}</label>
            <div class="md:col-span-2">
              <template v-if="field.type === 'select'">
                <select class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all appearance-none">
                  <option v-for="opt in field.options" :key="opt">{{ opt }}</option>
                </select>
              </template>
              <template v-else>
                <input :type="field.type" :value="field.value" :placeholder="field.placeholder"
                  class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all" />
              </template>
            </div>
          </div>
        </div>
      </div>

      <div class="flex items-center justify-end space-x-4 pt-4">
        <button class="px-8 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-all">
          Discard Changes
        </button>
        <button class="px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all">
          Save Settings
        </button>
      </div>
    </div>
  </div>
</template>
