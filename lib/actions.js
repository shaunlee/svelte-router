import { config, router } from './route'

export function activity(node, classes = {}) {
  const activeClass = classes.activeClass || 'active'
  const exactActiveClass = classes.exactActiveClass || 'exact-active'
  const isHash = config.mode === 'hash'

  const unsubscribe = router.subscribe(() => {
    const activePath = isHash ? location.hash.split('?').shift().substring(1) : location.pathname
    const target = new URL(node.href)
    const targetPath = isHash ? target.hash.split('?').shift().substring(1) : target.pathname
    // console.log({ activePath, targetPath })

    if (activePath === targetPath) {
      node.classList.add(exactActiveClass)
    } else {
      node.classList.remove(exactActiveClass)
    }
    if (
      activePath.startsWith(targetPath)
      && !(targetPath === (isHash ? '' : config.base) + '/' && activePath !== targetPath)
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
