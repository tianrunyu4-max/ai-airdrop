/**
 * Controllers - 统一导出所有Controller
 */

export { BaseController, type ApiResponse } from './BaseController'
export { UserController } from './UserController'
export { BinaryController } from './BinaryController'
export { TransferController } from './TransferController'
export { WithdrawalController } from './WithdrawalController'
export { MiningController } from './MiningController'

// 使用示例：
// import { UserController, BinaryController } from '@/controllers'
// 
// // 获取用户信息
// const result = await UserController.getProfile(userId)
// if (result.success) {
//   console.log(result.data)
// } else {
//   console.error(result.error)
// }




































