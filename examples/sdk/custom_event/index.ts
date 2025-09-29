import { isOk } from ".."
import { AvailError } from "../../../src/sdk/error"
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

  static decode(decoder: Decoder): CustomEvent | AvailError {
    const who = decoder.any1(AccountId)
    if (who instanceof AvailError) return who
    const dataHash = decoder.any1(H256)
    if (dataHash instanceof AvailError) return dataHash
    return new CustomEvent(who, dataHash)
  }

  encode(): Uint8Array {
    return u8aConcat(Encoder.any1(this.who), Encoder.any1(this.dataHash))
  }
}

const main = async () => {
  const client = isOk(await Client.create(LOCAL_ENDPOINT))

  const submittable = client.tx.dataAvailability.submitData("abc")
  const submitted = isOk(await submittable.signAndSubmit(alice(), { app_id: 2 }))
  const receipt = isOk((await submitted.receipt(true))!)
  const events = isOk(await receipt.txEvents())

  const event = events.find(CustomEvent)!
  console.log(`Account: ${event.who.toSS58()}, Hash: ${event.dataHash.toString()}`)

  process.exit(0)
}

main()
