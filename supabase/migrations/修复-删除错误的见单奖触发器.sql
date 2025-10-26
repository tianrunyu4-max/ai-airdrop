-- ==========================================
-- 🔧 修复：删除错误的见单奖触发器
-- ==========================================
-- 问题：之前错误地创建了一个触发器，在升级AI代理时发放5U
-- 正确逻辑：升级AI代理不发U，只建立直推关系
-- 见单奖应该在下线对碰成功时通过BinaryService.triggerOrderBonus()发放
-- ==========================================

-- 1️⃣ 删除错误的触发器
DROP TRIGGER IF EXISTS trigger_referral_bonus ON referral_relationships;

-- 2️⃣ 删除错误的触发器函数
DROP FUNCTION IF EXISTS reward_referrer_on_new_agent();

-- ==========================================
-- ✅ 完成提示
-- ==========================================

DO $$
BEGIN
  RAISE NOTICE '============================================';
  RAISE NOTICE '✅ 错误触发器已删除';
  RAISE NOTICE '============================================';
  RAISE NOTICE '已删除：';
  RAISE NOTICE '  - trigger_referral_bonus（触发器）';
  RAISE NOTICE '  - reward_referrer_on_new_agent()（函数）';
  RAISE NOTICE '============================================';
  RAISE NOTICE '保留正确的内容：';
  RAISE NOTICE '  - referral_relationships 表（直推关系表）';
  RAISE NOTICE '  - add_user_balance 等RPC函数';
  RAISE NOTICE '============================================';
END $$;

