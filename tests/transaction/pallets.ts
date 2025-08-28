import { assertEq, isOk, isOkAndNotNull } from ".."
import { Client, LOCAL_ENDPOINT, ClientError, ONE_AVAIL } from "../../src/sdk"
import { alice, bob } from "../../src/sdk/accounts"
import { balances } from "../../src/sdk/types/pallets"
import { BN } from "../../src/sdk/types/polkadot"
import { Duration } from "../../src/sdk/utils"

const ONE_SECOND: Duration = Duration.fromSecs(1)
const TEN_AVAIL: BN = ONE_AVAIL.mul(new BN(10))
const ONE_MILLION_AVAIL: BN = ONE_AVAIL.mul(new BN("1000000"))

export default async function runTests() {
  const client = await Client.create(LOCAL_ENDPOINT)
  if (client instanceof ClientError) throw client

  const ALICE_ADDRESS = alice().address
  const BOB_ADDRESS = bob().address

  {
    // Testing Transfer Keep Alive
    const beforeBobBalance = isOk(await client.balance(BOB_ADDRESS))
    const submittable = client.tx.balances.transferKeepAlive(BOB_ADDRESS, TEN_AVAIL)
    const submitted = isOk(await submittable.signAndSubmit(alice()))
    isOkAndNotNull(await submitted.receipt(true))
    const afterBobBalance = isOk(await client.balance(BOB_ADDRESS))
    assertEq(afterBobBalance.free.toString(), beforeBobBalance.free.add(TEN_AVAIL).toString())
  }

  {
    // Testing Transfer Allow Death
    const beforeBobBalance = isOk(await client.balance(BOB_ADDRESS))
    const submittable = client.tx.balances.transferAllowDeath(BOB_ADDRESS, TEN_AVAIL)
    const submitted = isOk(await submittable.signAndSubmit(alice()))
    isOkAndNotNull(await submitted.receipt(true))
    const afterBobBalance = isOk(await client.balance(BOB_ADDRESS))
    assertEq(afterBobBalance.free.toString(), beforeBobBalance.free.add(TEN_AVAIL).toString())
  }

  {
    // Testing Transfer All
    const submittable = client.tx.balances.transferAll(BOB_ADDRESS, false)
    const submitted = isOk(await submittable.signAndSubmit(alice()))
    isOkAndNotNull(await submitted.receipt(true, { method: "Block" }))
    const afterAliceBalance = isOk(await client.balance(alice().address))
    assertEq(afterAliceBalance.free.toString(), new BN(0).toString())
  }

  {
    console.log("Returning funds")
    // Returning back the funds
    const submittable = client.tx.balances.transferKeepAlive(ALICE_ADDRESS, ONE_MILLION_AVAIL)
    const submitted = isOk(await submittable.signAndSubmit(bob()))
    isOkAndNotNull(await submitted.receipt(true))
    const afterAliceBalance = isOk(await client.balance(ALICE_ADDRESS))
    assertEq(afterAliceBalance.free.toString(), ONE_MILLION_AVAIL.toString())
  }
}
