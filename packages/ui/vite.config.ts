import { resolve } from 'path'
import type { PluginOption } from 'vite'
import { defineConfig, loadEnv } from 'vite'
import Vue from '@vitejs/plugin-vue'
import inject from '@rollup/plugin-inject'
import Pages from 'vite-plugin-pages'
import Layouts from 'vite-plugin-vue-layouts'
import Components from 'unplugin-vue-components/vite'
import AutoImport from 'unplugin-auto-import/vite'
import { quasar, transformAssetUrls } from '@quasar/vite-plugin'
import { version } from './package.json'

export default defineConfig(({ mode }) => {
  process.env = { ...process.env, ...loadEnv(mode, process.cwd()) }

  const isProd = mode === 'production' || mode === 'staging'
  // const isReport = mode === 'report'

  const plugins: (PluginOption | PluginOption[])[] = [
    Vue({
      include: [/\.vue$/, /\.md$/],
      template: { transformAssetUrls },
      reactivityTransform: true,
    }),

    // https://github.com/antfu/unplugin-auto-import
    AutoImport({
      imports: [
        'vue',
        'vue/macros',
        'vue-router',
        '@vueuse/head',
        '@vueuse/core',
      ],
      dts: 'types/auto-imports.d.ts',
      dirs: ['src/hooks/**', 'src/store/**'],
      vueTemplate: true,
    }),

    // https://github.com/antfu/unplugin-vue-components
    Components({
      extensions: ['vue', 'md'],
      dts: 'types/components.d.ts',
    }),

    // https://github.com/hannoeru/vite-plugin-pages
    Pages({
      extensions: ['vue', 'md'],
    }),

    // https://github.com/JohnCampionJr/vite-plugin-vue-layouts
    Layouts(),

    quasar(),
  ]

  return {
    base: process.env.VITE_BASE_PATH,

    plugins,

    css: {
      preprocessorOptions: {
        scss: {
          additionalData: '@import "@/assets/styles/global.scss";',
        },
      },
    },

    assetsInclude: ['**/*.mov'],

    build: {
      manifest: isProd,
      // target: 'es2020',
      chunkSizeWarningLimit: 1024,
      rollupOptions: {
        plugins: [inject({ Buffer: ['buffer', 'Buffer'] })],
        output: {
          manualChunks(id) {
            if (id.includes('/node_modules/')) {
              return 'vendor'
            }
          },
        },
      },
    },

    resolve: {
      dedupe: [
        'bn.js',
        'bs58',
        'lodash',
        'buffer',
        'buffer-layout',
        'eventemitter3',
        '@solana/web3.js',
      ],
      alias: {
        '@/': `${resolve(__dirname, 'src')}/`,
      },
    },

    define: {
      'process.env': process.env,
      'import.meta.env.VERSION': JSON.stringify(version),
    },

    optimizeDeps: {
      include: [
        'vue',
        'vue-router',
        'pinia',
        '@vueuse/core',
        '@vueuse/head',
      ],
      exclude: ['vue-demi'],
      esbuildOptions: {
        // target: 'es2020',
        // minify: true,
      },
    },
  }
})
