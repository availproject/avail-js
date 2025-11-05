import { AvailError, Client, TURING_ENDPOINT } from "avail-js"
import { LegacyBlockSub } from "avail-js/subscription"

async function main() {
  const client = await Client.create(TURING_ENDPOINT)
  if (client instanceof AvailError) throw client

  // By default it subscribes to finalized block
  const sub1 = new LegacyBlockSub(client);
  const nextBlock1 = await sub1.next()
  const prevBlock1 = await sub1.prev()
  if (nextBlock1 instanceof AvailError) throw nextBlock1
  if (prevBlock1 instanceof AvailError) throw prevBlock1
  if (nextBlock1 == null) throw nextBlock1
  if (prevBlock1 == null) throw prevBlock1
  console.log(`Finalized Next:      Block Height: ${nextBlock1.block.header.number.toString()}, Block Extrinsic Count: ${nextBlock1.block.extrinsics.length}`)
  console.log(`Finalized Previous:  Block Height: ${prevBlock1.block.header.number.toString()}, Block Extrinsic Count: ${prevBlock1.block.extrinsics.length}`)

  // Best Block
  const sub2 = new LegacyBlockSub(client);
  sub2.useBestBlock(true)
  const nextBlock2 = await sub2.next()
  const prevBlock2 = await sub2.prev()
  if (nextBlock2 instanceof AvailError) throw nextBlock2
  if (prevBlock2 instanceof AvailError) throw prevBlock2
  if (nextBlock2 == null) throw nextBlock2
  if (prevBlock2 == null) throw prevBlock2
  console.log(`Best Next:           Block Height: ${nextBlock2.block.header.number.toString()}, Block Extrinsic Count: ${nextBlock2.block.extrinsics.length}`)
  console.log(`Best Previous:       Block Height: ${prevBlock2.block.header.number.toString()}, Block Extrinsic Count: ${prevBlock2.block.extrinsics.length}`)


  // Historical Blocks
  const sub3 = new LegacyBlockSub(client);
  sub3.setBlockHeight(2000000)
  const nextBlock3 = await sub3.next()
  const prevBlock3 = await sub3.prev()
  if (nextBlock3 instanceof AvailError) throw nextBlock3
  if (prevBlock3 instanceof AvailError) throw prevBlock3
  if (nextBlock3 == null) throw nextBlock3
  if (prevBlock3 == null) throw prevBlock3
  console.log(`Historical Next:     Block Height: ${nextBlock3.block.header.number.toString()}, Block Extrinsic Count: ${nextBlock3.block.extrinsics.length}`)
  console.log(`Historical Previous: Block Height: ${prevBlock3.block.header.number.toString()}, Block Extrinsic Count: ${prevBlock3.block.extrinsics.length}`)

  process.exit()
}

main().catch((e) => console.log(e))

/* 
  Expected Output:

  Finalized Next:      Block Height: 0x269d11, Block Extrinsic Count: 2
  Finalized Previous:  Block Height: 0x269d10, Block Extrinsic Count: 2
  Best Next:           Block Height: 0x269d12, Block Extrinsic Count: 2
  Best Previous:       Block Height: 0x269d11, Block Extrinsic Count: 2
  Historical Next:     Block Height: 0x1e8480, Block Extrinsic Count: 3
  Historical Previous: Block Height: 0x1e847f, Block Extrinsic Count: 3
*/
