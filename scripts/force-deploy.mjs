#!/usr/bin/env node

/**
 * 强制部署脚本 - 解决缓存问题
 */

import { execSync } from 'child_process';
import { existsSync, writeFileSync } from 'fs';
import { join } from 'path';

console.log('🔄 强制重新部署...');

try {
    // 1. 添加缓存破坏参数
    const timestamp = Date.now();
    console.log(`⏰ 时间戳: ${timestamp}`);
    
    // 2. 更新 vite.config.ts 添加缓存破坏
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
        clientsClaim: true
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
  }
})`;

    writeFileSync('vite.config.ts', viteConfig);
    console.log('✅ 更新了 vite.config.ts');
    
    // 3. 清理并重新构建
    console.log('🧹 清理旧构建...');
    if (existsSync('dist')) {
        execSync('rmdir /s /q dist', { stdio: 'inherit' });
    }
    
    console.log('🔨 重新构建...');
    execSync('npm run build', { stdio: 'inherit' });
    
    // 4. 创建强制刷新页面
    const forceRefreshHtml = `<!DOCTYPE html>
<html lang="zh">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>强制刷新 - AI智能科技学习集成</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            max-width: 600px;
            margin: 50px auto;
            padding: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
        }
        .container {
            background: rgba(255, 255, 255, 0.1);
            padding: 30px;
            border-radius: 10px;
            backdrop-filter: blur(10px);
        }
        button {
            background: #4CAF50;
            color: white;
            padding: 15px 30px;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            font-size: 16px;
            margin: 10px;
        }
        button:hover {
            background: #45a049;
        }
        .status {
            margin: 20px 0;
            padding: 15px;
            background: rgba(0, 0, 0, 0.2);
            border-radius: 5px;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🔄 强制刷新工具</h1>
        <p>如果网站没有显示最新更新，请使用以下工具：</p>
        
        <button onclick="forceRefresh()">强制刷新页面</button>
        <button onclick="clearAllCaches()">清理所有缓存</button>
        <button onclick="reloadWithoutCache()">无缓存重新加载</button>
        
        <div id="status" class="status">
            点击按钮开始强制刷新...
        </div>
        
        <div style="margin-top: 30px;">
            <a href="/" style="color: white; text-decoration: underline;">返回首页</a>
        </div>
    </div>

    <script>
        function updateStatus(message) {
            document.getElementById('status').innerHTML = message;
        }

        function forceRefresh() {
            updateStatus('正在强制刷新...');
            window.location.reload(true);
        }

        async function clearAllCaches() {
            updateStatus('正在清理所有缓存...');
            
            try {
                // 清理Service Worker
                if ('serviceWorker' in navigator) {
                    const registrations = await navigator.serviceWorker.getRegistrations();
                    for (let registration of registrations) {
                        await registration.unregister();
                    }
                }
                
                // 清理Cache API
                if ('caches' in window) {
                    const cacheNames = await caches.keys();
                    await Promise.all(
                        cacheNames.map(cacheName => caches.delete(cacheName))
                    );
                }
                
                // 清理存储
                localStorage.clear();
                sessionStorage.clear();
                
                updateStatus('✅ 所有缓存已清理！正在重新加载...');
                
                setTimeout(() => {
                    window.location.href = '/';
                }, 2000);
                
            } catch (error) {
                updateStatus('❌ 清理缓存时出错: ' + error.message);
            }
        }

        function reloadWithoutCache() {
            updateStatus('正在无缓存重新加载...');
            window.location.href = window.location.href + '?v=' + Date.now();
        }
    </script>
</body>
</html>`;

    writeFileSync('dist/force-refresh.html', forceRefreshHtml);
    console.log('✅ 创建了强制刷新页面');
    
    // 5. 手动部署
    console.log('🚀 开始手动部署...');
    execSync('npx netlify deploy --prod --dir=dist', { stdio: 'inherit' });
    
    console.log('🎉 强制部署完成！');
    console.log('');
    console.log('📋 验证步骤:');
    console.log('1. 访问 https://eth10.netlify.app/force-refresh.html');
    console.log('2. 点击"清理所有缓存"按钮');
    console.log('3. 等待自动跳转到首页');
    console.log('4. 检查版权信息是否更新为"2025AI 智能科技学习集成"');
    console.log('5. 检查右上角语言切换图标是否放大');
    
} catch (error) {
    console.error('❌ 强制部署失败:', error.message);
    process.exit(1);
}



/**
 * 强制部署脚本 - 解决缓存问题
 */

import { execSync } from 'child_process';
import { existsSync, writeFileSync } from 'fs';
import { join } from 'path';

console.log('🔄 强制重新部署...');

try {
    // 1. 添加缓存破坏参数
    const timestamp = Date.now();
    console.log(`⏰ 时间戳: ${timestamp}`);
    
    // 2. 更新 vite.config.ts 添加缓存破坏
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
        clientsClaim: true
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
  }
})`;

    writeFileSync('vite.config.ts', viteConfig);
    console.log('✅ 更新了 vite.config.ts');
    
    // 3. 清理并重新构建
    console.log('🧹 清理旧构建...');
    if (existsSync('dist')) {
        execSync('rmdir /s /q dist', { stdio: 'inherit' });
    }
    
    console.log('🔨 重新构建...');
    execSync('npm run build', { stdio: 'inherit' });
    
    // 4. 创建强制刷新页面
    const forceRefreshHtml = `<!DOCTYPE html>
<html lang="zh">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>强制刷新 - AI智能科技学习集成</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            max-width: 600px;
            margin: 50px auto;
            padding: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
        }
        .container {
            background: rgba(255, 255, 255, 0.1);
            padding: 30px;
            border-radius: 10px;
            backdrop-filter: blur(10px);
        }
        button {
            background: #4CAF50;
            color: white;
            padding: 15px 30px;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            font-size: 16px;
            margin: 10px;
        }
        button:hover {
            background: #45a049;
        }
        .status {
            margin: 20px 0;
            padding: 15px;
            background: rgba(0, 0, 0, 0.2);
            border-radius: 5px;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🔄 强制刷新工具</h1>
        <p>如果网站没有显示最新更新，请使用以下工具：</p>
        
        <button onclick="forceRefresh()">强制刷新页面</button>
        <button onclick="clearAllCaches()">清理所有缓存</button>
        <button onclick="reloadWithoutCache()">无缓存重新加载</button>
        
        <div id="status" class="status">
            点击按钮开始强制刷新...
        </div>
        
        <div style="margin-top: 30px;">
            <a href="/" style="color: white; text-decoration: underline;">返回首页</a>
        </div>
    </div>

    <script>
        function updateStatus(message) {
            document.getElementById('status').innerHTML = message;
        }

        function forceRefresh() {
            updateStatus('正在强制刷新...');
            window.location.reload(true);
        }

        async function clearAllCaches() {
            updateStatus('正在清理所有缓存...');
            
            try {
                // 清理Service Worker
                if ('serviceWorker' in navigator) {
                    const registrations = await navigator.serviceWorker.getRegistrations();
                    for (let registration of registrations) {
                        await registration.unregister();
                    }
                }
                
                // 清理Cache API
                if ('caches' in window) {
                    const cacheNames = await caches.keys();
                    await Promise.all(
                        cacheNames.map(cacheName => caches.delete(cacheName))
                    );
                }
                
                // 清理存储
                localStorage.clear();
                sessionStorage.clear();
                
                updateStatus('✅ 所有缓存已清理！正在重新加载...');
                
                setTimeout(() => {
                    window.location.href = '/';
                }, 2000);
                
            } catch (error) {
                updateStatus('❌ 清理缓存时出错: ' + error.message);
            }
        }

        function reloadWithoutCache() {
            updateStatus('正在无缓存重新加载...');
            window.location.href = window.location.href + '?v=' + Date.now();
        }
    </script>
</body>
</html>`;

    writeFileSync('dist/force-refresh.html', forceRefreshHtml);
    console.log('✅ 创建了强制刷新页面');
    
    // 5. 手动部署
    console.log('🚀 开始手动部署...');
    execSync('npx netlify deploy --prod --dir=dist', { stdio: 'inherit' });
    
    console.log('🎉 强制部署完成！');
    console.log('');
    console.log('📋 验证步骤:');
    console.log('1. 访问 https://eth10.netlify.app/force-refresh.html');
    console.log('2. 点击"清理所有缓存"按钮');
    console.log('3. 等待自动跳转到首页');
    console.log('4. 检查版权信息是否更新为"2025AI 智能科技学习集成"');
    console.log('5. 检查右上角语言切换图标是否放大');
    
} catch (error) {
    console.error('❌ 强制部署失败:', error.message);
    process.exit(1);
}























