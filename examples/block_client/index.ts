import { alice } from "../../src/core/accounts"
import { Hex } from "../../src/core/utils"
import { Client, LOCAL_ENDPOINT, GeneralError, avail, TransactionReceipt, H256 } from "./../../src/client/index"
import {
  DecodedTransaction,
  decodeHexCall,
  decodeScaleCall,
  OpaqueTransaction,
} from "../../src/core/decoded_transaction"
import { assertEq } from "./../index"

const main = async () => {
  const client = await Client.create(LOCAL_ENDPOINT)
  if (client instanceof GeneralError) throw new Error(client.value)

  const receipt = await submitDummyTransaction(client)
  if (receipt instanceof GeneralError) throw new Error(receipt.value)

  const result1 = await transactionExample(client, receipt.blockLoc.hash, receipt.txLoc.hash)
  if (result1 instanceof GeneralError) throw new Error(result1.value)

  const result2 = await transactionStaticExample(client, receipt.blockLoc.hash, receipt.txLoc.hash)
  if (result2 instanceof GeneralError) throw new Error(result2.value)

  const result3 = await transactionsExample(client, receipt.blockLoc.hash)
  if (result3 instanceof GeneralError) throw new Error(result3.value)

  const result4 = await transactionsFilterExample(client, receipt.blockLoc.hash)
  if (result4 instanceof GeneralError) throw new Error(result4.value)

  const result5 = await blockRpcExample(client, receipt.blockLoc.hash)
  if (result5 instanceof GeneralError) throw new Error(result5.value)

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

async function transactionStaticExample(client: Client, blockHash: H256, txHash: H256): Promise<null | GeneralError> {
  const blocks = client.blockClient()

  // Fetching only the Transaction Call from the block
  const result = (await blocks.transactionStatic(avail.dataAvailability.tx.SubmitData, blockHash, txHash))!
  if (result instanceof GeneralError) return result
  const [tx, info] = result

  // Printing out Transaction metadata like: Tx Hash, Tx Index, Pallet Id, Call Id
  console.log(
    `Tx Hash ${info.tx_hash}, Tx Index: ${info.tx_index}, Pallet Id: ${info.pallet_id}, Call id: ${info.call_id}`,
  )

  // Printing out Transaction signature data like: Signer, Nonce, App Id
  const signature = info.signature
  if (signature != null) {
    console.log(`SS58 Address: ${signature.ss58_address}, Nonce: ${signature.nonce}, App Id: ${signature.app_id}`)
  }

  console.log(`Data: ${Hex.encode(tx.call.data)}`)

  return null
}

async function transactionsExample(client: Client, blockHash: H256): Promise<null | GeneralError> {
  const blocks = client.blockClient()

  // Fetching only the Transaction Call from the block
  const infos = await blocks.transactions(blockHash)
  if (infos instanceof GeneralError) return infos

  for (const info of infos) {
    // Printing out Transaction metadata like: Tx Hash, Tx Index, Pallet Id, Call Id
    console.log(
      `Tx Hash ${info.tx_hash}, Tx Index: ${info.tx_index}, Pallet Id: ${info.pallet_id}, Call id: ${info.call_id}`,
    )

    // Printing out Transaction signature data like: Signer, Nonce, App Id
    const signature = info.signature
    if (signature != null) {
      console.log(`SS58 Address: ${signature.ss58_address}, Nonce: ${signature.nonce}, App Id: ${signature.app_id}`)
    }

    decodeTransactionCall(info.encoded!)
  }

  return null
}

async function transactionsFilterExample(client: Client, blockHash: H256): Promise<null | GeneralError> {
  const blocks = client.blockClient()

  // This will fetch all block transactions that have App Id set to `2`
  const signatureFilter = { app_id: 2 }
  const infos = await blocks.transactions(blockHash, null, signatureFilter)
  if (infos instanceof GeneralError) return infos
  assertEq(infos.length, 1)

  for (const info of infos) {
    assertEq(info.signature!.app_id, 2)
  }

  // This will fetch only block transactions with indices 0 and 1
  const transactionFilter = { TxIndex: [0, 1] }
  const infos2 = await blocks.transactions(blockHash, transactionFilter, null)
  if (infos2 instanceof GeneralError) return infos2
  assertEq(infos2.length, 2)
  assertEq(infos2[0].tx_index, 0)
  assertEq(infos2[1].tx_index, 1)

  // This will fetch only block transactions that were submitted by Alice
  const address = "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY"
  const signatureFilter2 = { ss58_address: address }
  const infos3 = await blocks.transactions(blockHash, null, signatureFilter2)
  if (infos3 instanceof GeneralError) return infos3
  assertEq(infos3.length, 1)

  for (const info of infos) {
    assertEq(info.signature!.ss58_address, address)
  }

  return null
}

async function blockRpcExample(client: Client, blockHash: H256): Promise<null | GeneralError> {
  const blocks = client.blockClient()

  const block = (await blocks.rpcBlock(blockHash))!
  if (block instanceof GeneralError) return block

  const blockHeader = block.block.header
  const maybeJustifications = block.justifications

  console.log(`Block Height: ${blockHeader.number.toNumber()}`)

  if (maybeJustifications.isSome) {
    const justifications = maybeJustifications.unwrap()
    for (const just of justifications) {
      console.log(`Justification: ${just.toHuman()}`)
    }
  }

  for (const transaction of block.block.extrinsics) {
    decodeTransactionBytes(transaction.toU8a())
  }

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

function decodeTransactionBytes(tx: Uint8Array): GeneralError | null {
  // TODO
  const decoded = DecodedTransaction.decodeScale(avail.dataAvailability.tx.SubmitData, tx)
  if (!(decoded instanceof GeneralError)) {
    const signature = decoded.signature!
    console.log(`SS58 Address: ${signature.address.id!.toSS58()}, App Id: ${signature.txExtra.appId}`)
    console.log(`Data: ${Hex.encode(decoded.call.data)}`)
  }

  const opaque = OpaqueTransaction.decodeScale(tx)
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
