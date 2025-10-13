#!/usr/bin/env node

/**
 * 快速登录修复脚本
 * 解决反复出现的登录问题
 */

import { execSync } from 'child_process';
import { existsSync, rmSync, writeFileSync } from 'fs';
import { join } from 'path';

console.log('⚡ 快速修复登录问题...');

try {
    // 1. 清理所有缓存
    console.log('🧹 清理所有缓存...');
    if (existsSync('dist')) {
        rmSync('dist', { recursive: true, force: true });
    }
    if (existsSync('node_modules/.vite')) {
        rmSync('node_modules/.vite', { recursive: true, force: true });
    }
    
    // 2. 优化vite配置，强制刷新
    const timestamp = Date.now();
    const viteConfig = `import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'
import { resolve } from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(${timestamp}),
    __BUILD_TIME__: JSON.stringify(${timestamp})
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
            urlPattern: /^https:\\/\\/eth10\\.netlify\\.app\\/.*\\.(js|css)$/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'app-resources',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 2 // 2 hours
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
        manualChunks: undefined,
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]'
      }
    },
    sourcemap: false,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    }
  }
})`;

    writeFileSync('vite.config.ts', viteConfig);
    console.log('✅ 优化了 vite.config.ts');
    
    // 3. 快速构建
    console.log('🔨 快速构建...');
    execSync('npm run build', { stdio: 'inherit' });
    
    // 4. 创建快速登录测试页面
    const quickLoginTest = `<!DOCTYPE html>
<html lang="zh">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>快速登录测试 - AI智能科技学习集成</title>
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
            border-radius: 15px;
            backdrop-filter: blur(10px);
        }
        .test-card {
            background: rgba(255, 255, 255, 0.9);
            color: #333;
            padding: 20px;
            border-radius: 10px;
            margin: 20px 0;
        }
        button {
            background: #4CAF50;
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
            background: #45a049;
            transform: translateY(-2px);
        }
        .success {
            background: rgba(0, 255, 0, 0.2);
            border: 2px solid #2ed573;
        }
        .error {
            background: rgba(255, 0, 0, 0.2);
            border: 2px solid #ff4757;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>⚡ 快速登录修复工具</h1>
        <p>解决反复出现的登录问题，提升登录速度</p>
        
        <div class="test-card">
            <h2>🔧 自动修复步骤</h2>
            <button onclick="quickFix()">🚀 一键修复登录问题</button>
            <button onclick="clearAllCaches()">🧹 清理所有缓存</button>
            <button onclick="testLogin()">🔍 测试登录功能</button>
        </div>
        
        <div id="status" class="test-card">
            点击按钮开始快速修复...
        </div>
        
        <div class="test-card">
            <h2>📱 快速访问</h2>
            <button onclick="window.open('https://eth10.netlify.app', '_blank')">
                🏠 访问首页
            </button>
            <button onclick="window.open('https://eth10.netlify.app/login', '_blank')">
                🔐 直接登录
            </button>
            <button onclick="window.open('https://eth10.netlify.app/profile', '_blank')">
                👤 个人资料（查看提现功能）
            </button>
        </div>
        
        <div class="test-card">
            <h2>💡 如果仍有问题</h2>
            <ol>
                <li>使用无痕模式访问网站</li>
                <li>尝试不同的浏览器</li>
                <li>检查网络连接</li>
                <li>等待2-3分钟让CDN更新</li>
            </ol>
        </div>
    </div>

    <script>
        function updateStatus(message, isSuccess = false, isError = false) {
            const status = document.getElementById('status');
            status.innerHTML = message;
            status.className = 'test-card ' + (isSuccess ? 'success' : isError ? 'error' : '');
        }

        async function quickFix() {
            updateStatus('🚀 正在执行快速修复...');
            
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
                
                updateStatus('✅ 快速修复完成！正在跳转到登录页面...', true);
                
                setTimeout(() => {
                    window.location.href = 'https://eth10.netlify.app/login?v=' + Date.now();
                }, 2000);
                
            } catch (error) {
                updateStatus('❌ 修复失败: ' + error.message, false, true);
            }
        }

        async function clearAllCaches() {
            updateStatus('🧹 正在清理所有缓存...');
            
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
                
                updateStatus('✅ 所有缓存已清理！', true);
                
            } catch (error) {
                updateStatus('❌ 清理失败: ' + error.message, false, true);
            }
        }

        function testLogin() {
            updateStatus('🔍 正在测试登录功能...');
            
            // 打开新窗口测试登录
            const testWindow = window.open('https://eth10.netlify.app/login?v=' + Date.now(), '_blank');
            
            setTimeout(() => {
                updateStatus('✅ 登录页面已打开，请测试登录功能', true);
            }, 1000);
        }
    </script>
</body>
</html>`;

    writeFileSync('dist/quick-login-fix.html', quickLoginTest);
    console.log('✅ 创建了快速登录修复页面');
    
    // 5. 立即部署
    console.log('🚀 立即部署修复...');
    execSync('npx netlify deploy --prod --dir=dist', { stdio: 'inherit' });
    
    console.log('🎉 快速修复完成！');
    console.log('');
    console.log('📋 用户操作步骤:');
    console.log('1. 访问 https://eth10.netlify.app/quick-login-fix.html');
    console.log('2. 点击"一键修复登录问题"按钮');
    console.log('3. 等待自动跳转到登录页面');
    console.log('4. 测试登录功能');
    console.log('');
    console.log('⚡ 修复特点:');
    console.log('- 优化了构建配置');
    console.log('- 强制刷新所有缓存');
    console.log('- 优化了加载速度');
    console.log('- 防止缓存问题');
    
} catch (error) {
    console.error('❌ 快速修复失败:', error.message);
    process.exit(1);
}


/**
 * 快速登录修复脚本
 * 解决反复出现的登录问题
 */

import { execSync } from 'child_process';
import { existsSync, rmSync, writeFileSync } from 'fs';
import { join } from 'path';

console.log('⚡ 快速修复登录问题...');

try {
    // 1. 清理所有缓存
    console.log('🧹 清理所有缓存...');
    if (existsSync('dist')) {
        rmSync('dist', { recursive: true, force: true });
    }
    if (existsSync('node_modules/.vite')) {
        rmSync('node_modules/.vite', { recursive: true, force: true });
    }
    
    // 2. 优化vite配置，强制刷新
    const timestamp = Date.now();
    const viteConfig = `import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'
import { resolve } from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(${timestamp}),
    __BUILD_TIME__: JSON.stringify(${timestamp})
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
            urlPattern: /^https:\\/\\/eth10\\.netlify\\.app\\/.*\\.(js|css)$/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'app-resources',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 2 // 2 hours
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
        manualChunks: undefined,
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]'
      }
    },
    sourcemap: false,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    }
  }
})`;

    writeFileSync('vite.config.ts', viteConfig);
    console.log('✅ 优化了 vite.config.ts');
    
    // 3. 快速构建
    console.log('🔨 快速构建...');
    execSync('npm run build', { stdio: 'inherit' });
    
    // 4. 创建快速登录测试页面
    const quickLoginTest = `<!DOCTYPE html>
<html lang="zh">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>快速登录测试 - AI智能科技学习集成</title>
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
            border-radius: 15px;
            backdrop-filter: blur(10px);
        }
        .test-card {
            background: rgba(255, 255, 255, 0.9);
            color: #333;
            padding: 20px;
            border-radius: 10px;
            margin: 20px 0;
        }
        button {
            background: #4CAF50;
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
            background: #45a049;
            transform: translateY(-2px);
        }
        .success {
            background: rgba(0, 255, 0, 0.2);
            border: 2px solid #2ed573;
        }
        .error {
            background: rgba(255, 0, 0, 0.2);
            border: 2px solid #ff4757;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>⚡ 快速登录修复工具</h1>
        <p>解决反复出现的登录问题，提升登录速度</p>
        
        <div class="test-card">
            <h2>🔧 自动修复步骤</h2>
            <button onclick="quickFix()">🚀 一键修复登录问题</button>
            <button onclick="clearAllCaches()">🧹 清理所有缓存</button>
            <button onclick="testLogin()">🔍 测试登录功能</button>
        </div>
        
        <div id="status" class="test-card">
            点击按钮开始快速修复...
        </div>
        
        <div class="test-card">
            <h2>📱 快速访问</h2>
            <button onclick="window.open('https://eth10.netlify.app', '_blank')">
                🏠 访问首页
            </button>
            <button onclick="window.open('https://eth10.netlify.app/login', '_blank')">
                🔐 直接登录
            </button>
            <button onclick="window.open('https://eth10.netlify.app/profile', '_blank')">
                👤 个人资料（查看提现功能）
            </button>
        </div>
        
        <div class="test-card">
            <h2>💡 如果仍有问题</h2>
            <ol>
                <li>使用无痕模式访问网站</li>
                <li>尝试不同的浏览器</li>
                <li>检查网络连接</li>
                <li>等待2-3分钟让CDN更新</li>
            </ol>
        </div>
    </div>

    <script>
        function updateStatus(message, isSuccess = false, isError = false) {
            const status = document.getElementById('status');
            status.innerHTML = message;
            status.className = 'test-card ' + (isSuccess ? 'success' : isError ? 'error' : '');
        }

        async function quickFix() {
            updateStatus('🚀 正在执行快速修复...');
            
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
                
                updateStatus('✅ 快速修复完成！正在跳转到登录页面...', true);
                
                setTimeout(() => {
                    window.location.href = 'https://eth10.netlify.app/login?v=' + Date.now();
                }, 2000);
                
            } catch (error) {
                updateStatus('❌ 修复失败: ' + error.message, false, true);
            }
        }

        async function clearAllCaches() {
            updateStatus('🧹 正在清理所有缓存...');
            
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
                
                updateStatus('✅ 所有缓存已清理！', true);
                
            } catch (error) {
                updateStatus('❌ 清理失败: ' + error.message, false, true);
            }
        }

        function testLogin() {
            updateStatus('🔍 正在测试登录功能...');
            
            // 打开新窗口测试登录
            const testWindow = window.open('https://eth10.netlify.app/login?v=' + Date.now(), '_blank');
            
            setTimeout(() => {
                updateStatus('✅ 登录页面已打开，请测试登录功能', true);
            }, 1000);
        }
    </script>
</body>
</html>`;

    writeFileSync('dist/quick-login-fix.html', quickLoginTest);
    console.log('✅ 创建了快速登录修复页面');
    
    // 5. 立即部署
    console.log('🚀 立即部署修复...');
    execSync('npx netlify deploy --prod --dir=dist', { stdio: 'inherit' });
    
    console.log('🎉 快速修复完成！');
    console.log('');
    console.log('📋 用户操作步骤:');
    console.log('1. 访问 https://eth10.netlify.app/quick-login-fix.html');
    console.log('2. 点击"一键修复登录问题"按钮');
    console.log('3. 等待自动跳转到登录页面');
    console.log('4. 测试登录功能');
    console.log('');
    console.log('⚡ 修复特点:');
    console.log('- 优化了构建配置');
    console.log('- 强制刷新所有缓存');
    console.log('- 优化了加载速度');
    console.log('- 防止缓存问题');
    
} catch (error) {
    console.error('❌ 快速修复失败:', error.message);
    process.exit(1);
}






