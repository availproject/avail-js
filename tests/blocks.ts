import { assertEqJson, isOkAndNotNull, isOk, assertEq } from "."
import { Client, ClientError, MAINNET_ENDPOINT, TURING_ENDPOINT } from "./../src/sdk"

export default async function runTests() {
  const client = isOk(await Client.create(MAINNET_ENDPOINT))

  //const blocks = client.blocks(1868028, 1868038)

  const step = 100
  let height = 1500000
  const proms = []
  for (let i = 0; i < 100; ++i) {
    const prom = client.blocks(height, height + step).ext.all({ filter: { PalletCall: [[29, 1]] }, encodeAs: "None" })
    height = height + step
    proms.push(prom)
  }
  const result = await Promise.all(proms)
  let count = 0
  for (const res of result) {
    if (res instanceof ClientError) throw res
    res.forEach((x) => {
      count += x.extrinsics.length
    })
  }

  console.log(count)
}
