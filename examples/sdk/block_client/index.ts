import { assertEq, isOk } from ".."
import { AvailError } from "../../../src/sdk/error"
import { ICall } from "../../../src/sdk/interface"
import { DecodedTransaction, OpaqueTransaction, TransactionReceipt } from "../../../src/sdk/transaction"
import { H256 } from "../../../src/sdk/types"
import { Hex } from "../../../src/sdk/utils"
import { avail, Client, LOCAL_ENDPOINT } from "./../../../src/sdk"
import { alice } from "./../../../src/sdk/accounts"

const main = async () => {
  const client = isOk(await Client.create(LOCAL_ENDPOINT))
  const receipt = isOk(await submitDummyTransaction(client))

  isOk(await transactionExample(client, receipt.blockRef.hash, receipt.txRef.hash))
  isOk(await transactionStaticExample(client, receipt.blockRef.hash, receipt.txRef.hash))
  isOk(await transactionsExample(client, receipt.blockRef.hash))
  isOk(await transactionsFilterExample(client, receipt.blockRef.hash))
  isOk(await blockRpcExample(client, receipt.blockRef.hash))

  process.exit(0)
}

main()

async function submitDummyTransaction(client: Client): Promise<TransactionReceipt | AvailError> {
  const tx = client.tx.dataAvailability.submitData("abc")

  const submitted = await tx.signAndSubmit(alice(), { app_id: 2 })
  if (submitted instanceof AvailError) return submitted

  const receipt = (await submitted.receipt(true))!
  if (receipt instanceof AvailError) return receipt

  return receipt
}

async function transactionExample(client: Client, blockHash: H256, txHash: H256): Promise<null | AvailError> {
  const blocks = client.blockClient()

  // Fetching only the Transaction Call from the block
  const info = (await blocks.transaction(blockHash, txHash))!
  if (info instanceof AvailError) return info

  // Printing out Transaction metadata like: Tx Hash, Tx Index, Pallet Id, Variant Id
  console.log(
    `Tx Hash ${info.txHash}, Tx Index: ${info.txIndex}, Pallet Id: ${info.palletId}, Call id: ${info.variantId}`,
  )

  // Printing out Transaction signature data like: Signer, Nonce, App Id
  const signature = info.signature
  if (signature != null) {
    console.log(`SS58 Address: ${signature.ss58_address}, Nonce: ${signature.nonce}, App Id: ${signature.app_id}`)
  }

  // Decoding the Transaction Call
  const result = decodeTransactionCall(info.data!)
  if (result instanceof AvailError) return result

  // Fetching the whole transaction from the block
  const info2 = (await blocks.transaction(blockHash, txHash, "Extrinsic"))!
  if (info2 instanceof AvailError) return info2

  // Printing out Transaction metadata like: Tx Hash, Tx Index, Pallet Id, Variant Id
  console.log(
    `Tx Hash ${info2.txHash}, Tx Index: ${info2.txIndex}, Pallet Id: ${info2.palletId}, Call id: ${info2.variantId}`,
  )

  // Printing out Transaction signature data like: Signer, Nonce, App Id
  const signature2 = info2.signature
  if (signature2 != null) {
    console.log(`SS58 Address: ${signature2.ss58_address}, Nonce: ${signature2.nonce}, App Id: ${signature2.app_id}`)
  }

  const result2 = decodeTransaction(info2.data!)
  if (result2 instanceof AvailError) return result2

  return null
}

async function transactionStaticExample(client: Client, blockHash: H256, txHash: H256): Promise<null | AvailError> {
  const blocks = client.blockClient()

  // Fetching only the Transaction Call from the block
  const result = (await blocks.transactionStatic(avail.dataAvailability.tx.SubmitData, blockHash, txHash))!
  if (result instanceof AvailError) return result
  const [tx, _, info] = result

  // Printing out Transaction metadata like: Tx Hash, Tx Index, Pallet Id, Variant Id
  console.log(
    `Tx Hash ${info.txHash}, Tx Index: ${info.txIndex}, Pallet Id: ${info.palletId}, Call id: ${info.variantId}`,
  )

  // Printing out Transaction signature data like: Signer, Nonce, App Id
  const signature = info.signature
  if (signature != null) {
    console.log(`SS58 Address: ${signature.ss58_address}, Nonce: ${signature.nonce}, App Id: ${signature.app_id}`)
  }

  console.log(`Data: ${Hex.encode(tx.data)}`)

  return null
}

async function transactionsExample(client: Client, blockHash: H256): Promise<null | AvailError> {
  const blocks = client.blockClient()

  // Fetching only the Transaction Call from the block
  const infos = await blocks.transactions(blockHash)
  if (infos instanceof AvailError) return infos

  for (const info of infos) {
    // Printing out Transaction metadata like: Tx Hash, Tx Index, Pallet Id, Variant Id
    console.log(
      `Tx Hash ${info.txHash}, Tx Index: ${info.txIndex}, Pallet Id: ${info.palletId}, Call id: ${info.variantId}`,
    )

    // Printing out Transaction signature data like: Signer, Nonce, App Id
    const signature = info.signature
    if (signature != null) {
      console.log(`SS58 Address: ${signature.ss58_address}, Nonce: ${signature.nonce}, App Id: ${signature.app_id}`)
    }

    decodeTransactionCall(info.data!)
  }

  return null
}

async function transactionsFilterExample(client: Client, blockHash: H256): Promise<null | AvailError> {
  const blocks = client.blockClient()

  // This will fetch all block transactions that have App Id set to `2`
  const infos = await blocks.transactions(blockHash, { appId: 2 })
  if (infos instanceof AvailError) return infos
  assertEq(infos.length, 1)

  for (const info of infos) {
    assertEq(info.signature!.app_id, 2)
  }

  // This will fetch only block transactions with indices 0 and 1
  const transactionFilter = { TxIndex: [0, 1] }
  const infos2 = await blocks.transactions(blockHash, { transactionFilter })
  if (infos2 instanceof AvailError) return infos2
  assertEq(infos2.length, 2)
  assertEq(infos2[0].txIndex, 0)
  assertEq(infos2[1].txIndex, 1)

  // This will fetch only block transactions that were submitted by Alice
  const address = "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY"
  const infos3 = await blocks.transactions(blockHash, { ss58Address: address })
  if (infos3 instanceof AvailError) return infos3
  assertEq(infos3.length, 1)

  for (const info of infos) {
    assertEq(info.signature!.ss58_address, address)
  }

  return null
}

async function blockRpcExample(client: Client, blockHash: H256): Promise<null | AvailError> {
  const blocks = client.blockClient()

  const block = (await blocks.rpcBlock(blockHash))!
  if (block instanceof AvailError) return block

  const blockHeader = block.block.header
  const maybeJustifications = block.justifications

  console.log(`Block Height: ${blockHeader.number.toNumber()}`)

  if (maybeJustifications.isSome) {
    const justifications = maybeJustifications.unwrap()
    for (const just of justifications) {
      console.log(`Justification: ${just.toString()}`)
    }
  }

  for (const transaction of block.block.extrinsics) {
    decodeTransactionBytes(transaction.toU8a())
  }

  return null
}

function decodeTransaction(tx: string): AvailError | null {
  // TODO
  const decoded = DecodedTransaction.decode(avail.dataAvailability.tx.SubmitData, tx)
  if (!(decoded instanceof AvailError)) {
    const signature = decoded.signature!
    console.log(`SS58 Address: ${signature.address.asId().toSS58()}, App Id: ${signature.txExtra.appId}`)
    console.log(`Data: ${Hex.encode(decoded.call.data)}`)
  }

  const opaque = OpaqueTransaction.decode(tx)
  if (opaque instanceof AvailError) return opaque

  console.log(
    `Pallet index: ${opaque.palletId()}, Call index: ${opaque.variantId()}, Call length: ${opaque.call.length}`,
  )

  const decodedCall = ICall.decode(avail.dataAvailability.tx.SubmitData, opaque.call)
  if (decodedCall != null) {
    console.log(`Data: ${Hex.encode(decodedCall.data)}`)
  }

  return null
}

function decodeTransactionBytes(tx: Uint8Array): AvailError | null {
  // TODO
  const decoded = DecodedTransaction.decode(avail.dataAvailability.tx.SubmitData, tx)
  if (!(decoded instanceof AvailError)) {
    const signature = decoded.signature!
    console.log(`SS58 Address: ${signature.address.asId().toSS58()}, App Id: ${signature.txExtra.appId}`)
    console.log(`Data: ${Hex.encode(decoded.call.data)}`)
  }

  const opaque = OpaqueTransaction.decode(tx)
  if (opaque instanceof AvailError) return opaque

  console.log(
    `Pallet index: ${opaque.palletId()}, Call index: ${opaque.variantId()}, Call length: ${opaque.call.length}`,
  )

  const decodedCall = ICall.decode(avail.dataAvailability.tx.SubmitData, opaque.call)
  if (decodedCall != null) {
    console.log(`Data: ${Hex.encode(decodedCall.data)}`)
  }

  return null
}

function decodeTransactionCall(call: string): AvailError | null {
  // TODO
  const decoded1 = ICall.decode(avail.dataAvailability.tx.SubmitData, call)
  if (decoded1 != null) {
    console.log(`Data: ${Hex.encode(decoded1.data)}`)
  }

  const hexDecoded = Hex.decode(call)
  if (hexDecoded instanceof AvailError) return hexDecoded

  const decoded2 = ICall.decode(avail.dataAvailability.tx.SubmitData, hexDecoded)
  if (decoded2 != null) {
    console.log(`Data: ${Hex.encode(decoded2.data)}`)
  }

  return null
}
