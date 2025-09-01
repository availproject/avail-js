import { assertEqJson, isOkAndNotNull } from ".."
import { Client, ClientError, MAINNET_ENDPOINT } from "../../src/sdk"
import { nominationPools } from "../../src/sdk/types/pallets"
import { ICall } from "../../src/sdk/interface"
import { BN } from "../../src/sdk/types"

export default async function runTests() {
  await tx_test()
}

async function tx_test() {
  const client = await Client.create(MAINNET_ENDPOINT)
  if (client instanceof ClientError) throw client

  const blockClient = client.blockClient()

  {
    // Bond Extra
    const submittable = client.tx.nominationPools.bondExtra("Rewards")
    const expectedCall = ICall.decode(nominationPools.tx.BondExtra, submittable.call.method.toU8a())!
    const [actualCall] = isOkAndNotNull(await blockClient.transactionStatic(nominationPools.tx.BondExtra, 1831776, 1))
    assertEqJson(actualCall, expectedCall)
  }

  {
    // Bond Extra #2
    const submittable = client.tx.nominationPools.bondExtra({ FreeBalance: new BN("6740000000000000000") })
    const expectedCall = ICall.decode(nominationPools.tx.BondExtra, submittable.call.method.toU8a())!
    const [actualCall] = isOkAndNotNull(await blockClient.transactionStatic(nominationPools.tx.BondExtra, 1831566, 1))
    assertEqJson(actualCall, expectedCall)
  }

  {
    // Bond Extra Other
    const submittable = client.tx.nominationPools.bondExtraOther(
      "0xe48387e8f162d580110568e3df575054de32269822f2362702a8afb1f6914469",
      "Rewards",
    )
    const expectedCall = ICall.decode(nominationPools.tx.BondExtraOther, submittable.call.method.toU8a())!
    const [actualCall] = isOkAndNotNull(
      await blockClient.transactionStatic(nominationPools.tx.BondExtraOther, 202579, 2),
    )
    assertEqJson(actualCall, expectedCall)
  }

  {
    // Chill
    const submittable = client.tx.nominationPools.chill(15)
    const expectedCall = ICall.decode(nominationPools.tx.Chill, submittable.call.method.toU8a())!
    const [actualCall] = isOkAndNotNull(await blockClient.transactionStatic(nominationPools.tx.Chill, 1729911, 1))
    assertEqJson(actualCall, expectedCall)
  }

  {
    // Claim Commission
    const submittable = client.tx.nominationPools.claimCommission(78)
    const expectedCall = ICall.decode(nominationPools.tx.ClaimCommission, submittable.call.method.toU8a())!
    const [actualCall] = isOkAndNotNull(
      await blockClient.transactionStatic(nominationPools.tx.ClaimCommission, 1802972, 1),
    )
    assertEqJson(actualCall, expectedCall)
  }

  {
    // Claim Payout
    const submittable = client.tx.nominationPools.claimPayout()
    const expectedCall = ICall.decode(nominationPools.tx.ClaimPayout, submittable.call.method.toU8a())!
    const [actualCall] = isOkAndNotNull(await blockClient.transactionStatic(nominationPools.tx.ClaimPayout, 1831831, 1))
    assertEqJson(actualCall, expectedCall)
  }

  {
    // Claim Payout Other
    const submittable = client.tx.nominationPools.claimPayoutOther(
      "0x7e1180729a6eebfa4c3b2f6cf2f6c7bf4c09f10f3dc339c6de8e1c14c539e62d",
    )
    const expectedCall = ICall.decode(nominationPools.tx.ClaimPayoutOther, submittable.call.method.toU8a())!
    const [actualCall] = isOkAndNotNull(
      await blockClient.transactionStatic(nominationPools.tx.ClaimPayoutOther, 535568, 1),
    )
    assertEqJson(actualCall, expectedCall)
  }

  {
    // Create
    const submittable = client.tx.nominationPools.create(
      new BN("10000000000000000000000"),
      "0x80acee285f2fd1b1042690b2e4447eac328fe6f70d32badd9ffbba4c872a6319",
      "0x80acee285f2fd1b1042690b2e4447eac328fe6f70d32badd9ffbba4c872a6319",
      "0x80acee285f2fd1b1042690b2e4447eac328fe6f70d32badd9ffbba4c872a6319",
    )
    const expectedCall = ICall.decode(nominationPools.tx.Create, submittable.call.method.toU8a())!
    const [actualCall] = isOkAndNotNull(await blockClient.transactionStatic(nominationPools.tx.Create, 182681, 14))
    assertEqJson(actualCall, expectedCall)
  }

  {
    // Create With Pool Id
    const submittable = client.tx.nominationPools.createWithPoolId(
      new BN("10000000000000000000000"),
      "0xc2ff325a289cf3c42e9ab0af62f285a22e8ec6ce0498c50318b5e6d4da827653",
      "0xc2ff325a289cf3c42e9ab0af62f285a22e8ec6ce0498c50318b5e6d4da827653",
      "0xc2ff325a289cf3c42e9ab0af62f285a22e8ec6ce0498c50318b5e6d4da827653",
      37,
    )
    const expectedCall = ICall.decode(nominationPools.tx.CreateWithPoolId, submittable.call.method.toU8a())!
    const [actualCall] = isOkAndNotNull(
      await blockClient.transactionStatic(nominationPools.tx.CreateWithPoolId, 481224, 1),
    )
    assertEqJson(actualCall, expectedCall)
  }

  {
    // Join
    const submittable = client.tx.nominationPools.join(new BN("365000000000000000000"), 4)
    const expectedCall = ICall.decode(nominationPools.tx.Join, submittable.call.method.toU8a())!
    const [actualCall] = isOkAndNotNull(await blockClient.transactionStatic(nominationPools.tx.Join, 1822288, 2))
    assertEqJson(actualCall, expectedCall)
  }
}
