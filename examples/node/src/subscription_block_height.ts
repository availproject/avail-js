import { AvailError, Client, TURING_ENDPOINT } from "avail-js"
import { Sub } from "avail-js/subscription"

async function main() {
  const client = await Client.create(TURING_ENDPOINT)
  if (client instanceof AvailError) throw client

  // By default it subscribes to finalized block
  const sub1 = new Sub(client);
  const nextInfo1 = await sub1.next()
  const prevInfo1 = await sub1.prev()
  if (nextInfo1 instanceof AvailError) throw nextInfo1
  if (prevInfo1 instanceof AvailError) throw prevInfo1
  console.log(`Finalized Next:      Block Height: ${nextInfo1.height}, Block Hash: ${nextInfo1.hash.toHex()}`)
  console.log(`Finalized Previous:  Block Height: ${prevInfo1.height}, Block Hash: ${prevInfo1.hash.toHex()}`)

  // Best Block
  const sub2 = new Sub(client);
  sub2.useBestBlock(true)
  const nextInfo2 = await sub2.next()
  const prevInfo2 = await sub2.prev()
  if (nextInfo2 instanceof AvailError) throw nextInfo2
  if (prevInfo2 instanceof AvailError) throw prevInfo2
  console.log(`Best Next:           Block Height: ${nextInfo2.height}, Block Hash: ${nextInfo2.hash.toHex()}`)
  console.log(`Best Previous:       Block Height: ${prevInfo2.height}, Block Hash: ${prevInfo2.hash.toHex()}`)


  // Historical Blocks
  const sub3 = new Sub(client);
  sub3.setBlockHeight(2000000)
  const nextInfo3 = await sub3.next()
  const prevInfo3 = await sub3.prev()
  if (nextInfo3 instanceof AvailError) throw nextInfo3
  if (prevInfo3 instanceof AvailError) throw prevInfo3
  console.log(`Historical Next:     Block Height: ${nextInfo3.height}, Block Hash: ${nextInfo3.hash.toHex()}`)
  console.log(`Historical Previous: Block Height: ${prevInfo3.height}, Block Hash: ${prevInfo3.hash.toHex()}`)

  process.exit()
}

main().catch((e) => console.log(e))

/* 
  Expected Output:

  Finalized Next:      Block Height: 2530415, Block Hash: 0x4e73b5926dc0a31ffde9505a0f1da9aace5ef4a3a502796bfe092d68f6ad67a8
  Finalized Previous:  Block Height: 2530414, Block Hash: 0x2fcd5b4fc36b97bd7ede10ad562aaf525758d5c27d624cad346e342f6e17366c
  Best Next:           Block Height: 2530416, Block Hash: 0xe9e88097579083284d2a0fadad9d81975f8527449826fe5de89e39a1d599e561
  Best Previous:       Block Height: 2530415, Block Hash: 0x4e73b5926dc0a31ffde9505a0f1da9aace5ef4a3a502796bfe092d68f6ad67a8
  Historical Next:     Block Height: 2000000, Block Hash: 0x6831d536cc3d6408a41a1e50d66f4f48c9c2ed5ffc7cfa7505a5f0251365428f
  Historical Previous: Block Height: 1999999, Block Hash: 0xed2db9aa89ee4b5c9ace26fb721bfbe45541d5386b2b0002eabfa3a939de67ed
*/
