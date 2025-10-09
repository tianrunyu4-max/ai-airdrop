# 📢 广告专题系统设计 V2 - 右侧布局

## 🎯 设计思路

广告**直接集成在机器人消息的右侧空白区域**，与空投信息同时展示。

---

## 📐 布局设计

### 整体结构：
```
┌─────────────────────────────────────────────────────────┐
│ 🤖 AI空投机器人                                        │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌────────────────────────────┬─────────────────────┐  │
│  │  左侧：空投信息（主要内容）│  右侧：广告区域    │  │
│  │                            │                     │  │
│  │  🔥 币安新空投！           │  [广告] 推荐       │  │
│  │                            │                     │  │
│  │  项目：BNB质押奖励         │  ┌───┬───┬───┐    │  │
│  │  奖励：预计50 USDT         │  │图1│图2│图3│    │  │
│  │  AI评分：8.5/10            │  └───┴───┴───┘    │  │
│  │                            │                     │  │
│  │  ✅ 参与方式：...          │  💎 VIP会员限时   │  │
│  │  ⏰ 截止时间：...          │  优惠！成为代理   │  │
│  │                            │  享受更多推荐...  │  │
│  │  [币安] [⭐ 8.5]          │                     │  │
│  │  [参与] [分享]             │  → 了解详情       │  │
│  └────────────────────────────┴─────────────────────┘  │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### 尺寸分配：
- **左侧（空投信息）**: `flex-1`（自适应，占主要空间）
- **右侧（广告区域）**: `w-64`（固定256px宽度）
- **分隔线**: 左边框 `border-l`

---

## 🎨 广告区域详细设计

### 结构：
```vue
<div class="w-64 flex-shrink-0 border-l pl-4">
  <!-- 广告标签 -->
  <div class="flex items-center gap-2 mb-3">
    <span class="badge badge-warning badge-sm">广告</span>
    <span class="text-xs text-base-content/60">推荐</span>
  </div>
  
  <!-- 广告内容卡片 -->
  <div class="bg-base-200/30 rounded-lg p-3 cursor-pointer hover:bg-base-200/60">
    <!-- 3张图片（3列网格布局） -->
    <div class="grid grid-cols-3 gap-1 mb-3">
      <img src="图1" class="w-full aspect-square rounded object-cover">
      <img src="图2" class="w-full aspect-square rounded object-cover">
      <img src="图3" class="w-full aspect-square rounded object-cover">
    </div>
    
    <!-- 广告文案（最多3行） -->
    <p class="text-sm text-base-content/90 line-clamp-3 mb-2">
      💎 VIP会员限时优惠！成为代理享受更多推荐奖励...
    </p>
    
    <!-- 点击提示 -->
    <div class="flex items-center justify-center gap-1 text-xs text-primary">
      <span>了解详情</span>
      <svg>→</svg>
    </div>
  </div>
</div>
```

### 视觉特点：
- ✅ **黄色广告标签**（醒目但不刺眼）
- ✅ **3张正方形图片**（网格排列）
- ✅ **文案限制3行**（超出显示省略号）
- ✅ **悬停效果**（背景变深）
- ✅ **点击提示**（蓝色箭头）

---

## 📊 数据结构

### 后端需要传给机器人消息的数据：

```json
{
  "id": "msg-123",
  "content": "🔥 币安新空投！\n\n项目：BNB质押奖励...",
  "airdrop_data": {
    "exchange": "币安",
    "score": 8.5
  },
  "ad_data": {
    "images": [
      "https://example.com/ad1.jpg",
      "https://example.com/ad2.jpg",
      "https://example.com/ad3.jpg"
    ],
    "text": "💎 VIP会员限时优惠！成为代理享受更多推荐奖励，月入过万不是梦！",
    "link": "https://example.com/ad-landing"
  }
}
```

### 关键字段：
- `images`: 数组，**必须3张图片**
- `text`: 字符串，**50字以内**
- `link`: 字符串，点击跳转链接
- `ad_data`: 可选，如果为 `null` 则不显示广告

---

## 🎯 推送逻辑

### 1. 后端控制（推荐）

每次推送空投消息时，后端决定是否带广告：

```typescript
// 后端API返回
{
  "airdrop": {
    "exchange": "币安",
    "content": "空投信息...",
    "score": 8.5
  },
  "advertisement": {  // 可能为 null
    "images": [...],
    "text": "...",
    "link": "..."
  }
}
```

### 2. 前端随机（当前实现）

70%概率显示广告：

```typescript
// 随机决定是否带广告
const shouldShowAd = Math.random() > 0.3 // 70%概率
const randomAd = shouldShowAd ? adPool[Math.floor(Math.random() * adPool.length)] : null

messages.value.push({
  content: airdropContent,
  airdrop_data: airdropData,
  ad_data: randomAd  // 70%概率有广告，30%概率为null
})
```

### 3. 频率配置

#### 方案A：固定比例
```typescript
// 每2条空投消息带1条广告
const messageCount = messages.value.length
const shouldShowAd = messageCount % 2 === 0
```

#### 方案B：时间控制
```typescript
// 每小时最多显示X次广告
const adFrequency = 2 // 每小时2次
const intervalMinutes = 60 / adFrequency // 30分钟
```

#### 方案C：后端参数
```typescript
// 从后端获取配置
const config = await fetchAdConfig()
// config.frequency = 2 (每小时2次)
// config.ratio = 0.7 (70%空投带广告)
```

---

## 💡 优势分析

### ✅ 用户体验
- **不打断**：广告与内容同时呈现，不占用额外空间
- **不干扰**：用户主要关注左侧空投信息
- **可选择**：可以选择性查看广告，不强制

### ✅ 商业价值
- **高曝光**：每条空投消息都可能带广告
- **精准触达**：用户在查看空投时自然看到广告
- **转化率高**：广告与用户兴趣相关

### ✅ 技术实现
- **简单集成**：广告是消息的一部分，不需要额外定时器
- **灵活控制**：后端可以精确控制哪条消息带广告
- **性能优化**：减少独立广告消息，减少DOM渲染

---

## 🚀 实现清单

### ✅ 已完成
- [x] 左右布局设计
- [x] 3张图片网格展示
- [x] 文案显示（50字限制）
- [x] 点击跳转功能
- [x] 悬停效果
- [x] 广告标签
- [x] 随机显示逻辑（70%概率）
- [x] 欢迎消息带广告

### 📋 后端需要提供

#### API接口：
```typescript
// 获取空投+广告
GET /api/airdrops/latest
Response: {
  "airdrop": { ... },
  "advertisement": { ... } or null
}

// 记录广告点击
POST /api/advertisements/{id}/click
Body: {
  "user_id": "xxx",
  "message_id": "xxx"
}
```

#### 数据库表：
```sql
-- 广告表
CREATE TABLE advertisements (
  id UUID PRIMARY KEY,
  image_url_1 TEXT NOT NULL,
  image_url_2 TEXT NOT NULL,
  image_url_3 TEXT NOT NULL,
  text VARCHAR(50) NOT NULL,
  link TEXT NOT NULL,
  frequency INT DEFAULT 2,      -- 每小时推送几次
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 广告展示记录
CREATE TABLE ad_impressions (
  id UUID PRIMARY KEY,
  ad_id UUID REFERENCES advertisements(id),
  message_id UUID,
  user_id UUID,
  shown_at TIMESTAMP DEFAULT NOW()
);

-- 广告点击记录
CREATE TABLE ad_clicks (
  id UUID PRIMARY KEY,
  ad_id UUID REFERENCES advertisements(id),
  message_id UUID,
  user_id UUID,
  clicked_at TIMESTAMP DEFAULT NOW()
);
```

---

## 📊 数据统计

### 关键指标：
1. **展示次数**（Impressions）- 广告被看到的次数
2. **点击次数**（Clicks）- 广告被点击的次数
3. **CTR点击率**（Click-Through Rate）= 点击次数 / 展示次数
4. **转化率**（Conversion Rate）- 点击后完成目标的比例

### 统计查询：
```sql
-- 广告效果统计
SELECT 
  a.id,
  a.text,
  COUNT(DISTINCT i.id) as impressions,
  COUNT(DISTINCT c.id) as clicks,
  ROUND(COUNT(DISTINCT c.id)::numeric / NULLIF(COUNT(DISTINCT i.id), 0) * 100, 2) as ctr
FROM advertisements a
LEFT JOIN ad_impressions i ON i.ad_id = a.id
LEFT JOIN ad_clicks c ON c.ad_id = a.id
WHERE a.created_at >= NOW() - INTERVAL '7 days'
GROUP BY a.id, a.text
ORDER BY ctr DESC;
```

---

## 🎯 测试场景

### 场景1：有广告的消息
```
1. 进入群聊
2. 1秒后看到欢迎消息
3. 右侧显示"新手福利"广告
4. 点击广告，弹出提示
```

### 场景2：没有广告的消息
```
1. 等待30秒
2. 看到第二条空投消息
3. 可能没有右侧广告（30%概率）
4. 左侧内容占满全宽
```

### 场景3：连续消息
```
1. 多条消息滚动
2. 部分消息带广告，部分不带
3. 广告随机展示不同内容
```

---

## 💰 商业模式

### 定价方案：

#### 1. CPM（按展示）
```
展示1000次 = 10-50元
适合：品牌推广
```

#### 2. CPC（按点击）
```
每次点击 = 0.5-2元
适合：效果广告
```

#### 3. 包量套餐
```
每天保证50次展示 = 500元/月
每天保证100次展示 = 900元/月
```

#### 4. 竞价排序
```
出价高的广告优先展示
最低出价：1元/次展示
```

---

## 🎨 样式优化建议

### 当前样式：
- 宽度：256px
- 图片：3列网格
- 文案：最多3行
- 背景：半透明

### 可选优化：
1. **响应式调整**：手机端广告移到底部
2. **动画效果**：图片淡入，文字滑入
3. **多种样式**：横向、纵向、大图模式
4. **视频广告**：支持短视频展示

---

## ✅ 完成！

**广告系统已优化为右侧布局，现在刷新页面测试！**

### 看到的效果：
- ✅ 左侧：空投信息（主要内容）
- ✅ 右侧：3张图片 + 文案（广告区域）
- ✅ 70%消息带广告，30%不带
- ✅ 点击广告弹出提示

### 下一步：
- [ ] 后端API开发
- [ ] 数据统计功能
- [ ] 点击跳转实现
- [ ] 管理后台创建

---

**需要调整什么（布局、尺寸、文案、概率）告诉我！** 🚀






