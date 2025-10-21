-- ==========================================
-- 🤖 创建智能客服机器人配置
-- ==========================================

-- 1. 创建客服问答配置表
CREATE TABLE IF NOT EXISTS customer_service_qa (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question TEXT NOT NULL,              -- 问题关键词
  answer TEXT NOT NULL,                -- 回答内容
  keywords TEXT[] DEFAULT '{}',        -- 触发关键词数组
  category VARCHAR(50),                -- 分类（账户/充值/提现/收益等）
  priority INTEGER DEFAULT 0,          -- 优先级（数字越大越优先）
  is_active BOOLEAN DEFAULT true,      -- 是否启用
  trigger_count INTEGER DEFAULT 0,     -- 触发次数统计
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 2. 创建索引
CREATE INDEX IF NOT EXISTS idx_cs_qa_keywords ON customer_service_qa USING GIN(keywords);
CREATE INDEX IF NOT EXISTS idx_cs_qa_active ON customer_service_qa(is_active);
CREATE INDEX IF NOT EXISTS idx_cs_qa_category ON customer_service_qa(category);

-- 3. 插入默认客服问答数据
INSERT INTO customer_service_qa (question, answer, keywords, category, priority) VALUES

-- 账户相关
('如何注册账号', 
'👋 注册非常简单！

1️⃣ 点击"注册"按钮
2️⃣ 输入手机号
3️⃣ 设置密码
4️⃣ 输入邀请码（必填）

✅ 注册成功后即可登录使用！',
ARRAY['注册', '账号', '怎么注册', '如何注册'],
'账户',
10),

('忘记密码怎么办',
'🔐 忘记密码解决方法：

1️⃣ 联系客服重置密码
2️⃣ 提供注册手机号
3️⃣ 验证身份后即可重置

📞 客服微信：[请联系管理员]',
ARRAY['忘记密码', '密码', '重置密码', '找回密码'],
'账户',
10),

-- 充值相关
('如何充值',
'💰 充值流程：

1️⃣ 进入"个人中心"
2️⃣ 点击"充值"按钮
3️⃣ 选择网络（TRC20/ERC20）
4️⃣ 输入充值金额
5️⃣ 复制充值地址转账
6️⃣ 填写交易哈希提交

⏰ 管理员审核后自动到账',
ARRAY['充值', '怎么充值', '如何充值', '充值流程', '怎么转账'],
'充值',
10),

('充值多久到账',
'⏰ 充值到账时间：

✅ 提交申请后，管理员会在 1-24小时内审核
✅ 审核通过后立即到账
✅ 如超过24小时未到账，请联系客服

📞 加急处理请联系客服',
ARRAY['到账', '充值到账', '多久到账', '什么时候到账'],
'充值',
9),

('充值最低金额',
'💵 充值限额：

最低充值：10 USDT
无最高限额

💡 建议首次充值10-100 USDT测试',
ARRAY['最低', '最低充值', '最少充值', '充值限额'],
'充值',
8),

-- 提现相关
('如何提现',
'💳 提现流程：

1️⃣ 进入"个人中心"
2️⃣ 点击"提现"按钮
3️⃣ 输入提现金额
4️⃣ 输入USDT地址
5️⃣ 选择网络（TRC20/ERC20）
6️⃣ 提交申请

⏰ 管理员审核后24小时内到账',
ARRAY['提现', '怎么提现', '如何提现', '提现流程', '取款'],
'提现',
10),

('提现手续费',
'💸 提现费用说明：

手续费：5%
最低提现：10 USDT

例如：
- 提现 100 USDT，手续费 5 USDT，到账 95 USDT
- 提现 1000 USDT，手续费 50 USDT，到账 950 USDT',
ARRAY['手续费', '提现手续费', '费用', '扣多少'],
'提现',
9),

('提现多久到账',
'⏰ 提现到账时间：

✅ 提交申请后，管理员会在 1-24小时内审核
✅ 审核通过后立即转账
✅ 区块链确认约需 5-30 分钟

📞 如超过24小时未到账，请联系客服',
ARRAY['提现到账', '提现时间', '多久到账'],
'提现',
8),

-- 收益相关
('AI学习机是什么',
'🤖 AI学习机说明：

💎 投资AI学习机，每日释放10%本金
📊 持续释放10天，本金归零
💰 总收益 = 本金 × 100%

例如：
- 投资 100 USDT
- 每天释放 10 USDT
- 10天后总收益 100 USDT

✅ 零风险，稳定收益！',
ARRAY['学习机', 'AI学习机', '什么是学习机', '学习卡'],
'收益',
10),

('对碰系统是什么',
'🎯 Binary对碰系统：

💎 对碰奖：8U/对（会员得6.8U，85%到账）
🎁 见单奖：5层×1U/对

📊 如何对碰：
- 你的左区和右区各有1台学习机
- 系统自动对碰
- 自动发放奖励

✅ 裂变式增长，收益倍增！',
ARRAY['对碰', '对碰系统', 'Binary', 'binary', '什么是对碰'],
'收益',
10),

('如何成为代理',
'👑 成为Binary代理：

📋 要求：
1️⃣ 购买1台AI学习机（100U起）
2️⃣ 自动成为代理
3️⃣ 开始推广赚钱

💰 代理收益：
- 对碰奖：8U/对
- 见单奖：5层×1U/对
- 团队分红

✅ 立即购买学习机，开启财富之路！',
ARRAY['代理', '成为代理', '如何成为代理', '怎么成为代理'],
'代理',
10),

-- 邀请码相关
('邀请码在哪里',
'🔗 获取邀请码：

1️⃣ 进入"个人中心"
2️⃣ 找到"我的邀请码"
3️⃣ 点击复制

💡 分享给朋友，他们注册时填写
✅ 他们购买学习机，你获得奖励！',
ARRAY['邀请码', '我的邀请码', '邀请码在哪'],
'邀请',
10),

-- 联系客服
('联系客服',
'📞 联系客服：

💬 在线客服：工作时间 9:00-21:00
📱 客服微信：[请联系管理员]
📧 客服邮箱：support@example.com

⚡ 急需帮助请直接微信联系！',
ARRAY['客服', '联系客服', '人工客服', '在线客服', '帮助'],
'客服',
10),

-- 默认回复（当没有匹配到问题时）
('其他问题',
'❓ 您好，我是AI智能客服！

我可以帮您解答：
• 注册登录问题
• 充值提现流程
• AI学习机说明
• 对碰系统介绍
• 代理相关问题

💬 请直接输入您的问题，例如：
"如何充值"、"提现多久到账"

如需人工服务，请输入"联系客服"',
ARRAY['你好', '在吗', '您好', 'hi', 'hello'],
'默认',
1);

-- 4. 启用RLS
ALTER TABLE customer_service_qa ENABLE ROW LEVEL SECURITY;

-- 5. 所有人可查看
CREATE POLICY "所有人可查看客服问答" ON customer_service_qa
  FOR SELECT
  USING (is_active = true);

-- 6. 只有管理员可以编辑
CREATE POLICY "管理员可编辑客服问答" ON customer_service_qa
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- 7. 创建智能匹配函数
CREATE OR REPLACE FUNCTION match_customer_question(user_message TEXT)
RETURNS TABLE(
  id UUID,
  question TEXT,
  answer TEXT,
  category VARCHAR(50),
  priority INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    qa.id,
    qa.question,
    qa.answer,
    qa.category,
    qa.priority
  FROM customer_service_qa qa
  WHERE qa.is_active = true
    AND (
      -- 关键词匹配
      EXISTS (
        SELECT 1 FROM unnest(qa.keywords) AS keyword
        WHERE user_message ILIKE '%' || keyword || '%'
      )
      -- 或者问题匹配
      OR user_message ILIKE '%' || qa.question || '%'
    )
  ORDER BY qa.priority DESC, qa.id
  LIMIT 1;
  
  -- 如果没有匹配，返回默认回复
  IF NOT FOUND THEN
    RETURN QUERY
    SELECT 
      qa.id,
      qa.question,
      qa.answer,
      qa.category,
      qa.priority
    FROM customer_service_qa qa
    WHERE qa.category = '默认'
      AND qa.is_active = true
    LIMIT 1;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- ==========================================
-- ✅ 执行完成！
-- ==========================================

/*
测试查询：

-- 测试匹配"充值"问题
SELECT * FROM match_customer_question('我要充值');

-- 测试匹配"提现"问题  
SELECT * FROM match_customer_question('怎么提现');

-- 查看所有问答
SELECT question, category, array_to_string(keywords, ', ') as keywords
FROM customer_service_qa
WHERE is_active = true
ORDER BY category, priority DESC;
*/

