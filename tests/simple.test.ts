import { describe, it, expect } from 'vitest'

// 简单的测试，验证测试框架是否工作
describe('测试框架验证', () => {
  it('应该通过基本的算术测试', () => {
    expect(1 + 1).toBe(2)
  })

  it('应该通过字符串测试', () => {
    expect('hello').toBe('hello')
  })

  it('应该通过对象测试', () => {
    const obj = { name: 'test', value: 100 }
    expect(obj.name).toBe('test')
    expect(obj.value).toBe(100)
  })
})






