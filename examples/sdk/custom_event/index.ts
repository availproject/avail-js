import { isOk } from ".."
import ClientError from "../../../src/sdk/error"
import { addPalletInfo, Event } from "../../../src/sdk/interface"
import { AccountId, H256 } from "../../../src/sdk/types"
import { u8aConcat } from "../../../src/sdk/types/polkadot"
import { Decoder, Encoder } from "../../../src/sdk/types/scale"
import { Client, LOCAL_ENDPOINT } from "./../../../src/sdk"
import { alice } from "./../../../src/sdk/accounts"

class CustomEvent extends addPalletInfo(29, 1) {
  constructor(
    public who: AccountId,
    public dataHash: H256,
  ) {
    super()
  }

  encode(): Uint8Array {
    return u8aConcat(Encoder.any1(this.who), Encoder.any1(this.dataHash))
  }

  static decode(decoder: Decoder): CustomEvent | ClientError {
    const who = decoder.any1(AccountId)
    if (who instanceof ClientError) return who
    const dataHash = decoder.any1(H256)
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
    (x) => [x.palletId, x.variantId].toString() == [CustomEvent.PALLET_ID, CustomEvent.VARIANT_ID].toString(),
  )!
  const customEvent = Event.decode(CustomEvent, runtimeEvent.encoded!)!
  console.log(`Account: ${customEvent.who.toSS58()}, Hash: ${customEvent.dataHash.toHuman()}`)

  Event.encode(customEvent)

  process.exit(0)
}

main()
