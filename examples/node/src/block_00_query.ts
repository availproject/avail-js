import { bob, Client, LOCAL_ENDPOINT } from "avail-js-sdk" // Global import

/**
 * Example to connect to a chain and get the ApiPromise.
 */
const main = async () => {
  const client = await Client.connect(LOCAL_ENDPOINT)

  // Fetching block relevant information
  //
  // Sometimes we don't need extrinsics or events from a block and instead
  // we need the header, the author, or the total weight. All that together
  // with some other information can be retrieved from the block interface.
  //
  // .author() 			- returns the author of the block. [!!There is no author for block height 0!!]
  // .header() 			- returns the header of the block.
  // .info() 				- returns the block height and block hash.
  // .justification()		- returns the grandpa justification if exists.
  // .timestamp() 		- returns the timestamp of the block. [!!The timestamp is 0 for block height 0!!]
  // .weight() 			- returns the weight of the block.
  // .nonce() 			- returns the nonce of an account for that specific block.
  // .metadata() 			- returns the metadata of the block.
  // .extrinsic_count()	- returns the number of extrinsics there is in the block
  // .event_count()		- returns the number of events there is in the blockhe account id (can be string) and the second input is
  // block query mode.
  const block = client.block(1)
  // TODO
  const author = await block.author()
  // TODO
  const header = await block.header()
  const info = await block.info()
  const justification = await block.justification()
  const hashJust = justification != null
  const ts = await block.timestamp()
  const weight = await block.weight()
  const nonce = await block.nonce(bob().address)
  await block.metadata()
  const extCount = await block.extrinsicCount()
  const evCount = await block.eventCount()

  console.log(`Author: ${author}, Block Height: ${info.height}, Block Hash: ${info.hash}`)
  console.log(`Has Justification: ${hashJust}, Timestamp: ${ts}`)
  console.log(`Weight: ${weight.mandatory.refTime}, Nonce: ${nonce}`)
  console.log(`Extrinsic Count: ${extCount}, Event Count: ${evCount}`)

  process.exit(0)
}
main()
