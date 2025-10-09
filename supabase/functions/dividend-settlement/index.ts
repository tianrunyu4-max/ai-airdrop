/**
 * 分红自动结算 - Edge Function
 * 
 * 功能：
 * - 每周一、三、五、日 00:00执行
 * - 分配分红池15%
 * - 发放给直推≥10人的用户
 * - 记录分红历史
 * 
 * Cron: 0 0 * * 1,3,5,0 (周一、三、五、日 00:00)
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

Deno.serve(async (req) => {
  try {
    // 创建 Supabase 客户端
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    console.log('开始执行分红结算任务...')

    // 获取分红池余额
    const { data: pool, error: poolError } = await supabase
      .from('dividend_pool')
      .select('*')
      .single()

    if (poolError) {
      console.error('查询分红池失败:', poolError)
      return new Response(
        JSON.stringify({ success: false, error: poolError.message }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }

    if (!pool || pool.balance <= 0) {
      console.log('分红池余额不足')
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: '分红池余额不足', 
          balance: pool?.balance || 0 
        }),
        { headers: { 'Content-Type': 'application/json' } }
      )
    }

    console.log(`分红池余额: ${pool.balance}`)

    // 查询符合条件的用户（直推≥10人）
    const { data: eligibleUsers, error: usersError } = await supabase
      .from('users')
      .select('id, username, direct_referral_count')
      .gte('direct_referral_count', 10)

    if (usersError) {
      console.error('查询符合条件用户失败:', usersError)
      return new Response(
        JSON.stringify({ success: false, error: usersError.message }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }

    if (!eligibleUsers || eligibleUsers.length === 0) {
      console.log('没有符合条件的用户（直推≥10人）')
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: '没有符合条件的用户',
          eligible_count: 0
        }),
        { headers: { 'Content-Type': 'application/json' } }
      )
    }

    console.log(`找到 ${eligibleUsers.length} 个符合条件的用户`)

    // 计算分红金额
    const distributionRatio = 0.15 // 15%
    const totalAmount = pool.balance * distributionRatio
    const perUserAmount = totalAmount / eligibleUsers.length
    const newPoolBalance = pool.balance - totalAmount

    console.log(`总分红: ${totalAmount}, 每人: ${perUserAmount}`)

    let successCount = 0
    let failCount = 0

    // 批量发放分红
    for (const user of eligibleUsers) {
      try {
        // 增加用户余额
        await supabase.rpc('add_user_balance', {
          p_user_id: user.id,
          p_amount: perUserAmount
        })

        // 记录分红历史
        await supabase
          .from('dividend_records')
          .insert({
            user_id: user.id,
            amount: perUserAmount,
            pool_balance_before: pool.balance,
            pool_balance_after: newPoolBalance,
            eligible_count: eligibleUsers.length
          })

        successCount++
        console.log(`用户 ${user.username} 分红成功: ${perUserAmount}U`)
      } catch (error) {
        failCount++
        console.error(`用户 ${user.id} 分红失败:`, error)
      }
    }

    // 更新分红池
    const { error: updateError } = await supabase
      .from('dividend_pool')
      .update({
        balance: newPoolBalance,
        total_distributed: (pool.total_distributed || 0) + totalAmount,
        last_distribution_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', pool.id)

    if (updateError) {
      console.error('更新分红池失败:', updateError)
      return new Response(
        JSON.stringify({ success: false, error: updateError.message }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const result = {
      success: true,
      timestamp: new Date().toISOString(),
      pool_balance_before: pool.balance,
      pool_balance_after: newPoolBalance,
      total_distributed: totalAmount,
      recipients: eligibleUsers.length,
      success: successCount,
      failed: failCount,
      per_user_amount: perUserAmount,
      message: `成功分红给 ${successCount}/${eligibleUsers.length} 个用户`
    }

    console.log('分红结算任务完成:', result)

    return new Response(
      JSON.stringify(result),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('分红结算任务异常:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : '未知错误' 
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})

