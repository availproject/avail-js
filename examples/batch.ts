import { assert_eq } from "."
import { BN, SDK, Account, Pallets } from "./../src/index"

export async function runBatch() {
  const sdk = await SDK.New(SDK.localEndpoint)

  const account = Account.alice()

  const value1 = SDK.oneAvail()
  const value2 = SDK.oneAvail().mul(new BN("100000000"))
  const destBob = "5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty"
  const destCharlie = "5FLSigC9HGRKVhB9FiEo4Y3koPsNmBmLJbpXg2mp1hXcS59Y"

  const call1 = sdk.tx.balances.transferKeepAlive(destBob, value1)
  const call2 = sdk.tx.balances.transferKeepAlive(destCharlie, value1)
  const calls = [call1.tx, call2.tx]

  //
  // Happy Path
  //

  // Batch call
  {
    const tx = sdk.tx.utility.batch(calls)
    const res = await tx.executeWaitForInclusion(account, {})
    assert_eq(res.isSuccessful(), true)
    if (res.events == undefined) throw new Error("")

    const events1 = res.events.find(Pallets.UtilityEvents.BatchCompleted)
    assert_eq(events1.length, 1)

    const events2 = res.events.find(Pallets.UtilityEvents.ItemCompleted)
    assert_eq(events2.length, 2)
  }

  // Batch All call
  {
    const tx = sdk.tx.utility.batchAll(calls)
    const res = await tx.executeWaitForInclusion(account, {})
    assert_eq(res.isSuccessful(), true)
    if (res.events == undefined) throw new Error("")

    const events1 = res.events.find(Pallets.UtilityEvents.BatchCompleted)
    assert_eq(events1.length, 1)

    const events2 = res.events.find(Pallets.UtilityEvents.ItemCompleted)
    assert_eq(events2.length, 2)
  }

  // Force Batch call
  {
    const tx = sdk.tx.utility.forceBatch(calls)
    const res = await tx.executeWaitForInclusion(account, {})
    assert_eq(res.isSuccessful(), true)
    if (res.events == undefined) throw new Error("")

    const events1 = res.events.find(Pallets.UtilityEvents.BatchCompleted)
    assert_eq(events1.length, 1)

    const events2 = res.events.find(Pallets.UtilityEvents.ItemCompleted)
    assert_eq(events2.length, 2)
  }

  //
  //	Things differ when we introduce a call that will fail
  //

  const call3 = sdk.tx.balances.transferKeepAlive(destBob, value2)
  const call4 = sdk.tx.balances.transferKeepAlive(destCharlie, value1)
  calls.push(call3.tx)
  calls.push(call4.tx)

  // Batch call
  {
    const tx = sdk.tx.utility.batch(calls)
    const res = await tx.executeWaitForInclusion(account, {})
    assert_eq(res.isSuccessful(), true)
    if (res.events == undefined) throw new Error("")

    const events1 = res.events.find(Pallets.UtilityEvents.BatchInterrupted)
    assert_eq(events1.length, 1)

    const events2 = res.events.find(Pallets.UtilityEvents.BatchCompleted)
    assert_eq(events2.length, 0)

    const events3 = res.events.find(Pallets.UtilityEvents.ItemCompleted)
    assert_eq(events3.length, 2)
  }

  // Batch All call
  {
    const tx = sdk.tx.utility.batchAll(calls)
    const res = await tx.executeWaitForInclusion(account, {})
    assert_eq(res.isSuccessful(), false)
  }

  // Force Batch call
  {
    const tx = sdk.tx.utility.forceBatch(calls)
    const res = await tx.executeWaitForInclusion(account, {})
    assert_eq(res.isSuccessful(), true)
    if (res.events == undefined) throw new Error("")

    const events1 = res.events.find(Pallets.UtilityEvents.BatchCompletedWithErrors)
    assert_eq(events1.length, 1)

    const events3 = res.events.find(Pallets.UtilityEvents.ItemCompleted)
    assert_eq(events3.length, 3)

    const events2 = res.events.find(Pallets.UtilityEvents.ItemFailed)
    assert_eq(events2.length, 1)
  }

  console.log("runBatch finished correctly")
}
