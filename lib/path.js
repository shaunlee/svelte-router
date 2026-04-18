export const isActivePath = (currentPath, targetPath) => {
  if (targetPath === '/') {
    return currentPath === '/'
  }

  return currentPath === targetPath || currentPath.startsWith(targetPath + '/')
}
