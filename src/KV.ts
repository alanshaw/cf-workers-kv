import { AsyncMapLike } from 'async-map-like'

type ListKey = { name: string, expiration?: number | undefined, metadata?: unknown }
type ValueType = 'text'|'json'|'arrayBuffer'|'stream'

type GetOptions = ValueType | { type?: ValueType, cacheTtl?: number }
type PutOptions = { expiration?: string | number | undefined, expirationTtl?: string | number | undefined, metadata?: any }
type ListOptions = { prefix?: string | undefined, limit?: number | undefined, cursor?: string | undefined }

export type ValueAndMeta = { value: string, metadata: any | null }

export class KV implements KVNamespace {
  private readonly data: Map<string, ValueAndMeta> | AsyncMapLike<string, ValueAndMeta>

  constructor (backend: Map<string, ValueAndMeta> | AsyncMapLike<string, ValueAndMeta>) {
    this.data = backend
  }

  get(key: string, options?: {cacheTtl?: number}): KVValue<string>
  get(key: string, type: 'text'): KVValue<string>
  get<ExpectedValue = unknown>(key: string, type: 'json'): KVValue<ExpectedValue>
  get(key: string, type: 'arrayBuffer'): KVValue<ArrayBuffer>
  get(key: string, type: 'stream'): KVValue<ReadableStream>
  get(key: string, options?: {
    type: 'text',
    cacheTtl?: number
  }): KVValue<string>
  get<ExpectedValue = unknown>(key: string, options?: {
    type: 'json',
    cacheTtl?: number
  }): KVValue<ExpectedValue>
  get(key: string, options?: {
    type: 'arrayBuffer',
    cacheTtl?: number
  }): KVValue<ArrayBuffer>
  get(key: string, options?: {
    type: 'stream',
    cacheTtl?: number
  }): KVValue<ReadableStream>
  async get(key: string, options?: GetOptions): KVValue<any> {
    const data = await this.data.get(key)
    if (!data) return null
    const { value } = data
    const type = typeof options === 'string'
      ? options
      : options && options.type
      ? options.type
      : 'text'
    if (type === 'text') return value
    if (type === 'json') return JSON.parse(value)
    throw new Error(`type not supported: ${type}`)
  }

  getWithMetadata<Metadata = unknown>(key: string): KVValueWithMetadata<string, Metadata>
  getWithMetadata<Metadata = unknown>(key: string, type: 'text'): KVValueWithMetadata<string, Metadata>
  getWithMetadata<ExpectedValue = unknown, Metadata = unknown>(key: string, type: 'json'): KVValueWithMetadata<ExpectedValue, Metadata>
  getWithMetadata<Metadata = unknown>(key: string, type: 'arrayBuffer'): KVValueWithMetadata<ArrayBuffer, Metadata>
  getWithMetadata<Metadata = unknown>(key: string, type: 'stream'): KVValueWithMetadata<ReadableStream, Metadata>
  async getWithMetadata<Metadata = unknown>(key: string, type?: ValueType): KVValueWithMetadata<any, Metadata> {
    const data = await this.data.get(key)
    if (!data) return { value: null, metadata: null }
    const { value, metadata } = data
    type = type || 'text'
    if (type === 'text') return { value, metadata }
    if (type === 'json') return { value: JSON.parse(value), metadata }
    throw new Error(`type not supported: ${type}`)
  }

  async put(key: string, value: string | ArrayBuffer | ReadableStream | FormData, options?: PutOptions): Promise<void> {
    if (typeof value !== 'string') throw new Error('value type not supported')
    if (options != null && (options.expiration != null || options.expirationTtl != null)) {
      throw new Error('expiration and TTL not supported')
    }
    await this.data.set(key, { value, metadata: options && options.metadata ? options.metadata : null })
  }

  async delete(key: string): Promise<void> {
    await this.data.delete(key)
  }

  async list(options?: ListOptions): Promise<{ keys: ListKey[], list_complete: boolean, cursor?: string | undefined }> {
    options = options || {}
    const prefix = options.prefix || ''
    const limit = options.limit == null ? 1000 : options.limit
    const skip = options.cursor ? parseInt(options.cursor) : 0
    const allKeys: Array<[string, ValueAndMeta]> = []
    for await (const e of this.data.entries()) {
      allKeys.push(e)
    }
    const filteredKeys = prefix ? allKeys.filter(([k]) => k.startsWith(prefix)) : allKeys
    const keys = filteredKeys
      .sort((a, b) => a[0] === b[0] ? 0 : a[0] < b[0] ? -1 : 1)
      .slice(skip, skip + limit)
      .map(([name, { metadata }]) => ({ name, metadata }))
    const complete = skip + limit >= allKeys.length
    const cursor = complete ? undefined : `${skip + limit}`
    return { keys, list_complete: complete, cursor }
  }
}
