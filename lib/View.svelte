<script>
  import { router } from './route'
</script>

<svelte:component this={$router.component} {...$router.params}/>
