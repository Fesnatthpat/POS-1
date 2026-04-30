<template>
  <div class="min-h-screen bg-slate-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
    <!-- Decorative background elements -->
    <div class="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-96 h-96 bg-indigo-100 rounded-full blur-3xl opacity-50"></div>
    <div class="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/2 w-96 h-96 bg-violet-100 rounded-full blur-3xl opacity-50"></div>

    <div class="max-w-md w-full z-10">
      <div class="bg-white rounded-3xl shadow-2xl shadow-slate-200/60 p-10 border border-slate-100">
        <div class="text-center mb-10">
          <NuxtLink to="/" class="inline-flex items-center space-x-2 mb-8 group">
            <div class="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-indigo-200 shadow-lg group-hover:bg-indigo-700 transition-colors">
              <span class="font-black text-xl italic leading-none">P</span>
            </div>
            <span class="text-2xl font-extrabold tracking-tight text-slate-900 group-hover:text-indigo-600 transition-colors">POS.</span>
          </NuxtLink>
          <h2 class="text-3xl font-black text-slate-900 tracking-tight">Welcome Back</h2>
          <p class="mt-3 text-slate-500 font-medium">Please enter your details to sign in.</p>
        </div>

        <form class="space-y-6" @submit.prevent="handleLogin">
          <div>
            <label for="email" class="block text-sm font-bold text-slate-700 mb-2">Email Address</label>
            <input id="email" type="email" required
              class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all placeholder:text-slate-400"
              placeholder="name@company.com" v-model="email" />
          </div>

          <div>
            <div class="flex items-center justify-between mb-2">
              <label for="password" class="text-sm font-bold text-slate-700">Password</label>
              <a href="#" class="text-xs font-bold text-indigo-600 hover:text-indigo-700">Forgot Password?</a>
            </div>
            <input id="password" type="password" required
              class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all placeholder:text-slate-400"
              placeholder="••••••••" v-model="password" />
          </div>

          <div class="flex items-center">
            <input id="remember" type="checkbox"
              class="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500" />
            <label for="remember" class="ml-2 block text-sm font-medium text-slate-600">
              Keep me signed in for 30 days
            </label>
          </div>

          <button type="submit"
            class="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 hover:-translate-y-0.5 active:translate-y-0 transition-all">
            Sign In
          </button>
        </form>

        <p class="mt-10 text-center text-sm font-medium text-slate-500">
          Don't have an account?
          <NuxtLink to="/register" class="text-indigo-600 font-bold hover:text-indigo-700 underline underline-offset-4">
            Create an account
          </NuxtLink>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const email = ref('')
const password = ref('')
const router = useRouter()

const handleLogin = () => {
  console.log('Login attempt:', { email: email.value, password: password.value })
  // Simulate login success and redirect
  router.push('/dashboard')
}
</script>


