import { writable } from 'svelte/store'

export let config = {
  mode: 'hash', // hash, web
  base: '',
  routes: []
}

export const router = writable({
  path: '',
  component: '',
  params: {},
  query: {}
})

router.push = (path, query = {}, opts = { overwrite: true }) => {
  path = config.base + (config.mode === 'hash' ? '#' : '') + path
  history.pushState({}, '', urlQuery(path, query, opts.overwrite))
  updateState()
}

router.replace = (path, query = {}, opts = { overwrite: true }) => {
  path = config.base + (config.mode === 'hash' ? '#' : '') + path
  history.replaceState({}, '', urlQuery(path, query, opts.overwrite))
  updateState()
}

router.go = (n) => window.history.go(n)
router.forward = window.history.go(1)
router.back = window.history.go(-1)

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

function buildPatterns() {
  // console.time('build patterns')
  for (const route of config.routes) {
    if (route.path === '*') {
      route.pattern = /.*/
    } else {
      if (config.base && config.mode === 'web') {
        route.path = config.base + route.path
      }
      const pattern = route.path.split('/').map(e => {
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
      }).join('/')
      route.pattern = new RegExp(`^${pattern}$`)
    }
  }
  // console.table(config.routes)
  // console.timeEnd('build patterns')
}

function parseWebPathQuery() {
  return {
    path: document.location.pathname,
    query: Object.fromEntries(
      new URLSearchParams(document.location.search).entries()
    )
  }
}

function parseHashPathQuery() {
  const hash = document.location.hash.substr(1)
  let path = hash, query = {}, n = hash.indexOf('?')

  if (n > -1) {
    path = hash.substring(0, n)
    query = Object.fromEntries(
      new URLSearchParams(hash.substring(n)).entries()
    )
  }

  return { path, query }
}

export function updateState() {
  // console.time('update state')
  const { path, query } = config.mode === 'hash'
    ? parseHashPathQuery()
    : parseWebPathQuery()
  // console.log(path, query)

  for (const route of config.routes) {
    const found = path.match(route.pattern)
    if (found) {
      // console.log({ found, path, pattern: route.pattern })
      router.set({
        path,
        component: route.component,
        params: { ...found.groups },
        query,
      })
      break
    }
  }
  // console.timeEnd('update state')
}

export function createRouter({ routes, mode = config.mode, base = config.base }) {
  console.assert((routes || []).length > 0, 'routes should not be empty')
  console.assert(['hash', 'web'].indexOf(mode) > -1, 'invalid mode:', mode)
  console.assert(base === '' || base.startsWith('/'), 'base should be empty or starts with /', base)

  config = { ...config, routes, mode, base }

  buildPatterns()

  if (config.mode === 'hash') {
    !document.location.hash
      && window.history.replaceState({}, '', '#' + routes[0].path)
  } else {
    [base, base + '/'].indexOf(document.location.pathname) > -1
      && document.location.pathname !== routes[0].path
      && window.history.replaceState({}, '', routes[0].path)
  }

  window.addEventListener('popstate', () => updateState())

  updateState()

  return router
}
