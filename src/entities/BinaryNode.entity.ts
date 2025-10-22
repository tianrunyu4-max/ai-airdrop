/**
 * BinaryNode Entity - 双区节点实体
 */

export interface BinaryNode {
  id: string
  user_id: string
  parent_id: string | null
  side: 'A' | 'B' | null          // 位于父节点的哪一侧
  level: number                    // 层级（从1开始）
  position: string                 // 位置编码，如 "1-A-L-R"
  
  // 子节点
  a_child_id: string | null
  b_child_id: string | null
  
  // 时间戳
  created_at: string
  updated_at: string
}

// 节点创建参数
export interface BinaryNodeCreateParams {
  user_id: string
  parent_id: string | null
  side: 'A' | 'B' | null
  level: number
  position?: string
}

// 位置信息
export interface Placement {
  parent_id: string
  side: 'A' | 'B'
  level: number
  position: string
}

// 团队统计
export interface TeamStats {
  a_side_count: number      // A区人数
  b_side_count: number      // B区人数
  a_side_sales: number      // A区销售额
  b_side_sales: number      // B区销售额
  total_members: number     // 总人数
  max_depth: number         // 最大深度
}

// 团队树节点（用于前端展示）
export interface TeamTreeNode {
  id: string
  user_id: string
  username: string
  level: number
  side: 'A' | 'B' | null
  sales: number
  direct_referrals: number
  children: TeamTreeNode[]
}




































