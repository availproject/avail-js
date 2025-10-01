import { assertEq, isOk } from ".."
import { AvailError } from "../../../src/sdk/error"
import { addHeader, ICall } from "../../../src/sdk/interface"
import { DecodedTransaction, OpaqueTransaction, SubmittableTransaction } from "../../../src/sdk/transaction"
import { Decoder, Encoder } from "../../../src/sdk/types/scale"
import { Client, LOCAL_ENDPOINT } from "./../../../src/sdk"
import { alice } from "./../../../src/sdk/accounts"

class CustomTransaction extends addHeader(29, 1) {
  constructor(public data: Uint8Array) {
    super()
  }

  encode(): Uint8Array {
    return Encoder.vecU8(this.data)
  }

  static decode(decoder: Decoder): CustomTransaction | AvailError {
    const data = decoder.vecU8()
    if (data instanceof AvailError) return data

    return new CustomTransaction(data)
  }
}

const main = async () => {
  const client = isOk(await Client.create(LOCAL_ENDPOINT))
  const data = new Uint8Array([0x61, 0x62, 0x63])

  // Decoding Hex Transaction Call to our Custom Transaction
  // For decoding from bytes call `decodeHex`
  {
    const decoded = ICall.decode(CustomTransaction, "0x1d010c616263")!
    assertEq(decoded.data.toString(), data.toString())
  }

  // Decoding whole Hex Transaction to our Custom Transaction
  // For decoding from bytes call `decodeHexTx`
  const tx =
    "0xb90184007e170b74231de8a3b8bbe55e4cda756e1e4eab0807d5637eca2d81d61ac02b15015e7a61c64e171023b165ba4fde6e41bb017a9dab2b357f1fd192c1d2c1f99956cb44df23ff4084b065f31b3b7634e02a081c7f86ca2cbe180b734acd2da3488cd4013c000c1d010c616263"
  {
    const decoded = ICall.decodeTransaction(CustomTransaction, tx)!
    assertEq(decoded.data.toString(), data.toString())
  }

  // Decoding whole Hex Transaction to Opaque Transaction and then to Custom Transaction
  {
    const opaque = OpaqueTransaction.decode(tx)
    if (opaque instanceof AvailError) return opaque

    const decoded = ICall.decode(CustomTransaction, opaque.call)!
    assertEq(decoded.data.toString(), data.toString())
  }

  // Decoding whole Hex Transaction to Decoded Transaction
  {
    const decoded = DecodedTransaction.decode(CustomTransaction, tx)
    if (decoded instanceof AvailError) return decoded
    assertEq(decoded.call.data.toString(), data.toString())
  }

  // Encoding....
  const call = new CustomTransaction(data)

  const submittable = SubmittableTransaction.from(client, call)
  const submitted = await submittable.signAndSubmit(alice(), { app_id: 3 })
  if (submitted instanceof AvailError) return submitted

  const receipt = (await submitted.receipt(true))!
  if (receipt instanceof AvailError) return receipt

  process.exit(0)
}

main()
