import { SDK, BN, utils, throwOnErrorOrFailed } from "./../src/index"

export async function run() {
  const sdk = await SDK.New(SDK.localEndpoint())
  const api = sdk.api

  const account = SDK.alice()

  // Bond minValidatorBond or 1 AVAIL token
  const minValidatorBond: BN = ((await api.query.staking.minValidatorBond()) as any) || SDK.oneAvail()

  // Bond
  const bondTx = sdk.tx.staking.bond(minValidatorBond, "Staked")
  const _res1 = throwOnErrorOrFailed(api, await bondTx.executeWaitForInclusion(account))

  // Generate Session Keys
  const keysBytes = await api.rpc.author.rotateKeys()
  const keys = utils.deconstruct_session_keys(keysBytes.toString())

  // Set Keys
  const setKeysTx = sdk.tx.session.setKeys(keys)
  const _res2 = throwOnErrorOrFailed(api, await setKeysTx.executeWaitForInclusion(account))

  // Validate
  const validateTx = sdk.tx.staking.validate(50, false)
  const _res3 = throwOnErrorOrFailed(api, await validateTx.executeWaitForInclusion(account))
}
