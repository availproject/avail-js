import { AvailError } from "../../../src/sdk/error"
import { TransactionReceipt } from "../../../src/sdk/transaction"
import { BN, KeyringPair } from "../../../src/sdk/types"
import { Weight } from "../../../src/sdk/types/metadata"
import { multisig } from "../../../src/sdk/types/pallets"
import { generateMultisig, sortMultisigAddresses } from "../../../src/sdk/utils"
import { Client, LOCAL_ENDPOINT, ONE_AVAIL } from "./../../../src/sdk"
import * as Accounts from "./../../../src/sdk/accounts"
import { assertEq, assertTrue } from "./../index"

export async function main() {
  const client = await Client.create(LOCAL_ENDPOINT)
  if (client instanceof AvailError) throw client

  // Multisig Signatures
  const [alice, bob, charlie] = [Accounts.alice(), Accounts.bob(), Accounts.charlie()]

  // Create Multisig Account
  const threshold = 3
  const multisigAddress = generateMultisig([alice.address, bob.address, charlie.address], threshold)
  await fundMultisigAccount(client, alice, multisigAddress)

  // Define what action will be taken by the multisig account
  const amount = ONE_AVAIL
  const call = client.tx().balances().transferKeepAlive(multisigAddress, amount)
  // Data needed for multisig approval and execution
  const callHash = call.call.method.hash.toString()
  const callData = call.call.unwrap().toU8a()
  const callInfo = await call.queryCallInfo()
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

  // Create New Multisig
  const call1signatures = sortMultisigAddresses([bob.address, charlie.address])
  const receipt1 = await firstApproval(client, alice, threshold, call1signatures, callHash, maxWeight)
  {
    const events = await receipt1.events()
    if (events instanceof AvailError) throw events

    const event = events.find(multisig.events.NewMultisig, true)
    console.log(`Approving: ${event.approving}, Multisig: ${event.multisig}, Call Hash: ${event.callHash}`)
  }

  // Approve existing Multisig
  const timepoint: multisig.types.Timepoint = new multisig.types.Timepoint(
    receipt1.blockRef.height,
    receipt1.txRef.index,
  )
  const call2signatures = sortMultisigAddresses([alice.address, charlie.address])
  const receipt2 = await nextApproval(client, bob, threshold, call2signatures, timepoint, callHash, maxWeight)

  {
    const events = await receipt2.events()
    if (events instanceof AvailError) throw events

    const event = events.find(multisig.events.MultisigApproval, true)
    console.log(
      `Approving: ${event.approving.toSS58()}, Timepoint Height: ${event.timepoint.height}, Timepoint Index: ${event.timepoint.index}, Multisig: ${event.multisig.toSS58()}, Call Hash: ${event.callHash.toHex()}`,
    )
  }

  // Execute Multisig
  const call3signatures = sortMultisigAddresses([alice.address, bob.address])
  const receipt3 = await lastApproval(client, charlie, threshold, call3signatures, timepoint, callData, maxWeight)

  {
    const events = await receipt3.events()
    if (events instanceof AvailError) throw events

    const event = events.find(multisig.events.MultisigExecuted, true)
    assertEq(event.result, "Ok")

    console.log(
      `Approving: ${event.approving.toSS58()}, Timepoint Height: ${event.timepoint.height}, Timepoint Index: ${event.timepoint.index}, Multisig: ${event.multisig.toSS58()}, Call Hash: ${event.callHash.toHex()}, Result: ${event.result.toString()}`,
    )
  }

  process.exit()
}

async function fundMultisigAccount(client: Client, alice: KeyringPair, multisigAddress: string) {
  console.log("Funding multisig account...")
  const amount = ONE_AVAIL.mul(new BN(100)) // 100 Avail
  const tx = client.tx().balances().transferKeepAlive(multisigAddress, amount)

  const submitted = await tx.signAndSubmit(alice)
  if (submitted instanceof AvailError) throw submitted

  const receipt = await submitted.receipt(true)
  if (receipt instanceof AvailError) throw receipt
  if (receipt == null) throw new Error("Failed to find transaction")
}

async function firstApproval(
  client: Client,
  account: KeyringPair,
  threshold: number,
  otherSignatures: string[],
  callHash: string,
  maxWeight: Weight,
): Promise<TransactionReceipt> {
  console.log("Alice is creating a Multisig Transaction...")

  const tx = client.tx().multisig().approveAsMulti(threshold, otherSignatures, null, callHash, maxWeight)
  const submitted = await tx.signAndSubmit(account)
  if (submitted instanceof AvailError) throw submitted

  const receipt = await submitted.receipt(true)
  if (receipt instanceof AvailError) throw receipt
  if (receipt == null) throw new Error("Failed to find transaction")

  const events = await receipt.events()
  if (events instanceof AvailError) throw events
  assertTrue(events.isExtrinsicSuccessPresent())

  return receipt
}

async function nextApproval(
  client: Client,
  account: KeyringPair,
  threshold: number,
  otherSignatures: string[],
  timepoint: multisig.types.Timepoint,
  callHash: string,
  maxWeight: Weight,
): Promise<TransactionReceipt> {
  console.log("Bob is approving the existing Multisig Transaction...")

  const tx = client.tx().multisig().approveAsMulti(threshold, otherSignatures, timepoint, callHash, maxWeight)
  const submitted = await tx.signAndSubmit(account)
  if (submitted instanceof AvailError) throw submitted

  const receipt = await submitted.receipt(true)
  if (receipt instanceof AvailError) throw receipt
  if (receipt == null) throw new Error("Failed to find transaction")

  const events = await receipt.events()
  if (events instanceof AvailError) throw events
  assertTrue(events.isExtrinsicSuccessPresent())

  return receipt
}

async function lastApproval(
  client: Client,
  account: KeyringPair,
  threshold: number,
  otherSignatures: string[],
  timepoint: multisig.types.Timepoint,
  callData: Uint8Array | string,
  maxWeight: Weight,
): Promise<TransactionReceipt> {
  console.log("Charlie is approving and executing the existing Multisig Transaction...")

  const tx = client.tx().multisig().asMulti(threshold, otherSignatures, timepoint, callData, maxWeight)
  const submitted = await tx.signAndSubmit(account)
  if (submitted instanceof AvailError) throw submitted

  const receipt = await submitted.receipt(true)
  if (receipt instanceof AvailError) throw receipt
  if (receipt == null) throw new Error("Failed to find transaction")

  const events = await receipt.events()
  if (events instanceof AvailError) throw events
  assertTrue(events.isExtrinsicSuccessPresent())

  return receipt
}

main()
