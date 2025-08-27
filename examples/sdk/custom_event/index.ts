import { isOk } from ".."
import ClientError from "../../../src/sdk/error"
import { addHeader, IEvent } from "../../../src/sdk/interface"
import { AccountId, H256 } from "../../../src/sdk/types"
import { u8aConcat } from "../../../src/sdk/types/polkadot"
import { Decoder, Encoder } from "../../../src/sdk/types/scale"
import { Client, LOCAL_ENDPOINT } from "./../../../src/sdk"
import { alice } from "./../../../src/sdk/accounts"

class CustomEvent extends addHeader(29, 1) {
  constructor(
    public who: AccountId,
    public dataHash: H256,
  ) {
    super()
  }

  static decode(decoder: Decoder): CustomEvent | ClientError {
    const who = decoder.any1(AccountId)
    if (who instanceof ClientError) return who
    const dataHash = decoder.any1(H256)
    if (dataHash instanceof ClientError) return dataHash
    return new CustomEvent(who, dataHash)
  }

  encode(): Uint8Array {
    return u8aConcat(Encoder.any1(this.who), Encoder.any1(this.dataHash))
  }
}

const main = async () => {
  const client = isOk(await Client.create(LOCAL_ENDPOINT))

  const submittable = client.tx().dataAvailability.submitData("abc")
  const submitted = isOk(await submittable.signAndSubmit(alice(), { app_id: 2 }))
  const receipt = isOk((await submitted.receipt(true))!)
  const events = isOk(await receipt.txEvents())

  const runtimeEvent = events.find(
    (x) => [x.palletId, x.variantId].toString() == [CustomEvent.palletId(), CustomEvent.variantId()].toString(),
  )!
  const customEvent = IEvent.decode(CustomEvent, runtimeEvent.data!)!
  console.log(`Account: ${customEvent.who.toSS58()}, Hash: ${customEvent.dataHash.toHuman()}`)

  IEvent.encode(customEvent)

  process.exit(0)
}

main()
