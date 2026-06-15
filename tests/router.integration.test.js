jest.mock('svelte/store', () => ({
  writable(initialValue) {
    let value = initialValue
    const subscribers = new Set()

    return {
      set(nextValue) {
        value = nextValue
        for (const subscriber of subscribers) {
          subscriber(value)
        }
      },
      subscribe(subscriber) {
        subscriber(value)
        subscribers.add(subscriber)
        return () => {
          subscribers.delete(subscriber)
        }
      }
    }
  }
}))

import { installBrowserEnv } from './browser.test-utils'

const loadRouteModule = () => {
  jest.resetModules()
  return require('../lib/route')
}

describe('router integration', () => {
  test('syncs the initial route and responds to popstate', () => {
    const browser = installBrowserEnv('http://localhost/app/users/1?tab=profile')
    const { createRouter, router } = loadRouteModule()

    createRouter({
      base: '/app',
      routes: [
        { path: '/users/:id', component: 'user' },
        { path: '*', component: 'fallback' }
      ]
    })

    let currentState
    const unsubscribe = router.subscribe((value) => {
      currentState = value
    })

    expect(currentState).toStrictEqual({
      component: 'user',
      path: '/users/1',
      query: { tab: 'profile' },
      params: { id: '1' }
    })

    browser.navigate('http://localhost/app/missing?page=2')
    browser.emit('popstate')

    expect(currentState).toStrictEqual({
      component: 'fallback',
      path: '/missing',
      query: { page: '2' },
      params: {}
    })

    unsubscribe()
  })

  test('pushes and replaces internal urls in hash mode', () => {
    installBrowserEnv('http://localhost/app#/hello/world?a=1')
    const { createRouter, router } = loadRouteModule()

    createRouter({
      base: '/app',
      mode: 'hash',
      routes: [
        { path: '/hello/:name', component: 'hello' }
      ]
    })

    let currentState
    router.subscribe((value) => {
      currentState = value
    })

    router.push('/hello/svelte', { page: 2 })

    expect(history.pushState).toHaveBeenCalledWith({}, '', 'http://localhost/app#/hello/svelte?page=2')
    expect(currentState).toStrictEqual({
      component: 'hello',
      path: '/hello/svelte',
      query: { page: '2' },
      params: { name: 'svelte' }
    })

    router.replace('http://localhost/app#/hello/router?tab=api', { page: 3 })

    expect(history.replaceState).toHaveBeenCalledWith({}, '', 'http://localhost/app#/hello/router?tab=api&page=3')
    expect(currentState).toStrictEqual({
      component: 'hello',
      path: '/hello/router',
      query: { tab: 'api', page: '3' },
      params: { name: 'router' }
    })
  })

  test('uses native navigation for external urls', () => {
    installBrowserEnv('http://localhost/app/')
    const { createRouter, router } = loadRouteModule()

    createRouter({
      base: '/app',
      routes: [
        { path: '/', component: 'home' }
      ]
    })

    router.push('https://example.com/docs')
    expect(location.href).toBe('https://example.com/docs')
    expect(history.pushState).not.toHaveBeenCalled()

    router.replace('mailto:test@example.com')
    expect(location.replace).toHaveBeenCalledWith('mailto:test@example.com')
    expect(history.replaceState).not.toHaveBeenCalled()
  })

  test('resolves absolute same-origin urls and exported query urls', () => {
    installBrowserEnv('http://localhost/app/?page=1')
    const { createRouter, router, urlQuery } = loadRouteModule()

    createRouter({
      base: '/app',
      routes: [
        { path: '/', component: 'home' },
        { path: '/docs', component: 'docs' }
      ]
    })

    let currentState
    router.subscribe((value) => {
      currentState = value
    })

    router.push('http://localhost/app/docs?tab=api', { page: 2 })

    expect(history.pushState).toHaveBeenCalledWith({}, '', 'http://localhost/app/docs?tab=api&page=2')
    expect(currentState).toStrictEqual({
      component: 'docs',
      path: '/docs',
      query: { tab: 'api', page: '2' },
      params: {}
    })
    expect(urlQuery('/docs', { tab: 'guide' })).toBe('http://localhost/app/docs?tab=guide')
  })

  test('normalizes web base and avoids duplicate navigation to the current url', () => {
    installBrowserEnv('http://localhost/app/docs')
    const { createRouter, router } = loadRouteModule()

    createRouter({
      base: '/app/',
      routes: [
        { path: '/docs', component: 'docs' }
      ]
    })
    createRouter({
      base: '/app/',
      routes: [
        { path: '/docs', component: 'docs' }
      ]
    })

    router.push('/docs')
    router.replace('/docs')

    expect(history.pushState).not.toHaveBeenCalled()
    expect(history.replaceState).not.toHaveBeenCalled()
  })

  test('resolves hash urls without a base or explicit query', () => {
    installBrowserEnv('http://localhost/')
    const { createRouter, urlQuery } = loadRouteModule()

    createRouter({
      mode: 'hash',
      routes: [
        { path: '/', component: 'home' }
      ]
    })

    expect(urlQuery('/docs')).toBe('http://localhost/#/docs')
  })
})
