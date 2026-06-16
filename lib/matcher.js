import * as patterns from './pattern'

const emptyParams = {}
const emptyRouteList = []

const getRouteKey = (path) => {
  if (path === '/' || !path) {
    return {
      segmentCount: 0,
      firstSegment: ''
    }
  }

  let segmentCount = 0
  let firstSegment = ''
  let segmentStart = -1

  for (let i = 0; i <= path.length; i += 1) {
    const char = path[i]

    if (char === '/' || i === path.length) {
      if (segmentStart !== -1) {
        segmentCount += 1

        if (!firstSegment) {
          const segment = path.slice(segmentStart, i)
          if (!segment.startsWith(':') && segment !== '*') {
            firstSegment = segment
          }
        }

        segmentStart = -1
      }

      continue
    }

    if (segmentStart === -1) {
      segmentStart = i
    }
  }

  return {
    segmentCount,
    firstSegment
  }
}

const createDynamicBucket = () => ({
  keyed: new Map(),
  fallback: []
})

const pushKeyedRoute = (bucket, firstSegment, route) => {
  const routes = bucket.keyed.get(firstSegment)

  if (routes) {
    routes.push(route)
    return
  }

  bucket.keyed.set(firstSegment, [route])
}

const nextDynamicRoute = (keyedRoutes, fallbackRoutes, keyedIndex, fallbackIndex) => {
  const keyedRoute = keyedRoutes[keyedIndex]
  const fallbackRoute = fallbackRoutes[fallbackIndex]

  if (!keyedRoute) return fallbackRoute
  if (!fallbackRoute) return keyedRoute
  return keyedRoute.order < fallbackRoute.order ? keyedRoute : fallbackRoute
}

const createMatch = (route) => ({
  component: route.component,
  params: emptyParams
})

const getStaticOrWildcardMatch = (staticRoute, staticOrder, wildcardRoute, wildcardOrder) => {
  if (staticOrder < wildcardOrder) {
    return createMatch(staticRoute)
  }

  if (wildcardOrder < staticOrder) {
    return createMatch(wildcardRoute)
  }

  return {
    component: '',
    params: emptyParams
  }
}

export function buildRouteMatcher(routes) {
  const staticRoutes = new Map()
  const dynamicBuckets = new Map()
  const wildcardRoutes = []
  let firstDynamicOrder = Infinity

  routes.forEach((route, order) => {
    if (route.path === '*') {
      wildcardRoutes.push({
        order,
        component: route.component
      })
      return
    }

    if (route.path.indexOf(':') === -1) {
      if (!staticRoutes.has(route.path)) {
        staticRoutes.set(route.path, {
          order,
          component: route.component
        })
      }
      return
    }

    const pattern = patterns.build(route.path)
    firstDynamicOrder = Math.min(firstDynamicOrder, order)
    const { segmentCount, firstSegment } = getRouteKey(route.path)
    const bucket = dynamicBuckets.get(segmentCount) ?? createDynamicBucket()
    const compiledRoute = {
      order,
      component: route.component,
      match(path) {
        const found = pattern.exec(path)
        if (!found) return null
        return { ...found.groups }
      }
    }

    dynamicBuckets.set(segmentCount, bucket)

    if (firstSegment) {
      pushKeyedRoute(bucket, firstSegment, compiledRoute)
      return
    }

    bucket.fallback.push(compiledRoute)
  })

  return (path) => {
    const staticRoute = staticRoutes.get(path)
    const staticOrder = staticRoute?.order ?? Infinity
    const wildcardRoute = wildcardRoutes[0]
    const wildcardOrder = wildcardRoute?.order ?? Infinity

    if (staticOrder < firstDynamicOrder && staticOrder < wildcardOrder) {
      return {
        component: staticRoute.component,
        params: emptyParams
      }
    }

    if (wildcardOrder < firstDynamicOrder && wildcardOrder < staticOrder) {
      return createMatch(wildcardRoute)
    }

    if (firstDynamicOrder === Infinity) {
      return getStaticOrWildcardMatch(staticRoute, staticOrder, wildcardRoute, wildcardOrder)
    }

    const { segmentCount, firstSegment } = getRouteKey(path)
    const bucket = dynamicBuckets.get(segmentCount)

    if (!bucket) {
      return getStaticOrWildcardMatch(staticRoute, staticOrder, wildcardRoute, wildcardOrder)
    }

    const keyedRoutes = bucket.keyed.get(firstSegment) ?? emptyRouteList
    const fallbackRoutes = bucket.fallback

    if (keyedRoutes.length === 0 && fallbackRoutes.length === 0) {
      return getStaticOrWildcardMatch(staticRoute, staticOrder, wildcardRoute, wildcardOrder)
    }

    let keyedIndex = 0
    let fallbackIndex = 0

    while (true) {
      const dynamicRoute = nextDynamicRoute(keyedRoutes, fallbackRoutes, keyedIndex, fallbackIndex)
      const dynamicOrder = dynamicRoute?.order ?? Infinity

      if (staticOrder < dynamicOrder && staticOrder < wildcardOrder) {
        return {
          component: staticRoute.component,
          params: emptyParams
        }
      }

      if (wildcardOrder < dynamicOrder && wildcardOrder < staticOrder) {
        return {
          component: wildcardRoute.component,
          params: emptyParams
        }
      }

      if (dynamicRoute) {
        if (dynamicRoute === keyedRoutes[keyedIndex]) {
          keyedIndex += 1
        } else {
          fallbackIndex += 1
        }

        const params = dynamicRoute.match(path)
        if (params !== null) {
          return {
            component: dynamicRoute.component,
            params
          }
        }

        continue
      }

      return {
        component: '',
        params: emptyParams
      }
    }
  }
}
