/* import { eq, isOk } from "."
import { Client, LOCAL_ENDPOINT, ONE_AVAIL, AccountId, BN } from "../src/sdk"
import { SubmittableTransaction } from "../src/sdk/submission_api"
import { dataAvailability } from "../src/sdk/core/types/pallets"

export default async function runTests() {
  const client = isOk(await Client.create(LOCAL_ENDPOINT))
  daTest(client)
  balancesTest(client)
  utilityTest(client)
}

function daTest(client: Client) {
  // Create Application Key
  {
    const dataString = "TEST"
    const dataArray = new TextEncoder().encode(dataString)

    const ext1 = client.tx().dataAvailability().createApplicationKey(dataString)
    const ext2 = client.tx().dataAvailability().createApplicationKey(dataArray)
    eq(ext1.call.toU8a().toString(), ext2.call.toU8a().toString())
  }

  // Submit Data
  {
    const dataString = "TEST"
    const dataArray = new TextEncoder().encode(dataString)

    const ext1 = client.tx().dataAvailability().submitData(dataString)
    const ext2 = client.tx().dataAvailability().submitData(dataArray)
    eq(ext1.call.toU8a().toString(), ext2.call.toU8a().toString())
  }
}

function balancesTest(client: Client) {
  // Transfer all
  {
    const str = "5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty"
    const accountId = AccountId.from(str, true)

    const ext1 = client.tx().balances().transferAll(str, false)
    const ext2 = client.tx().balances().transferAll(accountId, false)
    eq(ext1.call.toU8a().toString(), ext2.call.toU8a().toString())
  }

  // Transfer Allow Death
  {
    const str = "5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty"
    const accountId = AccountId.from(str, true)

    const ext1 = client.tx().balances().transferAllowDeath(str, ONE_AVAIL)
    const ext2 = client.tx().balances().transferAllowDeath(accountId, ONE_AVAIL)
    eq(ext1.call.toU8a().toString(), ext2.call.toU8a().toString())
  }

  // Transfer Allow Death
  {
    const str = "5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty"
    const accountId = AccountId.from(str, true)

    const ext1 = client.tx().balances().transferKeepAlive(str, ONE_AVAIL)
    const ext2 = client.tx().balances().transferKeepAlive(accountId, ONE_AVAIL)
    eq(ext1.call.toU8a().toString(), ext2.call.toU8a().toString())
  }
}

function utilityTest(client: Client) {
  const dataString = "TEST"
  const dataArray = new TextEncoder().encode(dataString)

  // Batch
  {
    const submitData = new dataAvailability.tx.SubmitData(dataArray)
    const submittable1 = SubmittableTransaction.from(client, submitData)

    const ext1 = client.tx().utility().batch([submitData, submittable1, submittable1.call])
    const ext2 = client.tx().utility().batch([submitData, submitData, submitData])
    eq(ext1.call.toU8a().toString(), ext2.call.toU8a().toString())
  }

  // Batch All
  {
    const submitData = new dataAvailability.tx.SubmitData(dataArray)
    const submittable1 = SubmittableTransaction.from(client, submitData)

    const ext1 = client.tx().utility().batchAll([submitData, submittable1, submittable1.call])
    const ext2 = client.tx().utility().batchAll([submitData, submitData, submitData])
    eq(ext1.call.toU8a().toString(), ext2.call.toU8a().toString())
  }

  // Force Batch
  {
    const submitData = new dataAvailability.tx.SubmitData(dataArray)
    const submittable1 = SubmittableTransaction.from(client, submitData)

    const ext1 = client.tx().utility().forceBatch([submitData, submittable1, submittable1.call])
    const ext2 = client.tx().utility().forceBatch([submitData, submitData, submitData])
    eq(ext1.call.toU8a().toString(), ext2.call.toU8a().toString())
  }
}

// function multisigTest(client: Client) {
//   const dataString = "TEST"
//   const dataArray = new TextEncoder().encode(dataString)

//   // Batch
//   {
//     const submitData = new dataAvailability.tx.SubmitData(dataArray)
//     const submittable1 = SubmittableTransaction.from(client, submitData)

//     const ext1 = client.tx().utility().batch([submitData, submittable1, submittable1.call])
//     const ext2 = client.tx().utility().batch([submitData, submitData, submitData])
//     assertEq(ext1.call.toU8a().toString(), ext2.call.toU8a().toString())
//   }

//   // Batch All
//   {
//     const submitData = new dataAvailability.tx.SubmitData(dataArray)
//     const submittable1 = SubmittableTransaction.from(client, submitData)

//     const ext1 = client.tx().utility().batchAll([submitData, submittable1, submittable1.call])
//     const ext2 = client.tx().utility().batchAll([submitData, submitData, submitData])
//     assertEq(ext1.call.toU8a().toString(), ext2.call.toU8a().toString())
//   }

//   // Force Batch
//   {
//     const submitData = new dataAvailability.tx.SubmitData(dataArray)
//     const submittable1 = SubmittableTransaction.from(client, submitData)

//     const ext1 = client.tx().utility().forceBatch([submitData, submittable1, submittable1.call])
//     const ext2 = client.tx().utility().forceBatch([submitData, submitData, submitData])
//     assertEq(ext1.call.toU8a().toString(), ext2.call.toU8a().toString())
//   }
// }
 */
