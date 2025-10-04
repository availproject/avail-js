import { Client, core } from "avail-js-sdk"
import { alice } from "avail-js-sdk/sdk/core/misc/accounts"
import { AvailError } from "avail-js-sdk/sdk/core/misc/error"

let client: Client
let busy: boolean = false

const submissionProgress = document.getElementById("submissionProgress") as HTMLProgressElement | null
if (submissionProgress == null) throw "No progress bar"

async function connect() {
  const c = await Client.create(core.misc.constants.TURING_ENDPOINT)
  if (c instanceof AvailError) throw c
  client = c

  if (submissionProgress == null) return
  const endpoint = document.getElementById("endpoint") as HTMLParagraphElement | null
  if (endpoint == null) return
  const chainName = document.getElementById("chainName") as HTMLParagraphElement | null
  if (chainName == null) return
  const genesisHash = document.getElementById("genesisHash") as HTMLParagraphElement | null
  if (genesisHash == null) return

  chainName.textContent = "Chain Name: " + client.api.runtimeChain
  endpoint.textContent = "Endpoint: " + client.endpoint
  genesisHash.textContent = "Genesis Hash: " + client.api.genesisHash.toHex()

  const submit_btn = document.getElementById("submit") as HTMLButtonElement | null
  if (submit_btn == null) return

  submit_btn.addEventListener("click", async () => {
    if (busy) return

    const submissionStatus = document.getElementById("submissionStatus") as HTMLParagraphElement | null
    if (submissionStatus == null) return

    const submitData = document.getElementById("submitData") as HTMLInputElement | null
    if (submitData == null) return

    const dataToSubmit = submitData.value
    const signer = core.misc.accounts.bob()

    busy = true
    const submittable = client.tx().dataAvailability().submitData(dataToSubmit)
    const submitted = await submittable.signAndSubmit(signer, { app_id: 2 })
    if (submitted instanceof AvailError) {
      submissionStatus.textContent = submitted.message
      busy = false
      return
    }

    submissionStatus.textContent =
      "Transaction submitted. Transaction Hash: " +
      submitted.txHash +
      ", Account: " +
      submitted.accountId +
      ". Waiting for receipt... 💤💤💤"

    submissionProgress.value = 0
    const progressTimer = setInterval(() => {
      submissionProgress.value += 100 / 20
    }, 1000)

    const receipt = await submitted.receipt(true)
    if (receipt instanceof AvailError) {
      submissionStatus.textContent = receipt.message

      clearInterval(progressTimer)
      busy = false
      return
    }
    clearInterval(progressTimer)
    submissionProgress.value = 100

    if (receipt == null) {
      submissionStatus.textContent = "Transaction was dropped"
      busy = false
      return
    }

    const info = receipt.blockRef
    submissionStatus.textContent =
      "Transaction included. Block Hash: " +
      info.hash +
      " Height: " +
      info.height +
      "Transaction Index: " +
      receipt.txRef.index +
      ". Explorer link: " +
      "https://explorer.avail.so/?rpc=wss%3A%2F%2Fturing-rpc.avail.so%2Fws#/explorer/query/" +
      info.hash
    busy = false
  })
}

connect()

/* 

    <p id="chainName"></p>
    <p id="endpoint"></p>
    <p id="genesisHash"></p>
*/

/* // Simple TS: type-safe DOM lookups + tiny counter
const msg = document.getElementById("msg") as HTMLParagraphElement | null;
const btn = document.getElementById("btn") as HTMLButtonElement | null;
const countEl = document.getElementById("count") as HTMLSpanElement | null;

if (msg) msg.textContent = "Hello from TypeScript 👋";
let count = 0;

btn?.addEventListener("click", () => {
  count++;
  if (countEl) countEl.textContent = String(count);
});
 */
