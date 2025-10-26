/**
 * BaseException - 基础异常类
 */

export class BaseException extends Error {
  public readonly code: string
  public readonly statusCode: number
  public readonly timestamp: string
  public readonly details?: any

  constructor(
    message: string,
    code: string = 'UNKNOWN_ERROR',
    statusCode: number = 500,
    details?: any
  ) {
    super(message)
    this.name = this.constructor.name
    this.code = code
    this.statusCode = statusCode
    this.timestamp = new Date().toISOString()
    this.details = details

    // 保持正确的堆栈跟踪
    Error.captureStackTrace(this, this.constructor)
  }

  /**
   * 转换为JSON格式
   */
  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      statusCode: this.statusCode,
      timestamp: this.timestamp,
      details: this.details
    }
  }

  /**
   * 转换为用户友好的消息
   */
  toUserMessage(): string {
    return this.message
  }
}









































