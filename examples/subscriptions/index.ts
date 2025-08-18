import { Client, GeneralError, TURING_ENDPOINT } from "./../../src"
import {
  BlockSubscription,
  HeaderSubscription,
  SubscriptionBuilder,
  GrandpaJustificationJsonSubscription,
} from "./../../src/client/subscription"
import { Duration } from "../../src/core"
import { assertEq } from "./../index"

const main = async () => {
  const client = await Client.create(TURING_ENDPOINT)
  if (client instanceof GeneralError) throw client.toError()

  const res1 = await showcaseHeaderSubscription(client)
  if (res1 instanceof GeneralError) throw res1.toError()
  const res2 = await showcaseBlockSubscription(client)
  if (res2 instanceof GeneralError) throw res2.toError()
  const res3 = await showcaseBestBlockSubscription(client)
  if (res3 instanceof GeneralError) throw res3.toError()
  const res4 = await showcaseHistoricalSubscription(client)
  if (res4 instanceof GeneralError) throw res4.toError()
  const res5 = await showcaseGrandpaJustificationJsonSubscription(client)
  if (res5 instanceof GeneralError) throw res5.toError()

  process.exit(0)
}

async function showcaseHeaderSubscription(client: Client): Promise<null | GeneralError> {
  const expectedHeight = await client.finalized.blockHeight()
  if (expectedHeight instanceof GeneralError) return expectedHeight

  const sub = await new SubscriptionBuilder().build(client)
  if (sub instanceof GeneralError) return sub
  const headerSub = new HeaderSubscription(client, sub)

  console.log("Fetching new finalized header")
  {
    const header = (await headerSub.next())!
    if (header instanceof GeneralError) return header
    assertEq(header.number.toNumber(), expectedHeight)
  }

  console.log("Fetching new finalized header")
  {
    const header = (await headerSub.next())!
    if (header instanceof GeneralError) return header
    assertEq(header.number.toNumber(), expectedHeight + 1)
  }

  return null
}

async function showcaseBlockSubscription(client: Client): Promise<null | GeneralError> {
  const expectedHeight = await client.finalized.blockHeight()
  if (expectedHeight instanceof GeneralError) return expectedHeight

  const sub = await new SubscriptionBuilder().build(client)
  if (sub instanceof GeneralError) return sub
  const blockSub = new BlockSubscription(client, sub)

  console.log("Fetching new finalized block")
  {
    const block = (await blockSub.next())!
    if (block instanceof GeneralError) return block
    assertEq(block.block.header.number.toNumber(), expectedHeight)
  }

  console.log("Fetching new finalized block")
  {
    const block = (await blockSub.next())!
    if (block instanceof GeneralError) return block
    assertEq(block.block.header.number.toNumber(), expectedHeight + 1)
  }

  return null
}

async function showcaseBestBlockSubscription(client: Client): Promise<null | GeneralError> {
  let expectedHeight = await client.best.blockHeight()
  if (expectedHeight instanceof GeneralError) return expectedHeight

  const sub = await new SubscriptionBuilder().followBestBlocks().build(client)
  if (sub instanceof GeneralError) return sub
  const blockSub = new BlockSubscription(client, sub)

  console.log("Fetching new best block")
  {
    const block = (await blockSub.next())!
    if (block instanceof GeneralError) return block
    assertEq(block.block.header.number.toNumber(), expectedHeight)
  }

  expectedHeight += 1
  while (true) {
    console.log("Fetching new best block")
    const block = (await blockSub.next())!
    if (block instanceof GeneralError) return block

    if (block.block.header.number.toNumber() == expectedHeight - 1) {
      console.log("Observed fork.")
    }

    if (block.block.header.number.toNumber() == expectedHeight) {
      break
    }
  }

  return null
}

async function showcaseHistoricalSubscription(client: Client): Promise<null | GeneralError> {
  let height = await client.finalized.blockHeight()
  if (height instanceof GeneralError) return height
  height = height > 10 ? height - 10 : 0

  const sub = await new SubscriptionBuilder().blockHeight(height).build(client)
  if (sub instanceof GeneralError) return sub
  const blockSub = new BlockSubscription(client, sub)

  console.log("Fetching new old finalized block")
  {
    const block = (await blockSub.next())!
    if (block instanceof GeneralError) return block
    assertEq(block.block.header.number.toNumber(), height)
  }

  console.log("Fetching new old finalized block")
  {
    const block = (await blockSub.next())!
    if (block instanceof GeneralError) return block
    assertEq(block.block.header.number.toNumber(), height + 1)
  }

  return null
}

async function showcaseGrandpaJustificationJsonSubscription(client: Client): Promise<null | GeneralError> {
  const sub = new GrandpaJustificationJsonSubscription(client, Duration.fromSecs(1), 2100223)

  console.log("Fetching new justification")
  {
    const justification = await sub.next()!
    if (justification instanceof GeneralError) return justification
    assertEq(justification.commit.target_number, 2100224)
  }

  console.log("Fetching new justification")
  {
    const justification = await sub.next()!
    if (justification instanceof GeneralError) return justification
    assertEq(justification.commit.target_number, 2100652)
  }

  return null
}

main()
