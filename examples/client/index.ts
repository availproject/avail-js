import { Client, TURING_ENDPOINT, H256, GeneralError } from "./../../src"
import { assertTrue, assertEq, assertNe } from "./../index"

const main = async () => {
  const client = await Client.create(TURING_ENDPOINT)
  if (client instanceof GeneralError) throw new Error(client.value)

  const result = await blockHeaderExample(client)
  if (result instanceof GeneralError) throw new Error(result.value)

  const result2 = await blockStateExample(client)
  if (result2 instanceof GeneralError) throw new Error(result2.value)

  const result3 = await blockHeightExample(client)
  if (result3 instanceof GeneralError) throw new Error(result3.value)

  const result4 = await blockHashExample(client)
  if (result4 instanceof GeneralError) throw new Error(result4.value)

  process.exit(0)
}

main()

async function blockHeaderExample(client: Client): Promise<null | GeneralError> {
  const blockHash = "0x149d4a65196867e6693c5bc731a430ebb4566a873f278d712c8e6d36aec7cb78"

  // Custom Block Header
  {
    const blockHeader = (await client.blockHeader(blockHash))!
    if (blockHeader instanceof GeneralError) return blockHeader
    assertEq(blockHeader.number.toNumber(), 100)
  }

  // Custom Block Header (On Failure and None it retries)
  {
    const blockHeader = (await client.blockHeader(blockHash))!
    if (blockHeader instanceof GeneralError) return blockHeader
    assertEq!(blockHeader.number.toNumber(), 100)
  }

  // Best Block Header
  {
    let blockHeader = await client.best.blockHeader()
    if (blockHeader instanceof GeneralError) return blockHeader
    assertTrue(blockHeader.number.toNumber() > 100)
  }

  // Finalized Block Header
  {
    let blockHeader = await client.finalized.blockHeader()
    if (blockHeader instanceof GeneralError) return blockHeader
    assertTrue!(blockHeader.number.toNumber() > 100)
  }

  return null
}

async function blockStateExample(client: Client): Promise<null | GeneralError> {
  // Custom Block State (unknown block hash)
  {
    const loc = { hash: H256.default(), height: 100 }
    const blockState = await client.blockState(loc)
    if (blockState instanceof GeneralError) return blockState
    assertEq(blockState, "Discarded")
  }

  // Custom Block State (unknown block height)
  {
    const loc = { hash: H256.default(), height: 500_000_000 }
    const blockState = await client.blockState(loc)
    if (blockState instanceof GeneralError) return blockState
    assertEq(blockState, "DoesNotExist")
  }

  // Best Block State
  {
    const loc = await client.best.blockRef()
    if (loc instanceof GeneralError) return loc

    const blockState = await client.blockState(loc)
    if (blockState instanceof GeneralError) return blockState
    assertEq(blockState, "Included")
  }

  // Finalized Block State
  {
    const loc = await client.finalized.blockRef()
    if (loc instanceof GeneralError) return loc

    const blockState = await client.blockState(loc)
    if (blockState instanceof GeneralError) return blockState
    assertEq(blockState, "Finalized")
  }

  return null
}

async function blockHeightExample(client: Client): Promise<null | GeneralError> {
  const blockHash = "0x149d4a65196867e6693c5bc731a430ebb4566a873f278d712c8e6d36aec7cb78"

  // Block Hash to Block Height
  {
    const blockHeight = (await client.blockHeight(blockHash))!
    if (blockHeight instanceof GeneralError) return blockHeight
    assertEq(blockHeight, 100)
  }

  // Block Hash to Block Height (On Failure and None it retries)
  {
    const blockHeight = (await client.blockHeight(blockHash))!
    if (blockHeight instanceof GeneralError) return blockHeight
    assertEq(blockHeight, 100)
  }

  // Best Block Height
  {
    const blockHeight = await client.best.blockHeight()
    if (blockHeight instanceof GeneralError) return blockHeight
    assertTrue(blockHeight > 100)
  }

  // Finalized Block Height
  {
    const blockHeight = await client.finalized.blockHeight()
    if (blockHeight instanceof GeneralError) return blockHeight
    assertTrue(blockHeight > 100)
  }

  return null
}

async function blockHashExample(client: Client): Promise<null | GeneralError> {
  const blockHeight = 100

  // Block Height to Block Hash
  {
    const blockHash = (await client.blockHash(blockHeight))!
    if (blockHash instanceof GeneralError) return blockHash
    assertEq(blockHash.toHex(), "0x149d4a65196867e6693c5bc731a430ebb4566a873f278d712c8e6d36aec7cb78")
  }

  // Block Height to Block Hash (On Failure and None it retries)
  {
    const blockHash = (await client.blockHash(blockHeight))!
    if (blockHash instanceof GeneralError) return blockHash
    assertEq(blockHash.toHex(), "0x149d4a65196867e6693c5bc731a430ebb4566a873f278d712c8e6d36aec7cb78")
  }

  // Best Block Hash
  const bestHash = await client.best.blockHash()
  if (bestHash instanceof GeneralError) return bestHash

  // Finalized Block Hash
  const finalizedHash = await client.finalized.blockHash()
  if (finalizedHash instanceof GeneralError) return finalizedHash
  assertNe(bestHash.toString(), finalizedHash.toString())

  return null
}
