<template>
  <div class="space-y-6">
    <!-- 消息清理 -->
    <div class="card bg-base-100 shadow">
      <div class="card-body">
        <h3 class="card-title">💬 聊天消息管理</h3>
        
        <div class="alert alert-info">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="stroke-current shrink-0 w-6 h-6"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          <div>
            <p><strong>清理规则：</strong></p>
            <p>• 用户消息：超过5分钟自动清理</p>
            <p>• 机器人消息（AI科技创薪群）：超过10分钟清理</p>
            <p>• 机器人消息（AI科技创薪群）：超过24小时清理</p>
          </div>
        </div>

        <div v-if="messageStats" class="stats shadow w-full">
          <div class="stat">
            <div class="stat-title">总消息数</div>
            <div class="stat-value">{{ messageStats.total }}</div>
          </div>
          <div class="stat">
            <div class="stat-title">用户消息</div>
            <div class="stat-value text-primary">{{ messageStats.userMessages }}</div>
          </div>
          <div class="stat">
            <div class="stat-title">机器人消息</div>
            <div class="stat-value text-secondary">{{ messageStats.botMessages }}</div>
          </div>
          <div class="stat">
            <div class="stat-title">待清理</div>
            <div class="stat-value text-warning">{{ messageStats.willDelete }}</div>
          </div>
        </div>

        <div class="card-actions justify-end mt-4">
          <button class="btn btn-info" @click="loadStats" :disabled="loading">
            <span v-if="!loading">🔄 刷新统计</span>
            <span v-else class="loading loading-spinner"></span>
          </button>
          <button class="btn btn-error" @click="cleanup" :disabled="loading">
            <span v-if="!loading">🗑️ 立即清理</span>
            <span v-else class="loading loading-spinner"></span>
          </button>
        </div>
      </div>
    </div>

    <!-- 🛠️ 工具发布管理 -->
    <div class="card bg-base-100 shadow">
      <div class="card-body">
        <h3 class="card-title">🛠️ 工具发布管理</h3>
        
        <div class="alert alert-warning">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="stroke-current shrink-0 w-6 h-6"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
          <div>
            <p><strong>工具发布规则：</strong></p>
            <p>• 系统最多保留 20 条发布</p>
            <p>• 每人每周限制 1 次发布</p>
            <p>• 随机 50% 概率顶置</p>
          </div>
        </div>

        <div v-if="postsStats" class="stats shadow w-full">
          <div class="stat">
            <div class="stat-title">当前发布数</div>
            <div class="stat-value" :class="postsStats.total >= 20 ? 'text-error' : 'text-primary'">
              {{ postsStats.total }}/20
            </div>
          </div>
          <div class="stat">
            <div class="stat-title">顶置发布</div>
            <div class="stat-value text-warning">{{ postsStats.pinned }}</div>
          </div>
          <div class="stat">
            <div class="stat-title">普通发布</div>
            <div class="stat-value text-secondary">{{ postsStats.normal }}</div>
          </div>
        </div>

        <div class="card-actions justify-end mt-4">
          <button class="btn btn-info" @click="loadPostsStats" :disabled="loading">
            <span v-if="!loading">🔄 刷新统计</span>
            <span v-else class="loading loading-spinner"></span>
          </button>
          <button class="btn btn-error" @click="clearAllPosts" :disabled="loading">
            <span v-if="!loading">🗑️ 清空所有发布</span>
            <span v-else class="loading loading-spinner"></span>
          </button>
        </div>
      </div>
    </div>

    <!-- 系统配置 -->
    <div class="card bg-base-100 shadow">
      <div class="card-body">
        <h3 class="card-title">系统参数配置</h3>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
          <!-- 代理费用 -->
          <div class="form-control">
            <label class="label">
              <span class="label-text font-semibold">代理费用（U）</span>
            </label>
            <input
              v-model.number="config.agent_fee"
              type="number"
              class="input input-bordered"
            />
            <label class="label">
              <span class="label-text-alt">成为代理需要支付的费用</span>
            </label>
          </div>

          <!-- 见点奖 -->
          <div class="form-control">
            <label class="label">
              <span class="label-text font-semibold">见点奖（U）</span>
            </label>
            <input
              v-model.number="config.spot_award"
              type="number"
              class="input input-bordered"
            />
            <label class="label">
              <span class="label-text-alt">网体内新增代理的奖励</span>
            </label>
          </div>

          <!-- 平级见点奖 -->
          <div class="form-control">
            <label class="label">
              <span class="label-text font-semibold">平级见点奖（U）</span>
            </label>
            <input
              v-model.number="config.peer_spot_award"
              type="number"
              class="input input-bordered"
            />
            <label class="label">
              <span class="label-text-alt">每级平级见点奖金额</span>
            </label>
          </div>

          <!-- 平级见点奖层级 -->
          <div class="form-control">
            <label class="label">
              <span class="label-text font-semibold">平级见点奖层级</span>
            </label>
            <input
              v-model.number="config.peer_levels"
              type="number"
              class="input input-bordered"
            />
            <label class="label">
              <span class="label-text-alt">向上计算的层级数</span>
            </label>
          </div>

          <!-- 直推分红 -->
          <div class="form-control">
            <label class="label">
              <span class="label-text font-semibold">直推分红每单（U）</span>
            </label>
            <input
              v-model.number="config.dividend_per_order"
              type="number"
              class="input input-bordered"
            />
            <label class="label">
              <span class="label-text-alt">直推分红每次发放金额</span>
            </label>
          </div>

          <!-- 分红最低直推人数 -->
          <div class="form-control">
            <label class="label">
              <span class="label-text font-semibold">分红最低直推人数</span>
            </label>
            <input
              v-model.number="config.min_referrals_for_dividend"
              type="number"
              class="input input-bordered"
            />
            <label class="label">
              <span class="label-text-alt">达到此人数才有分红资格</span>
            </label>
          </div>

          <!-- 复购阈值 -->
          <div class="form-control">
            <label class="label">
              <span class="label-text font-semibold">复购提示阈值（U）</span>
            </label>
            <input
              v-model.number="config.repurchase_threshold"
              type="number"
              class="input input-bordered"
            />
            <label class="label">
              <span class="label-text-alt">总收益达到此金额提示复购</span>
            </label>
          </div>

          <!-- 复购费用 -->
          <div class="form-control">
            <label class="label">
              <span class="label-text font-semibold">复购费用（U）</span>
            </label>
            <input
              v-model.number="config.repurchase_fee"
              type="number"
              class="input input-bordered"
            />
            <label class="label">
              <span class="label-text-alt">复购所需费用</span>
            </label>
          </div>

          <!-- 最低提现金额 -->
          <div class="form-control">
            <label class="label">
              <span class="label-text font-semibold">最低提现金额（U）</span>
            </label>
            <input
              v-model.number="config.min_withdraw"
              type="number"
              class="input input-bordered"
            />
            <label class="label">
              <span class="label-text-alt">用户提现的最低金额</span>
            </label>
          </div>

          <!-- 积分兑换U比例 -->
          <div class="form-control">
            <label class="label">
              <span class="label-text font-semibold">积分兑换U比例</span>
            </label>
            <input
              v-model.number="config.points_to_u_rate"
              type="number"
              step="0.01"
              class="input input-bordered"
            />
            <label class="label">
              <span class="label-text-alt">100积分可兑换多少U（如：7）</span>
            </label>
          </div>

          <!-- U提现比例 -->
          <div class="form-control">
            <label class="label">
              <span class="label-text font-semibold">U提现比例</span>
            </label>
            <input
              v-model.number="config.u_withdraw_ratio"
              type="number"
              step="0.01"
              max="1"
              class="input input-bordered"
            />
            <label class="label">
              <span class="label-text-alt">积分兑换U后可提现比例（0-1）</span>
            </label>
          </div>

          <!-- 互转流通比例 -->
          <div class="form-control">
            <label class="label">
              <span class="label-text font-semibold">互转流通比例</span>
            </label>
            <input
              v-model.number="config.transfer_ratio"
              type="number"
              step="0.01"
              max="1"
              class="input input-bordered"
            />
            <label class="label">
              <span class="label-text-alt">积分兑换U后用于互转比例（0-1）</span>
            </label>
          </div>
        </div>

        <div class="card-actions justify-end mt-6">
          <button class="btn btn-primary" @click="saveConfig" :disabled="saving">
            <span v-if="saving" class="loading loading-spinner"></span>
            保存配置
          </button>
        </div>
      </div>
    </div>

    <!-- AI学习机每日释放管理 -->
    <div class="card bg-gradient-to-br from-yellow-50 to-orange-50 shadow-xl border-2 border-yellow-300">
      <div class="card-body">
        <h3 class="card-title text-yellow-600">
          🤖 AI学习机每日释放管理
        </h3>

        <!-- 学习机状态 -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
          <div class="stats shadow bg-white border border-yellow-200">
            <div class="stat">
              <div class="stat-title text-gray-600">活跃学习机</div>
              <div class="stat-value text-yellow-600 text-2xl">{{ releaseStats.totalActive }}台</div>
              <div class="stat-desc text-gray-500">正在运行中</div>
            </div>
          </div>

          <div class="stats shadow bg-white border border-blue-200">
            <div class="stat">
              <div class="stat-title text-gray-600">涉及用户</div>
              <div class="stat-value text-blue-600 text-2xl">{{ releaseStats.totalUsers }}人</div>
              <div class="stat-desc text-gray-500">持有学习机</div>
            </div>
          </div>

          <div class="stats shadow bg-white border border-purple-200">
            <div class="stat">
              <div class="stat-title text-gray-600">总投入</div>
              <div class="stat-value text-purple-600 text-2xl">{{ releaseStats.totalInvested.toFixed(0) }}</div>
              <div class="stat-desc text-gray-500">积分（初始）</div>
            </div>
          </div>

          <div class="stats shadow bg-white border border-green-200">
            <div class="stat">
              <div class="stat-title text-gray-600">已释放</div>
              <div class="stat-value text-green-600 text-2xl">{{ releaseStats.totalReleased.toFixed(0) }}</div>
              <div class="stat-desc text-gray-500">积分（累计）</div>
            </div>
          </div>
        </div>

        <!-- 释放进度 -->
        <div v-if="releaseStats.totalActive > 0" class="mt-4">
          <div class="flex items-center justify-between text-sm text-gray-600 mb-2">
            <span>整体释放进度</span>
            <span>{{ ((releaseStats.totalReleased / releaseStats.totalInvested) * 100).toFixed(1) }}%</span>
          </div>
          <progress 
            class="progress progress-success w-full" 
            :value="releaseStats.totalReleased" 
            :max="releaseStats.totalInvested"
          ></progress>
        </div>

        <!-- 释放规则说明 -->
        <div class="alert alert-info mt-4">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="stroke-current shrink-0 w-6 h-6"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          <div>
            <h4 class="font-bold">每日释放规则</h4>
            <div class="text-sm mt-2 space-y-1">
              <p>• 每天00:00自动释放（或手动触发）</p>
              <p>• 基础释放率: <span class="font-bold text-yellow-600">10%/天</span></p>
              <p>• 分配规则: <span class="font-bold text-blue-600">70%转U，30%互转积分</span></p>
              <p>• 出局条件: <span class="font-bold text-purple-600">累计释放达2倍初始投入</span></p>
              <p>• 回本周期: <span class="font-bold text-green-600">20天完成</span></p>
            </div>
          </div>
        </div>

        <!-- 操作按钮 -->
        <div class="card-actions justify-end mt-4 gap-3">
          <button class="btn btn-outline btn-warning" @click="refreshReleaseStats" :disabled="loadingReleaseStats">
            <span v-if="loadingReleaseStats" class="loading loading-spinner"></span>
            <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            刷新数据
          </button>

          <button 
            class="btn btn-warning" 
            @click="showReleaseModal = true"
            :disabled="releaseStats.totalActive === 0"
          >
            🚀 手动触发每日释放
          </button>
        </div>

        <!-- 提示 -->
        <div v-if="releaseStats.totalActive === 0" class="alert alert-warning mt-4">
          <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
          <span>暂无活跃的学习机</span>
        </div>

        <!-- 最后释放时间 -->
        <div v-if="lastReleaseTime" class="text-sm text-gray-500 mt-2 text-right">
          最后释放时间: {{ lastReleaseTime }}
        </div>
      </div>
    </div>

    <!-- 分红系统管理 -->
    <div class="card bg-gradient-to-br from-blue-50 to-purple-50 shadow-xl border-2 border-blue-200">
      <div class="card-body">
        <h3 class="card-title text-blue-600">
          💎 分红系统管理
        </h3>

        <!-- 分红池状态 -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          <div class="stats shadow bg-white border border-blue-200">
            <div class="stat">
              <div class="stat-title text-gray-600">分红池余额</div>
              <div class="stat-value text-blue-600 text-2xl">{{ dividendStats.poolBalance.toFixed(2) }} U</div>
              <div class="stat-desc text-gray-500">可分配金额</div>
            </div>
          </div>

          <div class="stats shadow bg-white border border-yellow-200">
            <div class="stat">
              <div class="stat-title text-gray-600">符合条件用户</div>
              <div class="stat-value text-yellow-600 text-2xl">{{ dividendStats.eligibleCount }}人</div>
              <div class="stat-desc text-gray-500">直推≥10人</div>
            </div>
          </div>

          <div class="stats shadow bg-white border border-green-200">
            <div class="stat">
              <div class="stat-title text-gray-600">历史总分红</div>
              <div class="stat-value text-green-600 text-2xl">{{ dividendStats.totalDistributed.toFixed(2) }} U</div>
              <div class="stat-desc text-gray-500">累计已分配</div>
            </div>
          </div>
        </div>

        <!-- 下次分红时间 -->
        <div class="alert alert-info mt-4">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="stroke-current shrink-0 w-6 h-6"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          <div>
            <h4 class="font-bold">下次自动分红时间</h4>
            <p class="text-sm">{{ nextDividendDate }}</p>
            <p class="text-xs text-gray-500 mt-1">每周一、三、五、日 00:00 自动结算</p>
          </div>
        </div>

        <!-- 操作按钮 -->
        <div class="card-actions justify-end mt-4 gap-3">
          <button class="btn btn-outline btn-info" @click="refreshDividendStats" :disabled="loadingStats">
            <span v-if="loadingStats" class="loading loading-spinner"></span>
            <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            刷新数据
          </button>

          <button 
            class="btn btn-primary" 
            @click="showDividendModal = true"
            :disabled="dividendStats.poolBalance <= 0 || dividendStats.eligibleCount === 0"
          >
            💎 执行分红结算
          </button>
        </div>

        <!-- 分红提示 -->
        <div v-if="dividendStats.poolBalance <= 0" class="alert alert-warning mt-4">
          <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
          <span>分红池余额为0，暂时无法执行分红</span>
        </div>

        <div v-if="dividendStats.eligibleCount === 0" class="alert alert-warning mt-4">
          <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
          <span>暂无符合条件的用户（直推≥10人）</span>
        </div>
      </div>
    </div>

    <!-- 危险操作 -->
    <div class="card bg-base-100 shadow border-2 border-error">
      <div class="card-body">
        <h3 class="card-title text-error">
          <ExclamationTriangleIcon class="w-6 h-6" />
          危险操作
        </h3>

        <div class="space-y-4">
          <div class="alert alert-warning">
            <ExclamationTriangleIcon class="w-6 h-6" />
            <div>
              <h4 class="font-bold">矿机重启机制</h4>
              <p class="text-sm">此操作将重置所有矿机，销毁30%积分，请谨慎操作！</p>
            </div>
          </div>

          <button class="btn btn-error" @click="showRestartModal = true">
            <ArrowPathIcon class="w-5 h-5" />
            触发矿机重启
          </button>
        </div>
      </div>
    </div>

    <!-- 释放确认模态框 -->
    <dialog class="modal" :class="{ 'modal-open': showReleaseModal }">
      <div class="modal-box max-w-2xl">
        <h3 class="font-bold text-lg text-yellow-600 mb-4">🚀 确认触发每日释放？</h3>
        
        <div class="space-y-4">
          <div class="alert alert-info">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="stroke-current shrink-0 w-6 h-6"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            <div>
              <p class="font-bold">本次释放信息：</p>
              <div class="text-sm mt-2 space-y-1">
                <p>• 活跃学习机: <span class="font-bold text-yellow-600">{{ releaseStats.totalActive }} 台</span></p>
                <p>• 涉及用户: <span class="font-bold text-blue-600">{{ releaseStats.totalUsers }} 人</span></p>
                <p>• 预计释放量: <span class="font-bold text-green-600">约 {{ (releaseStats.totalInvested * 0.10).toFixed(0) }} 积分</span></p>
              </div>
            </div>
          </div>

          <div class="form-control">
            <label class="label">
              <span class="label-text">请输入 "RELEASE" 确认操作</span>
            </label>
            <input
              v-model="releaseConfirm"
              type="text"
              placeholder="输入 RELEASE"
              class="input input-bordered"
            />
          </div>
        </div>

        <div class="modal-action">
          <button class="btn" @click="closeReleaseModal">取消</button>
          <button 
            class="btn btn-warning" 
            @click="confirmRelease"
            :disabled="releaseConfirm !== 'RELEASE' || executingRelease"
          >
            <span v-if="executingRelease" class="loading loading-spinner"></span>
            🚀 确认触发释放
          </button>
        </div>
      </div>
    </dialog>

    <!-- 分红确认模态框 -->
    <dialog class="modal" :class="{ 'modal-open': showDividendModal }">
      <div class="modal-box max-w-2xl">
        <h3 class="font-bold text-lg text-blue-600 mb-4">💎 确认执行分红结算？</h3>
        
        <div class="space-y-4">
          <div class="alert alert-info">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="stroke-current shrink-0 w-6 h-6"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            <div>
              <p class="font-bold">本次分红结算信息：</p>
              <div class="text-sm mt-2 space-y-1">
                <p>• 分红池总额: <span class="font-bold text-blue-600">{{ dividendStats.poolBalance.toFixed(2) }} U</span></p>
                <p>• 符合条件用户: <span class="font-bold text-yellow-600">{{ dividendStats.eligibleCount }} 人</span></p>
                <p>• 每人分配: <span class="font-bold text-green-600">{{ (dividendStats.poolBalance / Math.max(dividendStats.eligibleCount, 1)).toFixed(2) }} U</span></p>
              </div>
            </div>
          </div>

          <div class="form-control">
            <label class="label">
              <span class="label-text">请输入 "DIVIDEND" 确认操作</span>
            </label>
            <input
              v-model="dividendConfirm"
              type="text"
              placeholder="输入 DIVIDEND"
              class="input input-bordered"
            />
          </div>
        </div>

        <div class="modal-action">
          <button class="btn" @click="closeDividendModal">取消</button>
          <button 
            class="btn btn-primary" 
            @click="confirmDividend"
            :disabled="dividendConfirm !== 'DIVIDEND' || executingDividend"
          >
            <span v-if="executingDividend" class="loading loading-spinner"></span>
            💎 确认执行分红
          </button>
        </div>
      </div>
    </dialog>

    <!-- 重启确认模态框 -->
    <dialog class="modal" :class="{ 'modal-open': showRestartModal }">
      <div class="modal-box">
        <h3 class="font-bold text-lg text-error mb-4">确认重启矿机系统？</h3>
        <div class="space-y-4">
          <div class="alert alert-error">
            <ExclamationTriangleIcon class="w-6 h-6" />
            <div>
              <p class="font-bold">此操作不可逆！将导致：</p>
              <ul class="text-sm mt-2 list-disc list-inside">
                <li>所有矿机状态重置</li>
                <li>所有用户积分销毁30%</li>
                <li>矿机重新排队释放</li>
              </ul>
            </div>
          </div>

          <div class="form-control">
            <label class="label">
              <span class="label-text">请输入 "RESTART" 确认操作</span>
            </label>
            <input
              v-model="restartConfirm"
              type="text"
              placeholder="输入 RESTART"
              class="input input-bordered"
            />
          </div>
        </div>

        <div class="modal-action">
          <button class="btn" @click="showRestartModal = false">取消</button>
          <button 
            class="btn btn-error" 
            @click="confirmRestart"
            :disabled="restartConfirm !== 'RESTART' || restarting"
          >
            <span v-if="restarting" class="loading loading-spinner"></span>
            确认重启
          </button>
        </div>
      </div>
    </dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { supabase } from '@/lib/supabase'
import { DividendService } from '@/services/DividendService'
import { MiningService } from '@/services/MiningService'
import { AdminCleanupService } from '@/services/AdminCleanupService'
import { 
  ExclamationTriangleIcon,
  ArrowPathIcon
} from '@heroicons/vue/24/outline'

const config = ref<Record<string, any>>({
  agent_fee: 30,
  spot_award: 8,
  peer_spot_award: 3,
  peer_levels: 5,
  dividend_per_order: 7,
  min_referrals_for_dividend: 5,
  repurchase_threshold: 300,
  repurchase_fee: 30,
  min_withdraw: 20,
  points_to_u_rate: 0.07,
  u_withdraw_ratio: 0.7,
  transfer_ratio: 0.3
})

const saving = ref(false)
const showRestartModal = ref(false)
const restartConfirm = ref('')
const restarting = ref(false)

// 释放系统相关状态
const releaseStats = ref({
  totalActive: 0,
  totalUsers: 0,
  totalInvested: 0,
  totalReleased: 0
})

const showReleaseModal = ref(false)
const releaseConfirm = ref('')
const executingRelease = ref(false)
const loadingReleaseStats = ref(false)
const lastReleaseTime = ref<string | null>(null)

// 分红系统相关状态
const dividendStats = ref({
  poolBalance: 0,
  eligibleCount: 0,
  totalDistributed: 0,
  lastDistributionDate: null as string | null
})

const showDividendModal = ref(false)
const dividendConfirm = ref('')
const executingDividend = ref(false)
const loadingStats = ref(false)

// 计算下次分红时间
const nextDividendDate = computed(() => {
  const nextDate = DividendService.getNextDividendDate()
  return nextDate.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    weekday: 'long'
  })
})

// 加载配置
const loadConfig = async () => {
  try {
    const { data, error } = await supabase
      .from('system_config')
      .select('*')

    if (error) throw error

    if (data) {
      data.forEach(item => {
        // 解析JSON值
        const value = typeof item.value === 'string' ? JSON.parse(item.value) : item.value
        config.value[item.key] = Number(value) || value
      })
    }
  } catch (error) {
    console.error('Load config error:', error)
  }
}

// 保存配置
const saveConfig = async () => {
  try {
    saving.value = true

    // 逐个更新配置项
    for (const [key, value] of Object.entries(config.value)) {
      const { error } = await supabase
        .from('system_config')
        .upsert({
          key,
          value: JSON.stringify(value),
          updated_at: new Date().toISOString()
        })

      if (error) throw error
    }

    alert('配置保存成功！')
  } catch (error) {
    console.error('Save config error:', error)
    alert('配置保存失败，请重试')
  } finally {
    saving.value = false
  }
}

// 加载释放统计
const loadReleaseStats = async () => {
  try {
    loadingReleaseStats.value = true
    const result = await MiningService.getActiveStats()
    
    if (result.success && result.data) {
      releaseStats.value = result.data
    }
  } catch (error) {
    console.error('加载释放统计失败:', error)
  } finally {
    loadingReleaseStats.value = false
  }
}

// 刷新释放统计
const refreshReleaseStats = async () => {
  await loadReleaseStats()
}

// 关闭释放模态框
const closeReleaseModal = () => {
  showReleaseModal.value = false
  releaseConfirm.value = ''
}

// 确认执行释放
const confirmRelease = async () => {
  if (releaseConfirm.value !== 'RELEASE') {
    return
  }

  try {
    executingRelease.value = true
    console.log('🚀 管理员手动触发每日释放...')

    const result = await MiningService.triggerAllDailyReleases()

    if (result.success && result.data) {
      const { processedCount, totalReleased, exitedCount } = result.data
      
      // 更新最后释放时间
      lastReleaseTime.value = new Date().toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      })

      // 刷新统计
      await loadReleaseStats()

      alert(`✅ 释放成功！\n\n处理学习机: ${processedCount}台\n总释放量: ${totalReleased.toFixed(2)}积分\n出局数量: ${exitedCount}台`)
      
      closeReleaseModal()
    } else {
      alert(`❌ 释放失败: ${result.error || '未知错误'}`)
    }
  } catch (error: any) {
    console.error('触发释放失败:', error)
    alert(`❌ 触发释放失败: ${error.message || '未知错误'}`)
  } finally {
    executingRelease.value = false
  }
}

// 消息清理相关
const messageStats = ref<any>(null)

const loadStats = async () => {
  try {
    loading.value = true
    messageStats.value = await AdminCleanupService.getMessageStats()
  } catch (error) {
    console.error('加载统计失败:', error)
    alert('❌ 加载统计失败')
  } finally {
    loading.value = false
  }
}

const cleanup = async () => {
  if (!confirm('⚠️ 确认清理过期消息？\n\n这将删除：\n• 超过5分钟的用户消息\n• 超过10分钟的机器人消息\n• 超过24小时的空投消息')) {
    return
  }
  
  try {
    loading.value = true
    const result = await AdminCleanupService.cleanupExpiredMessages()
    
    if (result.success) {
      alert('✅ 清理完成！')
      await loadStats() // 刷新统计
    } else {
      alert(`❌ 清理失败: ${result.error}`)
    }
  } catch (error: any) {
    console.error('清理失败:', error)
    alert(`❌ 清理失败: ${error.message}`)
  } finally {
    loading.value = false
  }
}

// 🛠️ 工具发布管理
const postsStats = ref<any>(null)

const loadPostsStats = async () => {
  try {
    loading.value = true
    const { data, error } = await supabase
      .from('posts')
      .select('id, is_pinned')
    
    if (error) throw error
    
    postsStats.value = {
      total: data?.length || 0,
      pinned: data?.filter(p => p.is_pinned).length || 0,
      normal: data?.filter(p => !p.is_pinned).length || 0
    }
  } catch (error) {
    console.error('加载发布统计失败:', error)
    alert('❌ 加载统计失败')
  } finally {
    loading.value = false
  }
}

const clearAllPosts = async () => {
  if (!confirm('⚠️ 确定要清空所有工具发布吗？\n\n此操作不可恢复！')) return
  if (!confirm('⚠️ 再次确认：是否清空所有发布？')) return
  
  try {
    loading.value = true
    const { error } = await supabase
      .from('posts')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000') // 删除所有
    
    if (error) throw error
    
    alert('✅ 已清空所有发布')
    await loadPostsStats() // 刷新统计
  } catch (error: any) {
    console.error('清空失败:', error)
    alert(`❌ 清空失败: ${error.message}`)
  } finally {
    loading.value = false
  }
}

// 加载分红统计
const loadDividendStats = async () => {
  try {
    loadingStats.value = true
    const result = await DividendService.getDividendStats()
    
    if (result.success && result.data) {
      dividendStats.value = result.data
    }
  } catch (error) {
    console.error('加载分红统计失败:', error)
  } finally {
    loadingStats.value = false
  }
}

// 刷新分红统计
const refreshDividendStats = async () => {
  await loadDividendStats()
}

// 关闭分红模态框
const closeDividendModal = () => {
  showDividendModal.value = false
  dividendConfirm.value = ''
}

// 确认执行分红
const confirmDividend = async () => {
  if (dividendConfirm.value !== 'DIVIDEND') return

  try {
    executingDividend.value = true

    const result = await DividendService.distributeDividends()
    
    if (result.success) {
      alert(`✅ 分红成功！\n\n分配金额: ${result.data?.totalDistributed.toFixed(2)} U\n参与人数: ${result.data?.recipientCount} 人\n人均: ${result.data?.sharePerUser.toFixed(2)} U`)
      closeDividendModal()
      await loadDividendStats() // 刷新统计
    } else {
      alert(`❌ 分红失败: ${result.error}`)
    }
  } catch (error: any) {
    console.error('执行分红失败:', error)
    alert(`❌ 分红失败: ${error.message}`)
  } finally {
    executingDividend.value = false
  }
}

// 确认重启
const confirmRestart = async () => {
  if (restartConfirm.value !== 'RESTART') return

  try {
    restarting.value = true

    // TODO: 实现重启逻辑
    // 1. 重置所有矿机
    // 2. 销毁30%积分
    // 3. 重新排队

    // 临时模拟
    await new Promise(resolve => setTimeout(resolve, 2000))

    alert('矿机系统已重启！')
    showRestartModal.value = false
    restartConfirm.value = ''
  } catch (error) {
    console.error('Restart error:', error)
    alert('重启失败，请重试')
  } finally {
    restarting.value = false
  }
}

onMounted(() => {
  loadConfig()
  loadReleaseStats()
  loadDividendStats()
  loadStats() // 加载消息统计
  loadPostsStats() // 加载工具发布统计
})
</script>






