import { assertEq, assertTrue, isOk, isOkAndNotNull } from ".."
import { Client, LOCAL_ENDPOINT, ClientError, ONE_AVAIL, MAINNET_ENDPOINT } from "../../src/sdk"
import { alice, bob, charlie, dave, eve, ferdie } from "../../src/sdk/accounts"
import { AccountId, H256 } from "../../src/sdk/types"
import { BN } from "../../src/sdk/types/polkadot"
import { staking } from "../../src/sdk/types/pallets"
import { Duration } from "../../src/sdk/utils"
import { ActiveEraInfo } from "../../src/sdk/types/pallets/staking/storage"

const ONE_SECOND: Duration = Duration.fromSecs(1)
const TEN_AVAIL: BN = ONE_AVAIL.mul(new BN(10))
const ONE_MILLION_AVAIL: BN = ONE_AVAIL.mul(new BN("1000000"))
const ONE_K_AVAIL: BN = ONE_AVAIL.mul(new BN("1000"))
const FIFTY_K_AVAIL: BN = ONE_AVAIL.mul(new BN("50000"))
const TWO_AVAIL: BN = ONE_AVAIL.mul(new BN(2))
const THREE_AVAIL: BN = ONE_AVAIL.mul(new BN(3))
const FOUR_AVAIL: BN = ONE_AVAIL.mul(new BN(4))
const FIVE_AVAIL: BN = ONE_AVAIL.mul(new BN(5))
const SIX_AVAIL: BN = ONE_AVAIL.mul(new BN(6))

export default async function runTests() {
  await storage_test()
  // TX: Bond, Bond Extra, Unbond, Rebond
  // await tx_bond_test()
}

// Storage:
// CounterForNominators CounterForValidators CurrentEra CurrentPlannedSession
// MaxNominatorsCount MaxValidatorsCount MinNominatorBond MinValidatorBond
// MinimumActiveStake MinimumValidatorCount ValidatorCount ActiveEra
// BondedEras MinCommission Validators Bonded
async function storage_test() {
  const client = await Client.create(MAINNET_ENDPOINT)
  if (client instanceof ClientError) throw client

  const blockHash = H256.fromUnsafe("0xe7d4f73660f45e316904982eaf1f6ee82807d826e91a14868c9f1cdc493d81db")
  const block01Hash = H256.fromUnsafe("0xad52d998ea47214959826fca788e3dffcb349969beead2cd9e893663656f2231")
  assertEq(isOkAndNotNull(await staking.storage.CounterForNominators.fetch(client, blockHash)), 2920)
  assertEq(isOkAndNotNull(await staking.storage.CounterForValidators.fetch(client, blockHash)), 136)
  assertEq(isOkAndNotNull(await staking.storage.CurrentEra.fetch(client, blockHash)), 420)
  assertEq(isOkAndNotNull(await staking.storage.CurrentPlannedSession.fetch(client, blockHash)), 2522)
  assertEq(isOk(await staking.storage.MaxNominatorsCount.fetch(client, blockHash)), null)
  assertEq(isOk(await staking.storage.MaxValidatorsCount.fetch(client, blockHash)), null)
  assertEq(json(isOkAndNotNull(await staking.storage.MinNominatorBond.fetch(client, blockHash))), json(ONE_K_AVAIL))
  assertEq(json(isOkAndNotNull(await staking.storage.MinValidatorBond.fetch(client, blockHash))), json(FIFTY_K_AVAIL))
  assertEq(
    json(isOkAndNotNull(await staking.storage.MinimumActiveStake.fetch(client, blockHash))),
    json(new BN("1743992038550")),
  )
  assertEq(isOkAndNotNull(await staking.storage.MinimumValidatorCount.fetch(client, blockHash)), 1)
  assertEq(isOkAndNotNull(await staking.storage.ValidatorCount.fetch(client, blockHash)), 105)
  assertEq(isOkAndNotNull(await staking.storage.ForceEra.fetch(client, blockHash)), "NotForcing")

  const activeEra = new ActiveEraInfo(420, new BN("1756370320000"))
  assertEq(json(isOkAndNotNull(await staking.storage.ActiveEra.fetch(client))), json(activeEra))
  const bondedEra = isOkAndNotNull(await staking.storage.BondedEras.fetch(client))
  assertEq(bondedEra.length, 29)
  assertEq(bondedEra[0][0], 392)
  assertEq(bondedEra[0][1], 2352)
  assertEq(bondedEra[28][0], 420)
  assertEq(bondedEra[28][1], 2520)
  assertEq(isOk(await staking.storage.ChillThreshold.fetch(client)), null)
  assertEq(isOk(await staking.storage.MinCommission.fetch(client, blockHash)), null)

  {
    // Validators
    const accountId = AccountId.from("5Cvfrt7pNqfrpTSMrewUdd7n4W9x9DPhxmmEBcDkS9iSbuD2")
    const valiatorsPerf = isOkAndNotNull(await staking.storage.Validators.fetch(client, accountId, blockHash))
    assertEq(valiatorsPerf.blocked, false)
    assertEq(valiatorsPerf.commission, 150000000)

    // Validators Iter
    const validatorsPerfIter = staking.storage.Validators.iter(client, block01Hash)
    const first = isOkAndNotNull(await validatorsPerfIter.nextKeyValue())
    assertEq(first[0].toSS58(), "5GuPR92DPMtfRQsTnhNoChi5NXRsYku8Qr5vJK3DdWxhhf1w")
    for (let i = 0; i < 6; ++i) {
      isOkAndNotNull(await validatorsPerfIter.nextKeyValue())
    }
    const last = isOkAndNotNull(await validatorsPerfIter.nextKeyValue())
    assertEq(last[0].toSS58(), "5GMqZDmBjfTG2NmknpwU74eBgh6kVf9XywxyErxu3BbMFZat")
    assertEq(isOk(await validatorsPerfIter.nextKeyValue()), null)
  }

  {
    // Bonded
    const accountId = AccountId.from("5Cvfrt7pNqfrpTSMrewUdd7n4W9x9DPhxmmEBcDkS9iSbuD2")
    const bondedAccountId = isOkAndNotNull(await staking.storage.Bonded.fetch(client, accountId, blockHash))
    assertEq(bondedAccountId.toSS58(), accountId.toSS58())

    // Validators Iter
    const bondedAccountIdIter = staking.storage.Bonded.iter(client, block01Hash)
    const first = isOkAndNotNull(await bondedAccountIdIter.nextKeyValue())
    assertEq(first[0].toSS58(), "5GuPR92DPMtfRQsTnhNoChi5NXRsYku8Qr5vJK3DdWxhhf1w")
    for (let i = 0; i < 6; ++i) {
      isOkAndNotNull(await bondedAccountIdIter.nextKeyValue())
    }
    const last = isOkAndNotNull(await bondedAccountIdIter.nextKeyValue())
    assertEq(last[0].toSS58(), "5GMqZDmBjfTG2NmknpwU74eBgh6kVf9XywxyErxu3BbMFZat")
    assertEq(isOk(await bondedAccountIdIter.nextKeyValue()), null)
  }
}

// TX: Bond, Bond Extra, Unbond, Rebond
async function tx_bond_test() {
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

  assertEq(json(tx_01.call.value), json(ONE_AVAIL))
  assertEq(tx_01.call.payee, "Staked")
  assertEq(json(tx_02.call.value), json(TWO_AVAIL))
  assertEq(tx_02.call.payee, "Stash")
  assertEq(json(tx_03.call.value), json(THREE_AVAIL))
  assertEq(tx_03.call.payee, "Controller")
  assertEq(json(tx_04.call.value), json(FOUR_AVAIL))
  assertEq(json(tx_04.call.payee), json({ Account: AccountId.from(alice()) }))
  assertEq(json(tx_05.call.value), json(FIVE_AVAIL))
  assertEq(tx_05.call.payee, "None")
  assertEq(json(tx_06.call.value), json(SIX_AVAIL))
  assertEq(json(tx_07.call.value), json(TWO_AVAIL))
  assertEq(json(tx_08.call.value), json(TWO_AVAIL))
}

function json(value: any): string {
  return JSON.stringify(value)
}
