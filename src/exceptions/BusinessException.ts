/**
 * BusinessException - 业务异常
 * 用于业务逻辑错误，如余额不足、权限不够等
 */

import { BaseException } from './BaseException'

export class BusinessException extends BaseException {
  constructor(message: string, code: string = 'BUSINESS_ERROR', details?: any) {
    super(message, code, 400, details)
  }
}

// ========== 具体业务异常 ==========

/**
 * 余额不足异常
 */
export class InsufficientBalanceException extends BusinessException {
  constructor(required: number, current: number) {
    super(
      `余额不足，当前余额${current}U，需要${required}U`,
      'INSUFFICIENT_BALANCE',
      { required, current }
    )
  }
}

/**
 * 用户不存在异常
 */
export class UserNotFoundException extends BusinessException {
  constructor(identifier: string) {
    super(
      `用户不存在: ${identifier}`,
      'USER_NOT_FOUND',
      { identifier }
    )
  }
}

/**
 * 用户名已存在异常
 */
export class UsernameExistsException extends BusinessException {
  constructor(username: string) {
    super(
      `用户名已存在: ${username}`,
      'USERNAME_EXISTS',
      { username }
    )
  }
}

/**
 * 邀请码无效异常
 */
export class InvalidInviteCodeException extends BusinessException {
  constructor(inviteCode: string) {
    super(
      `邀请码无效: ${inviteCode}`,
      'INVALID_INVITE_CODE',
      { inviteCode }
    )
  }
}

/**
 * 账户冻结异常
 */
export class AccountFrozenException extends BusinessException {
  constructor(reason?: string) {
    super(
      `账户已冻结${reason ? `: ${reason}` : ''}`,
      'ACCOUNT_FROZEN',
      { reason }
    )
  }
}

/**
 * 权限不足异常
 */
export class PermissionDeniedException extends BusinessException {
  constructor(action: string) {
    super(
      `没有权限执行此操作: ${action}`,
      'PERMISSION_DENIED',
      { action }
    )
  }
}

/**
 * 重复操作异常
 */
export class DuplicateOperationException extends BusinessException {
  constructor(operation: string) {
    super(
      `重复操作: ${operation}`,
      'DUPLICATE_OPERATION',
      { operation }
    )
  }
}

/**
 * 操作限制异常
 */
export class OperationLimitException extends BusinessException {
  constructor(operation: string, limit: number, current: number) {
    super(
      `${operation}超过限制，限制${limit}次，当前${current}次`,
      'OPERATION_LIMIT',
      { operation, limit, current }
    )
  }
}

/**
 * 数据不存在异常
 */
export class DataNotFoundException extends BusinessException {
  constructor(dataType: string, identifier: string) {
    super(
      `${dataType}不存在: ${identifier}`,
      'DATA_NOT_FOUND',
      { dataType, identifier }
    )
  }
}

/**
 * 状态错误异常
 */
export class InvalidStateException extends BusinessException {
  constructor(currentState: string, requiredState: string) {
    super(
      `当前状态为${currentState}，需要${requiredState}`,
      'INVALID_STATE',
      { currentState, requiredState }
    )
  }
}






































