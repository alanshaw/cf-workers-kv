# cf-workers-kv

[![Build Status](https://travis-ci.com/alanshaw/cf-workers-kv.svg?branch=main)](https://travis-ci.com/alanshaw/cf-workers-kv)
[![dependencies Status](https://status.david-dm.org/gh/alanshaw/cf-workers-kv.svg)](https://david-dm.org/alanshaw/cf-workers-kv)

Cloudflare workers KV with customizable backing store for testing.

## Install

```sh
npm install cf-workers-kv
```

## Usage

```js
import { KV } from 'cf-workers-kv'

// In memory map backend, also supports AsyncMapLike inerface for backing stores
// with async get/put etc. https://npm.im/async-map-like
const backend = new Map()
const fruits = new KV(backend)

const key = 'apple:grannysmith'
const value = { name: 'Granny Smith', type: 'apple', color: 'green' }
const metadata = { name: 'Granny Smith' }

await fruits.put(key, JSON.stringify(value), { metadata })

const apple = await fruits.get(key, 'json')
console.log(apple) // { name: 'Granny Smith', type: 'apple', color: 'green' }

const apples = await fruits.list({ prefix: 'apple:' })
console.log(apples) // { keys: [{ name: 'apple:grannysmith', metadata: { name: 'Granny Smith' } }], list_complete: true }

await fruits.delete(key)
```

## API

See [Cloudflare Workers Runtime API docs](https://developers.cloudflare.com/workers/runtime-apis/kv).

## Contribute

Feel free to dive in! [Open an issue](https://github.com/alanshaw/cf-workers-kv/issues/new) or submit PRs.

## License

[MIT](LICENSE) © Alan Shaw
