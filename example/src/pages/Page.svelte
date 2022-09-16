<script>
  import { router } from '@shaun/svelterouter'
</script>

<h1>Page {$router.query.page || 1}</h1>
