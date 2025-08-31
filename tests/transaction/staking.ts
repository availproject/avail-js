import { assertEq, assertTrue, isOk, isOkAndNotNull } from ".."
import { Client, LOCAL_ENDPOINT, ClientError, ONE_AVAIL, MAINNET_ENDPOINT } from "../../src/sdk"
import { alice, bob, charlie, dave, eve, ferdie } from "../../src/sdk/accounts"
import { AccountId, H256 } from "../../src/sdk/types"
import { BN } from "../../src/sdk/types/polkadot"
import { staking } from "../../src/sdk/types/pallets"
import { Duration } from "../../src/sdk/utils"
import { ActiveEraInfo } from "../../src/sdk/types/pallets/staking/types"

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
// ClaimedRewards ErasRewardPoints ErasStakersOverview ErasStartSessionIndex
// ErasTotalStake ErasValidatorPrefs ErasValidatorReward Ledger
// Nominators Payee SlashingSpans
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
  assertEq(json(isOkAndNotNull(await staking.storage.ActiveEra.fetch(client, blockHash))), json(activeEra))
  const bondedEra = isOkAndNotNull(await staking.storage.BondedEras.fetch(client, blockHash))
  assertEq(bondedEra.length, 29)
  assertEq(bondedEra[0][0], 392)
  assertEq(bondedEra[0][1], 2352)
  assertEq(bondedEra[28][0], 420)
  assertEq(bondedEra[28][1], 2520)
  assertEq(isOk(await staking.storage.ChillThreshold.fetch(client, blockHash)), null)
  assertEq(isOk(await staking.storage.MinCommission.fetch(client, blockHash)), null)

  {
    // Validators
    const accountId = AccountId.from("5Cvfrt7pNqfrpTSMrewUdd7n4W9x9DPhxmmEBcDkS9iSbuD2")
    const valiatorsPerf = isOkAndNotNull(await staking.storage.Validators.fetch(client, accountId, blockHash))
    assertEq(valiatorsPerf.blocked, false)
    assertEq(valiatorsPerf.commission, 150000000)

    // Validators Iter
    const iter = staking.storage.Validators.iter(client, block01Hash)
    const first = isOkAndNotNull(await iter.nextKeyValue())
    assertEq(first[0].toSS58(), "5GuPR92DPMtfRQsTnhNoChi5NXRsYku8Qr5vJK3DdWxhhf1w")
    for (let i = 0; i < 6; ++i) {
      isOkAndNotNull(await iter.nextKeyValue())
    }
    const last = isOkAndNotNull(await iter.nextKeyValue())
    assertEq(last[0].toSS58(), "5GMqZDmBjfTG2NmknpwU74eBgh6kVf9XywxyErxu3BbMFZat")
    assertEq(isOk(await iter.nextKeyValue()), null)
  }

  {
    // Bonded
    const accountId = AccountId.from("5Cvfrt7pNqfrpTSMrewUdd7n4W9x9DPhxmmEBcDkS9iSbuD2")
    const bondedAccountId = isOkAndNotNull(await staking.storage.Bonded.fetch(client, accountId, blockHash))
    assertEq(bondedAccountId.toSS58(), accountId.toSS58())

    // Bonded Iter
    const iter = staking.storage.Bonded.iter(client, block01Hash)
    const first = isOkAndNotNull(await iter.nextKeyValue())
    assertEq(first[0].toSS58(), "5GuPR92DPMtfRQsTnhNoChi5NXRsYku8Qr5vJK3DdWxhhf1w")
    for (let i = 0; i < 6; ++i) {
      isOkAndNotNull(await iter.nextKeyValue())
    }
    const last = isOkAndNotNull(await iter.nextKeyValue())
    assertEq(last[0].toSS58(), "5GMqZDmBjfTG2NmknpwU74eBgh6kVf9XywxyErxu3BbMFZat")
    assertEq(isOk(await iter.nextKeyValue()), null)
  }

  {
    // ClaimedRewards
    const accountId = AccountId.from("5DZUvVsx7wRn4MdCp4wmGiPxocRmgp5JMaHxeQ67eJB7BAqe")
    const claimed = isOkAndNotNull(await staking.storage.ClaimedRewards.fetch(client, 419, accountId, blockHash))
    assertEq(claimed.length, 1)
    assertEq(claimed[0], 0)

    // ClaimedRewards Iter
    const iter = isOkAndNotNull(staking.storage.ClaimedRewards.iter(client, 419, blockHash))
    const first = isOkAndNotNull(await iter.nextKeyValue())
    assertEq(first[0], 419)
    assertEq(first[1].toSS58(), "5DZUvVsx7wRn4MdCp4wmGiPxocRmgp5JMaHxeQ67eJB7BAqe")
    assertEq(first[2][0], 0)

    const second = isOkAndNotNull(await iter.nextKeyValue())
    assertEq(second[0], 419)
    assertEq(second[1].toSS58(), "5FZDzspL1BdHUGbMxq4JuNSTYb3nAmynpqUoZ1MAqZeNZ6vT")
    assertEq(second[2][0], 0)
  }

  {
    // ErasRewardPoints
    const accountIdFirst = AccountId.from("5CAp9rLiUiqq1ZimmBcGZgef4vCdj9Zxa9SsmTfL4hb3iecy")
    const accountIdLast = AccountId.from("5HnRBjpJagMGpGkTXnJECQbPvDbhGEWCAb8sGZJAXcHN2PtH")
    const claimed = isOkAndNotNull(await staking.storage.ErasRewardPoints.fetch(client, 420, blockHash))
    assertEq(claimed.total, 23720)
    assertEq(json(claimed.individual[0]), json([accountIdFirst, 160]))
    assertEq(json(claimed.individual[104]), json([accountIdLast, 300]))
    assertEq(claimed.individual.length, 105)

    // ErasRewardPoints Iter
    const iter = isOkAndNotNull(staking.storage.ErasRewardPoints.iter(client, blockHash))
    const first = isOkAndNotNull(await iter.nextKeyValue())
    assertEq(first[0], 407)
    assertEq(first[1].total, 86400)
    assertEq(first[1].individual[0][0].toSS58(), "5CAp9rLiUiqq1ZimmBcGZgef4vCdj9Zxa9SsmTfL4hb3iecy")
    assertEq(first[1].individual[0][1], 600)

    const second = isOkAndNotNull(await iter.nextKeyValue())
    assertEq(second[0], 347)
    assertEq(second[1].total, 86400)
    assertEq(second[1].individual[0][0].toSS58(), "5CAp9rLiUiqq1ZimmBcGZgef4vCdj9Zxa9SsmTfL4hb3iecy")
    assertEq(second[1].individual[0][1], 940)
  }

  {
    // ErasStakersOverview
    const accountId = AccountId.from("5HSmkdX8oLZWT5ccX9MXGq4ZAnbMWPfgu1ZZAnPkTsfoveAY")
    const exposure = isOkAndNotNull(await staking.storage.ErasStakersOverview.fetch(client, 420, accountId, blockHash))
    assertEq(exposure.pageCount, 2)
    assertEq(exposure.nominatorCount, 373)
    assertEq(exposure.own.toString(), new BN("338496809818288792970316").toString())
    assertEq(exposure.total.toString(), new BN("43820046485147106084546822").toString())

    const iter = isOkAndNotNull(staking.storage.ErasStakersOverview.iter(client, 420, blockHash))
    const first = isOkAndNotNull(await iter.nextKeyValue())
    assertEq(first[0], 420)
    assertEq(first[1].toSS58(), "5HSmkdX8oLZWT5ccX9MXGq4ZAnbMWPfgu1ZZAnPkTsfoveAY")
    assertEq(first[2].pageCount, 2)
    assertEq(first[2].nominatorCount, 373)
    assertEq(first[2].own.toString(), new BN("338496809818288792970316").toString())
    assertEq(first[2].total.toString(), new BN("43820046485147106084546822").toString())

    const second = isOkAndNotNull(await iter.nextKeyValue())
    assertEq(second[0], 420)
    assertEq(second[1].toSS58(), "5DRSzU1M1SCh7fJ5kCqHuvRufxjJxKWfkLJK4wDxRZNr7D5a")
    assertEq(second[2].pageCount, 1)
    assertEq(second[2].nominatorCount, 2)
    assertEq(second[2].own.toString(), new BN("49999999999999524397794").toString())
    assertEq(second[2].total.toString(), new BN("51493907141248517829589635").toString())
  }

  {
    // ErasStartSessionIndex
    const value = isOkAndNotNull(await staking.storage.ErasStartSessionIndex.fetch(client, 420, blockHash))
    assertEq(value, 2520)

    // ErasStartSessionIndex Iter
    const iter = isOkAndNotNull(staking.storage.ErasStartSessionIndex.iter(client, blockHash))
    const first = isOkAndNotNull(await iter.nextKeyValue())
    assertEq(first[0], 407)
    assertEq(first[1], 2442)

    const second = isOkAndNotNull(await iter.nextKeyValue())
    assertEq(second[0], 347)
    assertEq(second[1], 2082)
  }

  {
    // ErasTotalStake
    const value = isOkAndNotNull(await staking.storage.ErasTotalStake.fetch(client, 420, blockHash))
    assertEq(value.toString(), new BN("4958925200169322168370824260").toString())

    // ErasTotalStake Iter
    const iter = isOkAndNotNull(staking.storage.ErasTotalStake.iter(client, blockHash))
    const first = isOkAndNotNull(await iter.nextKeyValue())
    assertEq(first[0], 407)
    assertEq(first[1].toString(), new BN("4956279476433114709740654108").toString())

    const second = isOkAndNotNull(await iter.nextKeyValue())
    assertEq(second[0], 347)
    assertEq(second[1].toString(), new BN("5190525367176233023590780031").toString())
  }

  {
    // ErasValidatorPrefs
    const accountId = AccountId.from("5HSmkdX8oLZWT5ccX9MXGq4ZAnbMWPfgu1ZZAnPkTsfoveAY")
    const value = isOkAndNotNull(await staking.storage.ErasValidatorPrefs.fetch(client, 420, accountId, blockHash))
    assertEq(value.commission, 80000000)
    assertEq(value.blocked, false)

    // ErasValidatorPrefs Iter
    const iter = isOkAndNotNull(staking.storage.ErasValidatorPrefs.iter(client, 420, blockHash))
    const first = isOkAndNotNull(await iter.nextKeyValue())
    assertEq(first[0], 420)
    assertEq(first[1].toSS58(), "5HSmkdX8oLZWT5ccX9MXGq4ZAnbMWPfgu1ZZAnPkTsfoveAY")
    assertEq(first[2].commission, 80000000)
    assertEq(first[2].blocked, false)

    const second = isOkAndNotNull(await iter.nextKeyValue())
    assertEq(second[0], 420)
    assertEq(second[1].toSS58(), "5DRSzU1M1SCh7fJ5kCqHuvRufxjJxKWfkLJK4wDxRZNr7D5a")
    assertEq(second[2].commission, 100000000)
    assertEq(second[2].blocked, false)
  }

  {
    // ErasValidatorReward
    const value = isOkAndNotNull(await staking.storage.ErasValidatorReward.fetch(client, 419, blockHash))
    assertEq(value.toString(), new BN("1012783929701037260048293").toString())

    // ErasValidatorReward Iter
    const iter = isOkAndNotNull(staking.storage.ErasValidatorReward.iter(client, blockHash))
    const first = isOkAndNotNull(await iter.nextKeyValue())
    assertEq(first[0], 407)
    assertEq(first[1].toString(), new BN("1012192600146780914799302").toString())

    const second = isOkAndNotNull(await iter.nextKeyValue())
    assertEq(second[0], 347)
    assertEq(second[1].toString(), new BN("1044507368674839246164171").toString())

    // NULL
    const notThere = isOk(await staking.storage.ErasValidatorReward.fetch(client, 0, blockHash))
    assertEq(notThere, null)
  }

  {
    // Ledger
    const accountId = AccountId.from("5HSmkdX8oLZWT5ccX9MXGq4ZAnbMWPfgu1ZZAnPkTsfoveAY")
    const value = isOkAndNotNull(await staking.storage.Ledger.fetch(client, accountId, blockHash))
    assertEq(value.stash.toSS58(), "5HSmkdX8oLZWT5ccX9MXGq4ZAnbMWPfgu1ZZAnPkTsfoveAY")
    assertEq(value.total.toString(), "338638840179018921453941")
    assertEq(value.active.toString(), "338638840179018921453941")
    assertEq(value.unlocking.length, 0)
    assertEq(value.legacyClaimedRewards.length, 0)

    const accountId2 = AccountId.from("5C5sUPeuoL7utijRb9iTPqPX8ffGW7GuEi2WkA5ZwxP7xcj7")
    const value2 = isOkAndNotNull(await staking.storage.Ledger.fetch(client, accountId2, blockHash))
    assertEq(value2.stash.toSS58(), "5C5sUPeuoL7utijRb9iTPqPX8ffGW7GuEi2WkA5ZwxP7xcj7")
    assertEq(value2.total.toString(), "1008008876676459236879")
    assertEq(value2.active.toString(), "0")
    assertEq(value2.unlocking.length, 1)
    assertEq(value2.unlocking[0].era, 261)
    assertEq(value2.unlocking[0].value.toString(), "1008008876676459236879")
    assertEq(value2.legacyClaimedRewards.length, 0)

    // Ledger Iter
    const iter = isOkAndNotNull(staking.storage.Ledger.iter(client, blockHash))
    const first = isOkAndNotNull(await iter.nextKeyValue())
    assertEq(first[0].toSS58(), "5F7PK9H7VjVzp5FvXDdM5n5xEFB62d6cmXW7AgQiujiJF8C6")
    assertEq(first[1].stash.toSS58(), "5F7PK9H7VjVzp5FvXDdM5n5xEFB62d6cmXW7AgQiujiJF8C6")
    assertEq(first[1].total.toString(), "50001000000000000000000")
    assertEq(first[1].active.toString(), "50001000000000000000000")
    assertEq(first[1].unlocking.length, 0)
    assertEq(first[1].legacyClaimedRewards.length, 0)

    const second = isOkAndNotNull(await iter.nextKeyValue())
    assertEq(second[0].toSS58(), "5Higce1mZpyqtgaCwj2QUAL25v8xpE9gQnGUYokNbvN3fiXg")
    assertEq(second[1].stash.toSS58(), "5Higce1mZpyqtgaCwj2QUAL25v8xpE9gQnGUYokNbvN3fiXg")
    assertEq(second[1].total.toString(), "2527895230608998860241")
    assertEq(second[1].active.toString(), "2527895230608998860241")
    assertEq(second[1].unlocking.length, 0)
    assertEq(second[1].legacyClaimedRewards.length, 0)
  }

  {
    // Nominators
    const accountId = AccountId.from("5Higce1mZpyqtgaCwj2QUAL25v8xpE9gQnGUYokNbvN3fiXg")
    const value = isOkAndNotNull(await staking.storage.Nominators.fetch(client, accountId, blockHash))
    assertEq(value.suppressed, false)
    assertEq(value.submittedIn, 19)
    assertEq(value.targets.length, 16)
    assertEq(value.targets[0].toSS58(), "5FXG7qY4JcUYWPSdsncwwavQq7jsYTTS1DVfVh1WQndSehmU")
    assertEq(value.targets[15].toSS58(), "5CDKB192f38ysExFo1e1v8QwdcdU3zWfbzkGwJSSVK7yNWez")

    // Nominators Iter
    const iter = isOkAndNotNull(staking.storage.Nominators.iter(client, blockHash))
    const first = isOkAndNotNull(await iter.nextKeyValue())
    assertEq(first[0].toSS58(), "5Chem9Ssy1cRcoP1jU4D7M5efByHKd1fhBinko3egtbYgXw2")
    assertEq(first[1].submittedIn, 21)
    assertEq(first[1].suppressed, false)
    assertEq(first[1].targets.length, 3)
    assertEq(first[1].targets[0].toSS58(), "5CD3tVcNF4Vt4byePZUzQVF8ATD4UAk2xZpUdCojxGRV2bMW")
    assertEq(first[1].targets[2].toSS58(), "5FjdibsxmNFas5HWcT2i1AXbpfgiNfWqezzo88H2tskxWdt2")

    const second = isOkAndNotNull(await iter.nextKeyValue())
    assertEq(second[0].toSS58(), "5DntjWctpWiLTabsPhRSeJd1LssufapRuCVy2DJkniZPGDfX")
    assertEq(second[1].submittedIn, 149)
    assertEq(second[1].suppressed, false)
    assertEq(second[1].targets.length, 16)
    assertEq(second[1].targets[0].toSS58(), "5FRJb2VJuUAaXSB69KYNDHd4rFEK96fWQaJ8kesbe3y8hukU")
    assertEq(second[1].targets[15].toSS58(), "5DUAT335o6B8mDh8t9qTnwshHWRib5ze7C2k2qcQyH4TFzdf")
  }

  {
    // Payee
    const accountId = AccountId.from("5Higce1mZpyqtgaCwj2QUAL25v8xpE9gQnGUYokNbvN3fiXg")
    const value = isOkAndNotNull(await staking.storage.Payee.fetch(client, accountId, blockHash))
    assertEq(value, "Staked")

    const accountId2 = AccountId.from("5EYCAe5ijiYfAXEth5DCybgrWKqPCuZ4b2E68iqPEMPNdmr2")
    const value2 = isOkAndNotNull(await staking.storage.Payee.fetch(client, accountId2, blockHash))
    assertEq(json(value2), json({ Account: AccountId.from("5EYCAe5ijiYfAXEth5DUidEScpWafTewKhAbgfXDhBG6uTSm") }))

    // Payee Iter
    const iter = isOkAndNotNull(staking.storage.Payee.iter(client, blockHash))
    const first = isOkAndNotNull(await iter.nextKeyValue())
    assertEq(first[0].toSS58(), "5Chem9Ssy1cRcoP1jU4D7M5efByHKd1fhBinko3egtbYgXw2")
    assertEq(first[1], "Staked")

    const second = isOkAndNotNull(await iter.nextKeyValue())
    assertEq(second[0].toSS58(), "5DUJhx1upGXYMFHDHwMJbBnwb1kpKXqcyWgQXcue3Xhn852g")
    assertEq(second[1], "Staked")
  }

  {
    // SlashingSpans
    const accountId = AccountId.from("5DRSzU1M1SCh7fJ5kCqHuvRufxjJxKWfkLJK4wDxRZNr7D5a")
    const value = isOkAndNotNull(await staking.storage.SlashingSpans.fetch(client, accountId, blockHash))
    assertEq(value.spanIndex, 1)
    assertEq(value.lastStart, 410)
    assertEq(value.lastNonZeroSlash, 0)
    assertEq(value.prior.length, 1)
    assertEq(value.prior[0], 29)

    // SlashingSpans Iter
    const iter = isOkAndNotNull(staking.storage.SlashingSpans.iter(client, blockHash))
    const first = isOkAndNotNull(await iter.nextKeyValue())
    assertEq(first[0].toSS58(), "5DRSzU1M1SCh7fJ5kCqHuvRufxjJxKWfkLJK4wDxRZNr7D5a")
    assertEq(first[1].spanIndex, 1)
    assertEq(first[1].lastStart, 410)
    assertEq(first[1].lastNonZeroSlash, 0)
    assertEq(first[1].prior.length, 1)
    assertEq(first[1].prior[0], 29)

    const second = isOkAndNotNull(await iter.nextKeyValue())
    assertEq(second[0].toSS58(), "5D4mncFhjdNDCQimnGnV73dFWWuoGGerpFwHF8j4VinMRVs8")
    assertEq(second[1].spanIndex, 1)
    assertEq(second[1].lastStart, 412)
    assertEq(second[1].lastNonZeroSlash, 0)
    assertEq(second[1].prior.length, 1)
    assertEq(second[1].prior[0], 29)
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
