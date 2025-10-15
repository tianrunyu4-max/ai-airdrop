-- ============================================
-- 添加平台联系方式配置
-- ============================================
-- 更新日期：2025-10-13
-- 说明：在system_config表中添加平台官方联系方式配置

-- 插入平台联系方式配置
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

-- 输出确认消息
DO $$
BEGIN
  RAISE NOTICE '✅ 平台联系方式配置已添加到system_config表';
  RAISE NOTICE '📺 B站、YouTube：官方视频频道';
  RAISE NOTICE '📞 微信、Telegram、视频号、TikTok：官方联系方式';
  RAISE NOTICE '💡 可通过管理后台修改这些配置';
END $$;


