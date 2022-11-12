import { writable } from 'svelte/store'
import * as patterns from './pattern'
import { RouterURL } from './url'

const config = {
  base: '',
  mode: ''
}

const getTargetURL = (href) => new RouterURL(href, config)

const state = writable(location.href)

export const router = writable({
  component: '',
  path: '',
  query: {},
  params: {}
})

router.push = (path, options = {}) => {
  if (!path.startsWith(location.origin)) {
    if (config.mode === 'hash') {
      path = location.origin + (config.base || '/') + '#' + path
    } else {
      path = location.origin + config.base + path
    }
  }

  if (location.href !== path) {
    history[options.replace ? 'replaceState' : 'pushState']({}, '', path)
    state.set(path)
  }
}

router.replace = (path) => {
  router.push(path, { replace: true })
}

export function createRouter({ routes, base, mode }) {
  if (mode !== 'hash' && base && base.endsWith('/')) base = base.slice(0, -1)
  config.base = base ?? ''
  config.mode = mode ?? 'web'

  for (const route of routes) {
    route.pattern = patterns.build(route.path)
  }

  state.subscribe(href => {
    const url = new RouterURL(href, config)
    const path = url.path
    const query = url.query

    let component = ''
    let params = {}

    for (const route of routes) {
      const found = patterns.match(path, route.pattern)
      if (found) {
        component = route.component
        params = found === true ? {} : found
        break
      }
    }

    router.set({ component, path, query, params })
  })

  window.addEventListener('popstate', () => state.set(location.href))

  return router
}

export function link(el, attrs = {}) {
  attrs.active ??= 'active'
  attrs.exactActive ??= 'exact-active'

  const url = getTargetURL(el.href)
  el.href = url.resolve(url.path, url.query, true).url

  const unsubscribe = state.subscribe(href => {
    const stateUrl = getTargetURL(href)

    el.classList.toggle(attrs.active, stateUrl.path.startsWith(url.path))
    el.classList.toggle(attrs.exactActive, url.path === stateUrl.path)
  })

  function go(e) {
    e.preventDefault()
    router.push(el.href, { replace: !!el.attributes.replace })
  }
  el.addEventListener('click', go)
  return {
    destroy() {
      el.removeEventListener('click', go)
      unsubscribe()
    }
  }
}

export const urlQuery = (path, query = {}) =>
  new RouterURL(location.href, config).resolve(path, query).url
