<script>
  import { link } from './route'

  export let href
  export let activeClass = 'active'
  export let exactActiveClass = 'exact-active'
</script>

<a use:link={{activeClass, exactActiveClass}} {href} {...$$restProps}><slot></slot></a>
