import { assertEq, isOk } from ".."
import {
  BlockSubscription,
  GrandpaJustificationJsonSubscription,
  HeaderSubscription,
  SubscriptionBuilder,
} from "../../../src/sdk/subscriptions"
import { Duration } from "../../../src/sdk/utils"
import { Client, TURING_ENDPOINT } from "./../../../src/sdk"

const main = async () => {
  const client = isOk(await Client.create(TURING_ENDPOINT))

  await showcaseHeaderSubscription(client)
  await showcaseBlockSubscription(client)
  await showcaseBestBlockSubscription(client)
  await showcaseHistoricalSubscription(client)
  await showcaseGrandpaJustificationJsonSubscription(client)

  process.exit(0)
}

async function showcaseHeaderSubscription(client: Client) {
  const expectedHeight = isOk(await client.finalized.blockHeight())
  const sub = isOk(await new SubscriptionBuilder().build(client))
  const headerSub = new HeaderSubscription(client, sub)

  console.log("Fetching new finalized header")
  {
    const header = isOk((await headerSub.next())!)
    assertEq(header.number.toNumber(), expectedHeight)
  }

  console.log("Fetching new finalized header")
  {
    const header = isOk((await headerSub.next())!)
    assertEq(header.number.toNumber(), expectedHeight + 1)
  }
}

async function showcaseBlockSubscription(client: Client) {
  const expectedHeight = isOk(await client.finalized.blockHeight())
  const sub = isOk(await new SubscriptionBuilder().build(client))
  const blockSub = new BlockSubscription(client, sub)

  console.log("Fetching new finalized block")
  {
    const block = isOk((await blockSub.next())!)
    assertEq(block.block.header.number.toNumber(), expectedHeight)
  }

  console.log("Fetching new finalized block")
  {
    const block = isOk((await blockSub.next())!)
    assertEq(block.block.header.number.toNumber(), expectedHeight + 1)
  }
}

async function showcaseBestBlockSubscription(client: Client) {
  let expectedHeight = isOk(await client.best.blockHeight())
  const sub = isOk(await new SubscriptionBuilder().followBestBlocks().build(client))
  const blockSub = new BlockSubscription(client, sub)

  console.log("Fetching new best block")
  {
    const block = isOk((await blockSub.next())!)
    assertEq(block.block.header.number.toNumber(), expectedHeight)
  }

  expectedHeight += 1
  while (true) {
    console.log("Fetching new best block")
    const block = isOk((await blockSub.next())!)

    if (block.block.header.number.toNumber() == expectedHeight - 1) {
      console.log("Observed fork.")
    }

    if (block.block.header.number.toNumber() == expectedHeight) {
      break
    }
  }
}

async function showcaseHistoricalSubscription(client: Client) {
  let height = isOk(await client.finalized.blockHeight())
  height = height > 10 ? height - 10 : 0

  const sub = isOk(await new SubscriptionBuilder().blockHeight(height).build(client))
  const blockSub = new BlockSubscription(client, sub)

  console.log("Fetching new old finalized block")
  {
    const block = isOk((await blockSub.next())!)
    assertEq(block.block.header.number.toNumber(), height)
  }

  console.log("Fetching new old finalized block")
  {
    const block = isOk((await blockSub.next())!)
    assertEq(block.block.header.number.toNumber(), height + 1)
  }
}

async function showcaseGrandpaJustificationJsonSubscription(client: Client) {
  const sub = new GrandpaJustificationJsonSubscription(client, Duration.fromSecs(1), 2100223)

  console.log("Fetching new justification")
  {
    const justification = isOk(await sub.next()!)
    assertEq(justification.commit.target_number, 2100224)
  }

  console.log("Fetching new justification")
  {
    const justification = isOk(await sub.next()!)
    assertEq(justification.commit.target_number, 2100652)
  }
}

main()
