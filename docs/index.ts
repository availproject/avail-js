import { SDK } from "avail-js-sdk"

async function main() {}

main()
  .catch((e) => {
    console.log(e)
    process.exit(1)
  })
  .finally(() => {
    console.log("All Good")
    process.exit(0)
  })
