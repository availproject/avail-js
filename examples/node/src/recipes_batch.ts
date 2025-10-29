import { AvailError, Client, LOCAL_ENDPOINT, ONE_AVAIL, avail } from "avail-js"
import { accounts } from "avail-js/core"

const main = async () => {
  const client = await Client.create(LOCAL_ENDPOINT)
  if (client instanceof AvailError) throw client

  const balances = client.tx().balances()
  const c1 = balances.transferKeepAlive("5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty", ONE_AVAIL)
  const c2 = balances.transferKeepAlive("5DAAnrj7VHTznn2AWBemMuyBwZWs6FNFjdyVXUeYum3PTXFy", ONE_AVAIL)

  // There are three batch calls:
  // 1. Batch, 2. Batch All and 3. Force Batch
  const submittable = client.tx().utility().batchAll([c1, c2])
  const submitted = await submittable.signAndSubmit(accounts.alice())
  if (submitted instanceof AvailError) throw submitted

  const receipt = await submitted.receipt(true)
  if (receipt instanceof AvailError) throw receipt
  if (receipt == null) throw "Failed to find receipt"

  // Fetching and displaying Transaction Events
  const events = await receipt.events()
  if (events instanceof AvailError) throw events

  // Batch, Batch All and Force Batch can emit different events.
  if (events.isPresent(avail.utility.events.BatchInterrupted)) {
    console.log("Found Utility::BatchInterrupted")
  }
  if (events.isPresent(avail.utility.events.BatchCompleted)) {
    console.log("Found Utility::BatchCompleted")
  }
  if (events.isPresent(avail.utility.events.BatchCompletedWithErrors)) {
    console.log("Found Utility::BatchCompletedWithErrors")
  }

  console.log(`Found ${events.count(avail.utility.events.ItemCompleted)}x Utility::ItemCompleted`)

  if (events.isPresent(avail.utility.events.ItemFailed)) {
    console.log("Found Utility::ItemFailed")
  }
  if (events.isPresent(avail.utility.events.DispatchedAs)) {
    console.log("Found Utility::DispatchedAs")
  }

  // Decoding batch call
  const ext = await receipt.extrinsic(avail.utility.tx.BatchAll)
  if (ext instanceof AvailError) throw ext

  // RuntimeCall variants are the only calls that are decodable from a batch call.
  // If the call is not a RuntimeCall variant then it won't be decodable by the
  // Batch call
  const runtimeCalls = ext.call.decodeCalls()
  if (runtimeCalls instanceof AvailError) throw runtimeCalls
  for (const runtimeCall of runtimeCalls) {
    if (!(runtimeCall instanceof avail.balances.tx.TransferKeepAlive)) {
      throw "Expected Balance Transfer Keep Alive"
    }

    let dest = ""
    if ("Id" in runtimeCall.dest) {
      dest = runtimeCall.dest.Id.toSS58()
    }
    console.log(`Dest: ${dest}, Amount: ${runtimeCall.value.toString()}`)
  }

  process.exit(0)
}

main().catch((e) => console.log(e))

/* 
  Expected Output:

  Found Utility::BatchCompleted
  Found 2x Utility::ItemCompleted
  Dest: 5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty, Amount: 1000000000000000000
  Dest: 5DAAnrj7VHTznn2AWBemMuyBwZWs6FNFjdyVXUeYum3PTXFy, Amount: 1000000000000000000
*/