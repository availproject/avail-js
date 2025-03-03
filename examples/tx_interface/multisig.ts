import { SDK, Keyring, sdkTransactions, utils } from "../../src/sdk"

export async function run() {
  console.log("Multisig_ApproveAsMulti")
  let [blockHeight, txIndex] = await ApproveAsMulti.run()
  console.log("Multisig_AsMulti")
  await AsMulti.run(blockHeight, txIndex)
}

namespace ApproveAsMulti {
  export async function run() {
    const sdk = await SDK.New(SDK.localEndpoint())

    // Multisig Signatures
    const alice = new Keyring({ type: "sr25519" }).addFromUri("//Alice")
    const bobAddress = "5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty"

    // Create Multisig Account
    const threshold = 2
    const multisigAddress = utils.generateMultisig([alice.address, bobAddress], threshold)

    // Define what action will be taken by the multisig account
    const amount = SDK.oneAvail()
    const call = sdk.api.tx.balances.transferKeepAlive(multisigAddress, amount)
    // Data needed for multisig approval and execution
    const callHash = call.method.hash.toString()
    const maxWeight = (await call.paymentInfo(alice.address)).weight

    // Create New Multisig
    console.log("Alice is creating a Multisig Transaction...")
    const call1signatures = utils.sortMultisigAddresses([bobAddress])
    const tx = sdk.tx.multisig.approveAsMulti(threshold, call1signatures, null, callHash, maxWeight)
    const result = (await tx.executeWaitForInclusion(alice)).throwOnFault()

    result.printDebug()

    return [result.blockNumber, result.txIndex]
  }
}

namespace AsMulti {
  export async function run(blockHeight: number, txIndex: number) {
    const sdk = await SDK.New(SDK.localEndpoint())

    // Multisig Signatures
    const bob = new Keyring({ type: "sr25519" }).addFromUri("//Bob")
    const aliceAddress = "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY"

    // Create Multisig Account
    const threshold = 2
    const multisigAddress = utils.generateMultisig([aliceAddress, bob.address], threshold)

    // Define what action will be taken by the multisig account
    const amount = SDK.oneAvail()
    const call = sdk.api.tx.balances.transferKeepAlive(multisigAddress, amount)
    // Data needed for multisig approval and execution
    const callData = call.unwrap().toHex()
    const maxWeight = (await call.paymentInfo(aliceAddress)).weight
    const timepoint: sdkTransactions.MultisigTimepoint = { height: blockHeight, index: txIndex }

    // Approving and executing Multisig transaction
    console.log("Bob is approving and executing the existing Multisig Transaction...")
    const call2signatures = utils.sortMultisigAddresses([aliceAddress])
    const tx = sdk.tx.multisig.asMulti(threshold, call2signatures, timepoint, callData, maxWeight)
    const result = (await tx.executeWaitForInclusion(bob)).throwOnFault()

    result.printDebug()
  }
}
