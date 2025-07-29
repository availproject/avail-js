import { assertEq } from "."
import { ONE_AVAIL } from "../src/client"
import { timestamp, vector, dataAvailability, balances, utility } from "../src/core/chain_types"
import { OpaqueTransaction, DecodedTransaction, Hex, BN, GeneralError } from "../src/core"

export default function runTests() {
  opaque_transaction()
  decoded_transaction()
}

function opaque_transaction() {
  // Decode Timestamp Set transaction (No Signature)
  {
    const opaq = OpaqueTransaction.decodeHex("0x280403000b4003e0479801")
    if (opaq instanceof GeneralError) throw Error(opaq.value)
    assertEq(opaq.signature, null)
    assertEq(opaq.toCall(timestamp.tx.Set)!.now.toString(), "1753552520000")
  }

  // Decode Vector FailedSendMessageTxs transaction (No Signature)
  {
    const opaq = OpaqueTransaction.decodeHex("0x1004270b00")
    if (opaq instanceof GeneralError) throw Error(opaq.value)
    assertEq(opaq.signature, null)
    assertEq(opaq.toCall(vector.tx.FailedSendMessageTxs)!.failedTxs.length, 0)
  }

  // Data Availability Submit Data transaction
  // Account Address: 5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty
  // App ID: 4
  // Tip: 10 Avail
  // Nonce: 2
  // Data abc
  {
    const tx =
      "0xd90184008eaf04151687736326c9fea17e25fc5287613693c912909cb226aa4794f26a48010ed4f3d5f89e4b7a6f849a56b2860878398a5fa5946f3ba4d0aed894ef9faa5b61fd9b0ffb6ffaeb6ae03d8ce6b8189d63239aee7f710207fec32fcf855aed8bf50008130000e8890423c78a101d010c616263"
    const opaq = OpaqueTransaction.decodeHex(tx)
    if (opaq instanceof GeneralError) throw Error(opaq.value)
    const signature = opaq.signature!
    assertEq(signature.address.id!.toSS58(), "5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty")
    assertEq(signature.txExtra.appId, 4)
    assertEq(signature.txExtra.nonce, 2)
    assertEq(signature.txExtra.tip.toString(), ONE_AVAIL.mul(new BN(10)).toString())

    const call = opaq.toCall(dataAvailability.tx.SubmitData)!
    assertEq(Hex.encode(call.data), "0x616263")
  }

  // Balances TransferKeepAlive transaction
  // Account Address: 5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty
  // Dest Address: 5FLSigC9HGRKVhB9FiEo4Y3koPsNmBmLJbpXg2mp1hXcS59Y
  // Amount: 9 AVAIL
  // App ID: 0
  // Tip: 15 Avail
  // Nonce: 3
  {
    const tx =
      "0x710284008eaf04151687736326c9fea17e25fc5287613693c912909cb226aa4794f26a480120d558a3159fb0e4f2d82eba649b755fcfca82bcc857af1b08da9bb129f9f92ab12b1e05bffef01b3ca24ca840f6a23fc378e6a81c56454a44c7f825bec5d18495020c130000dcce86b42ad00006030090b5ab205c6974c9ea841be688864633dc9ca8a357843eeacf2314649965fe2213000084e2506ce67c"
    const opaq = OpaqueTransaction.decodeHex(tx)
    if (opaq instanceof GeneralError) throw Error(opaq.value)
    const signature = opaq.signature!
    assertEq(signature.address.id!.toSS58(), "5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty")
    assertEq(signature.txExtra.appId, 0)
    assertEq(signature.txExtra.nonce, 3)
    assertEq(signature.txExtra.tip.toString(), ONE_AVAIL.mul(new BN(15)).toString())

    const call = opaq.toCall(balances.tx.TransferKeepAlive)!
    assertEq(call.dest.id!.toSS58(), "5FLSigC9HGRKVhB9FiEo4Y3koPsNmBmLJbpXg2mp1hXcS59Y")
    assertEq(call.value.toString(), "9000000000000000000")
  }

  // Utility Batch transaction
  // Tx1: Balances.TransferKeepAlive
  //    - dest: 5CiPPseXPECbkjWCa6MnjNokrgYjMqmKndv2rSnekmSK2DjL
  //    - value: 5 AVAIL
  // Tx2: Balances.TransferKeepAlive
  //    - dest: 5HGjWAeFDfFCWPsjFQdVV2Msvz2XtMktvgocEZcCj68kUMaw
  //    - value: 6 AVAIL
  // Account Address: 5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty
  // App ID: 0
  // Tip: 0 Avail
  // Nonce: 4
  {
    const tx =
      "0x0d0384008eaf04151687736326c9fea17e25fc5287613693c912909cb226aa4794f26a4801844e13c0b87e6fa48c5767d5ebe683ad1ec738277b5b1c2cd659fc4b4843c512ed99aef375cb438dcf960ec16c3b5edbeb142082a8ba0082db611fc267a97286d5011000000100080603001cbd2d43530a44705ad088af313e18f80b53ef16b36177cd4b77b846f2a5f07c130000f44482916345060300e659a7a1628cdd93febc04a4e0646ea20e9f5f0ce097d9a05290d4a9e054df4e13000058ec35484453"
    const opaq = OpaqueTransaction.decodeHex(tx)
    if (opaq instanceof GeneralError) throw Error(opaq.value)
    const signature = opaq.signature!
    assertEq(signature.address.id!.toSS58(), "5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty")
    assertEq(signature.txExtra.appId, 0)
    assertEq(signature.txExtra.nonce, 4)
    assertEq(signature.txExtra.tip.toString(), new BN(0).toString())

    const batch = opaq.toCall(utility.tx.Batch)!
    assertEq(batch.length(), 2)

    const calls = batch.decodeCalls()
    if (calls instanceof GeneralError) throw Error(calls.value)
    assertEq(calls.length, 2)

    const call0 = calls[0].BalancesTransferKeepAlive!
    assertEq(call0.dest.id!.toSS58(), "5CiPPseXPECbkjWCa6MnjNokrgYjMqmKndv2rSnekmSK2DjL")
    assertEq(call0.value.toString(), ONE_AVAIL.mul(new BN(5)).toString())

    const call1 = calls[1].BalancesTransferKeepAlive!
    assertEq(call1.dest.id!.toSS58(), "5HGjWAeFDfFCWPsjFQdVV2Msvz2XtMktvgocEZcCj68kUMaw")
    assertEq(call1.value.toString(), ONE_AVAIL.mul(new BN(6)).toString())
  }
}

function decoded_transaction() {
  // Decode Timestamp Set transaction (No Signature)
  {
    const decoded = DecodedTransaction.decodeHex(timestamp.tx.Set, "0x280403000b4003e0479801")
    if (decoded instanceof GeneralError) throw Error(decoded.value)
    assertEq(decoded.signature, null)
    assertEq(decoded.call.now.toString(), "1753552520000")
  }

  // Decode Vector FailedSendMessageTxs transaction (No Signature)
  {
    const decoded = DecodedTransaction.decodeHex(vector.tx.FailedSendMessageTxs, "0x1004270b00")
    if (decoded instanceof GeneralError) throw Error(decoded.value)
    assertEq(decoded.signature, null)
    assertEq(decoded.call.failedTxs.length, 0)
  }

  // Data Availability Submit Data transaction
  // Account Address: 5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty
  // App ID: 4
  // Tip: 10 Avail
  // Nonce: 2
  // Data abc
  {
    const tx =
      "0xd90184008eaf04151687736326c9fea17e25fc5287613693c912909cb226aa4794f26a48010ed4f3d5f89e4b7a6f849a56b2860878398a5fa5946f3ba4d0aed894ef9faa5b61fd9b0ffb6ffaeb6ae03d8ce6b8189d63239aee7f710207fec32fcf855aed8bf50008130000e8890423c78a101d010c616263"
    const decoded = DecodedTransaction.decodeHex(dataAvailability.tx.SubmitData, tx)
    if (decoded instanceof GeneralError) throw Error(decoded.value)
    const signature = decoded.signature!
    assertEq(signature.address.id!.toSS58(), "5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty")
    assertEq(signature.txExtra.appId, 4)
    assertEq(signature.txExtra.nonce, 2)
    assertEq(signature.txExtra.tip.toString(), ONE_AVAIL.mul(new BN(10)).toString())

    assertEq(Hex.encode(decoded.call.data), "0x616263")
  }

  // Balances TransferKeepAlive transaction
  // Account Address: 5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty
  // Dest Address: 5FLSigC9HGRKVhB9FiEo4Y3koPsNmBmLJbpXg2mp1hXcS59Y
  // Amount: 9 AVAIL
  // App ID: 0
  // Tip: 15 Avail
  // Nonce: 3
  {
    const tx =
      "0x710284008eaf04151687736326c9fea17e25fc5287613693c912909cb226aa4794f26a480120d558a3159fb0e4f2d82eba649b755fcfca82bcc857af1b08da9bb129f9f92ab12b1e05bffef01b3ca24ca840f6a23fc378e6a81c56454a44c7f825bec5d18495020c130000dcce86b42ad00006030090b5ab205c6974c9ea841be688864633dc9ca8a357843eeacf2314649965fe2213000084e2506ce67c"
    const decoded = DecodedTransaction.decodeHex(balances.tx.TransferKeepAlive, tx)
    if (decoded instanceof GeneralError) throw Error(decoded.value)
    const signature = decoded.signature!
    assertEq(signature.address.id!.toSS58(), "5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty")
    assertEq(signature.txExtra.appId, 0)
    assertEq(signature.txExtra.nonce, 3)
    assertEq(signature.txExtra.tip.toString(), ONE_AVAIL.mul(new BN(15)).toString())

    assertEq(decoded.call.dest.id!.toSS58(), "5FLSigC9HGRKVhB9FiEo4Y3koPsNmBmLJbpXg2mp1hXcS59Y")
    assertEq(decoded.call.value.toString(), "9000000000000000000")
  }

  // Utility Batch transaction
  // Tx1: Balances.TransferKeepAlive
  //    - dest: 5CiPPseXPECbkjWCa6MnjNokrgYjMqmKndv2rSnekmSK2DjL
  //    - value: 5 AVAIL
  // Tx2: Balances.TransferKeepAlive
  //    - dest: 5HGjWAeFDfFCWPsjFQdVV2Msvz2XtMktvgocEZcCj68kUMaw
  //    - value: 6 AVAIL
  // Account Address: 5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty
  // App ID: 0
  // Tip: 0 Avail
  // Nonce: 4
  {
    const tx =
      "0x0d0384008eaf04151687736326c9fea17e25fc5287613693c912909cb226aa4794f26a4801844e13c0b87e6fa48c5767d5ebe683ad1ec738277b5b1c2cd659fc4b4843c512ed99aef375cb438dcf960ec16c3b5edbeb142082a8ba0082db611fc267a97286d5011000000100080603001cbd2d43530a44705ad088af313e18f80b53ef16b36177cd4b77b846f2a5f07c130000f44482916345060300e659a7a1628cdd93febc04a4e0646ea20e9f5f0ce097d9a05290d4a9e054df4e13000058ec35484453"
    const decoded = DecodedTransaction.decodeHex(utility.tx.Batch, tx)
    if (decoded instanceof GeneralError) throw Error(decoded.value)
    const signature = decoded.signature!
    assertEq(signature.address.id!.toSS58(), "5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty")
    assertEq(signature.txExtra.appId, 0)
    assertEq(signature.txExtra.nonce, 4)
    assertEq(signature.txExtra.tip.toString(), new BN(0).toString())

    assertEq(decoded.call.length(), 2)

    const calls = decoded.call.decodeCalls()
    if (calls instanceof GeneralError) throw Error(calls.value)
    assertEq(calls.length, 2)

    const call0 = calls[0].BalancesTransferKeepAlive!
    assertEq(call0.dest.id!.toSS58(), "5CiPPseXPECbkjWCa6MnjNokrgYjMqmKndv2rSnekmSK2DjL")
    assertEq(call0.value.toString(), ONE_AVAIL.mul(new BN(5)).toString())

    const call1 = calls[1].BalancesTransferKeepAlive!
    assertEq(call1.dest.id!.toSS58(), "5HGjWAeFDfFCWPsjFQdVV2Msvz2XtMktvgocEZcCj68kUMaw")
    assertEq(call1.value.toString(), ONE_AVAIL.mul(new BN(6)).toString())
  }
}
