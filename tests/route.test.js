import { buildRouteMatcher } from '../lib/matcher'

describe('route matcher', () => {
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
})
