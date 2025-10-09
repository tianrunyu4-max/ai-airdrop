-- 为现有数据库添加管理员字段（如果已经运行过初始schema.sql）

-- 添加is_admin字段（如果不存在）
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'is_admin'
  ) THEN
    ALTER TABLE users ADD COLUMN is_admin BOOLEAN DEFAULT FALSE;
  END IF;
END $$;

-- 创建第一个管理员账户的函数
CREATE OR REPLACE FUNCTION create_admin_user(
  p_username TEXT,
  p_password TEXT
)
RETURNS UUID AS $$
DECLARE
  v_user_id UUID;
  v_invite_code TEXT;
BEGIN
  -- 生成邀请码
  v_invite_code := 'ADMIN' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
  
  -- 创建用户（注意：实际生产环境应该通过Supabase Auth API创建）
  INSERT INTO users (
    username,
    invite_code,
    is_admin,
    is_agent
  ) VALUES (
    p_username,
    v_invite_code,
    TRUE,
    TRUE
  ) RETURNING id INTO v_user_id;
  
  RETURN v_user_id;
END;
$$ LANGUAGE plpgsql;

-- 使用示例（可选，创建后可以删除）
-- SELECT create_admin_user('admin', 'your_secure_password');

-- 管理员权限相关的RLS策略

-- 管理员可以查看所有用户
CREATE POLICY admin_view_all_users ON users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.is_admin = TRUE
    )
  );

-- 管理员可以查看所有提现
CREATE POLICY admin_view_all_withdrawals ON withdrawals
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.is_admin = TRUE
    )
  );

-- 管理员可以更新提现状态
CREATE POLICY admin_update_withdrawals ON withdrawals
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.is_admin = TRUE
    )
  );

-- 管理员可以查看所有交易
CREATE POLICY admin_view_all_transactions ON transactions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.is_admin = TRUE
    )
  );

-- 管理员可以修改系统配置
CREATE POLICY admin_manage_system_config ON system_config
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.is_admin = TRUE
    )
  );

-- 添加管理员操作日志表
CREATE TABLE IF NOT EXISTS admin_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id UUID REFERENCES users(id),
  action VARCHAR(50) NOT NULL,
  target_type VARCHAR(50),
  target_id UUID,
  details JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_admin_logs_admin ON admin_logs(admin_id);
CREATE INDEX idx_admin_logs_created ON admin_logs(created_at DESC);

-- 记录管理员操作的触发器函数
CREATE OR REPLACE FUNCTION log_admin_action()
RETURNS TRIGGER AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid() AND is_admin = TRUE
  ) THEN
    INSERT INTO admin_logs (admin_id, action, target_type, target_id, details)
    VALUES (
      auth.uid(),
      TG_OP,
      TG_TABLE_NAME,
      COALESCE(NEW.id, OLD.id),
      jsonb_build_object(
        'old', row_to_json(OLD),
        'new', row_to_json(NEW)
      )
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON TABLE admin_logs IS '管理员操作日志';
COMMENT ON COLUMN users.is_admin IS '是否为管理员';






