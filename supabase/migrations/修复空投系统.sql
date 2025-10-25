-- ==========================================
-- 修复空投系统并添加示例数据
-- ==========================================

-- 1. 修复airdrops表 - 添加type字段
ALTER TABLE public.airdrops 
ADD COLUMN IF NOT EXISTS type VARCHAR(50) DEFAULT 'airdrop';

-- 2. 添加其他可能缺失的字段
ALTER TABLE public.airdrops 
ADD COLUMN IF NOT EXISTS category VARCHAR(50) DEFAULT 'DeFi';

ALTER TABLE public.airdrops 
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active';

ALTER TABLE public.airdrops 
ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;

-- 3. 更新已有记录的type字段
UPDATE public.airdrops
SET type = 'airdrop'
WHERE type IS NULL;

-- 4. 清空现有数据，重新插入示例空投项目
TRUNCATE TABLE public.airdrops CASCADE;

-- 5. 插入3个示例空投项目
INSERT INTO public.airdrops (
  title,
  description,
  reward_amount,
  image_url,
  project_url,
  requirements,
  category,
  type,
  status,
  sort_order,
  start_time,
  end_time,
  total_participants,
  max_participants
) VALUES 
(
  'Uniswap V4 测试网空投',
  '🔥 Uniswap V4 测试网上线！参与早期测试，获得空投资格！\n\n✅ 任务简单：\n1. 连接钱包\n2. 在测试网交换代币\n3. 提供流动性\n\n💰 预计奖励：200-500 UNI',
  350,
  'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=400',
  'https://uniswap.org',
  jsonb_build_array(
    '连接MetaMask钱包',
    '在Uniswap V4测试网交换代币',
    '至少提供50U流动性',
    '持有3天以上'
  ),
  'DeFi',
  'airdrop',
  'active',
  1,
  NOW(),
  NOW() + INTERVAL '30 days',
  0,
  10000
),
(
  'zkSync Era 交互空投',
  '🚀 zkSync Era 主网已上线！Layer2新星，V神力推项目！\n\n✅ 空投任务：\n1. 跨链转账（ETH主网→zkSync）\n2. 在zkSync上交易\n3. 使用至少3个DApp\n\n💰 预计奖励：500-1000 ZK代币',
  750,
  'https://images.unsplash.com/photo-1622630998477-20aa696ecb05?w=400',
  'https://zksync.io',
  jsonb_build_array(
    '从以太坊主网跨链至少0.01 ETH',
    '在zkSync Era上完成5笔交易',
    '使用Mute、SpaceFi等DApp',
    '保持钱包活跃度'
  ),
  'Layer2',
  'airdrop',
  'active',
  2,
  NOW(),
  NOW() + INTERVAL '60 days',
  0,
  50000
),
(
  'Starknet 交互挖矿',
  '⭐ Starknet 生态空投！Cairo语言先驱，潜力无限！\n\n✅ 参与方式：\n1. 创建Starknet钱包\n2. 跨链资产到Starknet\n3. 参与生态DApp交互\n\n💰 预计奖励：800-1500 STRK',
  1000,
  'https://images.unsplash.com/photo-1634704784915-aacf363b021f?w=400',
  'https://starknet.io',
  jsonb_build_array(
    '创建Argent X或Braavos钱包',
    '跨链至少50U资产',
    '在Starknet上完成10笔交易',
    '使用JediSwap、mySwap等协议'
  ),
  'Layer2',
  'airdrop',
  'active',
  3,
  NOW(),
  NOW() + INTERVAL '90 days',
  0,
  100000
);

-- 6. 创建索引（提高查询性能）
CREATE INDEX IF NOT EXISTS idx_airdrops_type ON public.airdrops(type);
CREATE INDEX IF NOT EXISTS idx_airdrops_status ON public.airdrops(status);
CREATE INDEX IF NOT EXISTS idx_airdrops_sort_order ON public.airdrops(sort_order);

-- 7. 验证数据
SELECT 
  id,
  title,
  type,
  status,
  reward_amount,
  sort_order
FROM public.airdrops
ORDER BY sort_order;

-- ==========================================
-- 执行完成后应该看到3个空投项目：
-- 1. Uniswap V4 测试网空投
-- 2. zkSync Era 交互空投
-- 3. Starknet 交互挖矿
-- ==========================================

