# Svelte Router

Another vue-router inspired Svelte router

## Installation

### npm

```bash
npm install @shaun/svelte-router
```

### bun

```bash
bun add @shaun/svelte-router
```

### yarn

```bash
yarn add @shaun/svelte-router
```

## Getting Started

```html
<script>
  import { createRouter, link, Link, View } from '@shaun/svelte-router'
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
<a use:link href="/users/111">a link with action</a>
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

## Link Behavior

### Active and exact active classes

`<Link>` accepts `activeClass` and `exactActiveClass` props. They default to `active` and `exact-active`.

```html
<Link
  href="/users"
  activeClass="is-active"
  exactActiveClass="is-exact-active"
>
  Users
</Link>
```

`activeClass` is applied when the current route is the same path or a child path segment.
For example, `/users` is active for `/users/123`, but not for `/users-old`.

### External links

The `link` action and `<Link>` only intercept same-origin app navigation.
External URLs, `target="_blank"`, `download`, and modified clicks such as Cmd/Ctrl-click keep their native browser behavior.

## Example

[example](./example)

## Dynamic Route Matching with Params

Very often we will need to map routes with the given pattern to the same component. For example we may have a `User` component which should be rendered for all users but with different user IDs. In `@shaun/svelte-router` we can use a dynamic segment in the path to achieve that, we call that a param:

```javascript
import User from './User.svelte'

// these are passed to `createRouter`
const routes = [
  // dynamic segments start with a colon
  { path: '/users/:id', component: User },
]
```

Now URLs like `/users/johnny` and `/users/jolyne` will both map to the same route.

A param is denoted by a colon `:`. When a route is matched, the value of its params will be exposed as `$router.params`. Therefore, we can render the current user ID by updating User's template to this:

```html
<script>
  import { router } from '@shaun/svelte-router'
</script>

<div>User ID: {$router.params.id}</div>
```

The same:

```html
<script>
  export let id
</script>

<div>User ID: {id}</div>
```

You can have multiple params in the same route, and they will map to corresponding fields on `$router.params`. Examples:

| pattern | matched path | $router.params |
| --- | --- | --- |
| /users/:username | /users/eduardo | `{ username: 'eduardo' }` |
| /users/:username/posts/:postId | /users/eduardo/posts/123 | `{ username: 'eduardo', postId: '123' }` |

In addition to `$router.params`, the `$router` object also exposes other useful information such as `$router.query` (if there is a query in the URL), `$router.path`, etc.

## Routes' Matching Syntax

Most applications will use static routes like `/about` and dynamic routes like `/users/:userId` like we just saw in Dynamic Route Matching, but `@shaun/svelte-router` has much more to offer!

### Custom regex in params

When defining a param like `:userId`, we internally use the following regex `([^/]+)` (at least one character that isn't a slash `/`) to extract params from URLs.
This works well unless you need to differentiate two routes based on the param content. Imagine two routes `/:orderId` and `/:productName`, both would match the exact same URLs, so we need a way to differentiate them.
The easiest way would be to add a static section to the path that differentiates them:

```javascript
const routes = [
  // matches /o/3549
  { path: '/o/:orderId' },
  // matches /p/books
  { path: '/p/:productName' },
]
```

But in some scenarios we don't want to add that static section `/o/p`. However, `orderId` is always a number while `productName` can be anything, so we can specify a custom regex for a param in parentheses:

```javascript
const routes = [
  // /:orderId -> matches only numbers
  { path: '/:orderId(\\d+)' },
  // /:productName -> matches anything else
  { path: '/:productName' },
]
```

Now, going to `/25` will match `/:orderId` while going to anything else will match `/:productName`, as long as the more specific numeric route is declared first.

> **TIP**
> Make sure to escape backslashes (`\`) like we did with `\d` (becomes `\\d`) to actually pass the backslash character in a string in JavaScript.

### Route order

When more than one route can match the same path, the first matching route in the `routes` array wins.
Put more specific routes before broader fallback routes:

```javascript
const routes = [
  { path: '/:orderId(\\d+)', component: Order },
  { path: '/:productName', component: Product },
  { path: '*', component: NotFound },
]
```

### Matcher benchmark

The matcher indexes static routes and dynamic routes separately, then preserves route declaration order when multiple routes could match the same path.

Local microbenchmark, comparing the current matcher against the previous matcher implementation:

| Scenario | Before | After | Ratio |
| --- | ---: | ---: | ---: |
| Static route, static declared before dynamics | 68.375 ms | 15.332 ms | 4.46x faster |
| Wildcard route, wildcard declared before dynamics | 147.088 ms | 19.379 ms | 7.59x faster |
| Static route, dynamics declared before static | 35.993 ms | 36.140 ms | ~same |
| Dense dynamic miss then fallback dynamic match | 1555.587 ms | 1485.975 ms | 1.05x faster |

These numbers are median timings from 12 runs. The fast path helps most when declaration order allows a static or wildcard route to return before dynamic route candidates need to be checked.

## Programmatic Navigation

Aside from using `<Link>` to create anchor tags for declarative navigation, we can do this programmatically using the router's instance methods.

### Navigate to a different location

To navigate to a different URL, use `router.push`. This method pushes a new entry into the history stack, so when the user clicks the browser back button they will be taken to the previous URL.

This is the method called internally when you click a `<Link>`, so clicking `<Link href="...">` is the equivalent of calling `router.push(...)`.

| Declarative | Programmatic |
| --- | --- |
| `<Link href="...">` | `router.push(...)` |

The first argument is a path or URL string. The optional second argument is an object that will be merged into the query string. Examples:

```javascript
router.push('/users/eduardo')

router.push('/users?page=2')
router.push('/users', { page: 2 })
router.push('https://example.com/docs')
```

### Replace current location

It acts like `router.push`, the only difference is that it navigates without pushing a new history entry, as its name suggests - it replaces the current entry.

| Declarative | Programmatic |
| --- | --- |
| `<Link href="..." replace>` | `router.replace('...')` |

### History Manipulation

You may have noticed that `router.push` and `router.replace` are counterparts of `window.history.pushState` and `window.history.replaceState`, and they do imitate those browser APIs for in-app navigation.

Therefore, if you are already familiar with [Browser History APIs](https://developer.mozilla.org/en-US/docs/Web/API/History_API), manipulating history will feel familiar when using `@shaun/svelte-router`.

It is worth mentioning that `@shaun/svelte-router` navigation methods (`push` and `replace`) work consistently no matter the kind of `mode` option is passed when creating the router instance.

## Base Path

If your app is deployed under a subfolder, set the same base path in your router and your build tool.

```javascript
import { createRouter } from '@shaun/svelte-router'

const router = createRouter({
  base: '/demo',
  routes: [
    // ...
  ]
})
```

With Vite, build with the same base:

```bash
vite build --base=/demo/
```

You can also use `urlQuery()` to build links that respect the current router base:

```javascript
import { urlQuery } from '@shaun/svelte-router'

const href = urlQuery('/page?page=1', { page: 10 })
```

## Different History modes

The `mode` option when creating the router instance allows us to choose among different history modes.

### Hash Mode

The hash history mode is created with `'hash'`:

```javascript
import { createRouter } from '@shaun/svelte-router'

const router = createRouter({
  mode: 'hash',
  routes: [
    // ...
  ]
})
```

It uses a hash character (`#`) before the actual URL that is internally passed. Because this section of the URL is never sent to the server, it doesn't require any special treatment on the server level. It does however have a bad impact in SEO. If that's a concern for you, use the HTML5 history mode.

### HTML5 Mode

The HTML5 mode is created with `'web'` and is the recommended mode:

```javascript
import { createRouter } from '@shaun/svelte-router'

const router = createRouter({
  mode: 'web',
  routes: [
    // ...
  ]
})
```

When using `'web'`, the URL will look "normal," e.g. `https://example.com/user/id`. Beautiful!

Here comes a problem, though: Since our app is a single page client side app, without a proper server configuration, the users will get a 404 error if they access `https://example.com/user/id` directly in their browser. Now that's ugly.

Not to worry: To fix the issue, all you need to do is add a simple catch-all fallback route to your server. If the URL doesn't match any static assets, it should serve the same `index.html` page that your app lives in. Beautiful, again!

## Example Server Configurations

Note: The following examples assume you are serving your app from the root folder. If you deploy to a subfolder, you should use the `vite build --base=/prefix/` and the related base property of the router.
You also need to adjust the examples below to use the subfolder instead of the root folder (e.g. replacing RewriteBase `/` with RewriteBase `/name-of-your-subfolder/`).

### Apache

```apacheconf
<IfModule mod_negotiation.c>
  Options -MultiViews
</IfModule>

<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>
```

Instead of `mod_rewrite`, you could also use [`FallbackResource`](https://httpd.apache.org/docs/2.2/mod/mod_dir.html#fallbackresource).

### nginx

```nginx
location / {
  try_files $uri $uri/ /index.html;
}
```

### Caddy v2

```
try_files {path} /
```

### Firebase hosting

Add this to your `firebase.json`:

```json
{
  "hosting": {
    "public": "dist",
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ]
  }
}
```

## License

Licensed under [MIT](https://github.com/shaunlee/svelte-router/blob/master/LICENSE)
