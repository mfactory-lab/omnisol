<script setup lang="ts">
const router = useRouter()
</script>

<template>
  <error-container :code="404" message="Page not found">
    <div class="q-mt-lg">
      <q-btn rounded @click="router.back()">
        Back
      </q-btn>
    </div>
  </error-container>
</template>

<route lang="yaml">
meta:
  layout: empty
</route>
