import { AvailError, Client, TURING_ENDPOINT } from "avail-js"
import { EncodedExtrinsicSub, ExtrinsicOptions } from "avail-js/subscription"

async function main() {
  const client = await Client.create(TURING_ENDPOINT)
  if (client instanceof AvailError) throw client

  const opts: ExtrinsicOptions = { filter: { PalletCall: [[29, 1]] } };

  // By default it subscribes to finalized block
  const sub1 = new EncodedExtrinsicSub(client, opts);
  const extrinsics1 = await sub1.next()
  if (extrinsics1 instanceof AvailError) throw extrinsics1
  console.log(`Finalized:  Block Height: ${extrinsics1.blockHeight}, DA Extrinsics Count: ${extrinsics1.list.length}`)

  // Best Block
  const sub2 = new EncodedExtrinsicSub(client, opts);
  sub2.useBestBlock(true)
  const extrinsics2 = await sub2.next()
  if (extrinsics2 instanceof AvailError) throw extrinsics2
  console.log(`Best:       Block Height: ${extrinsics2.blockHeight}, DA Extrinsics Count: ${extrinsics2.list.length}`)


  // Historical Blocks
  const sub3 = new EncodedExtrinsicSub(client, opts);
  sub3.setBlockHeight(2000000)
  const extrinsics3 = await sub3.next()
  if (extrinsics3 instanceof AvailError) throw extrinsics3
  console.log(`Historical: Block Height: ${extrinsics3.blockHeight}, DA Extrinsics Count: ${extrinsics3.list.length}`)

  process.exit()
}

main().catch((e) => console.log(e))

/* 
  Expected Output:

  Finalized:  Block Height: 2504172, DA Extrinsics Count: 4
  Best:       Block Height: 2504174, DA Extrinsics Count: 2
  Historical: Block Height: 2000001, DA Extrinsics Count: 1
*/
