import { isOk } from ".."
import ClientError from "../../../src/sdk/error"
import { EventCodec } from "../../../src/sdk/interface"
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

const main = async () => {
  const client = isOk(await Client.create(LOCAL_ENDPOINT))

  const submittable = client.tx().dataAvailability.submitData("abc")
  const submitted = isOk(await submittable.signAndSubmit(alice(), { app_id: 2 }))
  const receipt = isOk((await submitted.receipt(true))!)
  const events = isOk(await receipt.txEvents())

  const runtimeEvent = events.find(
    (x) => [x.palletId, x.variantId].toString() == CustomEvent.emittedIndex().toString(),
  )!
  const customEvent = EventCodec.decodeHex(CustomEvent, runtimeEvent.encoded!)!
  console.log(`Account: ${customEvent.who.toSS58()}, Hash: ${customEvent.dataHash.toHuman()}`)

  process.exit(0)
}

main()
