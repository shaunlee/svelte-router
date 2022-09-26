import { writable } from 'svelte/store'

const config = {
  base: '',
  mode: ''
}

const currentHref = writable(location.href)

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
    currentHref.set(path)
  }
}

router.replace = (path) => {
  router.push(path, { replace: true })
}

export function createRouter({ routes, base, mode }) {
  if (mode !== 'hash' && base && base.endsWith('/')) base = base.slice(0, -1)
  config.base = base ?? ''
  config.mode = mode ?? 'web'

  buildPatterns(routes)

  currentHref.subscribe(state => {
    const url = new URL(state)

    let [pathname, search] = (mode === 'hash')
      ? url.hash.slice(1).split('?')
      : [url.pathname.replace(config.base, ''), url.search]

    let params = {}

    const found = routes.find(e => {
      if (e.pattern instanceof RegExp) {
        const m = pathname.match(e.pattern)
        if (!m) return false
        params = { ...m.groups }
        return true
      }
      return e.pattern === pathname
    })

    router.set({
      component: found ? found.component : '',
      path: pathname,
      query: Object.fromEntries(new URLSearchParams(search).entries()),
      params
    })
  })

  window.addEventListener('popstate', () => currentHref.set(location.href))

  return router
}

export function link(node, attrs = {}) {
  attrs.active ??= 'active'
  attrs.exactActive ??= 'exact-active'

  const url = new URL(node.href)

  if (config.mode === 'hash') {
    node.href = url.origin + config.base + '#' + url.pathname + url.search
  } else if (config.base) {
    node.href = url.origin + config.base + url.pathname + url.search
  }

  const unsubscribe = currentHref.subscribe(state => {
    const [nodeUrl, stateUrl] = [new URL(node.href), new URL(state)]
    const [l, r] = (config.mode === 'hash')
      ? [nodeUrl.hash.slice(1).split('?').shift(), stateUrl.hash.slice(1).split('?').shift()]
      : [nodeUrl.pathname, stateUrl.pathname]

    if (l !== (config.mode !== 'hash' ? config.base : '') + '/' && r.startsWith(l)) {
      node.classList.add(attrs.active)
    } else {
      node.classList.remove(attrs.active)
    }
    if (l === r) {
      node.classList.add(attrs.exactActive)
    } else {
      node.classList.remove(attrs.exactActive)
    }
  })

  function go(e) {
    e.preventDefault()
    router.push(e.target.href, { replace: !!node.attributes.replace })
  }
  node.addEventListener('click', go)
  return {
    destroy() {
      node.removeEventListener('click', go)
      unsubscribe()
    }
  }
}

function buildPatterns(routes) {
  // console.time('build patterns')
  for (const route of routes) {
    if (route.path === '*') {
      route.pattern = /^.*$/
    } else if (route.path.indexOf(':') === -1) {
      route.pattern = route.path
    } else {
      route.pattern = new RegExp('^' + route.path.split('/').map(e => {
        if (e.startsWith(':')) {
          let field = e.substr(1)
          let fieldPattern = '[^/]+'
          const ef = field.match(/\((.+?)\)/)
          if (ef) {
            field = field.substr(0, field.indexOf('('))
            fieldPattern = ef[1]
          }
          return `(?<${field}>${fieldPattern})`
        }
        return e
      }).join('/') + '$')
    }
  }
  // console.table(routes)
  // console.timeEnd('build patterns')
}

export function urlQuery(path, query = {}, opts = { overwrite: true}) {
  let guess = path.split('?')
  path = guess[0]
  let params = new URLSearchParams(guess[1] || '')
  if (guess.length > 1) {
    for (const [key, value] of new URLSearchParams(query)) {
      (opts.overwrite ? params.set : params.append).call(params, key, value)
    }
  }
  const paramsString = params.toString()
  if (paramsString) {
    path = path + '?' + paramsString
  }
  return path
}
