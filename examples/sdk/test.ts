import { TURING_ENDPOINT } from "../src"
import { alice, GeneralError } from "../src/core"
import { Client } from "./../src/client"

const main = async () => {
  const client = await Client.create(TURING_ENDPOINT)
  if (client instanceof GeneralError) throw new Error(client.value)

  const submittable = client.tx().dataAvailability().submitData("abc")
  const estimatedFees = await submittable.estimateCallFees()
  if (estimatedFees instanceof GeneralError) throw new Error(estimatedFees.value)
  console.log(`Fees: ${estimatedFees.finalFee()!}`)

  const estimatedFees2 = await submittable.estimateExtrinsicFees(alice(), { app_id: 2 })
  if (estimatedFees2 instanceof GeneralError) throw new Error(estimatedFees2.value)
  console.log(`Fees: ${estimatedFees2.finalFee()!}`)

  process.exit()
}

main()
