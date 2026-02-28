import { Client, AvailError, TURING_ENDPOINT } from "avail-js"
import { bob } from "avail-js/core/accounts"

let client: Client
let busy: boolean = false

const submissionProgress = document.getElementById("submissionProgress") as HTMLProgressElement | null
if (submissionProgress == null) throw "No progress bar"

async function onSubmitButton() {
  if (submissionProgress == null) return
  if (busy) return

  const submissionStatus = document.getElementById("submissionStatus") as HTMLParagraphElement | null
  if (submissionStatus == null) return

  const submitData = document.getElementById("submitData") as HTMLInputElement | null
  if (submitData == null) return

  const dataToSubmit = submitData.value
  const signer = bob()

  busy = true
  const submittable = client.tx().dataAvailability().submitData(dataToSubmit)

  /*   // returns an array of all the injected sources
    // (this needs to be called first, before other requests)
    const allInjected = await web3Enable('Test App');
    console.log({ a: allInjected });
  
    // returns an array of { address, meta: { name, source } }
    // meta.source contains the name of the extension that provides this account
    const allAccounts = await web3Accounts();
    console.log({ a: allAccounts });
  
    // `account` is of type InjectedAccountWithMeta 
    // We arbitrarily select the first account returned from the above snippet
    const account = allAccounts[0];
  
    // to be able to retrieve the signer interface from this account
    // we can use web3FromSource which will return an InjectedExtension type
    const injector = await web3FromSource(account.meta.source);
   */

  const submitted = await submittable.submitSigned(signer, { app_id: 2 })
  if (submitted instanceof AvailError) {
    submissionStatus.textContent = submitted.message
    busy = false
    return
  }

  submissionStatus.textContent =
    "Transaction submitted. Transaction Hash: " +
    submitted.extHash +
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

  submissionStatus.textContent =
    "Transaction included. Block Hash: " +
    receipt.blockHash +
    " Height: " +
    receipt.blockHeight +
    "Transaction Index: " +
    receipt.extIndex +
    ". Explorer link: " +
    "https://explorer.avail.so/?rpc=wss%3A%2F%2Fturing-rpc.avail.so%2Fws#/explorer/query/" +
    receipt.blockHash
  busy = false
}

async function connect() {
  const c = await Client.create(TURING_ENDPOINT)
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

  submit_btn.addEventListener("click", onSubmitButton)
}

connect()
