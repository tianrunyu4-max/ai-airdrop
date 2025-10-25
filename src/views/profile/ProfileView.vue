<template>
  <div class="h-full overflow-y-auto custom-scrollbar bg-gradient-to-b from-yellow-50 via-white to-yellow-50 pb-24">
    <!-- 顶部用户信息卡片 -->
    <div class="bg-gradient-to-br from-yellow-400 via-yellow-500 to-yellow-600 px-6 pt-8 pb-12 relative overflow-hidden">
      <!-- 装饰性背景 -->
      <div class="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32"></div>
      <div class="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full -ml-24 -mb-24"></div>
      
      <div class="relative z-10">
        <!-- 用户头像和基本信息 -->
        <div class="flex items-center gap-4 mb-6">
          <div class="avatar placeholder">
            <div class="bg-white/30 backdrop-blur-sm text-white rounded-full w-20 h-20 shadow-xl">
              <span class="text-3xl font-bold">{{ user?.username[0] }}</span>
            </div>
          </div>
          <div class="flex-1">
            <h2 class="text-2xl font-bold text-white">{{ user?.username }}</h2>
            <div class="flex gap-2 mt-2">
              <div v-if="user?.is_agent" class="badge badge-warning">
                👑 代理会员
              </div>
              <div v-if="user?.is_admin" class="badge badge-error">
                🔐 管理员
              </div>
            </div>
          </div>
        </div>

        <!-- 邀请码卡片 -->
        <div class="bg-white/20 backdrop-blur-lg rounded-2xl p-4 border border-white/30">
          <div class="flex items-center justify-between mb-3">
            <div class="text-white/90 text-sm">我的邀请码</div>
            <button 
              @click="copyInviteCode" 
              class="btn btn-sm bg-white/20 hover:bg-white/30 border-none text-white"
            >
              📋 复制
            </button>
          </div>
          <div class="text-white font-mono text-2xl font-bold tracking-wider">
            {{ inviteCode }}
          </div>
        </div>
      </div>
    </div>

    <!-- 数据统计卡片 -->
    <div class="px-4 -mt-6 relative z-20">
      <div class="bg-white rounded-2xl shadow-2xl border-2 border-yellow-200 p-4">
        <div class="grid grid-cols-3 divide-x divide-gray-200">
          <div class="text-center px-2">
            <div class="text-3xl font-bold text-yellow-600">{{ user?.direct_referral_count || 0 }}</div>
            <div class="text-xs text-gray-600 mt-1">直推人数</div>
          </div>
          <div class="text-center px-2">
            <div class="text-3xl font-bold text-green-600">{{ networkCount }}</div>
            <div class="text-xs text-gray-600 mt-1">团队人数</div>
          </div>
          <div class="text-center px-2">
            <div class="text-3xl font-bold text-blue-600">{{ (user?.total_earnings || 0).toFixed(2) }}</div>
            <div class="text-xs text-gray-600 mt-1">总收益(U)</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 余额卡片 -->
    <div class="p-4">
      <div class="bg-gradient-to-br from-white to-yellow-50 rounded-2xl p-6 shadow-lg border-2 border-yellow-200">
        <div class="flex items-center justify-between mb-4">
          <div>
            <div class="text-gray-600 text-sm">账户余额</div>
            <div class="text-4xl font-bold text-yellow-600 mt-1">
              {{ (user?.u_balance || 0).toFixed(2) }} U
            </div>
          </div>
          <div class="w-16 h-16 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center shadow-lg">
            <span class="text-3xl">💰</span>
          </div>
        </div>
        
        <!-- 积分余额显示 -->
        <div class="mt-4">
          <div class="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg p-4 border-2 border-yellow-300">
            <div class="flex items-center justify-between">
              <div>
                <div class="text-xs text-gray-600 mb-1">互转积分</div>
                <div class="text-3xl font-bold text-orange-600">
                  {{ (user?.transfer_points || 0).toFixed(2) }}
                </div>
                <div class="text-xs text-gray-500 mt-1">
                  💡 可在AI学习页面赠送给团队新伙伴
                </div>
              </div>
              <div class="w-14 h-14 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                <span class="text-2xl">🎁</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 充值/提现按钮 -->
    <div class="px-4 pb-4">
      <div class="grid grid-cols-2 gap-3">
        <button 
          @click="showRechargeModal = true"
          class="btn btn-lg btn-success text-white shadow-lg hover:shadow-xl transition-all"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          💰 充值
        </button>
        <button 
          @click="showWithdrawModal = true"
          class="btn btn-lg btn-warning text-white shadow-lg hover:shadow-xl transition-all"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          💳 提现
        </button>
      </div>
    </div>

    <!-- 代理状态/成为代理卡片 -->
    <div v-if="!user?.is_agent" class="px-4 mb-4">
      <div class="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-6 shadow-lg border-2 border-purple-200">
        <div class="flex items-start gap-4">
          <div class="w-16 h-16 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full flex items-center justify-center flex-shrink-0">
            <span class="text-3xl">👑</span>
          </div>
          <div class="flex-1">
            <h3 class="text-xl font-bold text-gray-800 mb-2">加入Binary对碰系统</h3>
            <div class="text-sm text-gray-600 space-y-1 mb-4">
              <div>✅ A+B双区公排自动化排线</div>
              <div>✅ 对碰奖励（6U/对，2:1 / 1:2，100%到账）</div>
              <div>✅ 见单奖（5层直推链，各得1U/组，重复拿）</div>
              <div>✅ 直推≥2人解锁见单奖</div>
              <div>✅ 解锁积分互转+AI学习机</div>
              <div class="text-purple-600 font-medium mt-2">仅需支付 30U 永久有效！</div>
            </div>
            <button 
              @click="becomeAgent"
              :disabled="(user?.u_balance || 0) < 30 || becomingAgent"
              class="btn bg-gradient-to-r from-purple-500 to-pink-500 border-none text-white shadow-md hover:shadow-xl transition-all disabled:opacity-50 w-full"
            >
              <span v-if="becomingAgent" class="loading loading-spinner loading-sm"></span>
              <span v-else>{{ (user?.u_balance || 0) < 30 ? 'U余额不足（需要30U）' : '🚀 立即加入Binary系统' }}</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 功能菜单 -->
    <div class="px-4">
      <div class="text-gray-800 font-bold mb-3 text-sm">功能菜单</div>
      <div class="space-y-3">
        <!-- 管理后台 -->
        <button 
          v-if="user?.is_admin"
          @click="$router.push('/admin')"
          class="w-full bg-gradient-to-r from-red-50 to-pink-50 hover:from-red-100 hover:to-pink-100 rounded-xl p-4 flex items-center justify-between border-2 border-red-200 transition-all"
        >
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center">
              <span class="text-xl">🔐</span>
            </div>
            <div class="text-left">
              <div class="font-bold text-gray-800">管理后台</div>
              <div class="text-xs text-gray-600">系统管理和配置</div>
            </div>
          </div>
          <span class="text-gray-400">→</span>
        </button>

        <!-- 交易记录 -->
        <button 
          @click="$router.push('/earnings')"
          class="w-full bg-white hover:bg-yellow-50 rounded-xl p-4 flex items-center justify-between border-2 border-yellow-200 transition-all"
        >
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-full flex items-center justify-center">
              <span class="text-xl">📊</span>
            </div>
            <div class="text-left">
              <div class="font-bold text-gray-800">收益明细</div>
              <div class="text-xs text-gray-600">查看收益记录</div>
            </div>
          </div>
          <span class="text-gray-400">→</span>
        </button>

        <!-- 我的团队 -->
        <button 
          @click="$router.push('/team')"
          class="w-full bg-white hover:bg-yellow-50 rounded-xl p-4 flex items-center justify-between border-2 border-yellow-200 transition-all"
        >
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 bg-gradient-to-br from-green-400 to-green-500 rounded-full flex items-center justify-center">
              <span class="text-xl">👥</span>
            </div>
            <div class="text-left">
              <div class="font-bold text-gray-800">我的团队</div>
              <div class="text-xs text-gray-600">团队统计和管理</div>
            </div>
          </div>
          <span class="text-gray-400">→</span>
        </button>

        <!-- 系统设置 -->
        <button 
          @click="showSettingsModal = true"
          class="w-full bg-white hover:bg-yellow-50 rounded-xl p-4 flex items-center justify-between border-2 border-yellow-200 transition-all"
        >
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 bg-gradient-to-br from-gray-400 to-gray-500 rounded-full flex items-center justify-center">
              <span class="text-xl">⚙️</span>
            </div>
            <div class="text-left">
              <div class="font-bold text-gray-800">系统设置</div>
              <div class="text-xs text-gray-600">语言和主题</div>
            </div>
          </div>
          <span class="text-gray-400">→</span>
        </button>
      </div>
    </div>

    <!-- 官方频道 -->
    <div class="px-4 mt-6">
      <div class="text-gray-800 font-bold mb-3 text-sm">📺 官方视频频道</div>
      <div class="grid grid-cols-2 gap-3">
        <!-- B站 -->
        <a 
          :href="platformContacts.bilibili"
          target="_blank"
          class="bg-white hover:bg-gray-50 rounded-xl p-4 flex flex-col items-center justify-center border-2 border-gray-200 transition-all"
        >
          <div class="w-12 h-12 flex items-center justify-center mb-2">
            <span class="text-3xl">📺</span>
          </div>
          <div class="font-bold text-gray-800 text-sm">哔哩哔哩</div>
          <div class="text-xs text-blue-600 mt-1">点击访问</div>
        </a>

        <!-- YouTube -->
        <a 
          :href="platformContacts.youtube"
          target="_blank"
          class="bg-white hover:bg-gray-50 rounded-xl p-4 flex flex-col items-center justify-center border-2 border-gray-200 transition-all"
        >
          <div class="w-12 h-12 flex items-center justify-center mb-2">
            <span class="text-3xl">▶️</span>
          </div>
          <div class="font-bold text-gray-800 text-sm">YouTube</div>
          <div class="text-xs text-red-600 mt-1">点击访问</div>
        </a>
      </div>
    </div>

    <!-- 联系我们 -->
    <div class="px-4 mt-6">
      <div class="text-gray-800 font-bold mb-3 text-sm">📞 联系我们</div>
      <div class="grid grid-cols-2 gap-3">
        <!-- 微信客服 -->
        <button 
          @click="showContactInfo('wechat')"
          class="bg-white hover:bg-gray-50 rounded-xl p-4 flex flex-col items-center justify-center border-2 border-gray-200 transition-all"
        >
          <div class="w-12 h-12 flex items-center justify-center mb-2">
            <span class="text-3xl">💬</span>
          </div>
          <div class="font-bold text-gray-800 text-sm">微信客服</div>
          <div class="text-xs text-green-600 mt-1">点击查看</div>
        </button>

        <!-- Telegram -->
        <a 
          :href="platformContacts.telegram"
          target="_blank"
          class="bg-white hover:bg-gray-50 rounded-xl p-4 flex flex-col items-center justify-center border-2 border-gray-200 transition-all"
        >
          <div class="w-12 h-12 flex items-center justify-center mb-2">
            <span class="text-3xl">✈️</span>
          </div>
          <div class="font-bold text-gray-800 text-sm">Telegram</div>
          <div class="text-xs text-blue-600 mt-1">点击加入</div>
        </a>

        <!-- 视频号 -->
        <button 
          @click="showContactInfo('shipin')"
          class="bg-white hover:bg-gray-50 rounded-xl p-4 flex flex-col items-center justify-center border-2 border-gray-200 transition-all"
        >
          <div class="w-12 h-12 flex items-center justify-center mb-2">
            <span class="text-3xl">🎬</span>
          </div>
          <div class="font-bold text-gray-800 text-sm">视频号</div>
          <div class="text-xs text-green-600 mt-1">点击查看</div>
        </button>

        <!-- 国际抖音 -->
        <button 
          @click="showContactInfo('tiktok')"
          class="bg-white hover:bg-gray-50 rounded-xl p-4 flex flex-col items-center justify-center border-2 border-gray-200 transition-all"
        >
          <div class="w-12 h-12 flex items-center justify-center mb-2">
            <span class="text-3xl">🎵</span>
          </div>
          <div class="font-bold text-gray-800 text-sm">TikTok</div>
          <div class="text-xs text-purple-600 mt-1">点击查看</div>
        </button>
      </div>
    </div>

    <!-- 退出登录 -->
    <div class="p-4 mt-4">
      <button 
        @click="handleLogout"
        class="w-full bg-white hover:bg-red-50 text-red-600 rounded-xl p-4 flex items-center justify-center gap-2 border-2 border-red-200 font-bold transition-all"
      >
        <span>🚪</span>
        <span>退出登录</span>
      </button>
    </div>

    <!-- 联系信息Modal -->
    <dialog class="modal" :class="{ 'modal-open': showContactModal }">
      <div class="modal-box">
        <h3 class="font-bold text-lg text-gray-800 mb-4">
          {{ contactInfo.title }}
        </h3>
        
        <div class="bg-yellow-50 rounded-xl p-4 border-2 border-yellow-200">
          <div class="text-center">
            <div class="text-4xl mb-3">{{ contactInfo.icon }}</div>
            <div class="text-gray-700 font-bold mb-2">{{ contactInfo.name }}</div>
            <div class="text-yellow-600 text-lg font-mono bg-white rounded-lg p-3 mb-3">
              {{ contactInfo.account }}
            </div>
            <div class="text-xs text-gray-600" v-if="contactInfo.note">
              {{ contactInfo.note }}
            </div>
          </div>
        </div>

        <div class="modal-action">
          <button class="btn btn-primary w-full" @click="copyContactInfo">复制账号</button>
          <button class="btn" @click="closeContactModal">关闭</button>
        </div>
      </div>
      <form method="dialog" class="modal-backdrop" @click="closeContactModal">
        <button>close</button>
      </form>
    </dialog>

    <!-- ✅ 邀请码输入Modal -->
    <dialog class="modal" :class="{ 'modal-open': showInviteCodeModal }">
      <div class="modal-box max-w-md">
        <h3 class="font-bold text-lg text-purple-600 mb-4">🎁 加入Binary对碰系统</h3>
        
        <div class="alert alert-info mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="stroke-current shrink-0 w-6 h-6"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          <div>
            <p class="font-bold">支付费用：30U</p>
            <div class="text-sm mt-2 space-y-1">
              <p>✅ A+B双区公排自动化排线</p>
              <p>✅ 对碰奖励（6U/对，2:1 / 1:2，100%到账）</p>
              <p>✅ 见单奖（5层直推链，各得1U/组，重复拿）</p>
              <p>✅ 直推≥2人解锁见单奖</p>
              <p>✅ 解锁积分互转+AI学习机</p>
            </div>
          </div>
        </div>

        <div class="form-control">
          <label class="label">
            <span class="label-text font-medium">请输入邀请码 <span class="text-red-500">*</span></span>
          </label>
          <input
            v-model="inviteCodeInput"
            type="text"
            placeholder="输入8位邀请码"
            class="input input-bordered input-primary w-full text-uppercase"
            maxlength="8"
            @input="inviteCodeInput = inviteCodeInput.toUpperCase()"
          />
          <label class="label">
            <span class="label-text-alt text-gray-500">💡 邀请码由您的推荐人提供</span>
          </label>
        </div>

        <div class="alert alert-warning mt-4">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="stroke-current shrink-0 w-6 h-6"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
          <div>
            <p class="text-sm">⚠️ 邀请人必须是已付费的AI代理</p>
            <p class="text-sm">⚠️ 邀请关系一旦建立，无法更改</p>
          </div>
        </div>

        <div class="modal-action">
          <button class="btn btn-ghost" @click="cancelBecomeAgent" :disabled="becomingAgent">取消</button>
          <button 
            class="btn btn-primary bg-gradient-to-r from-purple-500 to-pink-500 border-none"
            @click="confirmBecomeAgent"
            :disabled="becomingAgent || !inviteCodeInput || (user?.u_balance || 0) < 30"
          >
            <span v-if="becomingAgent" class="loading loading-spinner loading-sm"></span>
            <span v-else>
              {{ (user?.u_balance || 0) < 30 ? 'U余额不足（需要30U）' : '🚀 确认加入（30U）' }}
            </span>
          </button>
        </div>
      </div>
      <form method="dialog" class="modal-backdrop" @click="cancelBecomeAgent">
        <button>close</button>
      </form>
    </dialog>

    <!-- 设置Modal -->
    <dialog class="modal" :class="{ 'modal-open': showSettingsModal }">
      <div class="modal-box">
        <h3 class="font-bold text-lg">系统设置</h3>
        
        <div class="form-control mt-4">
          <label class="label">
            <span class="label-text">语言</span>
          </label>
          <select v-model="selectedLanguage" class="select select-bordered" @change="changeLanguage">
            <option value="zh">中文</option>
            <option value="en">English</option>
          </select>
        </div>

        <div class="form-control mt-4">
          <label class="label">
            <span class="label-text">主题</span>
          </label>
          <select v-model="selectedTheme" class="select select-bordered" @change="changeTheme">
            <option value="light">浅色</option>
            <option value="dark">深色</option>
          </select>
        </div>

        <div class="modal-action">
          <button class="btn" @click="showSettingsModal = false">关闭</button>
        </div>
      </div>
      <form method="dialog" class="modal-backdrop" @click="showSettingsModal = false">
        <button>close</button>
      </form>
    </dialog>

    <!-- 充值模态框 -->
    <div v-if="showRechargeModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-bold text-gray-800">💰 USDT充值</h3>
          <button @click="showRechargeModal = false" class="btn btn-sm btn-circle btn-ghost">✕</button>
        </div>

        <div class="space-y-4">
          <!-- 选择链 -->
          <div>
            <label class="label"><span class="label-text font-semibold">选择网络</span></label>
            <div class="flex gap-2">
              <button 
                @click="rechargeData.network = 'TRC20'"
                class="btn flex-1"
                :class="rechargeData.network === 'TRC20' ? 'btn-error' : 'btn-outline'"
              >
                TRC20
              </button>
              <button 
                @click="rechargeData.network = 'BEP20'"
                class="btn flex-1"
                :class="rechargeData.network === 'BEP20' ? 'btn-warning' : 'btn-outline'"
              >
                BEP20
              </button>
            </div>
          </div>

          <!-- 充值地址 -->
          <div v-if="rechargeConfig" class="bg-gray-50 rounded-lg p-4">
            <div class="text-sm text-gray-600 mb-2">转账至此地址</div>
            <div class="font-mono text-sm bg-white p-3 rounded border break-all">
              {{ rechargeData.network === 'TRC20' ? rechargeConfig.usdt_trc20 : rechargeConfig.usdt_bep20 }}
            </div>
            <button 
              @click="copyAddress(rechargeData.network === 'TRC20' ? rechargeConfig.usdt_trc20 : rechargeConfig.usdt_bep20)"
              class="btn btn-sm btn-primary w-full mt-2"
            >
              📋 复制地址
            </button>
          </div>

          <!-- 充值金额 -->
          <div>
            <label class="label"><span class="label-text font-semibold">充值金额 (USDT)</span></label>
            <input 
              v-model.number="rechargeData.amount" 
              type="number" 
              class="input input-bordered w-full"
              :placeholder="`最低充值 ${rechargeConfig?.min_amount || 10} USDT`"
            />
          </div>

          <!-- 交易哈希 (可选) -->
          <div>
            <label class="label"><span class="label-text font-semibold">交易哈希 (可选)</span></label>
            <input 
              v-model="rechargeData.txid" 
              type="text" 
              class="input input-bordered w-full"
              placeholder="粘贴交易哈希以加快确认"
            />
          </div>

          <!-- 提示 -->
          <div v-if="rechargeConfig" class="alert alert-info">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="stroke-current shrink-0 w-6 h-6"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            <div class="text-sm">
              {{ rechargeConfig.notice }}
            </div>
          </div>

          <!-- 按钮 -->
          <div class="flex gap-2">
            <button @click="showRechargeModal = false" class="btn btn-ghost flex-1">取消</button>
            <button @click="submitRecharge" class="btn btn-success flex-1" :disabled="submitting">
              <span v-if="!submitting">✅ 提交充值</span>
              <span v-else class="loading loading-spinner"></span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 提现模态框 -->
    <div v-if="showWithdrawModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-bold text-gray-800">💳 申请提现</h3>
          <button @click="showWithdrawModal = false" class="btn btn-sm btn-circle btn-ghost">✕</button>
        </div>

        <div class="space-y-4">
          <!-- 选择地址 -->
          <div>
            <label class="label"><span class="label-text font-semibold">提现地址</span></label>
            <select v-model="withdrawData.addressId" class="select select-bordered w-full">
              <option value="">请选择提现地址</option>
              <option v-for="addr in withdrawalAddresses" :key="addr.id" :value="addr.id">
                {{ addr.label }} ({{ addr.chain }})
              </option>
            </select>
            <button @click="showAddAddressModal = true; showWithdrawModal = false" class="btn btn-link btn-sm">
              + 添加新地址
            </button>
          </div>

          <!-- 提现金额 -->
          <div>
            <label class="label"><span class="label-text font-semibold">提现金额 (USDT)</span></label>
            <input 
              v-model.number="withdrawData.amount" 
              type="number" 
              class="input input-bordered w-full"
              placeholder="最低提现 50 USDT"
            />
            <div class="text-xs text-gray-500 mt-1">
              可用余额: {{ (user?.u_balance || 0).toFixed(2) }} U
            </div>
          </div>

          <!-- 提示 -->
          <div class="alert alert-warning">
            <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            <div class="text-sm">
              <p>• 最低提现: 50 USDT</p>
              <p>• 手续费: 5%</p>
              <p>• 预计24小时内到账</p>
            </div>
          </div>

          <!-- 按钮 -->
          <div class="flex gap-2">
            <button @click="showWithdrawModal = false" class="btn btn-ghost flex-1">取消</button>
            <button @click="submitWithdraw" class="btn btn-warning flex-1" :disabled="submitting">
              <span v-if="!submitting">💸 提交提现</span>
              <span v-else class="loading loading-spinner"></span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 添加提现地址模态框 -->
    <div v-if="showAddAddressModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-bold text-gray-800">添加提现地址</h3>
          <button
            @click="showAddAddressModal = false"
            class="btn btn-sm btn-circle btn-ghost"
          >
            ✕
          </button>
        </div>

        <form @submit.prevent="addAddress" class="space-y-4">
          <!-- 链类型选择 -->
          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-2">选择链类型</label>
            <div class="grid grid-cols-2 gap-3">
              <label class="flex items-center p-3 border-2 rounded-lg cursor-pointer transition-all"
                     :class="newAddress.chain === 'TRC20' ? 'border-red-300 bg-red-50' : 'border-gray-200'">
                <input
                  type="radio"
                  v-model="newAddress.chain"
                  value="TRC20"
                  class="sr-only"
                />
                <div class="flex items-center gap-2">
                  <div class="w-4 h-4 rounded-full border-2 flex items-center justify-center"
                       :class="newAddress.chain === 'TRC20' ? 'border-red-500 bg-red-500' : 'border-gray-300'">
                    <div v-if="newAddress.chain === 'TRC20'" class="w-2 h-2 rounded-full bg-white"></div>
                  </div>
                  <div>
                    <div class="font-semibold text-sm">波场链</div>
                    <div class="text-xs text-gray-500">TRC20</div>
                  </div>
                </div>
              </label>

              <label class="flex items-center p-3 border-2 rounded-lg cursor-pointer transition-all"
                     :class="newAddress.chain === 'BEP20' ? 'border-yellow-300 bg-yellow-50' : 'border-gray-200'">
                <input
                  type="radio"
                  v-model="newAddress.chain"
                  value="BEP20"
                  class="sr-only"
                />
                <div class="flex items-center gap-2">
                  <div class="w-4 h-4 rounded-full border-2 flex items-center justify-center"
                       :class="newAddress.chain === 'BEP20' ? 'border-yellow-500 bg-yellow-500' : 'border-gray-300'">
                    <div v-if="newAddress.chain === 'BEP20'" class="w-2 h-2 rounded-full bg-white"></div>
                  </div>
                  <div>
                    <div class="font-semibold text-sm">币安链</div>
                    <div class="text-xs text-gray-500">BEP20</div>
                  </div>
                </div>
              </label>
            </div>
          </div>

          <!-- 地址标签 -->
          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-2">地址标签</label>
            <input
              v-model="newAddress.label"
              type="text"
              placeholder="例如：我的钱包"
              class="input input-bordered w-full"
              required
            />
          </div>

          <!-- 钱包地址 -->
          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-2">钱包地址</label>
            <input
              v-model="newAddress.address"
              type="text"
              placeholder="请输入您的钱包地址"
              class="input input-bordered w-full font-mono"
              required
            />
          </div>

          <!-- 提示信息 -->
          <div class="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div class="flex items-start gap-2">
              <div class="text-blue-500 text-sm">💡</div>
              <div class="text-xs text-blue-700">
                <div class="font-semibold mb-1">重要提示：</div>
                <ul class="space-y-1">
                  <li>• 请确保地址正确，错误地址将导致资金丢失</li>
                  <li>• 提现最低金额：50U</li>
                  <li>• 提现手续费：2U</li>
                </ul>
              </div>
            </div>
          </div>

          <!-- 按钮 -->
          <div class="flex gap-3 pt-2">
            <button
              type="button"
              @click="showAddAddressModal = false"
              class="btn btn-outline flex-1"
            >
              取消
            </button>
            <button
              type="submit"
              class="btn btn-primary flex-1"
              :disabled="!newAddress.chain || !newAddress.label || !newAddress.address"
            >
              添加地址
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useToast } from '@/composables/useToast'
import { useI18n } from 'vue-i18n'
import { supabase } from '@/lib/supabase'
import { AgentService } from '@/services/AgentService'
import { RechargeService } from '@/services/RechargeService'
import { WithdrawalService } from '@/services/WithdrawalService'

const router = useRouter()
const authStore = useAuthStore()
const toast = useToast()
const { t } = useI18n()

// 用户信息
const user = computed(() => authStore.user)
const networkCount = ref(0)

// 提现相关数据
const showAddAddressModal = ref(false)
const showRechargeModal = ref(false)
const showWithdrawModal = ref(false)
const submitting = ref(false)

const withdrawalAddresses = ref<Array<{id?: string, chain: string, label: string, address: string}>>([])
const newAddress = ref({
  chain: 'TRC20',
  label: '',
  address: ''
})

// 充值相关
const rechargeConfig = ref<any>(null)
const rechargeData = ref({
  amount: 0,
  currency: 'USDT',
  network: 'TRC20',
  txid: ''
})

// 提现相关
const withdrawData = ref({
  addressId: '',
  amount: 0
})

// 邀请码信息
const inviteCode = computed(() => {
  if (!user.value?.is_agent) return '请先成为AI代理'
  return user.value?.invite_code || '生成中...'
})

// Modal状态
const showSettingsModal = ref(false)
const showContactModal = ref(false)

// 代理相关状态
const becomingAgent = ref(false)

// 平台官方联系方式（从后端配置加载）
const platformContacts = ref({
  bilibili: 'https://space.bilibili.com/你的B站ID',
  youtube: 'https://youtube.com/@你的频道',
  telegram: 'https://t.me/你的群组',
  wechat: 'AI_TECH_2025',
  shipin: '搜索"AI空投计划"',
  tiktok: '@aitech_official'
})

// 联系信息展示
const contactInfo = ref({
  title: '',
  icon: '',
  name: '',
  account: '',
  note: ''
})

// 设置
const selectedLanguage = ref('zh')
const selectedTheme = ref('light')

// 复制邀请码
const copyInviteCode = async () => {
  if (!user.value?.is_agent || !user.value?.invite_code) {
    toast.error('您还没有邀请码，请先成为AI代理')
    return
  }
  
  try {
    // 只复制邀请码本身，去掉任何多余内容
    const code = user.value.invite_code.trim()
    await navigator.clipboard.writeText(code)
    toast.success('邀请码已复制到剪贴板')
  } catch (error) {
    toast.error('复制失败，请手动复制')
  }
}

// ✅ 邀请码输入相关
const showInviteCodeModal = ref(false)
const inviteCodeInput = ref('')

// 成为AI代理（加入Binary系统）
const becomeAgent = async () => {
  if (!user.value) return

  // ✅ 显示邀请码输入对话框
  showInviteCodeModal.value = true
}

// ✅ 确认成为代理（输入邀请码后）
const confirmBecomeAgent = async () => {
  if (!user.value) return

  // 验证邀请码
  if (!inviteCodeInput.value || inviteCodeInput.value.trim() === '') {
    toast.error('请输入邀请码')
    return
  }

  try {
    becomingAgent.value = true
    const result = await AgentService.becomeAgent(user.value.id, inviteCodeInput.value.trim())

    if (result.success) {
      toast.success('🎉 ' + (result.message || '成功成为AI代理！'))
      // 刷新用户数据
      await authStore.loadUser()
      // 关闭对话框
      showInviteCodeModal.value = false
      inviteCodeInput.value = ''
    } else {
      toast.error(result.error || '操作失败')
    }
  } catch (error: any) {
    toast.error(error.message || '操作失败')
    console.error('成为代理失败:', error)
  } finally {
    becomingAgent.value = false
  }
}

// 取消成为代理
const cancelBecomeAgent = () => {
  showInviteCodeModal.value = false
  inviteCodeInput.value = ''
}

// 显示联系信息
const showContactInfo = (type: string) => {
  const contacts: Record<string, any> = {
    wechat: {
      title: '💬 微信客服',
      icon: '💬',
      name: '微信号',
      account: platformContacts.value.wechat,
      note: '添加微信，备注"AI空投计划"'
    },
    shipin: {
      title: '🎬 微信视频号',
      icon: '🎬',
      name: '视频号',
      account: platformContacts.value.shipin,
      note: '在微信中搜索关注'
    },
    tiktok: {
      title: '🎵 国际抖音',
      icon: '🎵',
      name: 'TikTok账号',
      account: platformContacts.value.tiktok,
      note: '在TikTok中搜索关注'
    }
  }
  
  contactInfo.value = contacts[type] || {}
  showContactModal.value = true
}

// 关闭联系信息Modal
const closeContactModal = () => {
  showContactModal.value = false
}

// 复制联系方式
const copyContactInfo = async () => {
  try {
    await navigator.clipboard.writeText(contactInfo.value.account)
    toast.success('已复制到剪贴板')
  } catch (error) {
    toast.error('复制失败，请手动复制')
  }
}

// 从后端加载平台联系方式
const loadPlatformContacts = async () => {
  try {
    // 从system_config表加载平台联系方式
    const { data } = await supabase
      .from('system_config')
      .select('platform_contacts')
      .maybeSingle()
    
    if (data?.platform_contacts) {
      platformContacts.value = {
        ...platformContacts.value,
        ...data.platform_contacts
      }
    }
  } catch (error) {
    console.log('使用默认联系方式')
  }
}

// 切换语言
const changeLanguage = () => {
  // 实现语言切换逻辑
  toast.success('语言切换成功')
}

// 切换主题
const changeTheme = () => {
  // 实现主题切换逻辑
  toast.success('主题切换成功')
}

// 加载团队统计
const loadNetworkStats = async () => {
  try {
    const userId = user.value?.id
    if (!userId) return

    // 获取团队人数（可以从binary_members或其他表查询）
    const { data } = await supabase
      .from('users')
      .select('id')
      .eq('inviter_id', userId)
    
    networkCount.value = data?.length || 0
  } catch (error) {
    console.error('加载团队统计失败:', error)
  }
}

// 添加提现地址
const addAddress = () => {
  if (!newAddress.value.chain || !newAddress.value.label || !newAddress.value.address) {
    toast.error('请填写完整信息')
    return
  }

  // 简单的地址格式验证
  if (newAddress.value.address.length < 20) {
    toast.error('地址格式不正确')
    return
  }

  withdrawalAddresses.value.push({ ...newAddress.value })
  newAddress.value = { chain: 'TRC20', label: '', address: '' }
  showAddAddressModal.value = false
  toast.success('地址添加成功')
}

// 删除提现地址
const deleteAddress = (index: number) => {
  if (confirm('确定要删除这个地址吗？')) {
    withdrawalAddresses.value.splice(index, 1)
    toast.success('地址已删除')
  }
}

// 退出登录
const handleLogout = async () => {
  if (confirm('确定要退出登录吗？')) {
    await authStore.logout()
    router.push('/login')
    toast.success('已退出登录')
  }
}

// 复制地址
const copyAddress = async (address: string) => {
  try {
    await navigator.clipboard.writeText(address)
    alert('✅ 地址已复制')
  } catch (error) {
    alert('❌ 复制失败，请手动复制')
  }
}

// 提交充值
const submitRecharge = async () => {
  if (!rechargeData.value.amount || rechargeData.value.amount < (rechargeConfig.value?.min_amount || 10)) {
    alert(`请输入正确的充值金额（最低 ${rechargeConfig.value?.min_amount || 10} USDT）`)
    return
  }

  try {
    submitting.value = true
    const result = await RechargeService.createRecharge(rechargeData.value)
    
    if (result.success) {
      alert('✅ 充值申请已提交！\n\nAI自动审核中，稍等片刻...')
      showRechargeModal.value = false
      // 重置表单
      rechargeData.value = {
        amount: 0,
        currency: 'USDT',
        network: 'TRC20',
        txid: ''
      }
    } else {
      alert(`❌ 提交失败: ${result.error}`)
    }
  } catch (error: any) {
    alert(`❌ 提交失败: ${error.message}`)
  } finally {
    submitting.value = false
  }
}

// 提交提现
const submitWithdraw = async () => {
  if (!withdrawData.value.addressId) {
    alert('请选择提现地址')
    return
  }
  
  if (!withdrawData.value.amount || withdrawData.value.amount < 50) {
    alert('请输入正确的提现金额（最低 50 USDT）')
    return
  }

  if (withdrawData.value.amount > (user.value?.u_balance || 0)) {
    alert('余额不足')
    return
  }

  try {
    submitting.value = true
    const selectedAddress = withdrawalAddresses.value.find(a => a.id === withdrawData.value.addressId)
    
    const result = await WithdrawalService.createWithdrawal({
      amount: withdrawData.value.amount,
      address: selectedAddress?.address || '',
      chain: selectedAddress?.chain || 'TRC20'
    })
    
    if (result.success) {
      alert('✅ 提现申请已提交！\n\n预计24小时内到账')
      showWithdrawModal.value = false
      // 重置表单
      withdrawData.value = {
        addressId: '',
        amount: 0
      }
      // 刷新用户信息
      await authStore.refreshUser()
    } else {
      alert(`❌ 提交失败: ${result.error}`)
    }
  } catch (error: any) {
    alert(`❌ 提交失败: ${error.message}`)
  } finally {
    submitting.value = false
  }
}

// 加载充值配置
const loadRechargeConfig = async () => {
  rechargeConfig.value = await RechargeService.getRechargeConfig()
}

onMounted(() => {
  loadRechargeConfig()
  loadPlatformContacts()
  loadNetworkStats()
})
</script>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #fbbf24;
  border-radius: 3px;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: #f59e0b;
}
</style>
