# 📢 广告专题系统设计

## 🎯 功能概述

在机器人消息的空白区域插入**广告推广内容**，提供平台变现能力。

---

## 📊 广告数据结构

### 后端提供字段：

```typescript
{
  images: string[]        // 2张图片URL
  text: string           // 50字以内广告文案
  link: string           // 跳转链接
  frequency?: number     // 每小时推送几次（可选）
}
```

### 示例数据：

```json
{
  "images": [
    "https://example.com/ad-image-1.jpg",
    "https://example.com/ad-image-2.jpg"
  ],
  "text": "🎁 新手福利！注册即送100U体验金，完成实名认证再送50U！限时活动，先到先得！",
  "link": "https://example.com/promotion",
  "frequency": 2
}
```

---

## 🎨 UI 设计

### 广告卡片布局：

```
┌────────────────────────────────────┐
│ 🤖 AI空投机器人           [参与]  │
├────────────────────────────────────┤
│ 📢 特别推荐                        │
│                                    │
│ ┌────────────────────────────────┐│
││ [广告] 推广内容                 ││
││                                  ││
││ [图1] [图2]  💎 VIP会员限时优惠 ││
││   80x80px    成为代理享受更多...││
││              → 点击了解详情      ││
│└────────────────────────────────┘│
└────────────────────────────────────┘
```

### 视觉特点：

- ✅ **广告标签**：黄色 `badge-warning`
- ✅ **边框分隔**：上方有分隔线
- ✅ **双图展示**：2张图片 80x80px
- ✅ **文案显示**：最多3行，超出显示省略号
- ✅ **点击提示**：蓝色箭头 + "点击了解详情"
- ✅ **悬停效果**：鼠标悬停背景变深

---

## ⏰ 推送频率配置

### 当前设置（测试）：

```typescript
// 欢迎消息后 5秒推送首条广告
setTimeout(() => {
  pushAdvertisement()
}, 5000)

// 每 20秒 推送一次广告（测试用）
adInterval = setInterval(() => {
  pushAdvertisement()
}, 20000)
```

### 生产环境建议：

#### 方案1：固定频率
```typescript
// 每小时推送 2 次 = 30分钟一次
adInterval = setInterval(() => {
  pushAdvertisement()
}, 1800000) // 30分钟 = 1800000ms
```

#### 方案2：后端控制
```typescript
// 从后端获取配置
const adConfig = await fetchAdConfig()
const intervalMs = (60 / adConfig.frequency) * 60 * 1000

adInterval = setInterval(() => {
  pushAdvertisement()
}, intervalMs)
```

#### 频率对照表：

| 每小时次数 | 间隔时间 | 毫秒值 |
|-----------|---------|--------|
| 1次 | 60分钟 | 3600000 |
| 2次 | 30分钟 | 1800000 |
| 3次 | 20分钟 | 1200000 |
| 4次 | 15分钟 | 900000 |
| 6次 | 10分钟 | 600000 |

---

## 📝 广告池管理

### 当前实现（开发模式）：

```typescript
const adPool = [
  {
    images: ['img1.jpg', 'img2.jpg'],
    text: '🎁 新手福利！注册即送100U...',
    link: 'https://example.com/promo1'
  },
  {
    images: ['img3.jpg', 'img4.jpg'],
    text: '💎 VIP会员限时优惠...',
    link: 'https://example.com/vip'
  },
  // 更多广告...
]

// 随机选择一条推送
const randomAd = adPool[Math.floor(Math.random() * adPool.length)]
```

### 生产环境建议：

#### 1. 从后端API获取
```typescript
const fetchAds = async () => {
  const { data } = await supabase
    .from('advertisements')
    .select('*')
    .eq('is_active', true)
    .order('priority', { ascending: false })
  
  return data
}
```

#### 2. 权重分配
```typescript
// 根据优先级/付费金额分配展示概率
const selectAdByWeight = (ads) => {
  const totalWeight = ads.reduce((sum, ad) => sum + ad.weight, 0)
  let random = Math.random() * totalWeight
  
  for (const ad of ads) {
    random -= ad.weight
    if (random <= 0) return ad
  }
}
```

#### 3. 轮播策略
```typescript
// 顺序展示所有广告
let currentAdIndex = 0
const nextAd = () => {
  const ad = adPool[currentAdIndex]
  currentAdIndex = (currentAdIndex + 1) % adPool.length
  return ad
}
```

---

## 🎯 广告数据表设计

### Supabase 表结构：

```sql
CREATE TABLE advertisements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- 广告内容
  image_url_1 TEXT NOT NULL,          -- 图片1 URL
  image_url_2 TEXT NOT NULL,          -- 图片2 URL
  text VARCHAR(50) NOT NULL,          -- 广告文案（50字限制）
  link TEXT NOT NULL,                 -- 跳转链接
  
  -- 推送配置
  frequency INT DEFAULT 2,            -- 每小时推送次数
  priority INT DEFAULT 0,             -- 优先级（数字越大越优先）
  weight INT DEFAULT 1,               -- 展示权重
  
  -- 统计数据
  impressions INT DEFAULT 0,          -- 展示次数
  clicks INT DEFAULT 0,               -- 点击次数
  ctr DECIMAL(5,2) DEFAULT 0,        -- 点击率 CTR
  
  -- 状态管理
  is_active BOOLEAN DEFAULT TRUE,     -- 是否启用
  start_date TIMESTAMP,               -- 开始时间
  end_date TIMESTAMP,                 -- 结束时间
  
  -- 广告主信息
  advertiser_name TEXT,               -- 广告主名称
  advertiser_id UUID,                 -- 广告主ID
  
  -- 审核相关
  status VARCHAR(20) DEFAULT 'pending', -- pending/approved/rejected
  reviewed_by UUID,
  reviewed_at TIMESTAMP,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 索引
CREATE INDEX idx_ads_active ON advertisements(is_active, priority DESC);
CREATE INDEX idx_ads_dates ON advertisements(start_date, end_date);
```

---

## 📊 点击统计

### 前端记录：

```typescript
const openAdLink = (adData: any) => {
  // 1. 记录点击
  await supabase
    .from('ad_clicks')
    .insert({
      ad_id: adData.id,
      user_id: authStore.user?.id,
      clicked_at: new Date().toISOString()
    })
  
  // 2. 更新广告点击数
  await supabase.rpc('increment_ad_clicks', { ad_id: adData.id })
  
  // 3. 跳转链接
  window.open(adData.link, '_blank')
}
```

### 点击记录表：

```sql
CREATE TABLE ad_clicks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ad_id UUID REFERENCES advertisements(id),
  user_id UUID REFERENCES users(id),
  clicked_at TIMESTAMP DEFAULT NOW(),
  ip_address TEXT,
  user_agent TEXT
);
```

---

## 💰 商业模式

### 1. CPM（按展示计费）
- 每1000次展示收费
- 适合品牌广告

### 2. CPC（按点击计费）
- 每次点击收费
- 适合效果广告

### 3. CPA（按转化计费）
- 按注册/成交收费
- 需要跟踪转化

### 4. 包月包年
- 固定展示次数
- 保证曝光量

---

## 🔧 后端管理功能

### 广告管理后台需要：

1. **广告创建**
   - 上传2张图片
   - 输入文案（限50字）
   - 设置跳转链接
   - 配置推送频率

2. **广告审核**
   - 待审核列表
   - 审核通过/拒绝
   - 审核记录

3. **广告排期**
   - 设置开始/结束时间
   - 优先级配置
   - 权重分配

4. **数据统计**
   - 展示次数
   - 点击次数
   - CTR 点击率
   - 转化数据

5. **费用结算**
   - 消费记录
   - 余额扣除
   - 发票管理

---

## 🎨 广告样式变种

### 样式1：横向布局（当前）
```
[图1] [图2] 文案...
```

### 样式2：纵向布局
```
[图1]
[图2]
文案...
```

### 样式3：单图大图
```
[大图]
文案...
```

### 样式4：视频广告
```
[视频封面]
播放按钮
文案...
```

---

## 📋 实现清单

### ✅ 已完成
- [x] 广告卡片UI设计
- [x] 双图片展示
- [x] 文案显示（50字）
- [x] 点击跳转功能
- [x] 广告池管理
- [x] 定时推送逻辑
- [x] 频率配置（可调）

### ⏳ 待开发
- [ ] 后端API接口
- [ ] 数据库表创建
- [ ] 点击统计功能
- [ ] 管理后台界面
- [ ] 广告审核流程
- [ ] 数据统计报表
- [ ] 费用结算系统

---

## 🚀 快速测试

### 当前测试配置：

```
5秒后：首条广告推送
20秒后：第二条广告
40秒后：第三条广告
60秒后：第四条广告
...循环...
```

### 修改推送频率：

打开 `src/views/chat/ChatView.vue`，找到：

```typescript
// 第541行
}, 20000) // 改为你想要的毫秒数
```

**示例：**
- 10秒一次：`10000`
- 1分钟一次：`60000`
- 30分钟一次：`1800000`

---

## 💡 优化建议

### 1. 用户体验
- ✅ 不要过于频繁（建议30分钟以上）
- ✅ 广告标签要清晰
- ✅ 允许用户关闭广告（VIP权益）
- ✅ 广告内容与平台相关

### 2. 广告质量
- ✅ 审核广告内容
- ✅ 图片清晰度要求
- ✅ 文案真实不夸大
- ✅ 链接安全检查

### 3. 数据分析
- ✅ A/B测试不同样式
- ✅ 分析最佳推送时间
- ✅ 优化文案转化率
- ✅ 监控用户反馈

---

## 🎉 完成！

**广告系统已集成到群聊中，现在刷新页面体验！**

5秒后会看到第一条广告推送，20秒后会看到下一条。

**商业价值：**
- 💰 平台变现渠道
- 📈 广告主推广渠道
- 🎯 精准用户触达
- 📊 数据可追踪

---

**需要调整什么？告诉我！** 🚀






