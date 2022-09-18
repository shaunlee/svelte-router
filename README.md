# Svelte Router

Another vue-router inspired Svelte router

## Installation

### npm

```bash
npm install @shaun/svelterouter
```

### yarn

```bash
yarn add @shaun/svelterouter
```

## Getting Started

```html
<script>
  import { createRouter, Link, View } from '@shaun/svelterouter'
  import Home from './Home.svelte'
  import User from './User.svelte'
  import NotFound from './NotFound.svelte'

  const routes = [
    { path: '/', component: Home },
    { path: '/users/:userId(\\d+)', component: User },
    { path: '*', component: NotFound }
  ]

  const router = createRouter({ routes })
</script>

<Link href="/">Home</Link>
<Link href="/users/123">Someone</Link>
<Link href="/users/321" replace>Replace to someone else's page</Link>
<Link href="/not-exists">To page not exists</Link>
<button type="button" on:click={() => router.push('/users/123')}>Click to someone's page</button>
<button type="button" on:click={() => router.replace('/users/321')}>Click replace to someone else's page</button>

<View></View>
```

User.svelte

```html
<script>
  export let userId // take router params
</script>

<div>User ID: {userId}</div>
```

## Example

[https://github.com/shaunlee/svelterouter/tree/master/example](https://github.com/shaunlee/svelterouter/tree/master/example)

## License

Licensed under [MIT](https://github.com/shaunlee/svelterouter/blob/master/LICENSE)
