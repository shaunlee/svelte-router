<script>
  import { createRouter, urlQuery, Link, View } from '@shaun/svelterouter'

  import Home from './pages/Home.svelte'
  import Hello from './pages/Hello.svelte'
  import Page from './pages/Page.svelte'

  const routes = [
    { path: '/', component: Home },
    { path: '/hello', component: Hello },
    { path: '/hello/:name', component: Hello },
    { path: '/page', component: Page },
  ]
  const router = createRouter({ routes, base: '/demo/' })
</script>

<section class="fixed inset-0 flex flex-row relative">
  <aside class="flex-none w-64 h-full">
    <ul class="p-4 flex flex-col space-y-1">
      <li>
        <Link href="/" class="text-blue-400 hover:underline" activeClass="text-blue-800">Home</Link>
      </li>
      <li>
        <Link href="/hello" class="text-blue-400 hover:underline" activeClass="text-blue-800">Hello</Link>
      </li>
      <li>
        <Link href="/hello/word" class="text-blue-400 hover:underline" activeClass="text-blue-800">Hello world</Link>
      </li>
      <li>
        <a use:link href="/hello/link" class="text-blue-400 hover:underline">Hello link</a>
      </li>
      <li>
        <Link href="/page" class="text-blue-400 hover:underline" activeClass="text-blue-800">Page 1</Link>
      </li>
      <li>
        <Link href="/page?page=2" class="text-blue-400 hover:underline" activeClass="text-blue-800">Page 2</Link>
      </li>
      <li>
        <Link href="/hello/replace" replace class="text-blue-400 hover:underline" activeClass="text-blue-800">Replace</Link>
      </li>
      <li>
        <button type="button" on:click={() => router.push('/hello/xyz?a=b', { page: 10 })} class="px-2 py-1 border rounded text-blue-400 hover:bg-blue-100">Go to</button>
      </li>
      <li>
        <button type="button" on:click={() => router.replace('/hello/xyz')} class="px-2 py-1 border rounded text-blue-400 hover:bg-blue-100">Replace to</button>
      </li>
      <li>
        <Link href={urlQuery('/page?a=b&page=1', { page: 10 })} class="text-blue-400 hover:underline" activeClass="text-blue-800">Page 10</Link>
      </li>
    </ul>
  </aside>
  <main class="flex-1">
    <div class="p-4">
      <div class="pb-4">{JSON.stringify($router)}</div>
      <View></View>
    </div>
  </main>
</section>
