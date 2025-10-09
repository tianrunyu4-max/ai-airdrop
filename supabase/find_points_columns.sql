-- 查找 users 表中所有包含 balance, points, transferable 的列
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'users'
  AND (
    column_name LIKE '%balance%' 
    OR column_name LIKE '%point%'
    OR column_name LIKE '%transfer%'
  )
ORDER BY column_name;

