-- ==========================================
-- 🚀 终极修复：一次性解决所有问题
-- ==========================================
-- 执行位置：Supabase SQL Editor
-- 执行时间：1分钟
-- ==========================================

-- ==========================================
-- 第一步：创建/修复所有表
-- ==========================================

-- 1. 确保chat_groups表存在且有正确字段
CREATE TABLE IF NOT EXISTS chat_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100),
  description TEXT NOT NULL,
  type VARCHAR(50) DEFAULT 'default',
  icon VARCHAR(10) DEFAULT '💬',
  member_count INTEGER DEFAULT 0,
  max_members INTEGER DEFAULT 100000,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  bot_enabled BOOLEAN DEFAULT false,
  bot_config JSONB,
  category_id UUID,
  group_number INTEGER,
  owner_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 添加缺失的字段（如果不存在）
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'chat_groups' AND column_name = 'name') THEN
    ALTER TABLE chat_groups ADD COLUMN name VARCHAR(100);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'chat_groups' AND column_name = 'sort_order') THEN
    ALTER TABLE chat_groups ADD COLUMN sort_order INTEGER DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'chat_groups' AND column_name = 'bot_enabled') THEN
    ALTER TABLE chat_groups ADD COLUMN bot_enabled BOOLEAN DEFAULT false;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'chat_groups' AND column_name = 'group_number') THEN
    ALTER TABLE chat_groups ADD COLUMN group_number INTEGER;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_chat_groups_type ON chat_groups(type);
CREATE INDEX IF NOT EXISTS idx_chat_groups_active ON chat_groups(is_active);
CREATE INDEX IF NOT EXISTS idx_chat_groups_sort ON chat_groups(sort_order);

-- 2. 确保messages表有正确字段
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'messages' AND column_name = 'is_bot') THEN
    ALTER TABLE messages ADD COLUMN is_bot BOOLEAN DEFAULT false;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'messages' AND column_name = 'airdrop_data') THEN
    ALTER TABLE messages ADD COLUMN airdrop_data JSONB;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'messages' AND column_name = 'money_data') THEN
    ALTER TABLE messages ADD COLUMN money_data JSONB;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'messages' AND column_name = 'image_url') THEN
    ALTER TABLE messages ADD COLUMN image_url TEXT;
  END IF;
END $$;

-- 3. 确保airdrops表有status字段
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'airdrops' AND column_name = 'status') THEN
    ALTER TABLE airdrops ADD COLUMN status VARCHAR(20) DEFAULT 'active';
  END IF;
END $$;

-- ==========================================
-- 第二步：删除旧的群组数据，创建新的
-- ==========================================

-- 删除所有旧群组（重新开始）
DELETE FROM chat_groups;

-- 创建默认聊天群（type='default'）- 用户登录后直接进这个群
INSERT INTO chat_groups (
  name,
  description,
  type,
  icon,
  member_count,
  max_members,
  is_active,
  sort_order,
  bot_enabled,
  group_number
) VALUES (
  'AI 自动赚钱系统',
  'AI 自动赚钱系统',
  'default',
  '💰',
  60,
  50000,
  true,
  1,
  true,
  1
);

-- 创建空投群（type='ai_push'）- 可选
INSERT INTO chat_groups (
  name,
  description,
  type,
  icon,
  member_count,
  max_members,
  is_active,
  sort_order,
  bot_enabled,
  group_number
) VALUES (
  'AI 科技空投',
  'AI 科技空投',
  'ai_push',
  '🚀',
  128,
  100000,
  true,
  2,
  true,
  1
);

-- ==========================================
-- 第三步：配置RLS策略
-- ==========================================

ALTER TABLE chat_groups ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "所有人可查看活跃群组" ON chat_groups;
CREATE POLICY "所有人可查看活跃群组" ON chat_groups
  FOR SELECT
  USING (is_active = true);

DROP POLICY IF EXISTS "管理员可管理群组" ON chat_groups;
CREATE POLICY "管理员可管理群组" ON chat_groups
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- ==========================================
-- 第四步：创建客服机器人问答（如果不存在）
-- ==========================================

CREATE TABLE IF NOT EXISTS customer_service_qa (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  keywords TEXT[] DEFAULT '{}',
  category VARCHAR(50),
  priority INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  trigger_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 只在表为空时插入默认问答
DO $$
BEGIN
  IF (SELECT COUNT(*) FROM customer_service_qa) = 0 THEN
    INSERT INTO customer_service_qa (question, answer, keywords, category, priority) VALUES
    ('如何充值', 
     '💰 充值流程：\n\n1️⃣ 进入"个人中心"\n2️⃣ 点击"充值"按钮\n3️⃣ 选择网络（TRC20/ERC20）\n4️⃣ 输入充值金额\n5️⃣ 复制充值地址转账\n6️⃣ 填写交易哈希提交\n\n⏰ 管理员审核后自动到账',
     ARRAY['充值', '怎么充值', '如何充值', '充值流程'],
     '充值',
     10),
    
    ('如何提现',
     '💳 提现流程：\n\n1️⃣ 进入"个人中心"\n2️⃣ 点击"提现"按钮\n3️⃣ 输入提现金额\n4️⃣ 输入USDT地址\n5️⃣ 选择网络（TRC20/ERC20）\n6️⃣ 提交申请\n\n⏰ 管理员审核后24小时内到账',
     ARRAY['提现', '怎么提现', '如何提现', '取款'],
     '提现',
     10),
    
    ('AI学习机是什么',
     '🤖 AI学习机说明：\n\n💎 投资AI学习机，每日释放10%本金\n📊 持续释放10天，本金归零\n💰 总收益 = 本金 × 100%\n\n例如：\n- 投资 100 USDT\n- 每天释放 10 USDT\n- 10天后总收益 100 USDT\n\n✅ 零风险，稳定收益！',
     ARRAY['学习机', 'AI学习机', '什么是学习机'],
     '收益',
     10),
    
    ('联系客服',
     '📞 联系客服：\n\n💬 在线客服：工作时间 9:00-21:00\n📱 客服微信：[请联系管理员]\n\n⚡ 急需帮助请直接微信联系！',
     ARRAY['客服', '联系客服', '人工客服'],
     '客服',
     10),
    
    ('其他问题',
     '❓ 您好，我是AI智能客服！\n\n我可以帮您解答：\n• 充值提现流程\n• AI学习机说明\n• 对碰系统介绍\n\n💬 请直接输入您的问题，例如：\n"如何充值"、"提现多久到账"\n\n如需人工服务，请输入"联系客服"',
     ARRAY['你好', '在吗', 'hi', 'hello'],
     '默认',
     1);
  END IF;
END $$;

-- 创建智能匹配函数
CREATE OR REPLACE FUNCTION match_customer_question(user_message TEXT)
RETURNS TABLE(
  id UUID,
  question TEXT,
  answer TEXT,
  category VARCHAR(50),
  priority INTEGER,
  trigger_count INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    qa.id,
    qa.question,
    qa.answer,
    qa.category,
    qa.priority,
    qa.trigger_count
  FROM customer_service_qa qa
  WHERE qa.is_active = true
    AND (
      EXISTS (
        SELECT 1 FROM unnest(qa.keywords) AS keyword
        WHERE user_message ILIKE '%' || keyword || '%'
      )
      OR user_message ILIKE '%' || qa.question || '%'
    )
  ORDER BY qa.priority DESC, qa.id
  LIMIT 1;
  
  IF NOT FOUND THEN
    RETURN QUERY
    SELECT 
      qa.id,
      qa.question,
      qa.answer,
      qa.category,
      qa.priority,
      qa.trigger_count
    FROM customer_service_qa qa
    WHERE qa.category = '默认'
      AND qa.is_active = true
    LIMIT 1;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- ==========================================
-- 第五步：验证
-- ==========================================

-- 验证群组
SELECT 
  id,
  description as "群名",
  type as "类型",
  icon,
  sort_order as "排序",
  is_active as "启用"
FROM chat_groups
ORDER BY sort_order;

-- 应该看到2个群组：
-- 1. AI 自动赚钱系统 (type=default, 排序=1)
-- 2. AI 科技空投 (type=ai_push, 排序=2)

-- 验证客服问答
SELECT 
  question as "问题",
  category as "分类",
  array_to_string(keywords, ', ') as "关键词"
FROM customer_service_qa
WHERE is_active = true
ORDER BY category, priority DESC;

-- ==========================================
-- ✅ 执行完成！
-- ==========================================

/*
现在的配置：

1. 用户登录/注册后
   → 自动进入"AI 自动赚钱系统"群（type='default'）
   → 智能客服自动回答问题
   
2. 如果切换到"AI 科技空投"群
   → 只有机器人推送空投
   → 用户不可聊天

前端代码会：
- 查找 type='default' 的群 ✅
- 如果没找到，自动创建 ✅
- 设置为当前群组 ✅
- 不会再跳转 ✅
*/

