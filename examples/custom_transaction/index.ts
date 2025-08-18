import { Client, LOCAL_ENDPOINT, SubmittableTransaction } from "./../../src"
import {
  alice,
  DecodedTransaction,
  Decoder,
  Encoder,
  GeneralError,
  OpaqueTransaction,
  TransactionCallCodec,
} from "./../../src/core"
import { assertEq } from "./../index"

class CustomTransaction {
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
  const client = await Client.create(LOCAL_ENDPOINT)
  if (client instanceof GeneralError) throw new Error(client.value)
  const data = new Uint8Array([0x61, 0x62, 0x63])

  // Decoding Hex Transaction Call to our Custom Transaction
  // For decoding from bytes call `decodeHex`
  {
    const decoded = TransactionCallCodec.decodeHexCall(CustomTransaction, "0x1d010c616263")!
    assertEq(decoded.data.toString(), data.toString())
  }

  // Decoding whole Hex Transaction to our Custom Transaction
  // For decoding from bytes call `decodeHexTx`
  const tx =
    "0xb90184007e170b74231de8a3b8bbe55e4cda756e1e4eab0807d5637eca2d81d61ac02b15015e7a61c64e171023b165ba4fde6e41bb017a9dab2b357f1fd192c1d2c1f99956cb44df23ff4084b065f31b3b7634e02a081c7f86ca2cbe180b734acd2da3488cd4013c000c1d010c616263"
  {
    const decoded = TransactionCallCodec.decodeHexTransaction(CustomTransaction, tx)!
    assertEq(decoded.data.toString(), data.toString())
  }

  // Decoding whole Hex Transaction to Opaque Transaction and then to Custom Transaction
  {
    const opaque = OpaqueTransaction.decodeHex(tx)
    if (opaque instanceof GeneralError) return opaque

    const decoded = TransactionCallCodec.decodeScaleCall(CustomTransaction, opaque.call)!
    assertEq(decoded.data.toString(), data.toString())
  }

  // Decoding whole Hex Transaction to Decoded Transaction
  {
    const decoded = DecodedTransaction.decodeHex(CustomTransaction, tx)
    if (decoded instanceof GeneralError) return decoded
    assertEq(decoded.call.data.toString(), data.toString())
  }

  // Encoding....
  const call = new CustomTransaction(data)

  const submittable = SubmittableTransaction.from(client, call)
  const submitted = await submittable.signAndSubmit(alice(), { app_id: 3 })
  if (submitted instanceof GeneralError) return submitted

  const receipt = (await submitted.receipt(true))!
  if (receipt instanceof GeneralError) return receipt

  process.exit(0)
}

main()
