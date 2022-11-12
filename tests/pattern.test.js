import * as patterns from '../lib/pattern'

describe('patterns', () => {
  test('build static path', () => {
    const path = '/hello/world'
    expect(patterns.build(path)).toBe(path)
  })

  test('build dynamic path', () => {
    expect(patterns.build('/hello/:name'))
      .toStrictEqual(/^\/hello\/(?<name>[^/]+)$/)
  })

  test('build match all for not found', () => {
    expect(patterns.build('*')).toStrictEqual(/^.*$/)
  })

  test('build dynamic path with regex', () => {
    expect(patterns.build('/users/:id(\\d+)'))
      .toStrictEqual(/^\/users\/(?<id>\d+)$/)
  })

  test('matches', () => {
    expect(patterns.match('/hello/world', patterns.build('/hello/world'))).toBe(true)
    expect(patterns.match('/hello/world', patterns.build('/hello/:name'))).toStrictEqual({name: 'world'})
    expect(patterns.match('/users/123', patterns.build('/users/:id(\\d+)'))).toStrictEqual({id: '123'})
    expect(patterns.match('/users/someone', patterns.build('/users/:id(\\d+)'))).toBe(false)
  })
})
