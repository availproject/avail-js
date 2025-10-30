import { AvailError, Client, LOCAL_ENDPOINT } from "avail-js"
import { accounts, avail, ONE_AVAIL, TEN_AVAIL } from "avail-js/core"
import { Weight } from "avail-js/core/metadata"
import { Timepoint } from "avail-js/core/pallets/multisig/types"
import { KeyringPair } from "avail-js/core/polkadot"
import { generateMultisig, sortMultisigAddresses } from "avail-js/core/utils"
import { TransactionReceipt } from "avail-js/submission"

export async function main() {
  const client = await Client.create(LOCAL_ENDPOINT)
  if (client instanceof AvailError) throw client

  // Multisig Signatures
  const [alice, bob, charlie] = [accounts.alice(), accounts.bob(), accounts.charlie()]

  // Create Multisig Account
  const threshold = 3
  const multisigAddress = generateMultisig([alice.address, bob.address, charlie.address], threshold)
  console.log(`Multisig address: ${multisigAddress}`)

  // Funding multisig account
  await fundMultisigAccount(client, alice, multisigAddress)

  // Creating transaction that the multisig account will execute
  const dest = "5DAAnrj7VHTznn2AWBemMuyBwZWs6FNFjdyVXUeYum3PTXFy"
  const amount = ONE_AVAIL
  const submittable = client.tx().balances().transferKeepAlive(dest, amount)

  // Gathering necessary information to execute multisig calls
  const callHash = submittable.callHash().toString()
  const callData = submittable.ext.unwrap().toU8a()
  const callInfo = await submittable.callInfo()
  if (callInfo instanceof AvailError) throw callInfo
  const maxWeight = callInfo.weight

  /*
      The first signature creates and approves the multisig transaction. All the next signatures (besides the last one) should 
      use the `nextApproval` function to approve the tx. The last signature should use the `lastApproval` function to approve
      and execute the multisig tx.
  
      In practice it means the following:
      - If the threshold is 2 do the following:
        - firstApproval
        - lastApproval
      - If the threshold is 4 do the following:
        - firstApproval
        - nextApproval
        - nextApproval
        - lastApproval
    */

  // First Approval
  const firstSignatures = sortMultisigAddresses([bob.address, charlie.address])
  const receipt1 = await firstApproval(client, alice, threshold, firstSignatures, callHash, maxWeight)

  // Approve existing Multisig
  const timepoint: avail.multisig.types.Timepoint = new Timepoint(receipt1.blockHeight, receipt1.extIndex)
  const secondSignatures = sortMultisigAddresses([alice.address, charlie.address])
  await nextApproval(client, bob, threshold, secondSignatures, timepoint, callHash, maxWeight)

  // Execute Multisig
  const thirdSignatures = sortMultisigAddresses([alice.address, bob.address])
  await lastApproval(client, charlie, threshold, thirdSignatures, timepoint, callData, maxWeight)

  process.exit()
}

async function fundMultisigAccount(client: Client, alice: KeyringPair, multisigAddress: string) {
  const amount = TEN_AVAIL
  const tx = client.tx().balances().transferKeepAlive(multisigAddress, amount)

  const submitted = await tx.signAndSubmit(alice)
  if (submitted instanceof AvailError) throw submitted

  const receipt = await submitted.receipt(true)
  if (receipt instanceof AvailError) throw receipt
  if (receipt == null) throw new Error("Failed to find transaction")

  const events = await receipt.events()
  if (events instanceof AvailError) throw events
  if (!events.isExtrinsicSuccessPresent()) throw "Extrinsic failed"
}

async function firstApproval(
  client: Client,
  account: KeyringPair,
  threshold: number,
  otherSignatures: string[],
  callHash: string,
  maxWeight: Weight,
): Promise<TransactionReceipt> {
  const submittable = client.tx().multisig().approveAsMulti(threshold, otherSignatures, null, callHash, maxWeight)
  const submitted = await submittable.signAndSubmit(account)
  if (submitted instanceof AvailError) throw submitted

  const receipt = await submitted.receipt(true)
  if (receipt instanceof AvailError) throw receipt
  if (receipt == null) throw new Error("Failed to find transaction")

  const events = await receipt.events()
  if (events instanceof AvailError) throw events
  if (!events.isExtrinsicSuccessPresent()) throw "Extrinsic failed"

  const event = events.first(avail.multisig.events.NewMultisig)
  if (event == null) throw "Failed to find NewMultisig event"
  console.log(`Approving: ${event.approving}, Call Hash: ${event.callHash}, Multisig: ${event.multisig}`)

  return receipt
}

async function nextApproval(
  client: Client,
  account: KeyringPair,
  threshold: number,
  otherSignatures: string[],
  timepoint: avail.multisig.types.Timepoint,
  callHash: string,
  maxWeight: Weight,
): Promise<TransactionReceipt> {
  const submittable = client.tx().multisig().approveAsMulti(threshold, otherSignatures, timepoint, callHash, maxWeight)
  const submitted = await submittable.signAndSubmit(account)
  if (submitted instanceof AvailError) throw submitted

  const receipt = await submitted.receipt(true)
  if (receipt instanceof AvailError) throw receipt
  if (receipt == null) throw new Error("Failed to find transaction")

  const events = await receipt.events()
  if (events instanceof AvailError) throw events
  if (!events.isExtrinsicSuccessPresent()) throw "Extrinsic failed"

  const event = events.first(avail.multisig.events.MultisigApproval)
  if (event == null) throw "Failed to find MultisigApproval event"
  console.log(
    `Approving: ${event.approving}, Call Hash: ${event.callHash}, Multisig: ${event.multisig}, Timepoint: ${event.timepoint.height}`,
  )

  return receipt
}

async function lastApproval(
  client: Client,
  account: KeyringPair,
  threshold: number,
  otherSignatures: string[],
  timepoint: avail.multisig.types.Timepoint,
  callData: Uint8Array | string,
  maxWeight: Weight,
): Promise<TransactionReceipt> {
  const tx = client.tx().multisig().asMulti(threshold, otherSignatures, timepoint, callData, maxWeight)
  const submitted = await tx.signAndSubmit(account)
  if (submitted instanceof AvailError) throw submitted

  const receipt = await submitted.receipt(true)
  if (receipt instanceof AvailError) throw receipt
  if (receipt == null) throw new Error("Failed to find transaction")

  const events = await receipt.events()
  if (events instanceof AvailError) throw events
  if (!events.isExtrinsicSuccessPresent()) throw "Extrinsic failed"
  if (events.multisigExecutedSuccessfully() !== true) throw "Multisig failed"

  const event = events.first(avail.multisig.events.MultisigExecuted)
  if (event == null) throw "Failed to find MultisigExecuted event"
  if (event.result != "Ok") throw "Multisig execution failed"

  console.log(
    `Approving: ${event.approving}, Call Hash: ${event.callHash}, Multisig: ${event.multisig}, Timepoint: ${event.timepoint.height}, Result: ${event.result}`,
  )

  return receipt
}

main().catch((e) => console.log(e))

/* 
  Expected Output:

  Multisig address: 5EAkPWNziBqEnrw6hkjFVu6EJej7Xf9wEK4CXir6YDS4kvUL
  Approving: 5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY, Call Hash: 0x543b0d9d49971c569ca8f66190f80a01442f38b18ab062a2cb18025e3f3ec332, Multisig: 5EAkPWNziBqEnrw6hkjFVu6EJej7Xf9wEK4CXir6YDS4kvUL
  Approving: 5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty, Call Hash: 0x543b0d9d49971c569ca8f66190f80a01442f38b18ab062a2cb18025e3f3ec332, Multisig: 5EAkPWNziBqEnrw6hkjFVu6EJej7Xf9wEK4CXir6YDS4kvUL, Timepoint: 3
  Approving: 5FLSigC9HGRKVhB9FiEo4Y3koPsNmBmLJbpXg2mp1hXcS59Y, Call Hash: 0x543b0d9d49971c569ca8f66190f80a01442f38b18ab062a2cb18025e3f3ec332, Multisig: 5EAkPWNziBqEnrw6hkjFVu6EJej7Xf9wEK4CXir6YDS4kvUL, Timepoint: 3, Result: Ok
*/
