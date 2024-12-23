import { SDK } from "./../src/index"

export async function run() {
  const sdk = await SDK.New(SDK.localEndpoint())
  const account = SDK.alice()

  const dest = "5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty"
  const value = SDK.oneAvail()
  const tx = sdk.tx.balances.transferKeepAlive(dest, value)

  const fee_details = await tx.payment_query_fee_details(sdk.api, account.address)
  console.log(fee_details)

  const info = await tx.payment_query_info(account.address)
  console.log(info.toString())
}

/*
  Example Output:
  
  {
    baseFee: <BN: 1ba01dfb315e000>,
    lenFee: <BN: 0>,
    adjustedWeightFee: <BN: 6f72e9ccad22a>
  }
  {"weight":{"refTime":196085000,"proofSize":3593},"class":"Normal","partialFee":"0x000000000000000001c106b2c58ca22a"}
*/
