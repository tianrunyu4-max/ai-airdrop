// 此文件由 Supabase CLI 自动生成
// 运行: supabase gen types typescript --project-id your-project-id > src/types/supabase.ts

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          username: string
          invite_code: string
          inviter_id: string | null
          referral_position: number
          has_network: boolean
          network_root_id: string | null
          direct_referral_count: number
          total_earnings: number
          u_balance: number
          points_balance: number
          is_agent: boolean
          agent_paid_at: string | null
          qualified_for_dividend: boolean
          language: string
          created_at: string
        }
        Insert: {
          id?: string
          username: string
          invite_code: string
          inviter_id?: string | null
          referral_position?: number
          has_network?: boolean
          network_root_id?: string | null
          direct_referral_count?: number
          total_earnings?: number
          u_balance?: number
          points_balance?: number
          is_agent?: boolean
          agent_paid_at?: string | null
          qualified_for_dividend?: boolean
          language?: string
          created_at?: string
        }
        Update: {
          id?: string
          username?: string
          invite_code?: string
          inviter_id?: string | null
          referral_position?: number
          has_network?: boolean
          network_root_id?: string | null
          direct_referral_count?: number
          total_earnings?: number
          u_balance?: number
          points_balance?: number
          is_agent?: boolean
          agent_paid_at?: string | null
          qualified_for_dividend?: boolean
          language?: string
          created_at?: string
        }
      }
      // 其他表类型...
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}

