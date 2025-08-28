import { assertEq, isOk } from ".."
import { ClientError } from "../../../src/sdk/error"
import { TransactionCallCodec } from "../../../src/sdk/interface"
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

async function submitDummyTransaction(client: Client): Promise<TransactionReceipt | ClientError> {
  const tx = client.tx.dataAvailability.submitData("abc")

  const submitted = await tx.signAndSubmit(alice(), { app_id: 2 })
  if (submitted instanceof ClientError) return submitted

  const receipt = (await submitted.receipt(true))!
  if (receipt instanceof ClientError) return receipt

  return receipt
}

async function transactionExample(client: Client, blockHash: H256, txHash: H256): Promise<null | ClientError> {
  const blocks = client.blockClient()

  // Fetching only the Transaction Call from the block
  const info = (await blocks.transaction(blockHash, txHash))!
  if (info instanceof ClientError) return info

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
  if (result instanceof ClientError) return result

  // Fetching the whole transaction from the block
  const info2 = (await blocks.transaction(blockHash, txHash, "Extrinsic"))!
  if (info2 instanceof ClientError) return info2

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
  if (result2 instanceof ClientError) return result2

  return null
}

async function transactionStaticExample(client: Client, blockHash: H256, txHash: H256): Promise<null | ClientError> {
  const blocks = client.blockClient()

  // Fetching only the Transaction Call from the block
  const result = (await blocks.transactionStatic(avail.dataAvailability.tx.SubmitData, blockHash, txHash))!
  if (result instanceof ClientError) return result
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

async function transactionsExample(client: Client, blockHash: H256): Promise<null | ClientError> {
  const blocks = client.blockClient()

  // Fetching only the Transaction Call from the block
  const infos = await blocks.transactions(blockHash)
  if (infos instanceof ClientError) return infos

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

async function transactionsFilterExample(client: Client, blockHash: H256): Promise<null | ClientError> {
  const blocks = client.blockClient()

  // This will fetch all block transactions that have App Id set to `2`
  const infos = await blocks.transactions(blockHash, { appId: 2 })
  if (infos instanceof ClientError) return infos
  assertEq(infos.length, 1)

  for (const info of infos) {
    assertEq(info.signature!.app_id, 2)
  }

  // This will fetch only block transactions with indices 0 and 1
  const transactionFilter = { TxIndex: [0, 1] }
  const infos2 = await blocks.transactions(blockHash, { transactionFilter })
  if (infos2 instanceof ClientError) return infos2
  assertEq(infos2.length, 2)
  assertEq(infos2[0].tx_index, 0)
  assertEq(infos2[1].tx_index, 1)

  // This will fetch only block transactions that were submitted by Alice
  const address = "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY"
  const infos3 = await blocks.transactions(blockHash, { ss58Address: address })
  if (infos3 instanceof ClientError) return infos3
  assertEq(infos3.length, 1)

  for (const info of infos) {
    assertEq(info.signature!.ss58_address, address)
  }

  return null
}

async function blockRpcExample(client: Client, blockHash: H256): Promise<null | ClientError> {
  const blocks = client.blockClient()

  const block = (await blocks.rpcBlock(blockHash))!
  if (block instanceof ClientError) return block

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

function decodeTransaction(tx: string): ClientError | null {
  // TODO
  const decoded = DecodedTransaction.decode(avail.dataAvailability.tx.SubmitData, tx)
  if (!(decoded instanceof ClientError)) {
    const signature = decoded.signature!
    console.log(`SS58 Address: ${signature.address.asId().toSS58()}, App Id: ${signature.txExtra.appId}`)
    console.log(`Data: ${Hex.encode(decoded.call.data)}`)
  }

  const opaque = OpaqueTransaction.decode(tx)
  if (opaque instanceof ClientError) return opaque

  console.log(
    `Pallet index: ${opaque.palletIndex()}, Call index: ${opaque.callIndex()}, Call length: ${opaque.call.length}`,
  )

  const decodedCall = TransactionCallCodec.decodeCall(avail.dataAvailability.tx.SubmitData, opaque.call)
  if (decodedCall != null) {
    console.log(`Data: ${Hex.encode(decodedCall.data)}`)
  }

  return null
}

function decodeTransactionBytes(tx: Uint8Array): ClientError | null {
  // TODO
  const decoded = DecodedTransaction.decode(avail.dataAvailability.tx.SubmitData, tx)
  if (!(decoded instanceof ClientError)) {
    const signature = decoded.signature!
    console.log(`SS58 Address: ${signature.address.asId().toSS58()}, App Id: ${signature.txExtra.appId}`)
    console.log(`Data: ${Hex.encode(decoded.call.data)}`)
  }

  const opaque = OpaqueTransaction.decode(tx)
  if (opaque instanceof ClientError) return opaque

  console.log(
    `Pallet index: ${opaque.palletIndex()}, Call index: ${opaque.callIndex()}, Call length: ${opaque.call.length}`,
  )

  const decodedCall = TransactionCallCodec.decodeCall(avail.dataAvailability.tx.SubmitData, opaque.call)
  if (decodedCall != null) {
    console.log(`Data: ${Hex.encode(decodedCall.data)}`)
  }

  return null
}

function decodeTransactionCall(call: string): ClientError | null {
  // TODO
  const decoded1 = TransactionCallCodec.decodeCall(avail.dataAvailability.tx.SubmitData, call)
  if (decoded1 != null) {
    console.log(`Data: ${Hex.encode(decoded1.data)}`)
  }

  const hexDecoded = Hex.decode(call)
  if (hexDecoded instanceof ClientError) return hexDecoded

  const decoded2 = TransactionCallCodec.decodeCall(avail.dataAvailability.tx.SubmitData, hexDecoded)
  if (decoded2 != null) {
    console.log(`Data: ${Hex.encode(decoded2.data)}`)
  }

  return null
}
