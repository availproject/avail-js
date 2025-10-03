/* import { eqJson, isOk, isOkNotNull } from ".."
import { Client, MAINNET_ENDPOINT, AccountId, H256, BN } from "../../."
import { multisig } from "../../core/types/pallets"
import { ICall } from "../../core/types/pallets"
import { Timepoint } from "../../core/types/pallets/multisig/types"
import { Weight } from "../../core/types/metadata"

export default async function runTests() {
  await tx_test()
  await event_test()
}

async function tx_test() {
  const client = isOk(await Client.create(MAINNET_ENDPOINT))

  {
    const block = client.block(1824125)

    // ApproveAsMulti
    const signatures = [
      "0xa26556769ad6581b7beb103590a5c378955244aa349bbacc2f148c51205e055a",
      "0xdc5d106accefeea0645567b92a5d1667bfabc834bbab673818956b1c29832c29",
    ]
    const callHash = "0xa4b1ac085cea36f1090309159e91d8468b223a8e77026cb545f285658ec17332"
    const weight: Weight = new Weight(new BN("10625088299"), new BN("11037"))
    const submittable = client.tx().multisig().approveAsMulti(2, signatures, null, callHash, weight)
    const expectedCall = ICall.decode(multisig.tx.ApproveAsMulti, submittable.call.method.toU8a())!
    const actualTx = isOkNotNull(await block.ext().get(multisig.tx.ApproveAsMulti, 5))
    eqJson(actualTx.call, expectedCall)
  }

  {
    const block = client.block(1814842)

    // AsMulti
    const signatures = [
      "0x2a960c22ebf8069f53172a91f5754c184e89c87e8435976415ab8c9dd4f0b61c",
      "0x705bfe5b162d54d51808ca5d74094fa72bfaec830f5b1206d8cfd8b6317e7572",
      "0x78459404abf0a6d264c957f113bfd45159d9139692e2680f9670eb95f31eaa6e",
      "0xda6ae7403cf319cde30cc7c3928c444f06ad7f3c69296272e34d225b151c8f6b",
    ]
    const timepoint: Timepoint = new Timepoint(1814743, 2)
    const weight: Weight = new Weight(new BN("196085000"), new BN("3593"))
    const call = client
      .tx()
      .balances()
      .transferKeepAlive(
        "0x8893040a40f0a275e28e0c15dc9f05144b89771e56f901a0235ebe21c44a36bf",
        new BN("50000000000000000000000000"),
      )
    const submittable = client.tx().multisig().asMulti(3, signatures, timepoint, call, weight)
    const expectedCall = ICall.decode(multisig.tx.AsMulti, submittable.call.method.toU8a())!
    const actualTx = isOkNotNull(await block.ext().get(multisig.tx.AsMulti, 1))
    eqJson(actualTx.call, expectedCall)
  }

  {
    const block = client.block(1824115)

    // CancelAsMulti
    const signatures = [
      "0xa26556769ad6581b7beb103590a5c378955244aa349bbacc2f148c51205e055a",
      "0xdc5d106accefeea0645567b92a5d1667bfabc834bbab673818956b1c29832c29",
    ]
    const timepoint: Timepoint = new Timepoint(1824112, 1)
    const callHash = "0xd359983366d5cf17ca06bfd071bf514e80ecb05f24ada11e5dead0d3d3f68ee4"
    const submittable = client.tx().multisig().cancelAsMulti(2, signatures, timepoint, callHash)
    const expectedCall = ICall.decode(multisig.tx.CancelAsMulti, submittable.call.method.toU8a())!
    const actualTx = isOkNotNull(await block.ext().get(multisig.tx.CancelAsMulti, 1))
    eqJson(actualTx.call, expectedCall)
  }
}

async function event_test() {
  const client = isOk(await Client.create(MAINNET_ENDPOINT))

  {
    const block = client.block(1861590)

    // NewMultisig
    const events = isOkNotNull(await block.events().ext(1))
    const event = events.first(multisig.events.NewMultisig, true)
    const expected = new multisig.events.NewMultisig(
      AccountId.from("0x4c4062701850428210b0bb341c92891c2cd8f67c5e66326991f8ee335de2394a", true),
      AccountId.from("0x248fa9bcba295608e1a3d36455a536ac4e4011e8366d8f56effb732b30dc372b", true),
      H256.from("0x69aaac7a36fa01d8c5aa1f634490bf4601891dd7ff19ade0787a37016b9d519a", true),
    )
    eqJson(event, expected)
  }

  {
    const block = client.block(1861592)

    // MultisigExecuted
    const events = isOkNotNull(await block.events().ext(1))
    const event = events.first(multisig.events.MultisigExecuted, true)
    const expected = new multisig.events.MultisigExecuted(
      AccountId.from("0xcf3cb26493846a0a5b758174dbc4dc3f42bf883bc50c8d5f4b4a4d1264dd908e", true),
      new Timepoint(1861590, 1),
      AccountId.from("0x248fa9bcba295608e1a3d36455a536ac4e4011e8366d8f56effb732b30dc372b", true),
      H256.from("0x69aaac7a36fa01d8c5aa1f634490bf4601891dd7ff19ade0787a37016b9d519a", true),
      "Ok",
    )
    eqJson(event, expected)
  }

  {
    const block = client.block(1805938)

    // MultisigApproval
    const events = isOkNotNull(await block.events().ext(1))
    const event = events.first(multisig.events.MultisigApproval, true)
    const expected = new multisig.events.MultisigApproval(
      AccountId.from("0xde54c7f5dbab3620e3093ee263983c0d77bc73e0a5a38391b778c99d2f23d60b", true),
      new Timepoint(1802555, 1),
      AccountId.from("0x0050e994d5891122c2a3416676cd7c1919b88344ea4fd3fb37ff0c5e6c17d753", true),
      H256.from("0xd581a9058842255005b89eb34d85a8631a155b4a8a4aff7d870f544bee5404a3", true),
    )
    eqJson(event, expected)
  }

  {
    const block = client.block(1861588)

    // MultisigCancelled
    const events = isOkNotNull(await block.events().ext(1))
    const event = events.first(multisig.events.MultisigCancelled, true)
    const expected = new multisig.events.MultisigCancelled(
      AccountId.from("0x4c4062701850428210b0bb341c92891c2cd8f67c5e66326991f8ee335de2394a", true),
      new Timepoint(1861566, 1),
      AccountId.from("0x248fa9bcba295608e1a3d36455a536ac4e4011e8366d8f56effb732b30dc372b", true),
      H256.from("0x69aaac7a36fa01d8c5aa1f634490bf4601891dd7ff19ade0787a37016b9d519a", true),
    )
    eqJson(event, expected)
  }
}
 */
