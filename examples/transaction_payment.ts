import { SDK } from "./../src/index"

export async function run() {
  const sdk = await SDK.New(SDK.localEndpoint())
  const api = sdk.api

  const account = SDK.alice()

  const dest = "5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty"
  const value = SDK.oneAvail()
  const tx = sdk.tx.balances.transferKeepAlive(dest, value)

  const fee_details = await tx.payment_query_fee_details(api, account.address)
  console.log(fee_details.baseFee)
  console.log(fee_details.lenFee)
  console.log(fee_details.adjustedWeightFee)

  const info = await tx.payment_query_info(account.address)
  console.log(info.toString())
}
