import { writable } from 'svelte/store'
import { buildRouteMatcher } from './matcher'
import { isActivePath } from './path'
import { RouterURL } from './url'

const config = {
  base: '',
  mode: 'web'
}

const emptyQuery = {}
const emptyParams = {}
const links = new Set()
let routeMatcher = buildRouteMatcher([])
let currentPath = ''
let isListening = false

const normalizeBase = (base, mode) =>
  mode !== 'hash' && base && base.endsWith('/') ? base.slice(0, -1) : (base ?? '')

const hasScheme = (value) => /^[a-zA-Z][a-zA-Z\d+.-]*:/.test(value)
const isAbsoluteURL = (value) => value.startsWith('//') || hasScheme(value)
const getAbsoluteURL = (value) => new URL(value, location.href)
const buildURL = (href) => new RouterURL(href, config)
const isExternalURL = (href) => getAbsoluteURL(href).origin !== location.origin

const buildPath = (path) => {
  if (path.startsWith(location.origin) || isAbsoluteURL(path)) {
    return path
  }

  return config.mode === 'hash'
    ? location.origin + (config.base || '/') + '#' + path
    : location.origin + config.base + path
}

const resolveTarget = (path, query = {}) => {
  if (isAbsoluteURL(path)) {
    const target = getAbsoluteURL(path)
    if (target.origin !== location.origin) {
      return target.href
    }

    const url = buildURL(target.href)
    return url.resolve(url.path, query).url
  }

  const url = buildURL(buildPath(path))
  return url.resolve(url.path, query).url
}

const updateLink = ({ el, activeClass, exactActiveClass, path }) => {
  if (path === null) {
    el.classList.remove(activeClass, exactActiveClass)
    return
  }

  el.classList.toggle(activeClass, isActivePath(currentPath, path))
  el.classList.toggle(exactActiveClass, path === currentPath)
}

const refreshLinks = () => {
  for (const entry of links) {
    updateLink(entry)
  }
}

const syncRouter = (href) => {
  const url = buildURL(href)
  const path = url.path
  const query = url.query
  const match = routeMatcher(path)

  currentPath = path

  router.set({
    component: match.component,
    path,
    query,
    params: match.params
  })

  refreshLinks()
}

const ensureListening = () => {
  if (isListening) return

  window.addEventListener('popstate', () => syncRouter(location.href))
  isListening = true
}

const resolveLinkAttrs = (attrs = {}) => ({
  activeClass: attrs.activeClass ?? attrs.active ?? 'active',
  exactActiveClass: attrs.exactActiveClass ?? attrs.exactActive ?? 'exact-active'
})

export const router = writable({
  component: '',
  path: '',
  query: emptyQuery,
  params: emptyParams
})

router.push = (path, query = {}) => {
  const target = resolveTarget(path, query)

  if (isExternalURL(target)) {
    location.href = target
    return
  }

  if (location.href !== target) {
    history.pushState({}, '', target)
    syncRouter(target)
  }
}

router.replace = (path, query = {}) => {
  const target = resolveTarget(path, query)

  if (isExternalURL(target)) {
    location.replace(target)
    return
  }

  if (location.href !== target) {
    history.replaceState({}, '', target)
    syncRouter(target)
  }
}

export function createRouter({ routes, base, mode }) {
  config.mode = mode ?? 'web'
  config.base = normalizeBase(base, config.mode)
  routeMatcher = buildRouteMatcher(routes)

  ensureListening()
  syncRouter(location.href)

  return router
}

export function link(el, attrs = {}) {
  const entry = {
    el,
    activeClass: 'active',
    exactActiveClass: 'exact-active',
    path: ''
  }

  const update = (nextAttrs = {}) => {
    const prevActiveClass = entry.activeClass
    const prevExactActiveClass = entry.exactActiveClass
    const normalized = resolveLinkAttrs(nextAttrs)
    entry.activeClass = normalized.activeClass
    entry.exactActiveClass = normalized.exactActiveClass

    if (isExternalURL(el.href)) {
      entry.path = null
    } else {
      const url = buildURL(el.href)
      el.href = url.resolve(url.path, url.query, true).url
      entry.path = url.path
    }

    if (prevActiveClass !== entry.activeClass) {
      el.classList.remove(prevActiveClass)
    }
    if (prevExactActiveClass !== entry.exactActiveClass) {
      el.classList.remove(prevExactActiveClass)
    }

    updateLink(entry)
  }

  const go = (e) => {
    if (
      e.defaultPrevented ||
      e.button !== 0 ||
      e.metaKey ||
      e.ctrlKey ||
      e.shiftKey ||
      e.altKey ||
      (el.target && el.target !== '_self') ||
      el.hasAttribute('download') ||
      entry.path === null
    ) {
      return
    }

    e.preventDefault()
    router[el.hasAttribute('replace') ? 'replace' : 'push'](el.href)
  }

  links.add(entry)
  update(attrs)
  el.addEventListener('click', go)

  return {
    update,
    destroy() {
      el.removeEventListener('click', go)
      links.delete(entry)
      el.classList.remove(entry.activeClass, entry.exactActiveClass)
    }
  }
}

export const urlQuery = (path, query = {}) =>
  resolveTarget(path, query)
