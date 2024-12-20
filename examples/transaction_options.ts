import { SDK, sdkAccount, throwOnErrorOrFailed } from "./../src/index"

export async function run() {
  await nonce()
  await app_id()
  await tip()
}

export async function nonce() {
  const sdk = await SDK.New(SDK.localEndpoint())
  const account = SDK.alice()
  const nonce = await sdkAccount.fetchNonceNode(sdk.api, account.address)

  const dest = "5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty"
  const value = SDK.oneAvail()
  const tx = sdk.tx.balances.transferKeepAlive(dest, value)
  const res = await tx.executeWaitForInclusion(account, { nonce })
  throwOnErrorOrFailed(sdk.api, res)
}

export async function app_id() {
  const sdk = await SDK.New(SDK.localEndpoint())
  const account = SDK.alice()

  const dest = "5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty"
  const value = SDK.oneAvail()
  const tx = sdk.tx.balances.transferKeepAlive(dest, value)
  const res = await tx.executeWaitForInclusion(account, { app_id: 1 })
  throwOnErrorOrFailed(sdk.api, res)
}

export async function tip() {
  const sdk = await SDK.New(SDK.localEndpoint())
  const account = SDK.alice()

  const dest = "5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty"
  const value = SDK.oneAvail()
  const tx = sdk.tx.balances.transferKeepAlive(dest, value)
  const res = await tx.executeWaitForInclusion(account, { tip: SDK.oneAvail() })
  throwOnErrorOrFailed(sdk.api, res)
}
