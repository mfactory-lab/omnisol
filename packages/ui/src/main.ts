import App from '@/App.vue'

async function bootstrap() {
  const app = createApp(App)

  // install all plugins under `plugins/`
  Object.values(import.meta.glob<{ install: any }>('./plugins/*.ts', { eager: true }))
    .forEach(i => i.install?.({ app }))

  app.mount('#app')
}

bootstrap().then()
