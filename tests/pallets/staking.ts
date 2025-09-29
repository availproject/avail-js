import { eq, eqJson, isOk, isOkNotNull, json } from ".."
import { Client, AvailError, ONE_AVAIL, MAINNET_ENDPOINT, TURING_ENDPOINT } from "../../src/sdk"
import { AccountId, H256 } from "../../src/sdk/types"
import { BN } from "../../src/sdk/types/polkadot"
import { staking } from "../../src/sdk/types/pallets"
import { Hex } from "../../src/sdk/utils"
import { ActiveEraInfo, ValidatorPerfs } from "../../src/sdk/types/pallets/staking/types"
import { ICall } from "../../src/sdk/core/interface"

const ONE_K_AVAIL: BN = ONE_AVAIL.mul(new BN("1000"))
const FIFTY_K_AVAIL: BN = ONE_AVAIL.mul(new BN("50000"))

export default async function runTests() {
  await storage_test()
  await tx_test()
  await event_test()
}

async function tx_test() {
  const client = isOk(await Client.create(MAINNET_ENDPOINT))

  {
    const block = client.block(1688315)

    // Bond
    const submittable = client.tx.staking.bond(new BN("50100000000000000000000"), "Staked")
    const expectedCall = ICall.decode(staking.tx.Bond, submittable.call.method.toU8a())!
    const actualTx = isOkNotNull(await block.ext.get(staking.tx.Bond, 1))
    eqJson(actualTx.call, expectedCall)
  }

  {
    const block = client.block(1828569)

    // Bond Extra
    const submittable = client.tx.staking.bond_extra(new BN("10000000000000000000"))
    const expectedCall = ICall.decode(staking.tx.BondExtra, submittable.call.method.toU8a())!
    const actualTx = isOkNotNull(await block.ext.get(staking.tx.BondExtra, 1))
    eqJson(actualTx.call, expectedCall)
  }

  {
    const block = client.block(1811904)

    // Chill
    const submittable = client.tx.staking.chill()
    const expectedCall = ICall.decode(staking.tx.Chill, submittable.call.method.toU8a())!
    const actualTx = isOkNotNull(await block.ext.get(staking.tx.Chill, 1))
    eqJson(actualTx.call, expectedCall)
  }

  {
    const block = client.block(1827511)

    // WithdrawUnbonded
    const submittable = client.tx.staking.withdrawUnbonded(84)
    const expectedCall = ICall.decode(staking.tx.WithdrawUnbonded, submittable.call.method.toU8a())!
    const actualTx = isOkNotNull(await block.ext.get(staking.tx.WithdrawUnbonded, 3))
    eqJson(actualTx.call, expectedCall)
  }

  {
    const block = client.block(1814105)

    // Validate
    const submittable = client.tx.staking.validate(100000000, false)
    const expectedCall = ICall.decode(staking.tx.Validate, submittable.call.method.toU8a())!
    const actualTx = isOkNotNull(await block.ext.get(staking.tx.Validate, 1))
    eqJson(actualTx.call, expectedCall)
  }

  {
    const block = client.block(1827480)

    // Unbond
    const submittable = client.tx.staking.unbond(new BN("49990000000000000000000"))
    const expectedCall = ICall.decode(staking.tx.Unbond, submittable.call.method.toU8a())!
    const actualTx = isOkNotNull(await block.ext.get(staking.tx.Unbond, 4))
    eqJson(actualTx.call, expectedCall)
  }

  {
    const block = client.block(1785389)

    // SetPayee
    const submittable = client.tx.staking.setPayee({
      Account: AccountId.from("0xdc38c8b63df616b7b9662544382c240f5f1c8eb47bc510b6077bd57fba077a5d", true),
    })
    const expectedCall = ICall.decode(staking.tx.SetPayee, submittable.call.method.toU8a())!
    const actualTx = isOkNotNull(await block.ext.get(staking.tx.SetPayee, 1))
    eqJson(actualTx.call, expectedCall)
  }

  {
    const block = client.block(1817341)

    // Rebond
    const submittable = client.tx.staking.rebond(new BN("2134432193417643036990"))
    const expectedCall = ICall.decode(staking.tx.Rebond, submittable.call.method.toU8a())!
    const actualTx = isOkNotNull(await block.ext.get(staking.tx.Rebond, 1))
    eqJson(actualTx.call, expectedCall)
  }

  {
    const block = client.block(1807526)

    // PayoutStakersByPage
    const submittable = client.tx.staking.payoutStakersByPage(
      "0x37dfeeed435f0e9f205e1dfc55775fcd06518f63a5b1ccd53ce2d9e14ab783d3",
      417,
      0,
    )
    const expectedCall = ICall.decode(staking.tx.PayoutStakersByPage, submittable.call.method.toU8a())!
    const actualTx = isOkNotNull(await block.ext.get(staking.tx.PayoutStakersByPage, 2))
    eqJson(actualTx.call, expectedCall)
  }

  {
    const block = client.block(1827501)

    // PayoutStakers
    const submittable = client.tx.staking.payoutStakers(
      "0xa4605eebf32be28f4b30219a329d5f61d1b250c2780ca62f1875e84adeac8b42",
      422,
    )
    const expectedCall = ICall.decode(staking.tx.PayoutStakers, submittable.call.method.toU8a())!
    const actualTx = isOkNotNull(await block.ext.get(staking.tx.PayoutStakers, 6))
    eqJson(actualTx.call, expectedCall)
  }

  {
    const block = client.block(1811815)

    // Nominate
    const submittable = client.tx.staking.nominate([
      "0x946a8565423df55a0449eb3502f1fff00158aa87aad880ff4a6cab915f2c0058",
      "0x248fa9bcba295608e1a3d36455a536ac4e4011e8366d8f56effb732b30dc372b",
      "0x9a75097e60376fa2c86e6f0830f58be57bf46e3832c5a5b763f4b8a89906483a",
      "0x1ca7f1e157baa7620d46102affe26a6f8322ff1743c80d0a21022f3ef29d0537",
    ])
    const expectedCall = ICall.decode(staking.tx.Nominate, submittable.call.method.toU8a())!
    const actualTx = isOkNotNull(await block.ext.get(staking.tx.Nominate, 1))
    eqJson(actualTx.call, expectedCall)
  }

  {
    const block = client.block(669361)

    // Kick
    const address = {
      Address32: Hex.decodeUnsafe("0x64c63961305e9ce5c8d9c43f0db12c141ed6ad25437ed3835c4e6ceab7307d79"),
    }
    const submittable = client.tx.staking.kick([address])
    const expectedCall = ICall.decode(staking.tx.Kick, submittable.call.method.toU8a())!
    const actualTx = isOkNotNull(await block.ext.get(staking.tx.Kick, 1))
    eqJson(actualTx.call, expectedCall)
  }

  {
    const block = client.block(470124)

    // Set Controller
    const submittable = client.tx.staking.setController()
    const expectedCall = ICall.decode(staking.tx.SetController, submittable.call.method.toU8a())!
    const actualTx = isOkNotNull(await block.ext.get(staking.tx.SetController, 1))
    eqJson(actualTx.call, expectedCall)
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
  if (client instanceof AvailError) throw client

  const blockHash = H256.from("0xe7d4f73660f45e316904982eaf1f6ee82807d826e91a14868c9f1cdc493d81db", true)
  const block01Hash = H256.from("0xad52d998ea47214959826fca788e3dffcb349969beead2cd9e893663656f2231", true)
  eq(isOkNotNull(await staking.storage.CounterForNominators.fetch(client, blockHash)), 2920)
  eq(isOkNotNull(await staking.storage.CounterForValidators.fetch(client, blockHash)), 136)
  eq(isOkNotNull(await staking.storage.CurrentEra.fetch(client, blockHash)), 420)
  eq(isOkNotNull(await staking.storage.CurrentPlannedSession.fetch(client, blockHash)), 2522)
  eq(isOk(await staking.storage.MaxNominatorsCount.fetch(client, blockHash)), null)
  eq(isOk(await staking.storage.MaxValidatorsCount.fetch(client, blockHash)), null)
  eq(json(isOkNotNull(await staking.storage.MinNominatorBond.fetch(client, blockHash))), json(ONE_K_AVAIL))
  eq(json(isOkNotNull(await staking.storage.MinValidatorBond.fetch(client, blockHash))), json(FIFTY_K_AVAIL))
  eq(
    json(isOkNotNull(await staking.storage.MinimumActiveStake.fetch(client, blockHash))),
    json(new BN("1743992038550")),
  )
  eq(isOkNotNull(await staking.storage.MinimumValidatorCount.fetch(client, blockHash)), 1)
  eq(isOkNotNull(await staking.storage.ValidatorCount.fetch(client, blockHash)), 105)
  eq(isOkNotNull(await staking.storage.ForceEra.fetch(client, blockHash)), "NotForcing")

  const activeEra = new ActiveEraInfo(420, new BN("1756370320000"))
  eq(json(isOkNotNull(await staking.storage.ActiveEra.fetch(client, blockHash))), json(activeEra))
  const bondedEra = isOkNotNull(await staking.storage.BondedEras.fetch(client, blockHash))
  eq(bondedEra.length, 29)
  eq(bondedEra[0][0], 392)
  eq(bondedEra[0][1], 2352)
  eq(bondedEra[28][0], 420)
  eq(bondedEra[28][1], 2520)
  eq(isOk(await staking.storage.ChillThreshold.fetch(client, blockHash)), null)
  eq(isOk(await staking.storage.MinCommission.fetch(client, blockHash)), null)

  {
    // Validators
    const accountId = AccountId.from("5Cvfrt7pNqfrpTSMrewUdd7n4W9x9DPhxmmEBcDkS9iSbuD2", true)
    const valiatorsPerf = isOkNotNull(await staking.storage.Validators.fetch(client, accountId, blockHash))
    eq(valiatorsPerf.blocked, false)
    eq(valiatorsPerf.commission, 150000000)

    // Validators Iter
    const iter = staking.storage.Validators.iter(client, block01Hash)
    const first = isOkNotNull(await iter.nextKeyValue())
    eq(first[0].toSS58(), "5GuPR92DPMtfRQsTnhNoChi5NXRsYku8Qr5vJK3DdWxhhf1w")
    for (let i = 0; i < 6; ++i) {
      isOkNotNull(await iter.nextKeyValue())
    }
    const last = isOkNotNull(await iter.nextKeyValue())
    eq(last[0].toSS58(), "5GMqZDmBjfTG2NmknpwU74eBgh6kVf9XywxyErxu3BbMFZat")
    eq(isOk(await iter.nextKeyValue()), null)
  }

  {
    // Bonded
    const accountId = AccountId.from("5Cvfrt7pNqfrpTSMrewUdd7n4W9x9DPhxmmEBcDkS9iSbuD2", true)
    const bondedAccountId = isOkNotNull(await staking.storage.Bonded.fetch(client, accountId, blockHash))
    eq(bondedAccountId.toSS58(), accountId.toSS58())

    // Bonded Iter
    const iter = staking.storage.Bonded.iter(client, block01Hash)
    const first = isOkNotNull(await iter.nextKeyValue())
    eq(first[0].toSS58(), "5GuPR92DPMtfRQsTnhNoChi5NXRsYku8Qr5vJK3DdWxhhf1w")
    for (let i = 0; i < 6; ++i) {
      isOkNotNull(await iter.nextKeyValue())
    }
    const last = isOkNotNull(await iter.nextKeyValue())
    eq(last[0].toSS58(), "5GMqZDmBjfTG2NmknpwU74eBgh6kVf9XywxyErxu3BbMFZat")
    eq(isOk(await iter.nextKeyValue()), null)
  }

  {
    // ClaimedRewards
    const accountId = AccountId.from("5DZUvVsx7wRn4MdCp4wmGiPxocRmgp5JMaHxeQ67eJB7BAqe", true)
    const claimed = isOkNotNull(await staking.storage.ClaimedRewards.fetch(client, 419, accountId, blockHash))
    eq(claimed.length, 1)
    eq(claimed[0], 0)

    // ClaimedRewards Iter
    const iter = isOkNotNull(staking.storage.ClaimedRewards.iter(client, 419, blockHash))
    const first = isOkNotNull(await iter.nextKeyValue())
    eq(first[0], 419)
    eq(first[1].toSS58(), "5DZUvVsx7wRn4MdCp4wmGiPxocRmgp5JMaHxeQ67eJB7BAqe")
    eq(first[2][0], 0)

    const second = isOkNotNull(await iter.nextKeyValue())
    eq(second[0], 419)
    eq(second[1].toSS58(), "5FZDzspL1BdHUGbMxq4JuNSTYb3nAmynpqUoZ1MAqZeNZ6vT")
    eq(second[2][0], 0)
  }

  {
    // ErasRewardPoints
    const accountIdFirst = AccountId.from("5CAp9rLiUiqq1ZimmBcGZgef4vCdj9Zxa9SsmTfL4hb3iecy", true)
    const accountIdLast = AccountId.from("5HnRBjpJagMGpGkTXnJECQbPvDbhGEWCAb8sGZJAXcHN2PtH", true)
    const claimed = isOkNotNull(await staking.storage.ErasRewardPoints.fetch(client, 420, blockHash))
    eq(claimed.total, 23720)
    eq(json(claimed.individual[0]), json([accountIdFirst, 160]))
    eq(json(claimed.individual[104]), json([accountIdLast, 300]))
    eq(claimed.individual.length, 105)

    // ErasRewardPoints Iter
    const iter = isOkNotNull(staking.storage.ErasRewardPoints.iter(client, blockHash))
    const first = isOkNotNull(await iter.nextKeyValue())
    eq(first[0], 407)
    eq(first[1].total, 86400)
    eq(first[1].individual[0][0].toSS58(), "5CAp9rLiUiqq1ZimmBcGZgef4vCdj9Zxa9SsmTfL4hb3iecy")
    eq(first[1].individual[0][1], 600)

    const second = isOkNotNull(await iter.nextKeyValue())
    eq(second[0], 347)
    eq(second[1].total, 86400)
    eq(second[1].individual[0][0].toSS58(), "5CAp9rLiUiqq1ZimmBcGZgef4vCdj9Zxa9SsmTfL4hb3iecy")
    eq(second[1].individual[0][1], 940)
  }

  {
    // ErasStakersOverview
    const accountId = AccountId.from("5HSmkdX8oLZWT5ccX9MXGq4ZAnbMWPfgu1ZZAnPkTsfoveAY", true)
    const exposure = isOkNotNull(await staking.storage.ErasStakersOverview.fetch(client, 420, accountId, blockHash))
    eq(exposure.pageCount, 2)
    eq(exposure.nominatorCount, 373)
    eq(exposure.own.toString(), new BN("338496809818288792970316").toString())
    eq(exposure.total.toString(), new BN("43820046485147106084546822").toString())

    const iter = isOkNotNull(staking.storage.ErasStakersOverview.iter(client, 420, blockHash))
    const first = isOkNotNull(await iter.nextKeyValue())
    eq(first[0], 420)
    eq(first[1].toSS58(), "5HSmkdX8oLZWT5ccX9MXGq4ZAnbMWPfgu1ZZAnPkTsfoveAY")
    eq(first[2].pageCount, 2)
    eq(first[2].nominatorCount, 373)
    eq(first[2].own.toString(), new BN("338496809818288792970316").toString())
    eq(first[2].total.toString(), new BN("43820046485147106084546822").toString())

    const second = isOkNotNull(await iter.nextKeyValue())
    eq(second[0], 420)
    eq(second[1].toSS58(), "5DRSzU1M1SCh7fJ5kCqHuvRufxjJxKWfkLJK4wDxRZNr7D5a")
    eq(second[2].pageCount, 1)
    eq(second[2].nominatorCount, 2)
    eq(second[2].own.toString(), new BN("49999999999999524397794").toString())
    eq(second[2].total.toString(), new BN("51493907141248517829589635").toString())
  }

  {
    // ErasStartSessionIndex
    const value = isOkNotNull(await staking.storage.ErasStartSessionIndex.fetch(client, 420, blockHash))
    eq(value, 2520)

    // ErasStartSessionIndex Iter
    const iter = isOkNotNull(staking.storage.ErasStartSessionIndex.iter(client, blockHash))
    const first = isOkNotNull(await iter.nextKeyValue())
    eq(first[0], 407)
    eq(first[1], 2442)

    const second = isOkNotNull(await iter.nextKeyValue())
    eq(second[0], 347)
    eq(second[1], 2082)
  }

  {
    // ErasTotalStake
    const value = isOkNotNull(await staking.storage.ErasTotalStake.fetch(client, 420, blockHash))
    eq(value.toString(), new BN("4958925200169322168370824260").toString())

    // ErasTotalStake Iter
    const iter = isOkNotNull(staking.storage.ErasTotalStake.iter(client, blockHash))
    const first = isOkNotNull(await iter.nextKeyValue())
    eq(first[0], 407)
    eq(first[1].toString(), new BN("4956279476433114709740654108").toString())

    const second = isOkNotNull(await iter.nextKeyValue())
    eq(second[0], 347)
    eq(second[1].toString(), new BN("5190525367176233023590780031").toString())
  }

  {
    // ErasValidatorPrefs
    const accountId = AccountId.from("5HSmkdX8oLZWT5ccX9MXGq4ZAnbMWPfgu1ZZAnPkTsfoveAY", true)
    const value = isOkNotNull(await staking.storage.ErasValidatorPrefs.fetch(client, 420, accountId, blockHash))
    eq(value.commission, 80000000)
    eq(value.blocked, false)

    // ErasValidatorPrefs Iter
    const iter = isOkNotNull(staking.storage.ErasValidatorPrefs.iter(client, 420, blockHash))
    const first = isOkNotNull(await iter.nextKeyValue())
    eq(first[0], 420)
    eq(first[1].toSS58(), "5HSmkdX8oLZWT5ccX9MXGq4ZAnbMWPfgu1ZZAnPkTsfoveAY")
    eq(first[2].commission, 80000000)
    eq(first[2].blocked, false)

    const second = isOkNotNull(await iter.nextKeyValue())
    eq(second[0], 420)
    eq(second[1].toSS58(), "5DRSzU1M1SCh7fJ5kCqHuvRufxjJxKWfkLJK4wDxRZNr7D5a")
    eq(second[2].commission, 100000000)
    eq(second[2].blocked, false)
  }

  {
    // ErasValidatorReward
    const value = isOkNotNull(await staking.storage.ErasValidatorReward.fetch(client, 419, blockHash))
    eq(value.toString(), new BN("1012783929701037260048293").toString())

    // ErasValidatorReward Iter
    const iter = isOkNotNull(staking.storage.ErasValidatorReward.iter(client, blockHash))
    const first = isOkNotNull(await iter.nextKeyValue())
    eq(first[0], 407)
    eq(first[1].toString(), new BN("1012192600146780914799302").toString())

    const second = isOkNotNull(await iter.nextKeyValue())
    eq(second[0], 347)
    eq(second[1].toString(), new BN("1044507368674839246164171").toString())

    // NULL
    const notThere = isOk(await staking.storage.ErasValidatorReward.fetch(client, 0, blockHash))
    eq(notThere, null)
  }

  {
    // Ledger
    const accountId = AccountId.from("5HSmkdX8oLZWT5ccX9MXGq4ZAnbMWPfgu1ZZAnPkTsfoveAY", true)
    const value = isOkNotNull(await staking.storage.Ledger.fetch(client, accountId, blockHash))
    eq(value.stash.toSS58(), "5HSmkdX8oLZWT5ccX9MXGq4ZAnbMWPfgu1ZZAnPkTsfoveAY")
    eq(value.total.toString(), "338638840179018921453941")
    eq(value.active.toString(), "338638840179018921453941")
    eq(value.unlocking.length, 0)
    eq(value.legacyClaimedRewards.length, 0)

    const accountId2 = AccountId.from("5C5sUPeuoL7utijRb9iTPqPX8ffGW7GuEi2WkA5ZwxP7xcj7", true)
    const value2 = isOkNotNull(await staking.storage.Ledger.fetch(client, accountId2, blockHash))
    eq(value2.stash.toSS58(), "5C5sUPeuoL7utijRb9iTPqPX8ffGW7GuEi2WkA5ZwxP7xcj7")
    eq(value2.total.toString(), "1008008876676459236879")
    eq(value2.active.toString(), "0")
    eq(value2.unlocking.length, 1)
    eq(value2.unlocking[0].era, 261)
    eq(value2.unlocking[0].value.toString(), "1008008876676459236879")
    eq(value2.legacyClaimedRewards.length, 0)

    // Ledger Iter
    const iter = isOkNotNull(staking.storage.Ledger.iter(client, blockHash))
    const first = isOkNotNull(await iter.nextKeyValue())
    eq(first[0].toSS58(), "5F7PK9H7VjVzp5FvXDdM5n5xEFB62d6cmXW7AgQiujiJF8C6")
    eq(first[1].stash.toSS58(), "5F7PK9H7VjVzp5FvXDdM5n5xEFB62d6cmXW7AgQiujiJF8C6")
    eq(first[1].total.toString(), "50001000000000000000000")
    eq(first[1].active.toString(), "50001000000000000000000")
    eq(first[1].unlocking.length, 0)
    eq(first[1].legacyClaimedRewards.length, 0)

    const second = isOkNotNull(await iter.nextKeyValue())
    eq(second[0].toSS58(), "5Higce1mZpyqtgaCwj2QUAL25v8xpE9gQnGUYokNbvN3fiXg")
    eq(second[1].stash.toSS58(), "5Higce1mZpyqtgaCwj2QUAL25v8xpE9gQnGUYokNbvN3fiXg")
    eq(second[1].total.toString(), "2527895230608998860241")
    eq(second[1].active.toString(), "2527895230608998860241")
    eq(second[1].unlocking.length, 0)
    eq(second[1].legacyClaimedRewards.length, 0)
  }

  {
    // Nominators
    const accountId = AccountId.from("5Higce1mZpyqtgaCwj2QUAL25v8xpE9gQnGUYokNbvN3fiXg", true)
    const value = isOkNotNull(await staking.storage.Nominators.fetch(client, accountId, blockHash))
    eq(value.suppressed, false)
    eq(value.submittedIn, 19)
    eq(value.targets.length, 16)
    eq(value.targets[0].toSS58(), "5FXG7qY4JcUYWPSdsncwwavQq7jsYTTS1DVfVh1WQndSehmU")
    eq(value.targets[15].toSS58(), "5CDKB192f38ysExFo1e1v8QwdcdU3zWfbzkGwJSSVK7yNWez")

    // Nominators Iter
    const iter = isOkNotNull(staking.storage.Nominators.iter(client, blockHash))
    const first = isOkNotNull(await iter.nextKeyValue())
    eq(first[0].toSS58(), "5Chem9Ssy1cRcoP1jU4D7M5efByHKd1fhBinko3egtbYgXw2")
    eq(first[1].submittedIn, 21)
    eq(first[1].suppressed, false)
    eq(first[1].targets.length, 3)
    eq(first[1].targets[0].toSS58(), "5CD3tVcNF4Vt4byePZUzQVF8ATD4UAk2xZpUdCojxGRV2bMW")
    eq(first[1].targets[2].toSS58(), "5FjdibsxmNFas5HWcT2i1AXbpfgiNfWqezzo88H2tskxWdt2")

    const second = isOkNotNull(await iter.nextKeyValue())
    eq(second[0].toSS58(), "5DntjWctpWiLTabsPhRSeJd1LssufapRuCVy2DJkniZPGDfX")
    eq(second[1].submittedIn, 149)
    eq(second[1].suppressed, false)
    eq(second[1].targets.length, 16)
    eq(second[1].targets[0].toSS58(), "5FRJb2VJuUAaXSB69KYNDHd4rFEK96fWQaJ8kesbe3y8hukU")
    eq(second[1].targets[15].toSS58(), "5DUAT335o6B8mDh8t9qTnwshHWRib5ze7C2k2qcQyH4TFzdf")
  }

  {
    // Payee
    const accountId = AccountId.from("5Higce1mZpyqtgaCwj2QUAL25v8xpE9gQnGUYokNbvN3fiXg", true)
    const value = isOkNotNull(await staking.storage.Payee.fetch(client, accountId, blockHash))
    eq(value, "Staked")

    const accountId2 = AccountId.from("5EYCAe5ijiYfAXEth5DCybgrWKqPCuZ4b2E68iqPEMPNdmr2", true)
    const value2 = isOkNotNull(await staking.storage.Payee.fetch(client, accountId2, blockHash))
    eq(json(value2), json({ Account: AccountId.from("5EYCAe5ijiYfAXEth5DUidEScpWafTewKhAbgfXDhBG6uTSm") }))

    // Payee Iter
    const iter = isOkNotNull(staking.storage.Payee.iter(client, blockHash))
    const first = isOkNotNull(await iter.nextKeyValue())
    eq(first[0].toSS58(), "5Chem9Ssy1cRcoP1jU4D7M5efByHKd1fhBinko3egtbYgXw2")
    eq(first[1], "Staked")

    const second = isOkNotNull(await iter.nextKeyValue())
    eq(second[0].toSS58(), "5DUJhx1upGXYMFHDHwMJbBnwb1kpKXqcyWgQXcue3Xhn852g")
    eq(second[1], "Staked")
  }

  {
    // SlashingSpans
    const accountId = AccountId.from("5DRSzU1M1SCh7fJ5kCqHuvRufxjJxKWfkLJK4wDxRZNr7D5a", true)
    const value = isOkNotNull(await staking.storage.SlashingSpans.fetch(client, accountId, blockHash))
    eq(value.spanIndex, 1)
    eq(value.lastStart, 410)
    eq(value.lastNonZeroSlash, 0)
    eq(value.prior.length, 1)
    eq(value.prior[0], 29)

    // SlashingSpans Iter
    const iter = isOkNotNull(staking.storage.SlashingSpans.iter(client, blockHash))
    const first = isOkNotNull(await iter.nextKeyValue())
    eq(first[0].toSS58(), "5DRSzU1M1SCh7fJ5kCqHuvRufxjJxKWfkLJK4wDxRZNr7D5a")
    eq(first[1].spanIndex, 1)
    eq(first[1].lastStart, 410)
    eq(first[1].lastNonZeroSlash, 0)
    eq(first[1].prior.length, 1)
    eq(first[1].prior[0], 29)

    const second = isOkNotNull(await iter.nextKeyValue())
    eq(second[0].toSS58(), "5D4mncFhjdNDCQimnGnV73dFWWuoGGerpFwHF8j4VinMRVs8")
    eq(second[1].spanIndex, 1)
    eq(second[1].lastStart, 412)
    eq(second[1].lastNonZeroSlash, 0)
    eq(second[1].prior.length, 1)
    eq(second[1].prior[0], 29)
  }
}

async function event_test() {
  const client = isOk(await Client.create(MAINNET_ENDPOINT))

  {
    const client = isOk(await Client.create(TURING_ENDPOINT))
    const block = client.block(2280015)

    // Bond
    const events = isOkNotNull(await block.event.ext(1))
    const event = events.first(staking.events.Bonded, true)
    const expected = new staking.events.Bonded(
      AccountId.from("5Ev2jfLbYH6ENZ8ThTmqBX58zoinvHyqvRMvtoiUnLLcv1NJ", true),
      new BN("24347340768494881376"),
    )
    eqJson(event, expected)
  }

  {
    const block = client.block(1835193)

    // Unbond
    const events = isOkNotNull(await block.event.ext(1))
    const event = events.first(staking.events.Unbonded, true)
    const expected = new staking.events.Unbonded(
      AccountId.from("0x7e1180729a6eebfa4c3b2f6cf2f6c7bf4c09f10f3dc339c6de8e1c14c539e62d", true),
      new BN("87000000000000000000000"),
    )
    eqJson(event, expected)
  }

  {
    const block = client.block(1814105)

    // ValidatorPrefsSet
    const events = isOkNotNull(await block.event.ext(1))
    const event = events.first(staking.events.ValidatorPrefsSet, true)
    const expected = new staking.events.ValidatorPrefsSet(
      AccountId.from("0xbaaf2475c394b0ab52a41966f1668950b4c896fbc365780d13f616bc7577fe3e", true),
      new ValidatorPerfs(100000000, false),
    )
    eqJson(event, expected)
  }

  {
    const block = client.block(1811904)

    // Chilled
    const events = isOkNotNull(await block.event.ext(1))
    const event = events.first(staking.events.Chilled, true)
    const expected = new staking.events.Chilled(
      AccountId.from("0xf2e800a72aa7b4e617f4f4a3f1fd3f02e92d1162049b9000de27d949f5d47c12", true),
    )
    eqJson(event, expected)
  }

  {
    const block = client.block(1861532)

    // Rewarded
    const events = isOkNotNull(await block.event.ext(1))
    const event = events.first(staking.events.Rewarded, true)
    const expected = new staking.events.Rewarded(
      AccountId.from("0x46fc4b4c46aa309f06f432e69e8447abfafcd083df55727d45cc0c8cfe40543e", true),
      "Stash",
      new BN("1631460583448789025116"),
    )
    eqJson(event, expected)
  }

  {
    const block = client.block(1861532)

    // PayoutStarted
    const events = isOkNotNull(await block.event.ext(1))
    const event = events.first(staking.events.PayoutStarted, true)
    const expected = new staking.events.PayoutStarted(
      430,
      AccountId.from("0x46fc4b4c46aa309f06f432e69e8447abfafcd083df55727d45cc0c8cfe40543e", true),
    )
    eqJson(event, expected)
  }

  {
    const block = client.block(1861093)

    // Withdrawn
    const events = isOkNotNull(await block.event.ext(1))
    const event = events.first(staking.events.Withdrawn, true)
    const expected = new staking.events.Withdrawn(
      AccountId.from("0xc270d5832919913ab755e7cc1823811588e8c2f79f8b68e908800014fd96881c", true),
      new BN("3740409175720722019688"),
    )
    eqJson(event, expected)
  }
}
