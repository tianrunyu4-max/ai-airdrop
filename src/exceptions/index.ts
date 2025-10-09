/**
 * Exceptions - 统一导出所有异常
 */

export * from './BaseException'
export * from './BusinessException'
export * from './ValidationException'

// 使用示例：
// import { InsufficientBalanceException, RequiredFieldException } from '@/exceptions'
// throw new InsufficientBalanceException(100, 50)


