# 📋 数据库SQL执行指南 - 一步一步慢慢来

## 🎯 目标

执行2个SQL脚本，启用V4.2参数热更新功能。

**预计时间**：5分钟  
**难度**：⭐ 简单  
**重要性**：🔴 必须执行

---

## 📍 第一步：打开 Supabase Dashboard

### 1.1 访问网址
在浏览器打开：**https://supabase.com/dashboard**

### 1.2 登录账号
使用您的 Supabase 账号登录

### 1.3 选择项目
找到并点击您的项目（AI智能空投对应的项目）

---

## 📍 第二步：进入 SQL Editor

### 2.1 找到左侧菜单
在项目页面左侧，找到菜单栏

### 2.2 点击 SQL Editor
菜单中找到 **"SQL Editor"** 图标（通常是一个代码图标）并点击

### 2.3 新建查询
点击右上角 **"+ New query"** 按钮

---

## 📍 第三步：执行 SQL #1 - 参数同步（必须）

### 3.1 复制以下SQL

```sql
-- ============================================
-- V4.2 参数同步 - 第1条SQL
-- ============================================

UPDATE system_params SET param_value = 10 WHERE param_key = 'pairing_bonus_per_pair';
```

### 3.2 粘贴到 SQL Editor

点击编辑器区域，按 **Ctrl+V** 粘贴

### 3.3 执行SQL

点击右下角 **"Run"** 按钮（或按 Ctrl+Enter）

### 3.4 查看结果

**预期结果**：
```
Success. No rows returned
```
或
```
UPDATE 1
```

✅ 看到以上任一结果即表示成功！

---

## 📍 第四步：执行 SQL #2 - 第2个参数

### 4.1 复制以下SQL

```sql
-- ============================================
-- V4.2 参数同步 - 第2条SQL
-- ============================================

UPDATE system_params SET param_value = 200 WHERE param_key = 'reinvest_threshold';
```

### 4.2 粘贴并执行

同样的方式：
1. 清空编辑器（Ctrl+A，Delete）
2. 粘贴SQL（Ctrl+V）
3. 点击 **Run** 执行

### 4.3 查看结果

**预期结果**：`UPDATE 1` 或 `Success`

✅ 成功！

---

## 📍 第五步：执行 SQL #3 - 第3个参数

### 5.1 复制以下SQL

```sql
-- ============================================
-- V4.2 参数同步 - 第3条SQL
-- ============================================

UPDATE system_params SET param_value = 3 WHERE param_key = 'level_bonus_depth';
```

### 5.2 粘贴并执行

重复相同操作

### 5.3 查看结果

**预期结果**：`UPDATE 1`

✅ 成功！

---

## 📍 第六步：执行 SQL #4 - 第4个参数

### 6.1 复制以下SQL

```sql
-- ============================================
-- V4.2 参数同步 - 第4条SQL
-- ============================================

UPDATE system_params SET param_value = 2 WHERE param_key = 'level_bonus_per_person';
```

### 6.2 粘贴并执行

同样操作

### 6.3 查看结果

**预期结果**：`UPDATE 1`

✅ 完成！4个核心参数已全部更新！

---

## 📍 第七步：验证结果（重要）

### 7.1 复制验证SQL

```sql
-- ============================================
-- 验证参数是否更新成功
-- ============================================

SELECT 
  param_key as "参数名", 
  param_value as "当前值", 
  param_unit as "单位",
  description as "说明"
FROM system_params
WHERE category = 'binary'
ORDER BY param_key;
```

### 7.2 执行验证

粘贴并点击 **Run**

### 7.3 检查结果

**预期看到以下数据**：

| 参数名 | 当前值 | 单位 | 说明 |
|-------|--------|------|------|
| agent_fee | 30 | U | AI代理加入费用 |
| dividend_min_referrals | 10 | 人 | 分红资格的最少直推人数 |
| **level_bonus_depth** | **3** | 代 | 平级奖代数 ✅ |
| **level_bonus_per_person** | **2** | U | 每人平级奖金 ✅ |
| max_free_pairings | 10 | 次 | 未解锁用户最多对碰次数 |
| member_ratio | 85 | % | 会员获得对碰奖的比例 |
| min_direct_referrals | 2 | 人 | 解锁无限对碰的最少直推人数 |
| **pairing_bonus_per_pair** | **10** | U | 每对对碰奖金 ✅ |
| platform_ratio | 15 | % | 平台费用比例 |
| **reinvest_threshold** | **200** | U | 原点复投阈值 ✅ |

### 7.4 确认关键参数

检查以下4个参数是否正确：
- ✅ `pairing_bonus_per_pair` = **10**
- ✅ `reinvest_threshold` = **200**
- ✅ `level_bonus_depth` = **3**
- ✅ `level_bonus_per_person` = **2**

**全部正确？** 🎉 恭喜！SQL #1 完成！

---

## 📍 第八步：执行 SQL #2 - 平台联系方式（可选）

### 8.1 这个SQL是可选的

**作用**：配置平台官方联系方式（B站、YouTube、Telegram等）

**是否必须**：❌ 可选，但建议执行

### 8.2 复制以下完整SQL

```sql
-- ============================================
-- 平台联系方式配置
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
```

### 8.3 粘贴并执行

清空编辑器 → 粘贴 → 点击 **Run**

### 8.4 查看结果

**预期结果**：
```
Success. No rows returned
```
或
```
INSERT 0 1
```

✅ 成功！

### 8.5 验证联系方式配置

```sql
-- 查看刚才插入的联系方式
SELECT key, value, description
FROM system_config
WHERE key = 'platform_contacts';
```

**预期结果**：看到一条记录，包含B站、YouTube等信息

✅ 完成！

---

## 📍 第九步：最终验证（检查一切正常）

### 9.1 检查参数总数

```sql
-- 查看所有Binary参数
SELECT COUNT(*) as "参数总数"
FROM system_params
WHERE category = 'binary';
```

**预期结果**：应该有 **10** 个参数左右

### 9.2 检查配置总数

```sql
-- 查看系统配置
SELECT COUNT(*) as "配置总数"
FROM system_config;
```

**预期结果**：应该有 **13-14** 条配置（包括刚添加的 platform_contacts）

---

## ✅ 完成确认清单

请勾选以下项目：

### SQL #1 - 参数同步（必须）
- [ ] 执行了 UPDATE pairing_bonus_per_pair = 10
- [ ] 执行了 UPDATE reinvest_threshold = 200
- [ ] 执行了 UPDATE level_bonus_depth = 3
- [ ] 执行了 UPDATE level_bonus_per_person = 2
- [ ] 验证查询显示4个参数值正确

### SQL #2 - 联系方式（可选）
- [ ] 执行了 INSERT platform_contacts
- [ ] 验证查询显示联系方式已添加

---

## 🎉 全部完成！

### 接下来会发生什么？

1. **立即生效**：数据库参数已更新
2. **1分钟后**：V4.2参数热更新系统开始工作
3. **所有用户**：享受新的参数配置
   - 对碰奖：10U × 85% = 8.5U
   - 复投提示：每200U（而非300U）
   - 平级奖：追溯3代（而非8代）

### 下一步建议

1. **测试参数热更新**（可选）：
   - 登录管理后台
   - 进入"系统参数配置"
   - 修改一个参数（如对碰奖改为11）
   - 等待1分钟
   - 触发对碰验证

2. **填写真实联系方式**（可选）：
   - 打开 https://eth10.netlify.app
   - 登录管理后台
   - 进入"系统参数配置"
   - 滑到底部"平台联系方式配置"
   - 填写真实的B站、YouTube等信息
   - 保存

---

## 🆘 遇到问题？

### 问题1：找不到 system_params 表

**错误信息**：`relation "system_params" does not exist`

**解决方法**：
1. 先执行 `supabase/migration_create_system_params.sql`
2. 然后再执行本SQL

### 问题2：UPDATE 返回 0

**错误信息**：`UPDATE 0`

**原因**：param_key 不存在或拼写错误

**解决方法**：
1. 检查 param_key 拼写
2. 执行查询：`SELECT * FROM system_params WHERE category = 'binary';`
3. 确认参数是否存在

### 问题3：权限错误

**错误信息**：`permission denied`

**原因**：当前用户没有更新权限

**解决方法**：
1. 确认使用的是项目Owner账号
2. 检查RLS策略设置

### 问题4：JSON语法错误

**错误信息**：`invalid input syntax for type json`

**原因**：platform_contacts的JSON格式有问题

**解决方法**：
1. 检查JSON中的引号是否正确
2. 确保没有多余的逗号
3. 复制我提供的完整SQL重新执行

---

## 📞 需要帮助？

如果遇到任何问题，请：

1. **截图错误信息**
2. **告诉我哪一步出错**
3. **我会帮您解决**

---

**创建时间**：2025-10-14  
**适用版本**：V4.2  
**执行时间**：约5分钟  
**难度**：⭐ 简单

🎊 **慢慢来，一步一步，您一定能成功！**


