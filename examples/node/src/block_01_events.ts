import { Client, LOCAL_ENDPOINT } from "avail-js-sdk" // Global import

/**
 * Example to connect to a chain and get the ApiPromise.
 */
const main = async () => {
  const client = await Client.connect(LOCAL_ENDPOINT)

  // Fetching block events
  //
  // The easiest way to fetch events from a particular block is via block.events().all() interface.
  // This will fetch all events emitted in that block which includes extrinsic and non-extrinsic events.
  //
  // We can adjust what events we get back by setting the input param to:
  // - AllowedEvents::All 			  	- fetches all events, (it's the default)
  // - AllowedEvents::OnlyExtrinsics    	- fetches only extrinsic events
  // - AllowedEvents::OnlyNonExtrinsics 	- fetches non-extrinsic events
  // - AllowedEvents::Only(Vec<u32>) 		- fetches events for specific extrinsic indices.
  const block = client.block(1)
  await block.events().all()

  // There are some QoL interfaces that is build on top of this:
  //
  // .system() 			- returns only system events
  // .extrinsic() 		- returns only events for one specific extrinsic index
  // .extrinsic_weight() 	- returns the weight of all extrinsic combined
  await block.events().system()
  await block.events().extrinsic(1)
  //TODO
  //const a4 = await block.events().extrinsicWeight()

  // If you just need the event count you can call .event_count()
  await block.events().eventCount()

  // .all() interface builds on top of existing RPC. If you need raw values from the underlying RCP
  // you can call .rpc(). The first parameter is the same as for .all() while the second allows you
  // to define if you want or don't want events data to be fetched.
  await block.events().rpc()

  process.exit(0)
}
main()
