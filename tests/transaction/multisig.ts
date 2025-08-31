import { assertEqJson, isOkAndNotNull } from ".."
import { Client, ClientError, MAINNET_ENDPOINT } from "../../src/sdk"
import { multisig } from "../../src/sdk/types/pallets"
import { ICall } from "../../src/sdk/interface"
import { BN } from "../../src/sdk/types"
import { Weight } from "../../src/sdk/types/metadata"
import { Timepoint } from "../../src/sdk/types/pallets/multisig/types"

export default async function runTests() {
  await tx_test()
}

async function tx_test() {
  const client = await Client.create(MAINNET_ENDPOINT)
  if (client instanceof ClientError) throw client

  const blockClient = client.blockClient()
  {
    // ApproveAsMulti
    const signature = [
      "0xa26556769ad6581b7beb103590a5c378955244aa349bbacc2f148c51205e055a",
      "0xdc5d106accefeea0645567b92a5d1667bfabc834bbab673818956b1c29832c29",
    ]
    const callHash = "0xa4b1ac085cea36f1090309159e91d8468b223a8e77026cb545f285658ec17332"
    const weight: Weight = new Weight(new BN("10625088299"), new BN("11037"))
    const submittable = client.tx.multisig.approveAsMulti(2, signature, null, callHash, weight)
    const expectedCall = ICall.decode(multisig.tx.ApproveAsMulti, submittable.call.method.toU8a())!
    const [actualCall] = isOkAndNotNull(await blockClient.transactionStatic(multisig.tx.ApproveAsMulti, 1824125, 5))
    assertEqJson(actualCall, expectedCall)
  }

  {
    // AsMulti
    const signature = [
      "0x2a960c22ebf8069f53172a91f5754c184e89c87e8435976415ab8c9dd4f0b61c",
      "0x705bfe5b162d54d51808ca5d74094fa72bfaec830f5b1206d8cfd8b6317e7572",
      "0x78459404abf0a6d264c957f113bfd45159d9139692e2680f9670eb95f31eaa6e",
      "0xda6ae7403cf319cde30cc7c3928c444f06ad7f3c69296272e34d225b151c8f6b",
    ]
    const timepoint: Timepoint = new Timepoint(1814743, 2)
    const weight: Weight = new Weight(new BN("196085000"), new BN("3593"))
    const call = client.tx.balances.transferKeepAlive(
      "0x8893040a40f0a275e28e0c15dc9f05144b89771e56f901a0235ebe21c44a36bf",
      new BN("50000000000000000000000000"),
    )
    const submittable = client.tx.multisig.asMulti(3, signature, timepoint, call, weight)
    const expectedCall = ICall.decode(multisig.tx.AsMulti, submittable.call.method.toU8a())!
    const [actualCall] = isOkAndNotNull(await blockClient.transactionStatic(multisig.tx.AsMulti, 1814842, 1))
    assertEqJson(actualCall, expectedCall)
  }

  {
    // CancelAsMulti
    const signature = [
      "0xa26556769ad6581b7beb103590a5c378955244aa349bbacc2f148c51205e055a",
      "0xdc5d106accefeea0645567b92a5d1667bfabc834bbab673818956b1c29832c29",
    ]
    const timepoint: Timepoint = new Timepoint(1824112, 1)
    const callHash = "0xd359983366d5cf17ca06bfd071bf514e80ecb05f24ada11e5dead0d3d3f68ee4"
    const submittable = client.tx.multisig.cancelAsMulti(2, signature, timepoint, callHash)
    const expectedCall = ICall.decode(multisig.tx.CancelAsMulti, submittable.call.method.toU8a())!
    const [actualCall] = isOkAndNotNull(await blockClient.transactionStatic(multisig.tx.CancelAsMulti, 1824115, 1))
    assertEqJson(actualCall, expectedCall)
  }
}
