import { assertEq, isOk } from ".."
import ClientError from "../../../src/sdk/error"
import { EventCodec, TransactionCallCodec } from "../../../src/sdk/interface"
import { DecodedTransaction, OpaqueTransaction, SubmittableTransaction } from "../../../src/sdk/transaction"
import { AccountId, H256 } from "../../../src/sdk/types"
import { Decoder, Encoder } from "../../../src/sdk/types/scale"
import { mergeArrays } from "../../../src/sdk/utils"
import { Client, LOCAL_ENDPOINT } from "./../../../src/sdk"
import { alice } from "./../../../src/sdk/accounts"

class CustomEvent {
  constructor(
    public who: AccountId,
    public dataHash: H256,
  ) {}

  encode(): Uint8Array {
    return mergeArrays([Encoder.any(this.who), Encoder.any(this.dataHash)])
  }

  static emittedIndex(): [number, number] {
    return [29, 1]
  }

  emittedIndex(): [number, number] {
    return CustomEvent.emittedIndex()
  }

  static decode(decoder: Decoder): CustomEvent | ClientError {
    const who = decoder.any(AccountId)
    if (who instanceof ClientError) return who

    const dataHash = decoder.any(H256)
    if (dataHash instanceof ClientError) return dataHash

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

  static decode(decoder: Decoder): CustomTransaction | ClientError {
    const data = decoder.vecU8()
    if (data instanceof ClientError) return data

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
  const client = isOk(await Client.create(LOCAL_ENDPOINT))

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
    const opaq = isOk(OpaqueTransaction.decodeHex(tx))
    const signature = opaq.signature!
    assertEq(signature.txExtra.appId, 3)

    const ct = TransactionCallCodec.decodeScaleCall(CustomTransaction, opaq.call)!
    assertEq(new TextDecoder().decode(ct.data), "abc")
  }

  // Decoding whole Hex Transaction to Decoded Transaction
  {
    const decodedTx = isOk(DecodedTransaction.decodeHex(CustomTransaction, tx))
    const signature = decodedTx.signature!
    assertEq(signature.txExtra.appId, 3)
    assertEq(new TextDecoder().decode(decodedTx.call.data), "abc")
  }

  // Encoding
  const ct = new CustomTransaction(new TextEncoder().encode("abc"))
  const submittable = SubmittableTransaction.from(client, ct)

  // Submitting
  const submitted = isOk(await submittable.signAndSubmit(alice(), { app_id: 2 }))
  const receipt = isOk((await submitted.receipt(true))!)
  console.log(`Block Hash: ${receipt.blockRef.hash}`)
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
