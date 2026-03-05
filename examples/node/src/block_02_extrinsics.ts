import { avail, Client, LOCAL_ENDPOINT } from "avail-js-sdk" // Global import

/**
 * Example to connect to a chain and get the ApiPromise.
 */
const main = async () => {
  const client = await Client.connect(LOCAL_ENDPOINT)

  // Fetching extrinsics
  //
  // The easiest way to fetch extrinsics from a particular block is via block.extrinsics().all() interface.
  // This will fetch all extrinsics executed in that block.
  //
  // We can adjust what extrinsics we get back by setting the first param to:
  // - None
  // - Some(list) - [!!Up to 30 items!!]
  // Where each elements of the list can be
  // - AllowedExtrinsic::TxHash 		- hash of extrinsic
  // - AllowedExtrinsic::TxIndex 		- index of extrinsic
  // - AllowedExtrinsic::Pallet 		- pallet id of extrinsic
  // - AllowedExtrinsic::PalletCall	- call id (pallet id + variant id) of extrinsic
  // If None then all extrinsic are allowed and fetched. If Some and the list is empty then
  // not a single extrinsic will be allowed and fetched. So the list acts as a whitelist
  // construct and you whitelist any combination of hashes, indices, pallets and/or calls.
  //
  // The second param allows us to filter by signature. By default no signature filtering is done.
  // This is useful if we want to fetch extrinsic that are submitted by an specific account.
  const block = client.block(1)
  await block.extrinsics().all()

  // If we already know what extrinsic we want, we can use .all_as() and it will fetch extrinsics only
  // related to that specific call type. The only drawback is that it can only fetch one specific
  // type unless you manually implement a struct that can handle multiple types...
  await block.extrinsics().allAs(avail.timestamp.tx.Set)

  // There are some QoL interfaces that is build on top of this:
  //
  // .get() 		- returns only one extrinsic from the block defined by either hash, index or string.
  // .get_as() 	- same as .get() but with the call type already defined.
  // .first() 	- returns the first extrinsic from the block that matches the filters.
  // .first_as()	- same as .first() but with the call type already defined.
  // .last() 		- returns the last extrinsic from the block that matches the filters.
  // .last_as() 	- same as .last() but with the call type already defined.
  // .count() 	- returns the count of extrinsics in a block
  // .exists() 	- returns true if an extrinsic exsits in the block with given filters
  await block.extrinsics().get(0)
  await block.extrinsics().first()
  await block.extrinsics().last()
  await block.extrinsics().count()
  await block.extrinsics().exists()

  // The .rpc() method gives you one more level of freedom compared to .all() method.
  // You can define the amount of data to fetch from the RPC:
  // - DataFormat::None 		  - nothing will be fetched
  // - DataFormat::Call 		  - only the extrinsic call will be fetched
  // - DataFormat::Extrinsic	- The whole extrinsic will be fetched
  await block.extrinsics().rpc()

  process.exit(0)
}
main()
