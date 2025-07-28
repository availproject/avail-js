import { alice } from "../../src/core/accounts"
import { Hex } from "../../src/core/utils"
import { Client, LOCAL_ENDPOINT, GeneralError, avail, TransactionReceipt, H256 } from "./../../src/client/index"
import {
  DecodedTransaction,
  decodeHexCall,
  decodeScaleCall,
  OpaqueTransaction,
} from "../../src/core/decoded_transaction"

const main = async () => {
  const client = await Client.create(LOCAL_ENDPOINT)
  if (client instanceof GeneralError) throw new Error(client.value)

  const receipt = await submitDummyTransaction(client)
  if (receipt instanceof GeneralError) throw new Error(receipt.value)

  const result1 = await transactionExample(client, receipt.blockLoc.hash, receipt.txLoc.hash)
  if (result1 instanceof GeneralError) throw new Error(result1.value)

  process.exit(0)
}

main()

async function submitDummyTransaction(client: Client): Promise<TransactionReceipt | GeneralError> {
  const tx = client.tx().dataAvailability().submitData("abc")

  const submitted = await tx.signAndSubmit(alice(), { app_id: 2 })
  if (submitted instanceof GeneralError) return submitted

  const receipt = (await submitted.receipt(true))!
  if (receipt instanceof GeneralError) return receipt

  return receipt
}

async function transactionExample(client: Client, blockHash: H256, txHash: H256): Promise<null | GeneralError> {
  const blocks = client.blockClient()

  // Fetching only the Transaction Call from the block
  const info = (await blocks.transaction(blockHash, txHash))!
  if (info instanceof GeneralError) return info

  // Printing out Transaction metadata like: Tx Hash, Tx Index, Pallet Id, Call Id
  console.log(
    `Tx Hash ${info.tx_hash}, Tx Index: ${info.tx_index}, Pallet Id: ${info.pallet_id}, Call id: ${info.call_id}`,
  )

  // Printing out Transaction signature data like: Signer, Nonce, App Id
  const signature = info.signature
  if (signature != null) {
    console.log(`SS58 Address: ${signature.ss58_address}, Nonce: ${signature.nonce}, App Id: ${signature.app_id}`)
  }

  // Decoding the Transaction Call
  const result = decodeTransactionCall(info.encoded!)
  if (result instanceof GeneralError) return result

  // Fetching the whole transaction from the block
  const info2 = (await blocks.transaction(blockHash, txHash, "Extrinsic"))!
  if (info2 instanceof GeneralError) return info2

  // Printing out Transaction metadata like: Tx Hash, Tx Index, Pallet Id, Call Id
  console.log(
    `Tx Hash ${info2.tx_hash}, Tx Index: ${info2.tx_index}, Pallet Id: ${info2.pallet_id}, Call id: ${info2.call_id}`,
  )

  // Printing out Transaction signature data like: Signer, Nonce, App Id
  const signature2 = info2.signature
  if (signature2 != null) {
    console.log(`SS58 Address: ${signature2.ss58_address}, Nonce: ${signature2.nonce}, App Id: ${signature2.app_id}`)
  }

  const result2 = decodeTransaction(info2.encoded!)
  if (result2 instanceof GeneralError) return result2

  return null
}

function decodeTransaction(tx: string): GeneralError | null {
  // TODO
  const decoded = DecodedTransaction.decodeHex(avail.dataAvailability.tx.SubmitData, tx)
  if (!(decoded instanceof GeneralError)) {
    const signature = decoded.signature!
    console.log(`SS58 Address: ${signature.address.id!.toSS58()}, App Id: ${signature.txExtra.appId}`)
    console.log(`Data: ${Hex.encode(decoded.call.data)}`)
  }

  const opaque = OpaqueTransaction.decodeHex(tx)
  if (opaque instanceof GeneralError) return opaque

  console.log(
    `Pallet index: ${opaque.palletIndex()}, Call index: ${opaque.callIndex()}, Call length: ${opaque.call.length}`,
  )

  const decodedCall = decodeScaleCall(avail.dataAvailability.tx.SubmitData, opaque.call)
  if (decodedCall != null) {
    console.log(`Data: ${Hex.encode(decodedCall.data)}`)
  }

  return null
}

function decodeTransactionCall(call: string): GeneralError | null {
  // TODO
  const decoded1 = decodeHexCall(avail.dataAvailability.tx.SubmitData, call)
  if (decoded1 != null) {
    console.log(`Data: ${Hex.encode(decoded1.data)}`)
  }

  const hexDecoded = Hex.decode(call)
  if (hexDecoded instanceof GeneralError) return hexDecoded

  const decoded2 = decodeScaleCall(avail.dataAvailability.tx.SubmitData, hexDecoded)
  if (decoded2 != null) {
    console.log(`Data: ${Hex.encode(decoded2.data)}`)
  }

  return null
}
