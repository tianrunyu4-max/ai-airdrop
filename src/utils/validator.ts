/**
 * Validator - 数据验证工具
 */

import { REGEX } from '@/config'
import {
  RequiredFieldException,
  InvalidFormatException,
  OutOfRangeException,
  InvalidLengthException,
  InvalidWalletAddressException
} from '@/exceptions'

export class Validator {
  /**
   * 验证必填字段
   */
  static required(value: any, fieldName: string): void {
    if (value === undefined || value === null || value === '') {
      throw new RequiredFieldException(fieldName)
    }
  }

  /**
   * 验证多个必填字段
   */
  static requiredFields(data: Record<string, any>, fields: string[]): void {
    for (const field of fields) {
      this.required(data[field], field)
    }
  }

  /**
   * 验证用户名
   */
  static username(username: string): void {
    this.required(username, 'username')
    
    if (!REGEX.USERNAME.test(username)) {
      throw new InvalidFormatException(
        'username',
        '4-20位字母数字下划线',
        username
      )
    }
  }

  /**
   * 验证密码
   */
  static password(password: string): void {
    this.required(password, 'password')
    
    if (!REGEX.PASSWORD.test(password)) {
      throw new InvalidFormatException(
        'password',
        '6-20位',
        `${password.length}位`
      )
    }
  }

  /**
   * 验证邀请码
   */
  static inviteCode(code: string): void {
    this.required(code, 'invite_code')
    
    if (!REGEX.INVITE_CODE.test(code)) {
      throw new InvalidFormatException(
        'invite_code',
        '8位大写字母数字',
        code
      )
    }
  }

  /**
   * 验证钱包地址
   */
  static walletAddress(address: string): void {
    this.required(address, 'wallet_address')
    
    if (!REGEX.TRC20_ADDRESS.test(address)) {
      throw new InvalidWalletAddressException(address)
    }
  }

  /**
   * 验证数值范围
   */
  static range(
    value: number,
    fieldName: string,
    min: number,
    max: number
  ): void {
    this.required(value, fieldName)
    
    if (value < min || value > max) {
      throw new OutOfRangeException(fieldName, min, max, value)
    }
  }

  /**
   * 验证字符串长度
   */
  static length(
    value: string,
    fieldName: string,
    min: number,
    max: number
  ): void {
    this.required(value, fieldName)
    
    if (value.length < min || value.length > max) {
      throw new InvalidLengthException(fieldName, min, max, value.length)
    }
  }

  /**
   * 验证正数
   */
  static positive(value: number, fieldName: string): void {
    this.required(value, fieldName)
    
    if (value <= 0) {
      throw new OutOfRangeException(fieldName, 0, Infinity, value)
    }
  }

  /**
   * 验证非负数
   */
  static nonNegative(value: number, fieldName: string): void {
    this.required(value, fieldName)
    
    if (value < 0) {
      throw new OutOfRangeException(fieldName, 0, Infinity, value)
    }
  }

  /**
   * 验证邮箱
   */
  static email(email: string): void {
    this.required(email, 'email')
    
    if (!REGEX.EMAIL.test(email)) {
      throw new InvalidFormatException('email', '有效的邮箱地址', email)
    }
  }

  /**
   * 验证手机号
   */
  static phone(phone: string): void {
    this.required(phone, 'phone')
    
    if (!REGEX.PHONE.test(phone)) {
      throw new InvalidFormatException('phone', '有效的手机号', phone)
    }
  }
}
































