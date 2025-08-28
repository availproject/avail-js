import { assertEq, assertTrue, isOk, isOkAndNotNull } from ".."
import { Client, LOCAL_ENDPOINT, ClientError, ONE_AVAIL } from "../../src/sdk"
import { alice, bob, charlie, dave, eve, ferdie } from "../../src/sdk/accounts"
import { AccountId } from "../../src/sdk/types"
import { BN } from "../../src/sdk/types/polkadot"
import { staking } from "../../src/sdk/types/pallets"
import { Duration } from "../../src/sdk/utils"

const ONE_SECOND: Duration = Duration.fromSecs(1)
const TEN_AVAIL: BN = ONE_AVAIL.mul(new BN(10))
const ONE_MILLION_AVAIL: BN = ONE_AVAIL.mul(new BN("1000000"))
const TWO_AVAIL: BN = ONE_AVAIL.mul(new BN(2))
const THREE_AVAIL: BN = ONE_AVAIL.mul(new BN(3))
const FOUR_AVAIL: BN = ONE_AVAIL.mul(new BN(4))
const FIVE_AVAIL: BN = ONE_AVAIL.mul(new BN(5))
const SIX_AVAIL: BN = ONE_AVAIL.mul(new BN(6))

export default async function runTests() {
  // Bond, Bond Extra, Unbond, Rebond
  await bond_test()
}

// Bond, Bond Extra, Unbond, Rebond
async function bond_test() {
  const client = await Client.create(LOCAL_ENDPOINT)
  if (client instanceof ClientError) throw client

  const submittable_01 = client.tx.staking.bond(ONE_AVAIL, "Staked")
  const submittable_02 = client.tx.staking.bond(TWO_AVAIL, "Stash")
  const submittable_03 = client.tx.staking.bond(THREE_AVAIL, "Controller")
  const submittable_04 = client.tx.staking.bond(FOUR_AVAIL, { Account: AccountId.from(alice()) })
  const submittable_05 = client.tx.staking.bond(FIVE_AVAIL, "None")
  const submittable_06 = client.tx.staking.bond_extra(SIX_AVAIL)
  const submittable_07 = client.tx.staking.unbond(TWO_AVAIL)
  const submittable_08 = client.tx.staking.rebond(TWO_AVAIL)

  const submitted_01 = isOk(await submittable_01.signAndSubmit(bob()))
  const submitted_02 = isOk(await submittable_02.signAndSubmit(charlie()))
  const submitted_03 = isOk(await submittable_03.signAndSubmit(dave()))
  const submitted_04 = isOk(await submittable_04.signAndSubmit(eve()))
  const submitted_05 = isOk(await submittable_05.signAndSubmit(ferdie()))
  const submitted_06 = isOk(await submittable_06.signAndSubmit(bob()))
  const submitted_07 = isOk(await submittable_07.signAndSubmit(charlie()))
  const submitted_08 = isOk(await submittable_08.signAndSubmit(charlie()))

  const receipt_01 = isOkAndNotNull(await submitted_01.receipt(true, { pollRate: ONE_SECOND }))
  const receipt_02 = isOkAndNotNull(await submitted_02.receipt(true, { pollRate: ONE_SECOND }))
  const receipt_03 = isOkAndNotNull(await submitted_03.receipt(true, { pollRate: ONE_SECOND }))
  const receipt_04 = isOkAndNotNull(await submitted_04.receipt(true, { pollRate: ONE_SECOND }))
  const receipt_05 = isOkAndNotNull(await submitted_05.receipt(true, { pollRate: ONE_SECOND }))
  const receipt_06 = isOkAndNotNull(await submitted_06.receipt(true, { pollRate: ONE_SECOND }))
  const receipt_07 = isOkAndNotNull(await submitted_07.receipt(true, { pollRate: ONE_SECOND }))
  const receipt_08 = isOkAndNotNull(await submitted_08.receipt(true, { pollRate: ONE_SECOND }))

  const events_01 = isOk(await receipt_01.txEvents())
  const events_02 = isOk(await receipt_02.txEvents())
  const events_03 = isOk(await receipt_03.txEvents())
  const events_04 = isOk(await receipt_04.txEvents())
  const events_05 = isOk(await receipt_05.txEvents())
  const events_06 = isOk(await receipt_06.txEvents())
  const events_07 = isOk(await receipt_07.txEvents())
  const events_08 = isOk(await receipt_08.txEvents())

  assertTrue(events_01.isExtrinsicSuccessPresent() && events_01.isPresent(staking.events.Bonded))
  assertTrue(events_02.isExtrinsicSuccessPresent() && events_02.isPresent(staking.events.Bonded))
  assertTrue(events_03.isExtrinsicSuccessPresent() && events_03.isPresent(staking.events.Bonded))
  assertTrue(events_04.isExtrinsicSuccessPresent() && events_04.isPresent(staking.events.Bonded))
  assertTrue(events_05.isExtrinsicSuccessPresent() && events_05.isPresent(staking.events.Bonded))
  assertTrue(events_06.isExtrinsicSuccessPresent() && events_06.isPresent(staking.events.Bonded))
  assertTrue(events_07.isExtrinsicSuccessPresent() && events_07.isPresent(staking.events.Unbonded))
  assertTrue(events_08.isExtrinsicSuccessPresent() && events_08.isPresent(staking.events.Bonded))

  const tx_01 = isOk(await receipt_01.tx(staking.tx.Bond))
  const tx_02 = isOk(await receipt_02.tx(staking.tx.Bond))
  const tx_03 = isOk(await receipt_03.tx(staking.tx.Bond))
  const tx_04 = isOk(await receipt_04.tx(staking.tx.Bond))
  const tx_05 = isOk(await receipt_05.tx(staking.tx.Bond))
  const tx_06 = isOk(await receipt_06.tx(staking.tx.BondExtra))
  const tx_07 = isOk(await receipt_07.tx(staking.tx.Unbond))
  const tx_08 = isOk(await receipt_08.tx(staking.tx.Rebond))

  assertEq(tx_01.call.value.toString(), ONE_AVAIL.toString())
  assertEq(tx_01.call.payee, "Staked")
  assertEq(tx_02.call.value.toString(), TWO_AVAIL.toString())
  assertEq(tx_02.call.payee, "Stash")
  assertEq(tx_03.call.value.toString(), THREE_AVAIL.toString())
  assertEq(tx_03.call.payee, "Controller")
  assertEq(tx_04.call.value.toString(), FOUR_AVAIL.toString())
  assertEq(json(tx_04.call.payee), json({ Account: AccountId.from(alice()) }))
  assertEq(tx_05.call.value.toString(), FIVE_AVAIL.toString())
  assertEq(tx_05.call.payee, "None")
  assertEq(tx_06.call.value.toString(), SIX_AVAIL.toString())
  assertEq(tx_07.call.value.toString(), TWO_AVAIL.toString())
  assertEq(tx_08.call.value.toString(), TWO_AVAIL.toString())
}

function json(value: any): string {
  return JSON.stringify(value)
}
