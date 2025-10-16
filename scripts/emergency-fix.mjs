#!/usr/bin/env node

/**
 * 紧急修复脚本 - 解决登录问题
 */

import { execSync } from 'child_process';
import { existsSync, rmSync, writeFileSync } from 'fs';
import { join } from 'path';

console.log('🚨 紧急修复登录问题...');

try {
    // 1. 清理所有缓存和构建文件
    console.log('🧹 清理所有缓存...');
    if (existsSync('dist')) {
        rmSync('dist', { recursive: true, force: true });
    }
    if (existsSync('node_modules/.vite')) {
        rmSync('node_modules/.vite', { recursive: true, force: true });
    }
    
    // 2. 更新vite配置，强制刷新缓存
    const timestamp = Date.now();
    const viteConfig = `import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'
import { resolve } from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(${timestamp})
  },
  plugins: [
    vue(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'],
      manifest: {
        name: 'AI智能科技学习集成',
        short_name: 'AI学习',
        description: '智能科技学习集成平台 - 币安&OKX空投实时推送',
        theme_color: '#6366f1',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        cleanupOutdatedCaches: true,
        sourcemap: false,
        skipWaiting: true,
        clientsClaim: true,
        runtimeCaching: [
          {
            urlPattern: /^https:\\/\\/eth10\\.netlify\\.app\\/.*\\.(js|css|png|jpg|jpeg|gif|svg|ico)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'static-resources',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 7 // 7 days
              }
            }
          }
        ]
      }
    })
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
        manualChunks: undefined
      }
    }
  }
})`;

    writeFileSync('vite.config.ts', viteConfig);
    console.log('✅ 更新了 vite.config.ts');
    
    // 3. 重新构建
    console.log('🔨 重新构建项目...');
    execSync('npm run build', { stdio: 'inherit' });
    
    // 4. 创建紧急缓存清理页面
    const emergencyClearHtml = `<!DOCTYPE html>
<html lang="zh">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>紧急缓存清理 - AI智能科技学习集成</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            max-width: 800px;
            margin: 50px auto;
            padding: 20px;
            background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%);
            color: white;
        }
        .container {
            background: rgba(255, 255, 255, 0.1);
            padding: 30px;
            border-radius: 15px;
            backdrop-filter: blur(10px);
            border: 2px solid rgba(255, 255, 255, 0.2);
        }
        .emergency {
            background: rgba(255, 0, 0, 0.2);
            border: 2px solid #ff4757;
            padding: 20px;
            border-radius: 10px;
            margin: 20px 0;
        }
        button {
            background: #ff4757;
            color: white;
            padding: 15px 30px;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            font-size: 16px;
            margin: 10px;
            font-weight: bold;
        }
        button:hover {
            background: #ff3742;
            transform: translateY(-2px);
        }
        .status {
            margin: 20px 0;
            padding: 15px;
            background: rgba(0, 0, 0, 0.3);
            border-radius: 8px;
            font-family: monospace;
        }
        .success {
            background: rgba(0, 255, 0, 0.2);
            border: 2px solid #2ed573;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🚨 紧急缓存清理工具</h1>
        <div class="emergency">
            <h2>⚠️ 检测到登录问题！</h2>
            <p>JavaScript模块加载失败，这通常是由于缓存问题导致的。</p>
            <p>请按照以下步骤操作：</p>
        </div>
        
        <button onclick="emergencyClear()">🚨 紧急清理所有缓存</button>
        <button onclick="forceReload()">🔄 强制重新加载</button>
        <button onclick="clearServiceWorker()">🧹 清理Service Worker</button>
        
        <div id="status" class="status">
            点击按钮开始紧急修复...
        </div>
        
        <div style="margin-top: 30px;">
            <a href="/" style="color: white; text-decoration: underline; font-weight: bold;">返回首页</a>
        </div>
    </div>

    <script>
        function updateStatus(message, isSuccess = false) {
            const status = document.getElementById('status');
            status.innerHTML = message;
            if (isSuccess) {
                status.className = 'status success';
            }
        }

        async function emergencyClear() {
            updateStatus('🚨 正在执行紧急缓存清理...');
            
            try {
                // 清理所有缓存
                if ('caches' in window) {
                    const cacheNames = await caches.keys();
                    await Promise.all(
                        cacheNames.map(cacheName => caches.delete(cacheName))
                    );
                }
                
                // 清理Service Worker
                if ('serviceWorker' in navigator) {
                    const registrations = await navigator.serviceWorker.getRegistrations();
                    for (let registration of registrations) {
                        await registration.unregister();
                    }
                }
                
                // 清理存储
                localStorage.clear();
                sessionStorage.clear();
                
                updateStatus('✅ 紧急清理完成！正在重新加载...', true);
                
                setTimeout(() => {
                    window.location.href = '/?v=' + Date.now();
                }, 2000);
                
            } catch (error) {
                updateStatus('❌ 清理失败: ' + error.message);
            }
        }

        function forceReload() {
            updateStatus('🔄 正在强制重新加载...');
            window.location.href = window.location.href + '&v=' + Date.now();
        }

        async function clearServiceWorker() {
            updateStatus('🧹 正在清理Service Worker...');
            
            try {
                if ('serviceWorker' in navigator) {
                    const registrations = await navigator.serviceWorker.getRegistrations();
                    for (let registration of registrations) {
                        await registration.unregister();
                    }
                    updateStatus('✅ Service Worker已清理！', true);
                } else {
                    updateStatus('❌ 浏览器不支持Service Worker');
                }
            } catch (error) {
                updateStatus('❌ 清理失败: ' + error.message);
            }
        }
    </script>
</body>
</html>`;

    writeFileSync('dist/emergency-clear.html', emergencyClearHtml);
    console.log('✅ 创建了紧急缓存清理页面');
    
    // 5. 立即部署
    console.log('🚀 立即部署修复...');
    execSync('npx netlify deploy --prod --dir=dist', { stdio: 'inherit' });
    
    console.log('🎉 紧急修复完成！');
    console.log('');
    console.log('📋 用户操作步骤:');
    console.log('1. 访问 https://eth10.netlify.app/emergency-clear.html');
    console.log('2. 点击"紧急清理所有缓存"按钮');
    console.log('3. 等待自动跳转到首页');
    console.log('4. 尝试登录');
    console.log('');
    console.log('💡 如果仍有问题，请使用无痕模式访问网站');
    
} catch (error) {
    console.error('❌ 紧急修复失败:', error.message);
    process.exit(1);
}


/**
 * 紧急修复脚本 - 解决登录问题
 */

import { execSync } from 'child_process';
import { existsSync, rmSync, writeFileSync } from 'fs';
import { join } from 'path';

console.log('🚨 紧急修复登录问题...');

try {
    // 1. 清理所有缓存和构建文件
    console.log('🧹 清理所有缓存...');
    if (existsSync('dist')) {
        rmSync('dist', { recursive: true, force: true });
    }
    if (existsSync('node_modules/.vite')) {
        rmSync('node_modules/.vite', { recursive: true, force: true });
    }
    
    // 2. 更新vite配置，强制刷新缓存
    const timestamp = Date.now();
    const viteConfig = `import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'
import { resolve } from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(${timestamp})
  },
  plugins: [
    vue(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'],
      manifest: {
        name: 'AI智能科技学习集成',
        short_name: 'AI学习',
        description: '智能科技学习集成平台 - 币安&OKX空投实时推送',
        theme_color: '#6366f1',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        cleanupOutdatedCaches: true,
        sourcemap: false,
        skipWaiting: true,
        clientsClaim: true,
        runtimeCaching: [
          {
            urlPattern: /^https:\\/\\/eth10\\.netlify\\.app\\/.*\\.(js|css|png|jpg|jpeg|gif|svg|ico)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'static-resources',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 7 // 7 days
              }
            }
          }
        ]
      }
    })
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
        manualChunks: undefined
      }
    }
  }
})`;

    writeFileSync('vite.config.ts', viteConfig);
    console.log('✅ 更新了 vite.config.ts');
    
    // 3. 重新构建
    console.log('🔨 重新构建项目...');
    execSync('npm run build', { stdio: 'inherit' });
    
    // 4. 创建紧急缓存清理页面
    const emergencyClearHtml = `<!DOCTYPE html>
<html lang="zh">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>紧急缓存清理 - AI智能科技学习集成</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            max-width: 800px;
            margin: 50px auto;
            padding: 20px;
            background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%);
            color: white;
        }
        .container {
            background: rgba(255, 255, 255, 0.1);
            padding: 30px;
            border-radius: 15px;
            backdrop-filter: blur(10px);
            border: 2px solid rgba(255, 255, 255, 0.2);
        }
        .emergency {
            background: rgba(255, 0, 0, 0.2);
            border: 2px solid #ff4757;
            padding: 20px;
            border-radius: 10px;
            margin: 20px 0;
        }
        button {
            background: #ff4757;
            color: white;
            padding: 15px 30px;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            font-size: 16px;
            margin: 10px;
            font-weight: bold;
        }
        button:hover {
            background: #ff3742;
            transform: translateY(-2px);
        }
        .status {
            margin: 20px 0;
            padding: 15px;
            background: rgba(0, 0, 0, 0.3);
            border-radius: 8px;
            font-family: monospace;
        }
        .success {
            background: rgba(0, 255, 0, 0.2);
            border: 2px solid #2ed573;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🚨 紧急缓存清理工具</h1>
        <div class="emergency">
            <h2>⚠️ 检测到登录问题！</h2>
            <p>JavaScript模块加载失败，这通常是由于缓存问题导致的。</p>
            <p>请按照以下步骤操作：</p>
        </div>
        
        <button onclick="emergencyClear()">🚨 紧急清理所有缓存</button>
        <button onclick="forceReload()">🔄 强制重新加载</button>
        <button onclick="clearServiceWorker()">🧹 清理Service Worker</button>
        
        <div id="status" class="status">
            点击按钮开始紧急修复...
        </div>
        
        <div style="margin-top: 30px;">
            <a href="/" style="color: white; text-decoration: underline; font-weight: bold;">返回首页</a>
        </div>
    </div>

    <script>
        function updateStatus(message, isSuccess = false) {
            const status = document.getElementById('status');
            status.innerHTML = message;
            if (isSuccess) {
                status.className = 'status success';
            }
        }

        async function emergencyClear() {
            updateStatus('🚨 正在执行紧急缓存清理...');
            
            try {
                // 清理所有缓存
                if ('caches' in window) {
                    const cacheNames = await caches.keys();
                    await Promise.all(
                        cacheNames.map(cacheName => caches.delete(cacheName))
                    );
                }
                
                // 清理Service Worker
                if ('serviceWorker' in navigator) {
                    const registrations = await navigator.serviceWorker.getRegistrations();
                    for (let registration of registrations) {
                        await registration.unregister();
                    }
                }
                
                // 清理存储
                localStorage.clear();
                sessionStorage.clear();
                
                updateStatus('✅ 紧急清理完成！正在重新加载...', true);
                
                setTimeout(() => {
                    window.location.href = '/?v=' + Date.now();
                }, 2000);
                
            } catch (error) {
                updateStatus('❌ 清理失败: ' + error.message);
            }
        }

        function forceReload() {
            updateStatus('🔄 正在强制重新加载...');
            window.location.href = window.location.href + '&v=' + Date.now();
        }

        async function clearServiceWorker() {
            updateStatus('🧹 正在清理Service Worker...');
            
            try {
                if ('serviceWorker' in navigator) {
                    const registrations = await navigator.serviceWorker.getRegistrations();
                    for (let registration of registrations) {
                        await registration.unregister();
                    }
                    updateStatus('✅ Service Worker已清理！', true);
                } else {
                    updateStatus('❌ 浏览器不支持Service Worker');
                }
            } catch (error) {
                updateStatus('❌ 清理失败: ' + error.message);
            }
        }
    </script>
</body>
</html>`;

    writeFileSync('dist/emergency-clear.html', emergencyClearHtml);
    console.log('✅ 创建了紧急缓存清理页面');
    
    // 5. 立即部署
    console.log('🚀 立即部署修复...');
    execSync('npx netlify deploy --prod --dir=dist', { stdio: 'inherit' });
    
    console.log('🎉 紧急修复完成！');
    console.log('');
    console.log('📋 用户操作步骤:');
    console.log('1. 访问 https://eth10.netlify.app/emergency-clear.html');
    console.log('2. 点击"紧急清理所有缓存"按钮');
    console.log('3. 等待自动跳转到首页');
    console.log('4. 尝试登录');
    console.log('');
    console.log('💡 如果仍有问题，请使用无痕模式访问网站');
    
} catch (error) {
    console.error('❌ 紧急修复失败:', error.message);
    process.exit(1);
}


















