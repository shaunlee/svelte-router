import { config, router } from './route'

export function activity(node, classes = {}) {
  const activeClass = classes.activeClass || 'active'
  const exactActiveClass = classes.exactActiveClass || 'exact-active'

  const unsubscribe = router.subscribe(() => {
    const activePath = location.href.replace(/#\//, '')
      .split('?').shift().replace(location.origin, '')

    let targetPath = node.href.split('?').shift().replace(location.origin, '')
    if (!targetPath.startsWith(config.base)) targetPath = config.base + targetPath

    if (activePath === targetPath) {
      node.classList.add(exactActiveClass)
    } else {
      node.classList.remove(exactActiveClass)
    }
    if (
      activePath.startsWith(targetPath)
      && !(targetPath === config.base + '/' && activePath !== targetPath)
    ) {
      node.classList.add(activeClass)
    } else {
      node.classList.remove(activeClass)
    }
  })

  return {
    destroy() {
      unsubscribe()
    }
  }
}
