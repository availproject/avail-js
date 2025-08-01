import { Client, LOCAL_ENDPOINT, SubmittableTransaction } from "./../../src/client"
import {
  GeneralError,
  alice,
  EventCodec,
  Encoder,
  Decoder,
  AccountId,
  H256,
  Utils,
  TransactionCallCodec,
  OpaqueTransaction,
  DecodedTransaction,
} from "../../src/core"
import { assertEq } from "./../index"

class CustomEvent {
  constructor(
    public who: AccountId,
    public dataHash: H256,
  ) {}

  encode(): Uint8Array {
    return Utils.mergeArrays([Encoder.any(this.who), Encoder.any(this.dataHash)])
  }

  static emittedIndex(): [number, number] {
    return [29, 1]
  }

  emittedIndex(): [number, number] {
    return CustomEvent.emittedIndex()
  }

  static decode(decoder: Decoder): CustomEvent | GeneralError {
    const who = decoder.any(AccountId)
    if (who instanceof GeneralError) return who

    const dataHash = decoder.any(H256)
    if (dataHash instanceof GeneralError) return dataHash

    return new CustomEvent(who, dataHash)
  }
}

export class CustomTransaction {
  constructor(public data: Uint8Array) {}

  encode(): Uint8Array {
    return Encoder.vecU8(this.data)
  }

  static dispatchIndex(): [number, number] {
    return [29, 1]
  }

  dispatchIndex(): [number, number] {
    return CustomTransaction.dispatchIndex()
  }

  static decode(decoder: Decoder): CustomTransaction | GeneralError {
    const data = decoder.vecU8()
    if (data instanceof GeneralError) return data

    return new CustomTransaction(data)
  }
}

const main = async () => {
  await transactionDecodingEncoding()
  eventDecodingEncoding()

  process.exit(0)
}

main()

async function transactionDecodingEncoding() {
  const client = await Client.create(LOCAL_ENDPOINT)
  if (client instanceof GeneralError) throw new Error(client.value)

  // Decoding

  // Decoding Hex Transaction Call to our Custom Transaction
  // For decoding from bytes call `decodeScale`
  {
    const ct = TransactionCallCodec.decodeHexCall(CustomTransaction, "0x1d010c616263")!
    assertEq(new TextDecoder().decode(ct.data), "abc")
  }

  // Decoding whole Hex Transaction to our Custom Transaction
  // For decoding from bytes call `decodeScaleTransaction`
  const tx =
    "0xb9018400d43593c715fdd31c61141abd04a99fd6822c8558854ccde39a5684e7a56da27d014ac740fa88d56954b4a3982e0fa9cdc8f44d8364c01fefc895c7751395709c1fda59696f4b9b74e1831e92487e62122cb4ac3ec82aa1af52a4473866f29dc087150104000c1d010c616263"
  {
    const ct = TransactionCallCodec.decodeHexTransaction(CustomTransaction, tx)!
    assertEq(new TextDecoder().decode(ct.data), "abc")
  }

  // Decoding whole Hex Transaction to Opaque Transaction and then to Custom Transaction
  {
    const opaq = OpaqueTransaction.decodeHex(tx)
    if (opaq instanceof GeneralError) throw new Error(opaq.value)
    const signature = opaq.signature!
    assertEq(signature.txExtra.appId, 3)

    const ct = TransactionCallCodec.decodeScaleCall(CustomTransaction, opaq.call)!
    assertEq(new TextDecoder().decode(ct.data), "abc")
  }

  // Decoding whole Hex Transaction to Decoded Transaction
  {
    const decodedTx = DecodedTransaction.decodeHex(CustomTransaction, tx)
    if (decodedTx instanceof GeneralError) throw new Error(decodedTx.value)
    const signature = decodedTx.signature!
    assertEq(signature.txExtra.appId, 3)
    assertEq(new TextDecoder().decode(decodedTx.call.data), "abc")
  }

  // Encoding
  const ct = new CustomTransaction(new TextEncoder().encode("abc"))
  const submittable = SubmittableTransaction.from(client, ct)

  // Submitting
  const submitted = await submittable.signAndSubmit(alice(), { app_id: 2 })
  if (submitted instanceof GeneralError) throw new Error(submitted.value)
  const receipt = (await submitted.receipt(true))!
  if (receipt instanceof GeneralError) throw new Error(receipt.value)
  console.log(`Block Hash: ${receipt.blockLoc.hash}`)
}

function eventDecodingEncoding() {
  const targetWho = "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY"
  const targetDataHash = "0xbddd813c634239723171ef3fee98579b94964e3bb1cb3e427262c8c068d52319"

  // Decoding
  const event =
    "0x1d01d43593c715fdd31c61141abd04a99fd6822c8558854ccde39a5684e7a56da27dbddd813c634239723171ef3fee98579b94964e3bb1cb3e427262c8c068d52319"
  {
    const ct = EventCodec.decodeHex(CustomEvent, event)!
    assertEq(ct.who.toString(), targetWho)
    assertEq(ct.dataHash.toString(), targetDataHash)
  }

  // Encoding
  {
    const ct = new CustomEvent(AccountId.fromSS58(targetWho), H256.fromHexUnsafe(targetDataHash))
    assertEq(EventCodec.encodeHex(ct), event)
  }
}
