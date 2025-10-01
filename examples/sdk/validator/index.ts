import { assertEq, isOk, isOkAndNotNull } from ".."
import { accounts, Client, AvailError, LOCAL_ENDPOINT, ONE_AVAIL, TEN_AVAIL } from "../../../src/sdk"
import { alice } from "../../../src/sdk/accounts"
import { BN } from "../../../src/sdk/types"
import { staking } from "../../../src/sdk/types/pallets"

export async function main() {
  const client = isOk(await Client.create(LOCAL_ENDPOINT))

  // Min Bond Value
  let minValidatorBond = await staking.storage.MinValidatorBond.fetch(client)
  if (minValidatorBond instanceof AvailError) throw minValidatorBond

  minValidatorBond = minValidatorBond ? minValidatorBond.add(ONE_AVAIL) : ONE_AVAIL.mul(new BN("1000"))

  // Fund Random Account
  const account = accounts.generate()
  {
    const submittable = client.tx().balances().transferKeepAlive(account.address, minValidatorBond.add(TEN_AVAIL))
    const submitted = isOk(await submittable.signAndSubmit(alice()))
    const receipt = isOkAndNotNull(await submitted.receipt(true))
    const events = isOk(await receipt.txEvents())
    assertEq(events.isExtrinsicSuccessPresent(), true)
  }

  // Bond
  {
    const submittable = client.tx().staking().bond(minValidatorBond, "Staked")
    const submitted = isOk(await submittable.signAndSubmit(account))
    const receipt = isOkAndNotNull(await submitted.receipt(true))
    const events = isOk(await receipt.txEvents())
    assertEq(events.isExtrinsicSuccessPresent(), true)
  }

  // Generate Session Keys
  const keys = isOk(await client.rpc.author.rotateKeys())

  // Set Session Keys
  {
    const submittable = client
      .tx()
      .session()
      .setKeys(keys.babe, keys.grandpa, keys.imOnline, keys.authorityDiscovery, null)
    const submitted = isOk(await submittable.signAndSubmit(account))
    const receipt = isOkAndNotNull(await submitted.receipt(true))
    const events = isOk(await receipt.txEvents())
    assertEq(events.isExtrinsicSuccessPresent(), true)
  }

  // Validate
  {
    const submittable = client.tx().staking().validate(50, false)
    const submitted = isOk(await submittable.signAndSubmit(account))
    const receipt = isOkAndNotNull(await submitted.receipt(true))
    const events = isOk(await receipt.txEvents())
    assertEq(events.isExtrinsicSuccessPresent(), true)
  }
}

main()
