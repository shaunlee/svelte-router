import { buildRouteMatcher } from '../lib/matcher'

describe('route matcher', () => {
  test('matches root routes directly', () => {
    const matchRoute = buildRouteMatcher([
      { path: '/', component: 'home' }
    ])

    expect(matchRoute('/')).toStrictEqual({
      component: 'home',
      params: {}
    })
  })

  test('matches static routes directly', () => {
    const matchRoute = buildRouteMatcher([
      { path: '/users/:id', component: 'user' },
      { path: '/about', component: 'about' }
    ])

    expect(matchRoute('/about')).toStrictEqual({
      component: 'about',
      params: {}
    })
  })

  test('matches keyed dynamic routes by segment count and first segment', () => {
    const matchRoute = buildRouteMatcher([
      { path: '/posts/:id', component: 'post' },
      { path: '/users/:id', component: 'user' },
      { path: '/:page', component: 'page' }
    ])

    expect(matchRoute('/users/42')).toStrictEqual({
      component: 'user',
      params: { id: '42' }
    })
  })

  test('preserves declaration order between keyed and fallback dynamic routes', () => {
    const matchRoute = buildRouteMatcher([
      { path: '/:section/:id', component: 'generic' },
      { path: '/users/:id', component: 'user' }
    ])

    expect(matchRoute('/users/42')).toStrictEqual({
      component: 'generic',
      params: { section: 'users', id: '42' }
    })
  })

  test('matches keyed dynamic routes before later fallback routes', () => {
    const matchRoute = buildRouteMatcher([
      { path: '/users/:id', component: 'user' },
      { path: '/:section/:id', component: 'generic' }
    ])

    expect(matchRoute('/users/42')).toStrictEqual({
      component: 'user',
      params: { id: '42' }
    })
  })

  test('keeps the first duplicate static route', () => {
    const matchRoute = buildRouteMatcher([
      { path: '/about', component: 'first' },
      { path: '/about', component: 'second' }
    ])

    expect(matchRoute('/about')).toStrictEqual({
      component: 'first',
      params: {}
    })
  })

  test('preserves wildcard precedence when declared before exact routes', () => {
    const matchRoute = buildRouteMatcher([
      { path: '*', component: 'fallback' },
      { path: '/users', component: 'users' }
    ])

    expect(matchRoute('/users')).toStrictEqual({
      component: 'fallback',
      params: {}
    })
  })

  test('preserves declaration order between static and dynamic routes', () => {
    const matchRoute = buildRouteMatcher([
      { path: '/users/:id', component: 'dynamic' },
      { path: '/users/new', component: 'static' }
    ])

    expect(matchRoute('/users/new')).toStrictEqual({
      component: 'dynamic',
      params: { id: 'new' }
    })
  })

  test('continues through keyed dynamic routes until one matches', () => {
    const matchRoute = buildRouteMatcher([
      { path: '/users/:id(\\d+)', component: 'id' },
      { path: '/users/:name', component: 'name' }
    ])

    expect(matchRoute('/users/shaun')).toStrictEqual({
      component: 'name',
      params: { name: 'shaun' }
    })
  })

  test('falls back to later static routes after dynamic misses', () => {
    const matchRoute = buildRouteMatcher([
      { path: '/:id(\\d+)', component: 'number' },
      { path: '/about', component: 'about' }
    ])

    expect(matchRoute('/about')).toStrictEqual({
      component: 'about',
      params: {}
    })
  })

  test('falls back to later static routes when no dynamic bucket can match', () => {
    const matchRoute = buildRouteMatcher([
      { path: '/users/:id', component: 'user' },
      { path: '/about', component: 'about' }
    ])

    expect(matchRoute('/about')).toStrictEqual({
      component: 'about',
      params: {}
    })
  })

  test('falls back to later wildcard routes after dynamic misses', () => {
    const matchRoute = buildRouteMatcher([
      { path: '/:id(\\d+)', component: 'number' },
      { path: '*', component: 'fallback' }
    ])

    expect(matchRoute('/about')).toStrictEqual({
      component: 'fallback',
      params: {}
    })
  })

  test('falls back to later wildcard routes when no keyed dynamic route can match', () => {
    const matchRoute = buildRouteMatcher([
      { path: '/users/:id', component: 'user' },
      { path: '*', component: 'fallback' }
    ])

    expect(matchRoute('/posts/1')).toStrictEqual({
      component: 'fallback',
      params: {}
    })
  })

  test('returns an empty match when no routes match', () => {
    const matchRoute = buildRouteMatcher([
      { path: '/:id(\\d+)', component: 'number' }
    ])

    expect(matchRoute('/about')).toStrictEqual({
      component: '',
      params: {}
    })
  })

  test('returns an empty match when only static routes miss', () => {
    const matchRoute = buildRouteMatcher([
      { path: '/about', component: 'about' }
    ])

    expect(matchRoute('/missing')).toStrictEqual({
      component: '',
      params: {}
    })
  })

  test('returns an empty match for root when no root route matches', () => {
    const matchRoute = buildRouteMatcher([
      { path: '/:page', component: 'page' }
    ])

    expect(matchRoute('/')).toStrictEqual({
      component: '',
      params: {}
    })
  })
})
