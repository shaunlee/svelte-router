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

import { createAnchor, createClickEvent, installBrowserEnv } from './browser.test-utils'

const loadRouteModule = () => {
  jest.resetModules()
  return require('../lib/route')
}

describe('link action', () => {
  test('intercepts internal clicks and updates active classes', () => {
    installBrowserEnv('http://localhost/app/')
    const { createRouter, link } = loadRouteModule()

    createRouter({
      base: '/app',
      routes: [
        { path: '/', component: 'home' },
        { path: '/docs', component: 'docs' }
      ]
    })

    const home = createAnchor({ href: '/' })
    const docs = createAnchor({ href: '/docs' })

    const homeAction = link(home, { activeClass: 'active', exactActiveClass: 'exact' })
    const docsAction = link(docs, { activeClass: 'active', exactActiveClass: 'exact' })
    const event = createClickEvent()

    expect(home.classList.contains('active')).toBe(true)
    expect(home.classList.contains('exact')).toBe(true)
    expect(docs.classList.contains('active')).toBe(false)

    docs.trigger('click', event)

    expect(event.preventDefault).toHaveBeenCalled()
    expect(history.pushState).toHaveBeenCalledWith({}, '', 'http://localhost/app/docs')
    expect(home.classList.contains('active')).toBe(false)
    expect(home.classList.contains('exact')).toBe(false)
    expect(docs.classList.contains('active')).toBe(true)
    expect(docs.classList.contains('exact')).toBe(true)

    homeAction.destroy()
    docsAction.destroy()
  })

  test('uses replace navigation when the attribute is present', () => {
    installBrowserEnv('http://localhost/app/')
    const { createRouter, link } = loadRouteModule()

    createRouter({
      base: '/app',
      routes: [
        { path: '/', component: 'home' },
        { path: '/docs', component: 'docs' }
      ]
    })

    const anchor = createAnchor({ href: '/docs', attrs: { replace: true } })
    const action = link(anchor)

    anchor.trigger('click', createClickEvent())

    expect(history.replaceState).toHaveBeenCalledWith({}, '', 'http://localhost/app/docs')
    expect(history.pushState).not.toHaveBeenCalled()

    action.destroy()
  })

  test('does not intercept external links, downloads, or modified clicks', () => {
    installBrowserEnv('http://localhost/app/')
    const { createRouter, link } = loadRouteModule()

    createRouter({
      base: '/app',
      routes: [
        { path: '/', component: 'home' }
      ]
    })

    const external = createAnchor({ href: 'https://example.com/docs' })
    const download = createAnchor({ href: '/file.zip', attrs: { download: true } })
    const blank = createAnchor({ href: '/docs', target: '_blank' })

    const externalAction = link(external, { activeClass: 'active', exactActiveClass: 'exact' })
    const downloadAction = link(download)
    const blankAction = link(blank)

    const externalClick = createClickEvent()
    const modifiedClick = createClickEvent({ metaKey: true })
    const blankClick = createClickEvent()

    external.trigger('click', externalClick)
    download.trigger('click', modifiedClick)
    blank.trigger('click', blankClick)

    expect(externalClick.preventDefault).not.toHaveBeenCalled()
    expect(modifiedClick.preventDefault).not.toHaveBeenCalled()
    expect(blankClick.preventDefault).not.toHaveBeenCalled()
    expect(history.pushState).not.toHaveBeenCalled()
    expect(external.classList.contains('active')).toBe(false)

    externalAction.destroy()
    downloadAction.destroy()
    blankAction.destroy()
  })

  test('updates active class names when link attrs change', () => {
    installBrowserEnv('http://localhost/app/docs')
    const { createRouter, link } = loadRouteModule()

    createRouter({
      base: '/app',
      routes: [
        { path: '/docs', component: 'docs' }
      ]
    })

    const anchor = createAnchor({ href: '/docs' })
    const action = link(anchor, { active: 'active-old', exactActive: 'exact-old' })

    expect(anchor.classList.contains('active-old')).toBe(true)
    expect(anchor.classList.contains('exact-old')).toBe(true)

    action.update({ activeClass: 'active-new', exactActiveClass: 'exact-new' })

    expect(anchor.classList.contains('active-old')).toBe(false)
    expect(anchor.classList.contains('exact-old')).toBe(false)
    expect(anchor.classList.contains('active-new')).toBe(true)
    expect(anchor.classList.contains('exact-new')).toBe(true)

    action.update()

    expect(anchor.classList.contains('active-new')).toBe(false)
    expect(anchor.classList.contains('exact-new')).toBe(false)
    expect(anchor.classList.contains('active')).toBe(true)
    expect(anchor.classList.contains('exact-active')).toBe(true)

    action.destroy()
  })
})
