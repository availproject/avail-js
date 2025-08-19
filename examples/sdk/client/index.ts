import { assertEq, assertNe, assertTrue, isOk } from ".."
import ClientError from "../../../src/sdk/error"
import { H256 } from "../../../src/sdk/types"
import { Client, TURING_ENDPOINT } from "./../../../src/sdk"

const main = async () => {
  const client = isOk(await Client.create(TURING_ENDPOINT))
  isOk(await blockHeaderExample(client))
  isOk(await blockStateExample(client))
  isOk(await blockHeightExample(client))
  isOk(await blockHashExample(client))

  process.exit(0)
}

main()

async function blockHeaderExample(client: Client): Promise<null | ClientError> {
  const blockHash = "0x149d4a65196867e6693c5bc731a430ebb4566a873f278d712c8e6d36aec7cb78"

  // Custom Block Header
  {
    const blockHeader = (await client.blockHeader(blockHash))!
    if (blockHeader instanceof ClientError) return blockHeader
    assertEq(blockHeader.number.toNumber(), 100)
  }

  // Custom Block Header (On Failure and None it retries)
  {
    const blockHeader = (await client.blockHeader(blockHash))!
    if (blockHeader instanceof ClientError) return blockHeader
    assertEq!(blockHeader.number.toNumber(), 100)
  }

  // Best Block Header
  {
    let blockHeader = await client.best.blockHeader()
    if (blockHeader instanceof ClientError) return blockHeader
    assertTrue(blockHeader.number.toNumber() > 100)
  }

  // Finalized Block Header
  {
    let blockHeader = await client.finalized.blockHeader()
    if (blockHeader instanceof ClientError) return blockHeader
    assertTrue!(blockHeader.number.toNumber() > 100)
  }

  return null
}

async function blockStateExample(client: Client): Promise<null | ClientError> {
  // Custom Block State (unknown block hash)
  {
    const loc = { hash: H256.default(), height: 100 }
    const blockState = await client.blockState(loc)
    if (blockState instanceof ClientError) return blockState
    assertEq(blockState, "Discarded")
  }

  // Custom Block State (unknown block height)
  {
    const loc = { hash: H256.default(), height: 500_000_000 }
    const blockState = await client.blockState(loc)
    if (blockState instanceof ClientError) return blockState
    assertEq(blockState, "DoesNotExist")
  }

  // Best Block State
  {
    const loc = await client.best.blockRef()
    if (loc instanceof ClientError) return loc

    const blockState = await client.blockState(loc)
    if (blockState instanceof ClientError) return blockState
    assertEq(blockState, "Included")
  }

  // Finalized Block State
  {
    const loc = await client.finalized.blockRef()
    if (loc instanceof ClientError) return loc

    const blockState = await client.blockState(loc)
    if (blockState instanceof ClientError) return blockState
    assertEq(blockState, "Finalized")
  }

  return null
}

async function blockHeightExample(client: Client): Promise<null | ClientError> {
  const blockHash = "0x149d4a65196867e6693c5bc731a430ebb4566a873f278d712c8e6d36aec7cb78"

  // Block Hash to Block Height
  {
    const blockHeight = (await client.blockHeight(blockHash))!
    if (blockHeight instanceof ClientError) return blockHeight
    assertEq(blockHeight, 100)
  }

  // Block Hash to Block Height (On Failure and None it retries)
  {
    const blockHeight = (await client.blockHeight(blockHash))!
    if (blockHeight instanceof ClientError) return blockHeight
    assertEq(blockHeight, 100)
  }

  // Best Block Height
  {
    const blockHeight = await client.best.blockHeight()
    if (blockHeight instanceof ClientError) return blockHeight
    assertTrue(blockHeight > 100)
  }

  // Finalized Block Height
  {
    const blockHeight = await client.finalized.blockHeight()
    if (blockHeight instanceof ClientError) return blockHeight
    assertTrue(blockHeight > 100)
  }

  return null
}

async function blockHashExample(client: Client): Promise<null | ClientError> {
  const blockHeight = 100

  // Block Height to Block Hash
  {
    const blockHash = (await client.blockHash(blockHeight))!
    if (blockHash instanceof ClientError) return blockHash
    assertEq(blockHash.toHex(), "0x149d4a65196867e6693c5bc731a430ebb4566a873f278d712c8e6d36aec7cb78")
  }

  // Block Height to Block Hash (On Failure and None it retries)
  {
    const blockHash = (await client.blockHash(blockHeight))!
    if (blockHash instanceof ClientError) return blockHash
    assertEq(blockHash.toHex(), "0x149d4a65196867e6693c5bc731a430ebb4566a873f278d712c8e6d36aec7cb78")
  }

  // Best Block Hash
  const bestHash = await client.best.blockHash()
  if (bestHash instanceof ClientError) return bestHash

  // Finalized Block Hash
  const finalizedHash = await client.finalized.blockHash()
  if (finalizedHash instanceof ClientError) return finalizedHash
  assertNe(bestHash.toString(), finalizedHash.toString())

  return null
}
