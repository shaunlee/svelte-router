import { isActivePath } from '../lib/path'

describe('path helpers', () => {
  test('matches exact paths', () => {
    expect(isActivePath('/hello', '/hello')).toBe(true)
  })

  test('matches child paths only on segment boundaries', () => {
    expect(isActivePath('/hello/world', '/hello')).toBe(true)
    expect(isActivePath('/hello-world', '/hello')).toBe(false)
  })

  test('treats root as active only on the root page', () => {
    expect(isActivePath('/', '/')).toBe(true)
    expect(isActivePath('/hello', '/')).toBe(false)
  })
})
