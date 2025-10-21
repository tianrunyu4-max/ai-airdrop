-- ==========================================
-- 🚀 快速添加测试空投数据
-- ==========================================
-- 
-- 用途：在爬虫运行前，手动添加一些测试数据
-- 执行位置：Supabase SQL Editor
-- 执行时间：1分钟
--
-- ==========================================

-- 1️⃣ Web3空投（90%）
INSERT INTO airdrops (
  title, 
  platform, 
  project_name,
  type, 
  category,
  ai_score, 
  reward_min, 
  reward_max, 
  difficulty, 
  status,
  description,
  steps,
  url
) VALUES

-- LayerZero
('LayerZero 全链空投', 'Layer3', 'LayerZero', 'web3', 'DeFi', 9.8, 1000, 10000, 'medium', 'active',
'LayerZero是全链互操作性协议，已获A16z等顶级VC投资，尚未发币，空投预期极高',
ARRAY['使用Stargate Finance跨链', '在10+条链上进行交互', '使用LayerZero协议的DApp', '持续活跃6个月'],
'https://layerzero.network'),

-- zkSync Era
('zkSync Era 交互空投', 'Galxe', 'zkSync', 'web3', 'Layer2', 9.5, 500, 5000, 'medium', 'active',
'zkSync Era是以太坊Layer2解决方案，Matter Labs开发，主网已上线，积分系统活跃',
ARRAY['跨链ETH到zkSync Era', '使用SyncSwap进行交易', '提供流动性', '参与DeFi协议（Mute.io等）', '持续交互3-6个月'],
'https://era.zksync.io'),

-- Base链
('Coinbase Base链 生态空投', 'DeFiLlama', 'Base', 'web3', 'Layer2', 9.2, 300, 3000, 'easy', 'active',
'Base是Coinbase官方推出的以太坊Layer2，背靠Coinbase交易所，生态快速发展',
ARRAY['跨链到Base链', '使用BaseSwap或Aerodrome DEX', 'Mint Base链上的NFT', '参与DeFi协议', '持续活跃'],
'https://base.org'),

-- Scroll
('Scroll zkEVM 空投', 'Layer3', 'Scroll', 'web3', 'Layer2', 9.3, 500, 4000, 'medium', 'active',
'Scroll是以太坊原生zkEVM Layer2，主网已上线，有Canvas积分系统',
ARRAY['跨链到Scroll主网', '使用Ambient或Zebra DEX', '部署智能合约（可选）', '使用DApp 20次以上', '参与Canvas任务'],
'https://scroll.io'),

-- Linea
('Linea zkEVM 空投', 'Galxe', 'Linea', 'web3', 'Layer2', 9.0, 400, 3500, 'medium', 'active',
'Linea是ConsenSys开发的zkEVM Layer2，背靠MetaMask，有Voyage任务系统',
ARRAY['跨链ETH到Linea', '使用LineaSwap或Velocore', '参与借贷协议（Mendi Finance）', '完成Linea Voyage任务', '持续交互'],
'https://linea.build'),

-- Starknet
('Starknet 第2轮空投', 'Layer3', 'Starknet', 'web3', 'Layer2', 8.8, 300, 2500, 'medium', 'active',
'Starknet已完成第1轮空投，第2轮预期中，继续使用可获得更多奖励',
ARRAY['使用Argent X或Braavos钱包', '使用JediSwap、mySwap交易', '参与DeFi协议（Nostra、zkLend）', '持续交互'],
'https://starknet.io'),

-- Blast
('Blast L2 高收益空投', 'DeFiLlama', 'Blast', 'web3', 'Layer2', 9.1, 500, 5000, 'easy', 'active',
'Blast是原生收益Layer2，主网已上线，质押ETH/USDB可自动获得4%收益+积分',
ARRAY['注册Blast账户（需邀请码）', '存入ETH或稳定币', '自动获得原生收益', '参与Blast生态DApp', '邀请朋友获得加成'],
'https://blast.io'),

-- Zora
('Zora Network NFT空投', 'Galxe', 'Zora', 'web3', 'NFT', 8.5, 200, 2000, 'easy', 'active',
'Zora是专注NFT的以太坊Layer2，免Gas费Mint，是NFT创作者和收藏家的首选',
ARRAY['访问Zora.co', 'Mint免费NFT（每天都有新的）', '创建自己的NFT作品（可选）', '交易NFT', '跨链互动'],
'https://zora.energy'),

-- Manta Pacific
('Manta Pacific 模块化空投', 'Layer3', 'Manta Pacific', 'web3', 'Layer2', 8.7, 300, 2500, 'medium', 'active',
'Manta Pacific是模块化Layer2，主网已上线，有New Paradigm积分活动',
ARRAY['跨链到Manta Pacific', '使用ApertureSwap交易', '质押MANTA代币', '完成New Paradigm任务', '参与DeFi生态'],
'https://pacific.manta.network');

-- 2️⃣ 交易所空投（10%）
INSERT INTO airdrops (
  title, 
  platform, 
  project_name,
  type, 
  category,
  ai_score, 
  reward_min, 
  reward_max, 
  difficulty, 
  status,
  description,
  url
) VALUES

-- 币安Launchpool
('币安 Launchpool 挖矿', 'Binance', 'Binance', 'cex', 'Exchange', 8.2, 50, 200, 'easy', 'active',
'币安Launchpool是币安推出的新币挖矿活动，质押BNB或FDUSD即可获得新代币奖励',
'https://www.binance.com/zh-CN/support/announcement/launchpool');

-- ==========================================
-- ✅ 执行完成！
-- ==========================================

-- 验证数据
SELECT 
  title,
  platform,
  type,
  ai_score,
  CONCAT(reward_min, '-', reward_max, ' USDT') as reward,
  difficulty,
  status
FROM airdrops
ORDER BY ai_score DESC;

-- 查看统计
SELECT 
  type,
  COUNT(*) as count,
  AVG(ai_score) as avg_score,
  SUM(reward_max) as total_max_reward
FROM airdrops
GROUP BY type;

