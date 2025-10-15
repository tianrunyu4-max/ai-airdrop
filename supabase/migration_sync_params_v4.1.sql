-- ============================================
-- 同步系统参数到V4.1配置
-- ============================================
-- 更新日期：2025-10-14
-- 说明：将 system_params 表的参数值同步到代码中的最新配置

-- 更新Binary系统参数
UPDATE system_params SET param_value = 10 WHERE param_key = 'pairing_bonus_per_pair';
-- 对碰奖从7U提升到10U

UPDATE system_params SET param_value = 200 WHERE param_key = 'reinvest_threshold';
-- 复投阈值从300U降低到200U

UPDATE system_params SET param_value = 3 WHERE param_key = 'level_bonus_depth';
-- 平级奖层级从8代减少到3代

UPDATE system_params SET param_value = 2 WHERE param_key = 'level_bonus_per_person';
-- 平级奖金额确认为2U

-- 输出确认消息
DO $$
BEGIN
  RAISE NOTICE '✅ 系统参数已同步到V4.1配置';
  RAISE NOTICE '📊 对碰奖：7U → 10U';
  RAISE NOTICE '💰 复投阈值：300U → 200U';
  RAISE NOTICE '👥 平级奖层级：8代 → 3代';
  RAISE NOTICE '⚠️ 重要：这些参数目前是硬编码在代码中的';
  RAISE NOTICE '💡 建议：让BinaryService从数据库读取参数实现热更新';
END $$;

-- 查看更新后的Binary参数
SELECT 
  param_key as 参数,
  param_value as 当前值,
  param_unit as 单位,
  description as 说明
FROM system_params
WHERE category = 'binary'
ORDER BY id;

