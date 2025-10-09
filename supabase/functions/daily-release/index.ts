/**
 * AI学习机每日释放 - Edge Function
 * 
 * 功能：
 * - 每天00:00自动执行
 * - 计算10%释放
 * - 分配70%U + 30%积分
 * - 检查2倍出局
 * 
 * Cron: 0 0 * * * (每天00:00)
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

interface MiningMachine {
  id: string
  user_id: string
  initial_points: number
  total_points: number
  released_points: number
  base_rate: number
  is_active: boolean
}

Deno.serve(async (req) => {
  try {
    // 创建 Supabase 客户端
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    console.log('开始执行每日释放任务...')

    // 查询所有活跃的学习机
    const { data: machines, error: queryError } = await supabase
      .from('mining_machines')
      .select('*')
      .eq('is_active', true)

    if (queryError) {
      console.error('查询学习机失败:', queryError)
      return new Response(
        JSON.stringify({ success: false, error: queryError.message }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }

    if (!machines || machines.length === 0) {
      console.log('没有活跃的学习机')
      return new Response(
        JSON.stringify({ success: true, message: '没有活跃的学习机', processed: 0 }),
        { headers: { 'Content-Type': 'application/json' } }
      )
    }

    console.log(`找到 ${machines.length} 台活跃学习机`)

    let successCount = 0
    let failCount = 0
    let exitCount = 0

    // 处理每台学习机
    for (const machine of machines as MiningMachine[]) {
      try {
        // 计算每日释放量（10%/天）
        const dailyRelease = machine.initial_points * (machine.base_rate || 0.10)
        
        console.log(`处理学习机 ${machine.id}: 释放 ${dailyRelease} 积分`)

        // 检查是否会超过总量（2倍出局）
        const newReleased = machine.released_points + dailyRelease
        
        if (newReleased >= machine.total_points) {
          // 已达到2倍出局条件
          const finalRelease = machine.total_points - machine.released_points
          
          // 更新为出局状态
          await supabase
            .from('mining_machines')
            .update({ 
              is_active: false,
              released_points: machine.total_points
            })
            .eq('id', machine.id)
          
          // 分配最后的释放量
          if (finalRelease > 0) {
            const toU = finalRelease * 0.70
            const toPoints = finalRelease * 0.30
            const uAmount = toU * 0.07 // 1积分=0.07U

            // 增加U余额
            await supabase.rpc('add_user_balance', {
              p_user_id: machine.user_id,
              p_amount: uAmount
            })

            // 增加积分余额
            await supabase.rpc('add_user_points', {
              p_user_id: machine.user_id,
              p_amount: toPoints
            })
          }
          
          exitCount++
          console.log(`学习机 ${machine.id} 已出局`)
          continue
        }

        // 更新释放积分
        await supabase
          .from('mining_machines')
          .update({ released_points: newReleased })
          .eq('id', machine.id)

        // 分配到用户余额（70%U + 30%积分）
        const toU = dailyRelease * 0.70 // 70%转U
        const toPoints = dailyRelease * 0.30 // 30%转积分

        // 增加U余额（1积分=0.07U）
        const uAmount = toU * 0.07
        await supabase.rpc('add_user_balance', {
          p_user_id: machine.user_id,
          p_amount: uAmount
        })

        // 增加积分余额
        await supabase.rpc('add_user_points', {
          p_user_id: machine.user_id,
          p_amount: toPoints
        })

        // 记录每日释放记录（可选）
        await supabase
          .from('daily_releases')
          .insert({
            machine_id: machine.id,
            user_id: machine.user_id,
            released_points: dailyRelease,
            to_u: uAmount,
            to_points: toPoints
          })

        successCount++
        console.log(`学习机 ${machine.id} 释放成功`)
      } catch (error) {
        failCount++
        console.error(`处理学习机 ${machine.id} 失败:`, error)
      }
    }

    const result = {
      success: true,
      timestamp: new Date().toISOString(),
      total: machines.length,
      success: successCount,
      failed: failCount,
      exited: exitCount,
      message: `成功处理 ${successCount}/${machines.length} 台学习机，${exitCount} 台已出局`
    }

    console.log('每日释放任务完成:', result)

    return new Response(
      JSON.stringify(result),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('每日释放任务异常:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : '未知错误' 
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})

