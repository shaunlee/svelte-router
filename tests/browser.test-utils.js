export const installBrowserEnv = (startHref = 'http://localhost/') => {
  let currentURL = new URL(startHref)
  const listeners = new Map()

  const window = {
    addEventListener(type, handler) {
      const handlers = listeners.get(type) ?? new Set()
      handlers.add(handler)
      listeners.set(type, handlers)
    },
    removeEventListener(type, handler) {
      listeners.get(type)?.delete(handler)
    },
    dispatchEvent(event) {
      for (const handler of listeners.get(event.type) ?? []) {
        handler(event)
      }
    }
  }

  const location = {
    get href() {
      return currentURL.href
    },
    set href(value) {
      currentURL = new URL(value, currentURL.href)
    },
    get origin() {
      return currentURL.origin
    },
    replace: jest.fn((value) => {
      location.href = value
    })
  }

  const history = {
    pushState: jest.fn((_, __, value) => {
      location.href = value
    }),
    replaceState: jest.fn((_, __, value) => {
      location.href = value
    })
  }

  global.window = window
  global.location = location
  global.history = history

  return {
    history,
    location,
    window,
    navigate(value) {
      location.href = value
    },
    emit(type) {
      window.dispatchEvent({ type })
    }
  }
}

const createClassList = () => {
  const classes = new Set()

  return {
    add(...tokens) {
      for (const token of tokens) {
        classes.add(token)
      }
    },
    remove(...tokens) {
      for (const token of tokens) {
        classes.delete(token)
      }
    },
    toggle(token, force) {
      if (force === undefined) {
        if (classes.has(token)) {
          classes.delete(token)
          return false
        }

        classes.add(token)
        return true
      }

      if (force) {
        classes.add(token)
        return true
      }

      classes.delete(token)
      return false
    },
    contains(token) {
      return classes.has(token)
    },
    values() {
      return [...classes]
    }
  }
}

export const createAnchor = ({
  href = '/',
  target = '',
  attrs = {}
} = {}) => {
  let currentHref = href
  const listeners = new Map()

  return {
    get href() {
      return new URL(currentHref, location.href).href
    },
    set href(value) {
      currentHref = value
    },
    get target() {
      return target
    },
    set target(value) {
      target = value
    },
    classList: createClassList(),
    addEventListener(type, handler) {
      listeners.set(type, handler)
    },
    removeEventListener(type, handler) {
      if (listeners.get(type) === handler) {
        listeners.delete(type)
      }
    },
    hasAttribute(name) {
      return !!attrs[name]
    },
    trigger(type, event) {
      listeners.get(type)?.(event)
    }
  }
}

export const createClickEvent = (overrides = {}) => {
  const event = {
    altKey: false,
    button: 0,
    ctrlKey: false,
    defaultPrevented: false,
    metaKey: false,
    shiftKey: false,
    preventDefault: jest.fn(() => {
      event.defaultPrevented = true
    }),
    ...overrides
  }

  return event
}
