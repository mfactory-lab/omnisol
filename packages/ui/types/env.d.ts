/// <reference types="vite/client" />
/// <reference types="vite-plugin-vue-layouts/client" />
/// <reference types="vite-plugin-pages/client" />

interface ImportMetaEnv {
  readonly MODE: 'production' | 'development' | 'staging' | 'testing' | 'preview'

  readonly VERSION: string

  readonly VITE_API_URL: string
  readonly VITE_BASE_PATH: string
  readonly VITE_GTAG_ID: string
  readonly VITE_SENTRY_DSN: string
}
