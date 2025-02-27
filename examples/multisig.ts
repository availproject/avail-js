import { assert_eq } from "."
import { SDK, BN, KeyringPair, TransactionDetails, utils, Account, Metadata, Pallets } from "./../src/index"

export async function runMultisig() {
  const sdk = await SDK.New(SDK.localEndpoint)

  // Multisig Signatures
  const [alice, bob, charlie] = [Account.alice(), Account.bob(), Account.charlie()]

  // Create Multisig Account
  const threshold = 3
  const multisigAddress = utils.generateMultisig([alice.address, bob.address, charlie.address], threshold)
  await fundMultisigAccount(sdk, alice, multisigAddress)

  // Define what action will be taken by the multisig account
  const amount = SDK.oneAvail()
  const call = sdk.tx.balances.transferKeepAlive(multisigAddress, amount)
  // Data needed for multisig approval and execution
  const callHash = call.tx.method.hash.toString()
  const callData = call.tx.unwrap().toHex()
  const maxWeight = (await call.paymentQueryCallInfo()).weight

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
  const call1signatures = utils.sortMultisigAddresses([bob.address, charlie.address])
  const firstResult = await firstApproval(sdk, alice, threshold, call1signatures, callHash, maxWeight)
  {
    const event = firstResult.events?.findFirst(Pallets.MultisigEvents.NewMultisig)
    if (event == undefined) throw Error()
    console.log(`Approving: ${event.approving.toSS58()}, Multisig: ${event.multisig.toSS58()}, Call Hash: ${event.callHash.toHex()}`)
  }

  // Approve existing Multisig
  const timepoint: Metadata.TimepointBlocknumber = { height: firstResult.blockNumber, index: firstResult.txIndex }
  const call2signatures = utils.sortMultisigAddresses([alice.address, charlie.address])
  const secondResult = await nextApproval(sdk, bob, threshold, call2signatures, timepoint, callHash, maxWeight)

  {
    const event = secondResult.events?.findFirst(Pallets.MultisigEvents.MultisigApproval)
    if (event == undefined) throw Error()
    console.log(`Approving: ${event.approving.toSS58()}, Timepoint Height: ${event.timepoint.height}, Timepoint Index: ${event.timepoint.index}, Multisig: ${event.multisig.toSS58()}, Call Hash: ${event.callHash.toHex()}`)
  }

  // Execute Multisig
  const call3signatures = utils.sortMultisigAddresses([alice.address, bob.address])
  const thirdResult = await lastApproval(sdk, charlie, threshold, call3signatures, timepoint, callData, maxWeight)

  {
    const event = thirdResult.events?.findFirst(Pallets.MultisigEvents.MultisigExecuted)
    if (event == undefined) throw Error()
    assert_eq(event.result.variantIndex, 0)
    console.log(`Approving: ${event.approving.toSS58()}, Timepoint Height: ${event.timepoint.height}, Timepoint Index: ${event.timepoint.index}, Multisig: ${event.multisig.toSS58()}, Call Hash: ${event.callHash.toHex()}, Result: ${event.result.toString()}`)
  }

  console.log("runMultisig finished correctly")
}

async function fundMultisigAccount(sdk: SDK, alice: KeyringPair, multisigAddress: string): Promise<string> {
  console.log("Funding multisig account...")
  const amount = SDK.oneAvail().mul(new BN(100)) // 100 Avail
  const tx = sdk.tx.balances.transferKeepAlive(multisigAddress, amount)
  const res = await tx.executeWaitForInclusion(alice, {})
  assert_eq(res.isSuccessful(), true)
  if (res.events == undefined) throw Error()

  return multisigAddress
}

async function firstApproval(
  sdk: SDK,
  account: KeyringPair,
  threshold: number,
  otherSignatures: string[],
  callHash: string,
  maxWeight: Metadata.Weight,
): Promise<TransactionDetails> {
  console.log("Alice is creating a Multisig Transaction...")

  const tx = sdk.tx.multisig.approveAsMulti(threshold, otherSignatures, null, callHash, maxWeight)
  const res = await tx.executeWaitForInclusion(account, {})
  assert_eq(res.isSuccessful(), true)
  if (res.events == undefined) throw Error()

  return res
}

async function nextApproval(
  sdk: SDK,
  account: KeyringPair,
  threshold: number,
  otherSignatures: string[],
  timepoint: Metadata.TimepointBlocknumber,
  callHash: string,
  maxWeight: Metadata.Weight,
): Promise<TransactionDetails> {
  console.log("Bob is approving the existing Multisig Transaction...")

  const tx = sdk.tx.multisig.approveAsMulti(threshold, otherSignatures, timepoint, callHash, maxWeight)
  const res = await tx.executeWaitForInclusion(account, {})
  assert_eq(res.isSuccessful(), true)
  if (res.events == undefined) throw Error()

  return res
}

async function lastApproval(
  sdk: SDK,
  account: KeyringPair,
  threshold: number,
  otherSignatures: string[],
  timepoint: Metadata.TimepointBlocknumber,
  callData: string,
  maxWeight: Metadata.Weight,
): Promise<TransactionDetails> {
  console.log("Charlie is approving and executing the existing Multisig Transaction...")

  const tx = sdk.tx.multisig.asMulti(threshold, otherSignatures, timepoint, callData, maxWeight)
  const res = await tx.executeWaitForInclusion(account, {})
  assert_eq(res.isSuccessful(), true)
  if (res.events == undefined) throw Error()

  return res
}
