<template>
  <div class="min-h-screen flex items-center justify-center p-4">
    <div class="text-center">
      <h1 class="text-6xl font-bold text-gradient">404</h1>
      <p class="text-xl text-base-content/60 mt-4">页面不存在</p>
      <button class="btn btn-primary mt-6" @click="$router.push('/')">
        返回首页
      </button>
    </div>
  </div>
</template>

