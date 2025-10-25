-- ==========================================
-- 插入真实热门空投数据（2024年最新）
-- ==========================================

-- 清空旧数据
TRUNCATE TABLE public.airdrops CASCADE;

-- 插入5个真实热门空投项目

-- 1. LayerZero - 全链互操作协议
INSERT INTO public.airdrops (
  title, description, reward_amount, image_url, project_url,
  requirements, category, type, status, sort_order,
  start_time, end_time, total_participants, max_participants
) VALUES (
  'LayerZero 主网交互空投',
  '🔥 LayerZero - 全链互操作协议，顶级VC投资！

✅ 空投策略：
1. 使用LayerZero桥接资产（Stargate）
2. 跨链至少5笔交易
3. 桥接总金额 > 1000U
4. 使用不同链（ETH/Arbitrum/Optimism/Polygon）

💰 预计奖励：1000-5000 ZRO代币
⏰ 快照时间：未公布，持续交互
🌟 投资方：a16z、红杉资本、Binance Labs',
  2500,
  'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=400&q=80',
  'https://layerzero.network',
  '["使用Stargate桥接资产","跨链交易至少5笔","桥接总金额超过1000U","使用3条以上不同链"]'::jsonb,
  'Infrastructure',
  'airdrop',
  'active',
  1,
  NOW(),
  NOW() + INTERVAL '60 days',
  0,
  100000
);

-- 2. Scroll - zkEVM Layer2
INSERT INTO public.airdrops (
  title, description, reward_amount, image_url, project_url,
  requirements, category, type, status, sort_order,
  start_time, end_time, total_participants, max_participants
) VALUES (
  'Scroll - zkEVM Layer2 空投',
  '🚀 Scroll - 以太坊原生zkEVM，技术领先！

✅ 空投任务：
1. 从以太坊主网跨链到Scroll
2. 在Scroll上进行DEX交易
3. 部署合约或使用NFT
4. 保持长期活跃度

💰 预计奖励：800-2000 SCR代币
⏰ 主网已上线，抓紧交互
🌟 投资方：Polychain、Bain Capital Crypto',
  1200,
  'https://images.unsplash.com/photo-1622630998477-20aa696ecb05?w=400&q=80',
  'https://scroll.io',
  '["跨链至少0.01 ETH到Scroll","完成10笔以上交易","使用Scroll生态DApp","持有资产30天以上"]'::jsonb,
  'Layer2',
  'airdrop',
  'active',
  2,
  NOW(),
  NOW() + INTERVAL '90 days',
  0,
  50000
);

-- 3. Linea - ConsenSys zkEVM
INSERT INTO public.airdrops (
  title, description, reward_amount, image_url, project_url,
  requirements, category, type, status, sort_order,
  start_time, end_time, total_participants, max_participants
) VALUES (
  'Linea - ConsenSys推出的zkEVM',
  '⭐ Linea - MetaMask背后的ConsenSys出品！

✅ 参与方式：
1. 连接MetaMask钱包
2. 跨链ETH到Linea主网
3. 使用Linea生态应用
4. 参与Linea Voyage活动

💰 预计奖励：500-1500代币
⏰ 官方确认将有代币空投
🌟 背景：ConsenSys（MetaMask母公司）',
  900,
  'https://images.unsplash.com/photo-1634704784915-aacf363b021f?w=400&q=80',
  'https://linea.build',
  '["使用MetaMask跨链","完成Linea Voyage任务","在Linea上交易","使用多个生态DApp"]'::jsonb,
  'Layer2',
  'airdrop',
  'active',
  3,
  NOW(),
  NOW() + INTERVAL '45 days',
  0,
  80000
);

-- 4. Blast - ETH原生收益Layer2
INSERT INTO public.airdrops (
  title, description, reward_amount, image_url, project_url,
  requirements, category, type, status, sort_order,
  start_time, end_time, total_participants, max_participants
) VALUES (
  'Blast - ETH原生收益Layer2',
  '💥 Blast - 自动产生收益的Layer2！

✅ 空投策略：
1. 邀请码注册（可在Discord获取）
2. 存入ETH或稳定币
3. 自动获得4%收益
4. 邀请朋友获得更多积分

💰 预计奖励：根据存款量和积分
⏰ 主网即将上线
🌟 创始人：Blur创始人Pacman',
  1500,
  'https://images.unsplash.com/photo-1640826514546-7d2d924c6b0c?w=400&q=80',
  'https://blast.io',
  '["通过邀请码注册","存入资产到Blast","邀请朋友参与","积累积分"]'::jsonb,
  'Layer2',
  'airdrop',
  'active',
  4,
  NOW(),
  NOW() + INTERVAL '30 days',
  0,
  150000
);

-- 5. Manta Pacific - 模块化Layer2
INSERT INTO public.airdrops (
  title, description, reward_amount, image_url, project_url,
  requirements, category, type, status, sort_order,
  start_time, end_time, total_participants, max_participants
) VALUES (
  'Manta Pacific - 模块化Layer2',
  '🌊 Manta Pacific - Celestia DA支持的Layer2！

✅ 参与方式：
1. 跨链ETH到Manta Pacific
2. 参与生态DeFi协议
3. 提供流动性
4. 持续交互保持活跃

💰 预计奖励：300-800 MANTA
⏰ New Paradigm活动进行中
🌟 已发行代币，生态激励持续',
  550,
  'https://images.unsplash.com/photo-1621416894569-0f39ed31d247?w=400&q=80',
  'https://pacific.manta.network',
  '["跨链资产到Manta Pacific","使用Manta生态DApp","完成至少5笔交易","参与流动性挖矿"]'::jsonb,
  'Layer2',
  'airdrop',
  'active',
  5,
  NOW(),
  NOW() + INTERVAL '60 days',
  0,
  30000
);

-- 验证数据
SELECT 
  id,
  title,
  reward_amount,
  category,
  status,
  total_participants,
  max_participants
FROM public.airdrops
ORDER BY sort_order;

-- ==========================================
-- 执行完成后应该看到5个真实空投项目
-- ==========================================

