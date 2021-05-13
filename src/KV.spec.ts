import test from 'ava'
import { KV } from './KV.js'

const apple = {
  key: 'apple:grannysmith',
  value: { name: 'Granny Smith', type: 'apple', color: 'green' },
  metadata: { name: 'Granny Smith' }
}

test('basics', async t => {
  const fruits = new KV(new Map())

  await fruits.put(apple.key, JSON.stringify(apple.value), { metadata: apple.metadata })

  const appleValue = await fruits.get<typeof apple.value>(apple.key, 'json')
  t.deepEqual(appleValue, apple.value)

  const appleMeta = await fruits.getWithMetadata<typeof apple.value, typeof apple.metadata>(apple.key, 'json')
  t.deepEqual(appleMeta.value, apple.value)
  t.deepEqual(appleMeta.metadata, apple.metadata)

  const apples = await fruits.list({ prefix: 'apple:' })
  t.is(apples.keys.length, 1)
  t.is(apples.keys[0].name, apple.key)
  t.deepEqual(apples.keys[0].metadata, apple.metadata)
  t.true(apples.list_complete)

  await fruits.delete(apple.key)
  const deletedValue = await fruits.get(apple.key)
  t.is(deletedValue, null)

  const deletedMeta = await fruits.getWithMetadata(apple.key)
  t.is(deletedMeta.value, null)
  t.is(deletedMeta.metadata, null)
})

test('put and get text', async t => {
  const fruits = new KV(new Map())

  await fruits.put(apple.key, JSON.stringify(apple.value), { metadata: apple.metadata })

  const appleValue = await fruits.get(apple.key)
  t.is(appleValue, JSON.stringify(apple.value))

  const appleMeta = await fruits.getWithMetadata(apple.key)
  t.deepEqual(appleMeta.value, JSON.stringify(apple.value))
  t.deepEqual(appleMeta.metadata, apple.metadata)
})

test('list prefix', async t => {
  const kv = new KV(new Map())
  await kv.put('fruit:1', JSON.stringify({ type: 'fruit' }), { metadata: { type: 'fruit' } })
  await kv.put('veg:1', JSON.stringify({ type: 'veg' }), { metadata: { type: 'veg' } })
  const fruits = await kv.list({ prefix: 'fruit:' })
  t.is(fruits.keys.length, 1)
  t.is(fruits.keys[0].name, 'fruit:1')
  t.deepEqual(fruits.keys[0].metadata, { type: 'fruit' })
  t.true(fruits.list_complete)
})

test('list limit', async t => {
  const kv = new KV(new Map())
  await kv.put('fruit:1', JSON.stringify({ type: 'fruit' }), { metadata: { type: 'fruit' } })
  await kv.put('fruit:2', JSON.stringify({ type: 'fruit' }), { metadata: { type: 'fruit' } })
  await kv.put('fruit:3', JSON.stringify({ type: 'fruit' }), { metadata: { type: 'fruit' } })
  const fruits = await kv.list({ limit: 2 })
  t.is(fruits.keys.length, 2)
  t.false(fruits.list_complete)
})

test('list cursor', async t => {
  const kv = new KV(new Map())
  await kv.put('fruit:1', JSON.stringify({ type: 'fruit' }), { metadata: { type: 'fruit' } })
  await kv.put('fruit:2', JSON.stringify({ type: 'fruit' }), { metadata: { type: 'fruit' } })
  await kv.put('fruit:3', JSON.stringify({ type: 'fruit' }), { metadata: { type: 'fruit' } })
  let fruits = await kv.list({ limit: 2 })
  t.is(fruits.keys.length, 2)
  t.false(fruits.list_complete)
  fruits = await kv.list({ limit: 2, cursor: fruits.cursor })
  t.is(fruits.keys.length, 1)
  t.true(fruits.list_complete)
})
