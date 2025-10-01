import { isOk } from ".."
import { Client, TURING_ENDPOINT } from "./../../../src/sdk"
import { alice } from "./../../../src/sdk/accounts"

const main = async () => {
  const client = isOk(await Client.create(TURING_ENDPOINT))

  const submittable = client.tx().dataAvailability().submitData("abc")
  const estimatedFees = isOk(await submittable.estimateCallFees())
  console.log(`Fees: ${estimatedFees.finalFee()!}`)

  const estimatedFees2 = isOk(await submittable.estimateExtrinsicFees(alice(), { app_id: 2 }))
  console.log(`Fees: ${estimatedFees2.finalFee()!}`)

  process.exit()
}

main()
