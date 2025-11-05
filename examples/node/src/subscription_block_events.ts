import { AvailError, Client, TURING_ENDPOINT } from "avail-js"
import { BlockEventsSub } from "avail-js/subscription"

async function main() {
  const client = await Client.create(TURING_ENDPOINT)
  if (client instanceof AvailError) throw client

  // By default it subscribes to finalized block
  const sub1 = new BlockEventsSub(client, { filter: "OnlyExtrinsics" })
  const result1 = await sub1.next()
  if (result1 instanceof AvailError) throw result1
  console.log(`Finalized:  Extrinsic Event Count: ${result1.list.length}`)

  // Best Block
  const sub2 = new BlockEventsSub(client, { filter: "OnlyExtrinsics" })
  sub2.useBestBlock(true)
  const result2 = await sub2.next()
  if (result2 instanceof AvailError) throw result2
  console.log(`Best:       Extrinsic Event Count: ${result2.list.length}`)

  // Historical Blocks
  // For some older blocks this will not work as at that time the necessary runtime api was not available
  const sub3 = new BlockEventsSub(client, { filter: "OnlyExtrinsics" })
  sub2.setBlockHeight(2100000)
  const result3 = await sub3.next()
  if (result3 instanceof AvailError) throw result3
  console.log(`Historical: Extrinsic Event Count: ${result3.list.length}`)

  process.exit()
}

main().catch((e) => console.log(e))

/* 
  Expected Output:

  Ext Hash: 0x361a9a5e164e14a66991ad61bd315095975938f6ba530bb5fa1aec699fedf3ed
  Block State: Finalized
  Block Height: 2506351, Block Hash: 0x7cbadfbfa11591e34663d8ffdb1cc5b97a2c77e3816ee490465dca99aa2868d5, Ext Hash: 0x361a9a5e164e14a66991ad61bd315095975938f6ba530bb5fa1aec699fedf3ed, Ext Index: 1
  Is Successful: true, Who: 5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty, Data Hash: 0xdd3b07766319623a7fdb53b802ee8a5b75a194ad4c638f251a209f34d960f859
  Data: BBMM
*/
