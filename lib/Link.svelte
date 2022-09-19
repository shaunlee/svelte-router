<script>
  import { config, updateState } from './route'
  import { activity } from './actions'

  export let href
  export let replace = false
  export let activeClass = 'active'
  export let exactActiveClass = 'exact-active'

  if (config.mode === 'hash') href = '#' + href
  if (!href.startsWith(config.base)) href = config.base + href

  function go() {
    let path = location.href.replace(location.origin, '')
    if (config.mode === 'hash') path = path.substring(location.pathname.length)

    if (path != href) {
      replace
        ? history.replaceState({}, '', href)
        : history.pushState({}, '', href)

      updateState()
    }
  }
</script>

<a {href} on:click|preventDefault={go} {...$$restProps} use:activity={{activeClass, exactActiveClass}}><slot></slot></a>
