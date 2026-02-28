import { Client, TURING_ENDPOINT } from "avail-js-sdk"

async function main() {
  const client = await Client.connect(TURING_ENDPOINT)

  const era = 582
  const account = "5HpkbR8i5cf87grRKxmYssuVzuVeXaakv4TJLyMEQDdvfxJa"
  const pref = await client.api().query.staking.erasValidatorPrefs(era, account)

  console.log(`ErasValidatorPrefs(era=${era}, account=${account})=${pref.toString()}`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
