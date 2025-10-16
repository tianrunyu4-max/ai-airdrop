/**
 * 头像自动生成工具
 * 为用户生成随机颜色的正方形卡通头像
 */

// 8种美观的背景颜色
const AVATAR_COLORS = [
  '#FF6B6B', // 珊瑚红
  '#4ECDC4', // 青绿色
  '#45B7D1', // 天蓝色
  '#FFA07A', // 浅橙色
  '#98D8C8', // 薄荷绿
  '#F7DC6F', // 柠檬黄
  '#BB8FCE', // 淡紫色
  '#85C1E2'  // 粉蓝色
]

/**
 * 根据用户名生成正方形SVG头像
 * @param username 用户名
 * @param size 头像尺寸（默认200px）
 * @returns Base64编码的SVG头像URL
 */
export function generateAvatar(username: string, size: number = 200): string {
  // 随机选择一个颜色
  const color = AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)]
  
  // 获取用户名首字母，如果是中文则取第一个字
  const firstChar = username.charAt(0).toUpperCase()
  
  // 生成正方形SVG
  const svg = `
    <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${size}" height="${size}" fill="${color}"/>
      <text 
        x="50%" 
        y="50%" 
        text-anchor="middle" 
        dy=".3em" 
        fill="white" 
        font-size="${size / 2}" 
        font-weight="bold"
        font-family="Arial, sans-serif, '微软雅黑'"
      >${firstChar}</text>
    </svg>
  `
  
  // 返回Base64编码的DataURL
  return `data:image/svg+xml;base64,${btoa(svg)}`
}

/**
 * 根据用户名生成固定颜色的头像（同一用户每次生成相同颜色）
 * @param username 用户名
 * @param size 头像尺寸（默认200px）
 * @returns Base64编码的SVG头像URL
 */
export function generateConsistentAvatar(username: string, size: number = 200): string {
  // 根据用户名计算哈希值，确保同一用户名总是得到同一颜色
  let hash = 0
  for (let i = 0; i < username.length; i++) {
    hash = username.charCodeAt(i) + ((hash << 5) - hash)
  }
  
  // 根据哈希值选择颜色
  const colorIndex = Math.abs(hash) % AVATAR_COLORS.length
  const color = AVATAR_COLORS[colorIndex]
  
  // 获取用户名首字母
  const firstChar = username.charAt(0).toUpperCase()
  
  // 生成正方形SVG
  const svg = `
    <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${size}" height="${size}" fill="${color}"/>
      <text 
        x="50%" 
        y="50%" 
        text-anchor="middle" 
        dy=".3em" 
        fill="white" 
        font-size="${size / 2}" 
        font-weight="bold"
        font-family="Arial, sans-serif, '微软雅黑'"
      >${firstChar}</text>
    </svg>
  `
  
  return `data:image/svg+xml;base64,${btoa(svg)}`
}

