import { Client, TURING_ENDPOINT } from "avail-js-sdk"

async function main() {
  const client = await Client.connect(TURING_ENDPOINT)
  const group = await client.block(2042845).events().extrinsic(1)

  if (group == null) {
    throw new Error("No extrinsic event group found")
  }

  let dataSubmitted: (typeof group.events)[number] | undefined
  for (const event of group.events) {
    if (event.palletId === 29 && event.variantId === 1) {
      dataSubmitted = event
      break
    }
  }
  if (dataSubmitted == null) {
    throw new Error("No DataAvailability::DataSubmitted event found")
  }

  console.log(
    `phase=${group.phase} eventIndex=${dataSubmitted.index} encodedData=${dataSubmitted.encodedData ?? "none"}`,
  )
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
