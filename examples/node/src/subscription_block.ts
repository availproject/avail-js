import { AvailError, Client, TURING_ENDPOINT } from "avail-js"
import { BlockSub } from "avail-js/subscription"

async function main() {
  const client = await Client.create(TURING_ENDPOINT)
  if (client instanceof AvailError) throw client

  // By default it subscribes to finalized block
  const sub1 = new BlockSub(client);
  const nextBlock1 = await sub1.next()
  const prevBlock1 = await sub1.prev()
  if (nextBlock1 instanceof AvailError) throw nextBlock1
  if (prevBlock1 instanceof AvailError) throw prevBlock1
  console.log(`Finalized Next:      Block Height: ${nextBlock1.blockHeight}, Block Author: ${await nextBlock1.value.author()}`)
  console.log(`Finalized Previous:  Block Height: ${prevBlock1.blockHeight}, Block Author: ${await prevBlock1.value.author()}`)

  // Best Block
  const sub2 = new BlockSub(client);
  sub2.useBestBlock(true)
  const nextBlock2 = await sub2.next()
  const prevBlock2 = await sub2.prev()
  if (nextBlock2 instanceof AvailError) throw nextBlock2
  if (prevBlock2 instanceof AvailError) throw prevBlock2
  console.log(`Best Next:           Block Height: ${nextBlock2.blockHeight}, Block Author: ${await nextBlock2.value.author()}`)
  console.log(`Best Previous:       Block Height: ${prevBlock2.blockHeight}, Block Author: ${await prevBlock2.value.author()}`)


  // Historical Blocks
  const sub3 = new BlockSub(client);
  sub3.setBlockHeight(2000000)
  const nextBlock3 = await sub3.next()
  const prevBlock3 = await sub3.prev()
  if (nextBlock3 instanceof AvailError) throw nextBlock3
  if (prevBlock3 instanceof AvailError) throw prevBlock3
  console.log(`Historical Next:     Block Height: ${nextBlock3.blockHeight}, Block Author: ${await nextBlock3.value.author()}`)
  console.log(`Historical Previous: Block Height: ${prevBlock3.blockHeight}, Block Author: ${await prevBlock3.value.author()}`)

  process.exit()
}

main().catch((e) => console.log(e))

/* 
  Expected Output:

  Finalized Next:      Block Height: 2530433, Block Author: 5DvVCG3UgyTn433oiLuFpSrwB4jLSN1H2vk3YrQDbWSN71sx
  Finalized Previous:  Block Height: 2530432, Block Author: 5E9WFrdJgeP46qPEr6VL6y9agscxm4Gf78vqiuQnAftekN3R
  Best Next:           Block Height: 2530434, Block Author: 5EfQ8sPGXDkDvb7K39x4TkTS3HwF2ec5cq9A9huwTNVUz9Nn
  Best Previous:       Block Height: 2530433, Block Author: 5DvVCG3UgyTn433oiLuFpSrwB4jLSN1H2vk3YrQDbWSN71sx
  Historical Next:     Block Height: 2000000, Block Author: 5GQjARS9nVu5t3NrBZGhdUKKpwdj1xvnek9rNk7UKaH7DHoJ
  Historical Previous: Block Height: 1999999, Block Author: 5DtTjsDx6NXtni43VFFZkrEqfpyFnZDJ2MhwpgGJWrUejV29
*/
