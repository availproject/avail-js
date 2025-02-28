import { SDK, Account, Pallets, BN } from "./../src/index"

export async function runValidator() {
  const sdk = await SDK.New(SDK.localEndpoint)
  const account = Account.generate()

  // Min Bond Value
  const storageAt = await sdk.client.storageAt()
  let minValidatorBond = await Pallets.StakingStorage.MinValidatorBond.fetch(storageAt)
  minValidatorBond = minValidatorBond.add(SDK.oneAvail())

  // Fund Random Account
  {
    const tx = sdk.tx.balances.transferKeepAlive(account.address, minValidatorBond.add(SDK.oneAvail().mul(new BN(10))))
    const res = await tx.executeWaitForInclusion(Account.alice(), {})
    const isOk = res.isSuccessful()
    if (isOk == undefined || isOk == false) throw Error()
  }

  // Bond
  {
    const tx = sdk.tx.staking.bond(minValidatorBond, "Staked")
    const res = await tx.executeWaitForInclusion(account, {})
    const isOk = res.isSuccessful()
    if (isOk == undefined || isOk == false) throw Error()
  }

  // Generate Session Keys
  const sessionKeys = await sdk.client.rotateKeys()

  // Set Session Keys
  {
    const tx = sdk.tx.session.setKeys(sessionKeys, new Uint8Array())
    const res = await tx.executeWaitForInclusion(account, {})
    const isOk = res.isSuccessful()
    if (isOk == undefined || isOk == false) throw Error()
  }

  // Validate
  {
    const tx = sdk.tx.staking.validate(50, false)
    const res = await tx.executeWaitForInclusion(account, {})
    const isOk = res.isSuccessful()
    if (isOk == undefined || isOk == false) throw Error()
  }

  console.log("runValidator finished correctly")
}
