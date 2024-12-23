import { SDK, sdkAccount } from "./../src/index"

export async function run() {
  await nonce()
  await app_id()
  await tip()
}

export async function nonce() {
  console.log("Nonce")
  const sdk = await SDK.New(SDK.localEndpoint())
  const account = SDK.alice()
  const nonce = await sdkAccount.fetchNonceNode(sdk.api, account.address)

  const dest = "5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty"
  const value = SDK.oneAvail()
  const tx = sdk.tx.balances.transferKeepAlive(dest, value)
  const res = await tx.executeWaitForInclusion(account, { nonce })
  res.throwOnFault()
}

export async function app_id() {
  console.log("App Id")
  const sdk = await SDK.New(SDK.localEndpoint())
  const account = SDK.alice()

  const data = "My Data"
  const tx = sdk.tx.dataAvailability.submitData(data)
  const res = await tx.executeWaitForInclusion(account, { app_id: 1 })
  res.throwOnFault()
}

export async function tip() {
  console.log("Tip")
  const sdk = await SDK.New(SDK.localEndpoint())
  const account = SDK.alice()

  const dest = "5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty"
  const value = SDK.oneAvail()
  const tx = sdk.tx.balances.transferKeepAlive(dest, value)
  const res = await tx.executeWaitForInclusion(account, { tip: SDK.oneAvail() })
  res.throwOnFault()
}
