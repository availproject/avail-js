import { Client, LOCAL_ENDPOINT } from "./../../src"
import { AccountId, alice, Decoder, Encoder, EventCodec, GeneralError, H256, Utils } from "./../../src/core"

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

const main = async () => {
  const client = await Client.create(LOCAL_ENDPOINT)
  if (client instanceof GeneralError) throw new Error(client.value)

  const submittable = client.tx().dataAvailability().submitData("abc")
  const submitted = await submittable.signAndSubmit(alice(), { app_id: 2 })
  if (submitted instanceof GeneralError) return submitted

  const receipt = (await submitted.receipt(true))!
  if (receipt instanceof GeneralError) throw new Error(receipt.value)

  const events = await receipt.txEvents()
  if (events instanceof GeneralError) throw new Error(events.value)

  const runtimeEvent = events.find((x) => x.emitted_index.toString() == CustomEvent.emittedIndex().toString())!
  const customEvent = EventCodec.decodeHex(CustomEvent, runtimeEvent.encoded!)!
  console.log(`Account: ${customEvent.who.toSS58()}, Hash: ${customEvent.dataHash.toHuman()}`)

  process.exit(0)
}

main()
