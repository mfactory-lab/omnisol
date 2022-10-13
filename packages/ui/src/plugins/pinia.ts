import { createPinia } from 'pinia'
import type { App } from 'vue'

export const install = ({ app }: { app: App<Element> }) => {
  const store = createPinia()
  app.use(store)
}
