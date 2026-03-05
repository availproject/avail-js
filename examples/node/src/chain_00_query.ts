import { Client, LOCAL_ENDPOINT } from "avail-js-sdk" // Global import

/**
 * Example to connect to a chain and get the ApiPromise.
 */
const main = async () => {
  const client = await Client.connect(LOCAL_ENDPOINT)

  // Chain interface
  //
  // Chain interface is the backbone of all other interfaces that are build on top of it.
  // Block, Subscription, Submission, etc. all of the use .chain() underneath them.
  // Chain has around 50 methods and documenting all of them would be a fools errant.
  //
  // Instead, I advise you to check them yourself and see if any of the methods fits your bill.
  // Here I will just show the ones that are needed and used the most.
  //
  // .info() 			- returns the genesis hash together with best and finalized block hashes and heights.
  // .block_hash() 	- returns block hash.
  // .block_height()	- returns block height.
  const chain = client.chain()
  await chain.info()
  await chain.blockHash(1)
  await chain.blockHeight((await chain.blockHash(1))!)

  // To quickly query only best or finalized block information, .best() and .finalized()
  // interfaces can be used. They are build on top of .chain() and are here just to
  // provide a shortcut. They only offer a limited set of information to be queried so
  // more than often you will rely on .chain()
  const best = client.best()
  await best.blockHash()
  await best.blockHeight()
  await best.blockInfo()

  const finalized = client.finalized()
  await finalized.blockHash()
  await finalized.blockHeight()
  await finalized.blockInfo()
  process.exit(0)
}
main()
