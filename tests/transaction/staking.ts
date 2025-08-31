import { assertEq, isOk, isOkAndNotNull } from ".."
import { Client, ClientError, ONE_AVAIL, MAINNET_ENDPOINT } from "../../src/sdk"
import { AccountId, H256 } from "../../src/sdk/types"
import { BN } from "../../src/sdk/types/polkadot"
import { staking } from "../../src/sdk/types/pallets"
import { Hex } from "../../src/sdk/utils"
import { ActiveEraInfo } from "../../src/sdk/types/pallets/staking/types"
import { ICall } from "../../src/sdk/interface"

const ONE_K_AVAIL: BN = ONE_AVAIL.mul(new BN("1000"))
const FIFTY_K_AVAIL: BN = ONE_AVAIL.mul(new BN("50000"))

export default async function runTests() {
  await storage_test()
  await tx_test()
}

async function tx_test() {
  const client = await Client.create(MAINNET_ENDPOINT)
  if (client instanceof ClientError) throw client

  const blockClient = client.blockClient()
  {
    // Bond
    const submittable = client.tx.staking.bond(new BN("50100000000000000000000"), "Staked")
    const expectedCall = ICall.decode(staking.tx.Bond, submittable.call.method.toU8a())!
    const [actualCall] = isOkAndNotNull(await blockClient.transactionStatic(staking.tx.Bond, 1688315, 1))
    assertEq(json(actualCall), json(expectedCall))
  }

  {
    // Bond Extra
    const submittable = client.tx.staking.bond_extra(new BN("10000000000000000000"))
    const expectedCall = ICall.decode(staking.tx.BondExtra, submittable.call.method.toU8a())!
    const [actualCall] = isOkAndNotNull(await blockClient.transactionStatic(staking.tx.BondExtra, 1828569, 1))
    assertEq(json(actualCall), json(expectedCall))
  }

  {
    // Chill
    const submittable = client.tx.staking.chill()
    const expectedCall = ICall.decode(staking.tx.Chill, submittable.call.method.toU8a())!
    const [actualCall] = isOkAndNotNull(await blockClient.transactionStatic(staking.tx.Chill, 1811904, 1))
    assertEq(json(actualCall), json(expectedCall))
  }

  {
    // WithdrawUnbonded
    const submittable = client.tx.staking.withdrawUnbonded(84)
    const expectedCall = ICall.decode(staking.tx.WithdrawUnbonded, submittable.call.method.toU8a())!
    const [actualCall] = isOkAndNotNull(await blockClient.transactionStatic(staking.tx.WithdrawUnbonded, 1827511, 3))
    assertEq(json(actualCall), json(expectedCall))
  }

  {
    // WithdrawUnbonded
    const submittable = client.tx.staking.withdrawUnbonded(84)
    const expectedCall = ICall.decode(staking.tx.WithdrawUnbonded, submittable.call.method.toU8a())!
    const [actualCall] = isOkAndNotNull(await blockClient.transactionStatic(staking.tx.WithdrawUnbonded, 1827511, 3))
    assertEq(json(actualCall), json(expectedCall))
  }

  {
    // Validate
    const submittable = client.tx.staking.validate(100000000, false)
    const expectedCall = ICall.decode(staking.tx.Validate, submittable.call.method.toU8a())!
    const [actualCall] = isOkAndNotNull(await blockClient.transactionStatic(staking.tx.Validate, 1814105, 1))
    assertEq(json(actualCall), json(expectedCall))
  }

  {
    // Unbond
    const submittable = client.tx.staking.unbond(new BN("49990000000000000000000"))
    const expectedCall = ICall.decode(staking.tx.Unbond, submittable.call.method.toU8a())!
    const [actualCall] = isOkAndNotNull(await blockClient.transactionStatic(staking.tx.Unbond, 1827480, 4))
    assertEq(json(actualCall), json(expectedCall))
  }

  {
    // SetPayee
    const submittable = client.tx.staking.setPayee({
      Account: AccountId.from("0xdc38c8b63df616b7b9662544382c240f5f1c8eb47bc510b6077bd57fba077a5d"),
    })
    const expectedCall = ICall.decode(staking.tx.SetPayee, submittable.call.method.toU8a())!
    const [actualCall] = isOkAndNotNull(await blockClient.transactionStatic(staking.tx.SetPayee, 1785389, 1))
    assertEq(json(actualCall), json(expectedCall))
  }

  {
    // Rebond
    const submittable = client.tx.staking.rebond(new BN("2134432193417643036990"))
    const expectedCall = ICall.decode(staking.tx.Rebond, submittable.call.method.toU8a())!
    const [actualCall] = isOkAndNotNull(await blockClient.transactionStatic(staking.tx.Rebond, 1817341, 1))
    assertEq(json(actualCall), json(expectedCall))
  }

  {
    // PayoutStakersByPage
    const submittable = client.tx.staking.payoutStakersByPage(
      "0x37dfeeed435f0e9f205e1dfc55775fcd06518f63a5b1ccd53ce2d9e14ab783d3",
      417,
      0,
    )
    const expectedCall = ICall.decode(staking.tx.PayoutStakersByPage, submittable.call.method.toU8a())!
    const [actualCall] = isOkAndNotNull(await blockClient.transactionStatic(staking.tx.PayoutStakersByPage, 1807526, 2))
    assertEq(json(actualCall), json(expectedCall))
  }

  {
    // PayoutStakers
    const submittable = client.tx.staking.payoutStakers(
      "0xa4605eebf32be28f4b30219a329d5f61d1b250c2780ca62f1875e84adeac8b42",
      422,
    )
    const expectedCall = ICall.decode(staking.tx.PayoutStakers, submittable.call.method.toU8a())!
    const [actualCall] = isOkAndNotNull(await blockClient.transactionStatic(staking.tx.PayoutStakers, 1827501, 6))
    assertEq(json(actualCall), json(expectedCall))
  }

  {
    // Nominate
    const submittable = client.tx.staking.nominate([
      "0x946a8565423df55a0449eb3502f1fff00158aa87aad880ff4a6cab915f2c0058",
      "0x248fa9bcba295608e1a3d36455a536ac4e4011e8366d8f56effb732b30dc372b",
      "0x9a75097e60376fa2c86e6f0830f58be57bf46e3832c5a5b763f4b8a89906483a",
      "0x1ca7f1e157baa7620d46102affe26a6f8322ff1743c80d0a21022f3ef29d0537",
    ])
    const expectedCall = ICall.decode(staking.tx.Nominate, submittable.call.method.toU8a())!
    const [actualCall] = isOkAndNotNull(await blockClient.transactionStatic(staking.tx.Nominate, 1811815, 1))
    assertEq(json(actualCall), json(expectedCall))
  }

  {
    // Kick
    const address = {
      Address32: Hex.decodeUnsafe("0x64c63961305e9ce5c8d9c43f0db12c141ed6ad25437ed3835c4e6ceab7307d79"),
    }
    const submittable = client.tx.staking.kick([address])
    const expectedCall = ICall.decode(staking.tx.Kick, submittable.call.method.toU8a())!
    const [actualCall] = isOkAndNotNull(await blockClient.transactionStatic(staking.tx.Kick, 669361, 1))
    assertEq(json(actualCall), json(expectedCall))
  }

  {
    // Set Controller
    const submittable = client.tx.staking.setController()
    const expectedCall = ICall.decode(staking.tx.SetController, submittable.call.method.toU8a())!
    const [actualCall] = isOkAndNotNull(await blockClient.transactionStatic(staking.tx.SetController, 470124, 1))
    assertEq(json(actualCall), json(expectedCall))
  }
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

function json(value: any): string {
  return JSON.stringify(value)
}
