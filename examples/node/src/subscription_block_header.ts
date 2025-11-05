import { AvailError, Client, TURING_ENDPOINT } from "avail-js"
import { BlockHeaderSub } from "avail-js/subscription"

async function main() {
  const client = await Client.create(TURING_ENDPOINT)
  if (client instanceof AvailError) throw client

  // By default it subscribes to finalized block
  const sub1 = new BlockHeaderSub(client);
  const nextHeader1 = await sub1.next()
  const prevHeader1 = await sub1.prev()
  if (nextHeader1 instanceof AvailError) throw nextHeader1
  if (nextHeader1 == null) throw "No Header was found"
  if (prevHeader1 instanceof AvailError) throw prevHeader1
  if (prevHeader1 == null) throw "No Header was found"
  console.log(`Finalized Next:      Block Height: ${nextHeader1.number}, Block Hash: ${nextHeader1.hash.toHex()}`)
  console.log(`Finalized Previous:  Block Height: ${prevHeader1.number}, Block Hash: ${prevHeader1.hash.toHex()}`)

  // Best Block
  const sub2 = new BlockHeaderSub(client);
  sub2.useBestBlock(true)
  const nextHeader2 = await sub2.next()
  const prevHeader2 = await sub2.prev()
  if (nextHeader2 instanceof AvailError) throw nextHeader2
  if (nextHeader2 == null) throw "No Header was found"
  if (prevHeader2 instanceof AvailError) throw prevHeader2
  if (prevHeader2 == null) throw "No Header was found"
  console.log(`Best Next:           Block Height: ${nextHeader2.number}, Block Hash: ${nextHeader2.hash.toHex()}`)
  console.log(`Best Previous:       Block Height: ${prevHeader2.number}, Block Hash: ${prevHeader2.hash.toHex()}`)


  // Historical Blocks
  const sub3 = new BlockHeaderSub(client);
  sub3.setBlockHeight(2000000)
  const nextHeader3 = await sub3.next()
  const prevHeader3 = await sub3.prev()
  if (nextHeader3 instanceof AvailError) throw nextHeader3
  if (nextHeader3 == null) throw "No Header was found"
  if (prevHeader3 instanceof AvailError) throw prevHeader3
  if (prevHeader3 == null) throw "No Header was found"
  console.log(`Historical Next:     Block Height: ${nextHeader3.number}, Block Hash: ${nextHeader3.hash.toHex()}`)
  console.log(`Historical Previous: Block Height: ${prevHeader3.number}, Block Hash: ${prevHeader3.hash.toHex()}`)


  process.exit()
}

main().catch((e) => console.log(e))

/* 
  Expected Output:

  Finalized Next:      Block Height: 2530402, Block Hash: 0xaec938ac56a7d5081137e7e768b7e880d54502be6e22931554ed034571350539
  Finalized Previous:  Block Height: 2530401, Block Hash: 0x147c05af7d5861dfb68993a5202da7a583d46f9de27a78b6b7cb69acde3579ee
  Best Next:           Block Height: 2530403, Block Hash: 0x9d00e05c01d20698ee6f79dbf4c58ef2e44f1bc9a5d0b36baa17bb60aa1b345a
  Best Previous:       Block Height: 2530402, Block Hash: 0xaec938ac56a7d5081137e7e768b7e880d54502be6e22931554ed034571350539
  Historical Next:     Block Height: 2000000, Block Hash: 0x6831d536cc3d6408a41a1e50d66f4f48c9c2ed5ffc7cfa7505a5f0251365428f
  Historical Previous: Block Height: 1999999, Block Hash: 0xed2db9aa89ee4b5c9ace26fb721bfbe45541d5386b2b0002eabfa3a939de67ed
*/
