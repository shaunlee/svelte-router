export class RouterURL {
  #url
  #path = ''
  #query = {}

  constructor(url, opts = {}) {
    this.mode = opts.mode ?? 'web'
    this.base = opts.base ?? ''
    this.url = url
  }

  set url (val) {
    this.#url = new URL(val)
    this.#sync()
  }

  get url () {
    return this.#url.href
  }

  get path () {
    return this.#path
  }

  get query () {
    return this.#query
  }

  resolve (path, params, replace = false) {
    const l = this.#url.origin + this.base + (this.mode === 'hash' ? '#' : '') + path
    const r = replace
      ? new URLSearchParams(params).toString()
      : new URLSearchParams({ ...this.query, ...params }).toString()
    this.url = l + (r ? '?' + r : '')
    return this
  }

  #sync () {
    if (this.mode === 'hash' && this.#url.hash) {
      const [path = '', query = ''] = this.#url.hash.slice(1).split('?')
      this.#path = path
      this.#query = query ? Object.fromEntries(new URLSearchParams(query)) : {}
      return
    }

    this.#path = this.base && this.#url.pathname.startsWith(this.base)
      ? this.#url.pathname.slice(this.base.length)
      : this.#url.pathname
    this.#query = this.#url.search
      ? Object.fromEntries(new URLSearchParams(this.#url.search.slice(1)))
      : {}
  }
}
