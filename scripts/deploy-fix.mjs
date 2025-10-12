#!/usr/bin/env node

/**
 * 部署修复脚本 - 解决登录问题
 * 这个脚本会：
 * 1. 清理旧的构建文件
 * 2. 重新构建项目
 * 3. 更新缓存清理页面
 * 4. 验证构建结果
 */

import { execSync } from 'child_process';
import { existsSync, rmSync, mkdirSync } from 'fs';
import { join } from 'path';

console.log('🚀 开始部署修复...');

try {
    // 1. 清理旧的构建文件
    console.log('📁 清理旧的构建文件...');
    if (existsSync('dist')) {
        rmSync('dist', { recursive: true, force: true });
    }
    
    // 2. 重新构建项目
    console.log('🔨 重新构建项目...');
    execSync('npm run build', { stdio: 'inherit' });
    
    // 3. 验证关键文件是否存在
    console.log('✅ 验证构建结果...');
    const criticalFiles = [
        'dist/index.html',
        'dist/assets/index-CoBm6KJN.js',
        'dist/assets/ChatView-2odg4Ri3.js',
        'dist/manifest.webmanifest',
        'dist/sw.js'
    ];
    
    for (const file of criticalFiles) {
        if (!existsSync(file)) {
            throw new Error(`关键文件缺失: ${file}`);
        }
        console.log(`✓ ${file}`);
    }
    
    // 4. 检查缓存清理页面
    if (!existsSync('dist/clear-cache.html')) {
        console.log('📄 复制缓存清理页面...');
        execSync('cp public/clear-cache.html dist/', { stdio: 'inherit' });
    }
    
    console.log('🎉 部署修复完成！');
    console.log('');
    console.log('📋 下一步操作：');
    console.log('1. 将 dist/ 目录部署到 Netlify');
    console.log('2. 访问 /clear-cache.html 清理浏览器缓存');
    console.log('3. 重新访问登录页面');
    console.log('');
    console.log('🔧 如果仍有问题，请检查：');
    console.log('- Netlify 的 MIME 类型配置');
    console.log('- Service Worker 缓存');
    console.log('- 浏览器开发者工具中的网络请求');
    
} catch (error) {
    console.error('❌ 部署修复失败:', error.message);
    process.exit(1);
}
