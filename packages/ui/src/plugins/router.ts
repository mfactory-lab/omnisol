import type { App } from 'vue'
import { createMemoryHistory, createRouter, createWebHistory } from 'vue-router'
import { setupLayouts } from 'virtual:generated-layouts'
import generatedRoutes from '~pages'

const routes = setupLayouts(generatedRoutes)
const base = import.meta.env.BASE_URL

const router = createRouter({
  history: import.meta.env.SSR ? createMemoryHistory(base) : createWebHistory(base),
  scrollBehavior: () => ({ left: 0, top: 0 }),
  strict: true,
  routes,
})

export const install = ({ app }: { app: App<Element> }) => {
  app.use(router)
}
