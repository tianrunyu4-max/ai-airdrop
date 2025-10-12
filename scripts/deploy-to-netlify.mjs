#!/usr/bin/env node

/**
 * 部署到 Netlify 脚本
 * 将更新后的系统部署到 https://eth10.netlify.app
 */

import { execSync } from 'child_process';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

console.log('🚀 开始部署到 Netlify...');

try {
    // 1. 检查构建文件是否存在
    console.log('📁 检查构建文件...');
    if (!existsSync('dist')) {
        throw new Error('dist 目录不存在，请先运行 npm run build');
    }
    
    if (!existsSync('dist/index.html')) {
        throw new Error('dist/index.html 不存在，构建可能失败');
    }
    
    console.log('✅ 构建文件检查通过');
    
    // 2. 检查 Netlify 配置
    console.log('⚙️ 检查 Netlify 配置...');
    if (!existsSync('netlify.toml')) {
        throw new Error('netlify.toml 配置文件不存在');
    }
    
    const netlifyConfig = readFileSync('netlify.toml', 'utf-8');
    console.log('✅ Netlify 配置检查通过');
    
    // 3. 检查关键文件
    const criticalFiles = [
        'dist/index.html',
        'dist/assets/index-A01XX7IF.js',
        'dist/assets/ChatView-BmUSsC50.js',
        'dist/manifest.webmanifest',
        'dist/sw.js',
        'dist/clear-cache.html'
    ];
    
    console.log('🔍 验证关键文件...');
    for (const file of criticalFiles) {
        if (!existsSync(file)) {
            console.warn(`⚠️ 文件不存在: ${file}`);
        } else {
            console.log(`✓ ${file}`);
        }
    }
    
    // 4. 显示部署信息
    console.log('');
    console.log('📋 部署信息:');
    console.log('🌐 目标地址: https://eth10.netlify.app');
    console.log('📦 构建目录: dist/');
    console.log('🔧 配置文件: netlify.toml');
    console.log('');
    
    // 5. 部署指令
    console.log('🚀 部署指令:');
    console.log('');
    console.log('方法1 - 使用 Netlify CLI:');
    console.log('  npx netlify deploy --prod --dir=dist');
    console.log('');
    console.log('方法2 - 拖拽部署:');
    console.log('  1. 访问 https://app.netlify.com');
    console.log('  2. 找到 eth10 项目');
    console.log('  3. 将 dist/ 目录拖拽到部署区域');
    console.log('');
    console.log('方法3 - Git 部署:');
    console.log('  git add .');
    console.log('  git commit -m "更新版权信息和语言切换图标"');
    console.log('  git push origin main');
    console.log('');
    
    // 6. 部署后验证
    console.log('✅ 部署后验证步骤:');
    console.log('1. 访问 https://eth10.netlify.app');
    console.log('2. 检查底部版权信息: "© 2025AI 智能科技学习集成"');
    console.log('3. 检查右上角语言切换图标是否放大');
    console.log('4. 测试登录功能是否正常');
    console.log('5. 如果遇到缓存问题，访问 /clear-cache.html');
    console.log('');
    
    console.log('🎉 部署准备完成！');
    console.log('');
    console.log('💡 提示: 如果遇到缓存问题，用户可以访问:');
    console.log('   https://eth10.netlify.app/clear-cache.html');
    
} catch (error) {
    console.error('❌ 部署准备失败:', error.message);
    process.exit(1);
}
