import { eqJson, isOk, isOkNotNull } from ".."
import { Client, MAINNET_ENDPOINT } from "../../src/sdk"
import { nominationPools } from "../../src/sdk/types/pallets"
import { ICall } from "../../src/sdk/core/interface"
import { BN } from "../../src/sdk/types"

export default async function runTests() {
  await tx_test()
}

async function tx_test() {
  const client = isOk(await Client.create(MAINNET_ENDPOINT))

  {
    const block = client.block(1831776)

    // Bond Extra
    const submittable = client.tx.nominationPools.bondExtra("Rewards")
    const expectedCall = ICall.decode(nominationPools.tx.BondExtra, submittable.call.method.toU8a())!
    const actualTx = isOkNotNull(await block.ext.get(nominationPools.tx.BondExtra, 1))
    eqJson(actualTx.call, expectedCall)
  }

  {
    const block = client.block(1831566)

    // Bond Extra #2
    const submittable = client.tx.nominationPools.bondExtra({ FreeBalance: new BN("6740000000000000000") })
    const expectedCall = ICall.decode(nominationPools.tx.BondExtra, submittable.call.method.toU8a())!
    const actualTx = isOkNotNull(await block.ext.get(nominationPools.tx.BondExtra, 1))
    eqJson(actualTx.call, expectedCall)
  }

  {
    const block = client.block(202579)

    // Bond Extra Other
    const submittable = client.tx.nominationPools.bondExtraOther(
      "0xe48387e8f162d580110568e3df575054de32269822f2362702a8afb1f6914469",
      "Rewards",
    )
    const expectedCall = ICall.decode(nominationPools.tx.BondExtraOther, submittable.call.method.toU8a())!
    const actualTx = isOkNotNull(await block.ext.get(nominationPools.tx.BondExtraOther, 2))
    eqJson(actualTx.call, expectedCall)
  }

  {
    const block = client.block(1729911)

    // Chill
    const submittable = client.tx.nominationPools.chill(15)
    const expectedCall = ICall.decode(nominationPools.tx.Chill, submittable.call.method.toU8a())!
    const actualTx = isOkNotNull(await block.ext.get(nominationPools.tx.Chill, 1))
    eqJson(actualTx.call, expectedCall)
  }

  {
    const block = client.block(1802972)

    // Claim Commission
    const submittable = client.tx.nominationPools.claimCommission(78)
    const expectedCall = ICall.decode(nominationPools.tx.ClaimCommission, submittable.call.method.toU8a())!
    const actualTx = isOkNotNull(await block.ext.get(nominationPools.tx.ClaimCommission, 1))
    eqJson(actualTx.call, expectedCall)
  }

  {
    const block = client.block(1831831)

    // Claim Payout
    const submittable = client.tx.nominationPools.claimPayout()
    const expectedCall = ICall.decode(nominationPools.tx.ClaimPayout, submittable.call.method.toU8a())!
    const actualTx = isOkNotNull(await block.ext.get(nominationPools.tx.ClaimPayout, 1))
    eqJson(actualTx.call, expectedCall)
  }

  {
    const block = client.block(535568)

    // Claim Payout Other
    const submittable = client.tx.nominationPools.claimPayoutOther(
      "0x7e1180729a6eebfa4c3b2f6cf2f6c7bf4c09f10f3dc339c6de8e1c14c539e62d",
    )
    const expectedCall = ICall.decode(nominationPools.tx.ClaimPayoutOther, submittable.call.method.toU8a())!
    const actualTx = isOkNotNull(await block.ext.get(nominationPools.tx.ClaimPayoutOther, 1))
    eqJson(actualTx.call, expectedCall)
  }

  {
    const block = client.block(182681)

    // Create
    const submittable = client.tx.nominationPools.create(
      new BN("10000000000000000000000"),
      "0x80acee285f2fd1b1042690b2e4447eac328fe6f70d32badd9ffbba4c872a6319",
      "0x80acee285f2fd1b1042690b2e4447eac328fe6f70d32badd9ffbba4c872a6319",
      "0x80acee285f2fd1b1042690b2e4447eac328fe6f70d32badd9ffbba4c872a6319",
    )
    const expectedCall = ICall.decode(nominationPools.tx.Create, submittable.call.method.toU8a())!
    const actualTx = isOkNotNull(await block.ext.get(nominationPools.tx.Create, 14))
    eqJson(actualTx.call, expectedCall)
  }

  {
    const block = client.block(481224)

    // Create With Pool Id
    const submittable = client.tx.nominationPools.createWithPoolId(
      new BN("10000000000000000000000"),
      "0xc2ff325a289cf3c42e9ab0af62f285a22e8ec6ce0498c50318b5e6d4da827653",
      "0xc2ff325a289cf3c42e9ab0af62f285a22e8ec6ce0498c50318b5e6d4da827653",
      "0xc2ff325a289cf3c42e9ab0af62f285a22e8ec6ce0498c50318b5e6d4da827653",
      37,
    )
    const expectedCall = ICall.decode(nominationPools.tx.CreateWithPoolId, submittable.call.method.toU8a())!
    const actualTx = isOkNotNull(await block.ext.get(nominationPools.tx.CreateWithPoolId, 1))
    eqJson(actualTx.call, expectedCall)
  }

  {
    const block = client.block(1822288)

    // Join
    const submittable = client.tx.nominationPools.join(new BN("365000000000000000000"), 4)
    const expectedCall = ICall.decode(nominationPools.tx.Join, submittable.call.method.toU8a())!
    const actualTx = isOkNotNull(await block.ext.get(nominationPools.tx.Join, 2))
    eqJson(actualTx.call, expectedCall)
  }

  {
    const block = client.block(1808990)

    // Nominate
    const submittable = client.tx.nominationPools.nominate(50, [
      "0xa26556769ad6581b7beb103590a5c378955244aa349bbacc2f148c51205e055a",
      "0xa586680015c5b7fe08486de7ba5a8e2064dea3324ecaeda658f3b5443d37c5c1",
    ])
    const expectedCall = ICall.decode(nominationPools.tx.Nominate, submittable.call.method.toU8a())!
    const actualTx = isOkNotNull(await block.ext.get(nominationPools.tx.Nominate, 1))
    eqJson(actualTx.call, expectedCall)
  }

  {
    const block = client.block(1827335)

    // Set Claim Permission #1
    const submittable = client.tx.nominationPools.setClaimPermission("Permissioned")
    const expectedCall = ICall.decode(nominationPools.tx.SetClaimPermission, submittable.call.method.toU8a())!
    const actualTx = isOkNotNull(await block.ext.get(nominationPools.tx.SetClaimPermission, 1))
    eqJson(actualTx.call, expectedCall)
  }

  {
    const block = client.block(1827272)

    // Set Claim Permission #2
    const submittable = client.tx.nominationPools.setClaimPermission("PermissionlessCompound")
    const expectedCall = ICall.decode(nominationPools.tx.SetClaimPermission, submittable.call.method.toU8a())!
    const actualTx = isOkNotNull(await block.ext.get(nominationPools.tx.SetClaimPermission, 1))
    eqJson(actualTx.call, expectedCall)
  }

  {
    const block = client.block(1716287)

    // Set Claim Permission #3
    const submittable = client.tx.nominationPools.setClaimPermission("PermissionlessAll")
    const expectedCall = ICall.decode(nominationPools.tx.SetClaimPermission, submittable.call.method.toU8a())!
    const actualTx = isOkNotNull(await block.ext.get(nominationPools.tx.SetClaimPermission, 1))
    eqJson(actualTx.call, expectedCall)
  }

  {
    const block = client.block(1181206)

    // Set Commission #1
    const submittable = client.tx.nominationPools.setCommission(73, [
      10000000,
      "0xec5c245a8405d77710d5d226e354b4236e5e5d13c61fa8ba3fa9aed204b6d6b7",
    ])
    const expectedCall = ICall.decode(nominationPools.tx.SetCommission, submittable.call.method.toU8a())!
    const actualTx = isOkNotNull(await block.ext.get(nominationPools.tx.SetCommission, 1))
    eqJson(actualTx.call, expectedCall)
  }

  {
    const block = client.block(1056874)

    // Set Commission #2
    const submittable = client.tx.nominationPools.setCommission(76, null)
    const expectedCall = ICall.decode(nominationPools.tx.SetCommission, submittable.call.method.toU8a())!
    const actualTx = isOkNotNull(await block.ext.get(nominationPools.tx.SetCommission, 1))
    eqJson(actualTx.call, expectedCall)
  }

  {
    const block = client.block(493706)

    // Set Commission Change Rate
    const submittable = client.tx.nominationPools.setCommissionChangeRate(76, 1000000000, 4320)
    const expectedCall = ICall.decode(nominationPools.tx.SetCommissionChangeRate, submittable.call.method.toU8a())!
    const actualTx = isOkNotNull(await block.ext.get(nominationPools.tx.SetCommissionChangeRate, 1))
    eqJson(actualTx.call, expectedCall)
  }

  {
    const block = client.block(472501)

    // Set Commission Max
    const submittable = client.tx.nominationPools.setCommissionMax(76, 100000000)
    const expectedCall = ICall.decode(nominationPools.tx.SetCommissionMax, submittable.call.method.toU8a())!
    const actualTx = isOkNotNull(await block.ext.get(nominationPools.tx.SetCommissionMax, 1))
    eqJson(actualTx.call, expectedCall)
  }

  {
    const block = client.block(182911)

    // Set Metadata
    const submittable = client.tx.nominationPools.setMetadata(78, "Green")
    const expectedCall = ICall.decode(nominationPools.tx.SetMetadata, submittable.call.method.toU8a())!
    const actualTx = isOkNotNull(await block.ext.get(nominationPools.tx.SetMetadata, 1))
    eqJson(actualTx.call, expectedCall)
  }

  {
    const block = client.block(86141)

    // Set State #1
    const submittable = client.tx.nominationPools.setState(37, "Destroying")
    const expectedCall = ICall.decode(nominationPools.tx.SetState, submittable.call.method.toU8a())!
    const actualTx = isOkNotNull(await block.ext.get(nominationPools.tx.SetState, 4))
    eqJson(actualTx.call, expectedCall)
  }

  {
    const block = client.block(337747)

    // Set State #2
    const submittable = client.tx.nominationPools.setState(55, "Blocked")
    const expectedCall = ICall.decode(nominationPools.tx.SetState, submittable.call.method.toU8a())!
    const actualTx = isOkNotNull(await block.ext.get(nominationPools.tx.SetState, 1))
    eqJson(actualTx.call, expectedCall)
  }

  {
    const block = client.block(1831014)

    // Unbond
    const submittable = client.tx.nominationPools.unbond(
      "0xc25a201b2443dac9697558458ccb6b120c079f70b9a72eeeea7914639197e24f",
      new BN("333000000000000000000"),
    )
    const expectedCall = ICall.decode(nominationPools.tx.Unbond, submittable.call.method.toU8a())!
    const actualTx = isOkNotNull(await block.ext.get(nominationPools.tx.Unbond, 1))
    eqJson(actualTx.call, expectedCall)
  }

  {
    const block = client.block(694694)

    // Update Roles #1
    const submittable = client.tx.nominationPools.updateRoles(29, "Remove", "Remove", "Remove")
    const expectedCall = ICall.decode(nominationPools.tx.UpdateRoles, submittable.call.method.toU8a())!
    const actualTx = isOkNotNull(await block.ext.get(nominationPools.tx.UpdateRoles, 1))
    eqJson(actualTx.call, expectedCall)
  }

  {
    const block = client.block(183031)

    // Update Roles #2
    const submittable = client.tx.nominationPools.updateRoles(
      68,
      { Set: "0x7b70773cac7dc43f72f79fff8718606f5d2a38077326d9bd1e5c6ac1b1d79fd9" },
      { Set: "0x7b70773cac7dc43f72f79fff8718606f5d2a38077326d9bd1e5c6ac1b1d79fd9" },
      { Set: "0x7b70773cac7dc43f72f79fff8718606f5d2a38077326d9bd1e5c6ac1b1d79fd9" },
    )
    const expectedCall = ICall.decode(nominationPools.tx.UpdateRoles, submittable.call.method.toU8a())!
    const actualTx = isOkNotNull(await block.ext.get(nominationPools.tx.UpdateRoles, 1))
    eqJson(actualTx.call, expectedCall)
  }

  {
    const block = client.block(1832868)

    // Withdraw Unbonded
    const submittable = client.tx.nominationPools.withdrawUnbonded(
      "0x48498d4fdb57d0c11c8e4ec98ffc0a7511563eb73cd2940c5208fc9170bed473",
      0,
    )
    const expectedCall = ICall.decode(nominationPools.tx.WithdrawUnbonded, submittable.call.method.toU8a())!
    const actualTx = isOkNotNull(await block.ext.get(nominationPools.tx.WithdrawUnbonded, 1))
    eqJson(actualTx.call, expectedCall)
  }
}
