import { assertEq, isOk, isOkAndNotNull } from ".."
import { Client, LOCAL_ENDPOINT, ClientError, ONE_AVAIL } from "../../src/sdk"
import { alice, bob } from "../../src/sdk/accounts"
import { balances } from "../../src/sdk/types/pallets"
import { BN } from "../../src/sdk/types/polkadot"
import { Duration } from "../../src/sdk/utils"

const ONE_SECOND: Duration = Duration.fromSecs(1)
const TEN_AVAIL: BN = ONE_AVAIL.mul(new BN(10))
const ONE_MILLION_AVAIL: BN = ONE_AVAIL.mul(new BN("1000000"))
const ALICE_ADDRESS = alice().address
const BOB_ADDRESS = bob().address

export default async function runTests() {
  const client = await Client.create(LOCAL_ENDPOINT)
  if (client instanceof ClientError) throw client

  {
    // Testing Transfer Keep Alive
    const beforeBobBalance = isOk(await client.balance(BOB_ADDRESS))
    const submittable = client.tx.balances.transferKeepAlive(BOB_ADDRESS, TEN_AVAIL)
    const submitted = isOk(await submittable.signAndSubmit(alice()))
    isOkAndNotNull(await submitted.receipt(true))
    const afterBobBalance = isOk(await client.balance(BOB_ADDRESS))
    assertEq(afterBobBalance.free, beforeBobBalance.free.add(TEN_AVAIL))
  }

  {
    // Testing Transfer Allow Death
    const beforeBobBalance = isOk(await client.balance(BOB_ADDRESS))
    const submittable = client.tx.balances.transferAllowDeath(BOB_ADDRESS, TEN_AVAIL)
    const submitted = isOk(await submittable.signAndSubmit(alice()))
    isOkAndNotNull(await submitted.receipt(true))
    const afterBobBalance = isOk(await client.balance(BOB_ADDRESS))
    assertEq(afterBobBalance.free, beforeBobBalance.free.add(TEN_AVAIL))
  }

  {
    // Testing Transfer All
    const submittable = client.tx.balances.transferAll(BOB_ADDRESS, false)
    const submitted = isOk(await submittable.signAndSubmit(alice()))
    isOkAndNotNull(await submitted.receipt(true))
    const afterAliceBalance = isOk(await client.balance(alice().address))
    assertEq(afterAliceBalance.free, new BN(0))
  }

  {
    // Returning back the funds
    const submittable = client.tx.balances.transferKeepAlive(ALICE_ADDRESS, ONE_MILLION_AVAIL)
    const submitted = isOk(await submittable.signAndSubmit(bob()))
    isOkAndNotNull(await submitted.receipt(true))
    const afterAliceBalance = isOk(await client.balance(ALICE_ADDRESS))
    assertEq(afterAliceBalance.free, new BN(0))
  }
}
