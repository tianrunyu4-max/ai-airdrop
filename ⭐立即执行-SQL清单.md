# ⭐ 立即执行 - SQL清单

## 🚀 V4.2已部署成功！

**生产网址**：https://eth10.netlify.app  
**部署时间**：2025-10-14

---

## 🔴 必须执行的SQL（重要）

### 步骤1：打开 Supabase Dashboard
访问：https://supabase.com/dashboard

### 步骤2：进入 SQL Editor
点击左侧菜单 → SQL Editor

### 步骤3：复制并执行以下SQL

```sql
-- ============================================
-- V4.2 参数同步SQL（必须执行）
-- ============================================

-- 更新对碰奖：7U → 10U
UPDATE system_params 
SET param_value = 10 
WHERE param_key = 'pairing_bonus_per_pair';

-- 更新复投阈值：300U → 200U
UPDATE system_params 
SET param_value = 200 
WHERE param_key = 'reinvest_threshold';

-- 更新平级奖层级：8代 → 3代
UPDATE system_params 
SET param_value = 3 
WHERE param_key = 'level_bonus_depth';

-- 确认平级奖金额：2U
UPDATE system_params 
SET param_value = 2 
WHERE param_key = 'level_bonus_per_person';

-- 验证结果
SELECT 
  param_key as 参数键, 
  param_value as 参数值, 
  param_unit as 单位,
  description as 说明
FROM system_params
WHERE category = 'binary'
ORDER BY param_key;
```

### 步骤4：验证结果

执行后应该看到以下结果：

| 参数键 | 参数值 | 单位 | 说明 |
|-------|--------|------|------|
| agent_fee | 30 | U | AI代理加入费用 |
| dividend_min_referrals | 10 | 人 | 分红资格的最少直推人数 |
| level_bonus_depth | **3** | 代 | 平级奖代数 ✅ |
| level_bonus_per_person | **2** | U | 每人平级奖金 ✅ |
| max_free_pairings | 10 | 次 | 未解锁用户最多对碰次数 |
| member_ratio | 85 | % | 会员获得对碰奖的比例 |
| min_direct_referrals | 2 | 人 | 解锁无限对碰的最少直推人数 |
| pairing_bonus_per_pair | **10** | U | 每对对碰奖金 ✅ |
| platform_ratio | 15 | % | 平台费用比例 |
| reinvest_threshold | **200** | U | 原点复投阈值 ✅ |

**✅ 确认以上4个参数已更新为加粗值**

---

## 🟡 可选执行的SQL（联系方式）

### 步骤1：在 SQL Editor 执行

```sql
-- ============================================
-- 平台联系方式配置（可选）
-- ============================================

INSERT INTO system_config (key, value, description) VALUES
(
  'platform_contacts',
  '{
    "bilibili": "https://space.bilibili.com/你的B站ID",
    "youtube": "https://youtube.com/@你的频道",
    "telegram": "https://t.me/你的群组",
    "wechat": "AI_TECH_2025",
    "shipin": "搜索\"AI科技创新\"",
    "tiktok": "@aitech_official"
  }'::jsonb,
  '平台官方联系方式'
)
ON CONFLICT (key) DO UPDATE
SET value = EXCLUDED.value,
    updated_at = NOW();

-- 验证
SELECT key, value, description
FROM system_config
WHERE key = 'platform_contacts';
```

### 步骤2：在管理后台填写真实联系方式

1. 打开 https://eth10.netlify.app
2. 登录管理后台
3. 进入"系统参数配置"
4. 滑到底部"📞 平台联系方式配置"
5. 填写真实的B站、YouTube、Telegram等信息
6. 点击"💾 保存联系方式"

---

## ✅ 验证清单

### 1. 验证参数已同步
```sql
-- 在 SQL Editor 执行
SELECT param_key, param_value 
FROM system_params 
WHERE param_key IN (
  'pairing_bonus_per_pair',
  'reinvest_threshold', 
  'level_bonus_depth',
  'level_bonus_per_person'
);
```

**预期结果**：
- pairing_bonus_per_pair: **10**
- reinvest_threshold: **200**
- level_bonus_depth: **3**
- level_bonus_per_person: **2**

### 2. 验证前端部署
1. 打开 https://eth10.netlify.app
2. 强制刷新（Ctrl+F5）
3. 检查页面正常加载

### 3. 验证管理后台
1. 登录管理后台
2. 进入"系统参数配置"
3. 确认看到黄色警告提示：
   > ⚠️ 参数修改功能说明  
   > 当前参数修改**仅保存到数据库**，实际业务逻辑暂未动态读取。

4. **等等！这个提示已经过时了！**
   - V4.2 现在**已经支持动态读取**
   - 管理后台修改参数**会在1分钟内生效**
   - 这个警告提示需要更新 ⚠️

---

## 🔧 需要修复的遗漏

我发现了一个问题：管理后台的警告提示已经过时，需要更新为：

```
✅ 参数热更新已启用（V4.2）
当前参数修改会保存到数据库，并在1分钟内自动生效。
💡 修改后等待60秒，新参数即可生效，无需重启服务。
```

**是否需要我立即修复这个提示？**

---

## 📊 执行完成后的效果

### 对碰奖
- 旧值：7U × 85% = 5.95U
- **新值：10U × 85% = 8.5U** ⬆️ +42%

### 平级奖
- 旧值：追溯8代，每人2U
- **新值：追溯3代，每人2U** ⬇️ 减少层级

### 复投
- 旧值：每300U复投一次
- **新值：每200U复投一次** ⬇️ 更频繁

---

## 🎯 下一步

### 立即执行（必须）
1. ✅ 执行SQL 1（参数同步）
2. ⏳ 验证参数值
3. ⏳ 测试前端功能

### 稍后执行（可选）
1. ⏳ 执行SQL 2（联系方式）
2. ⏳ 填写真实联系方式
3. ⏳ 更新管理后台提示

### 持续测试
1. ⏳ 修改一个参数测试热更新
2. ⏳ 等待1分钟
3. ⏳ 触发对碰验证新参数
4. ⏳ 检查奖励金额

---

## 📞 遇到问题？

### 问题1：SQL执行报错
**可能原因**：system_params表不存在  
**解决方法**：先执行 `supabase/migration_create_system_params.sql`

### 问题2：参数没有变化
**可能原因**：WHERE条件不匹配  
**解决方法**：检查 param_key 拼写是否正确

### 问题3：前端不显示新值
**可能原因**：缓存未清除  
**解决方法**：强制刷新（Ctrl+F5）

---

## ✅ 完成确认

执行完SQL后，请确认：

- [ ] SQL 1 执行成功，无报错
- [ ] 验证查询显示正确的参数值
- [ ] 前端可以正常访问
- [ ] （可选）SQL 2 执行成功
- [ ] （可选）管理后台联系方式已填写

---

**状态**：⏳ 等待执行SQL  
**时间**：预计2分钟  
**难度**：⭐ 简单  

🚀 **执行SQL后，V4.2参数热更新功能即可完全启用！**


