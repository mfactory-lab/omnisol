<script setup lang="ts">
import '@/assets/styles/app.scss'

onBeforeMount(() => {
  initWallet()
})
</script>

<template>
  <router-view />
</template>
