import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

// 生成版本号
const version = Date.now()

// https://vitejs.dev/config/
export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(version),
    __BUILD_TIME__: JSON.stringify(version)
  },
  plugins: [
    vue()
    // 🚫 暂时禁用PWA，避免Service Worker缓存问题
    // 等项目稳定后再启用
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  },
  server: {
    port: 3000,
    host: true
  },
  test: {
    globals: true,
    environment: 'jsdom'
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: undefined,
        // 使用时间戳作为hash的一部分，确保每次构建都是唯一的
        entryFileNames: `assets/[name]-[hash]-${version}.js`,
        chunkFileNames: `assets/[name]-[hash]-${version}.js`,
        assetFileNames: `assets/[name]-[hash]-${version}.[ext]`
      }
    },
    sourcemap: false,
    minify: 'esbuild',
    // 优化chunk分割
    chunkSizeWarningLimit: 1000,
    // 确保CSS注入
    cssCodeSplit: true
  }
})