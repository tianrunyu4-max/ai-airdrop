/**
 * ValidationException - 验证异常
 * 用于参数验证错误
 */

import { BaseException } from './BaseException'

export class ValidationException extends BaseException {
  constructor(message: string, field?: string, details?: any) {
    super(
      message,
      'VALIDATION_ERROR',
      400,
      { field, ...details }
    )
  }
}

// ========== 具体验证异常 ==========

/**
 * 必填参数缺失异常
 */
export class RequiredFieldException extends ValidationException {
  constructor(field: string) {
    super(`缺少必填参数: ${field}`, field)
  }
}

/**
 * 参数格式错误异常
 */
export class InvalidFormatException extends ValidationException {
  constructor(field: string, expected: string, actual: string) {
    super(
      `${field}格式错误，期望${expected}，实际${actual}`,
      field,
      { expected, actual }
    )
  }
}

/**
 * 参数范围错误异常
 */
export class OutOfRangeException extends ValidationException {
  constructor(field: string, min: number, max: number, actual: number) {
    super(
      `${field}超出范围，应在${min}-${max}之间，实际${actual}`,
      field,
      { min, max, actual }
    )
  }
}

/**
 * 参数长度错误异常
 */
export class InvalidLengthException extends ValidationException {
  constructor(field: string, min: number, max: number, actual: number) {
    super(
      `${field}长度错误，应在${min}-${max}字符，实际${actual}字符`,
      field,
      { min, max, actual }
    )
  }
}

/**
 * 参数类型错误异常
 */
export class InvalidTypeException extends ValidationException {
  constructor(field: string, expected: string, actual: string) {
    super(
      `${field}类型错误，期望${expected}，实际${actual}`,
      field,
      { expected, actual }
    )
  }
}

/**
 * 钱包地址格式错误异常
 */
export class InvalidWalletAddressException extends ValidationException {
  constructor(address: string) {
    super(
      '钱包地址格式错误，请输入有效的TRC20地址',
      'wallet_address',
      { address }
    )
  }
}









