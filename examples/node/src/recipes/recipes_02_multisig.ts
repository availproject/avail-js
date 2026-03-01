import { BN, Client, LOCAL_ENDPOINT, Keyring, ONE_AVAIL, Weight, avail } from 'avail-js-sdk'

async function main() {
  const client = await Client.connect(LOCAL_ENDPOINT)

  const alice = new Keyring({ type: 'sr25519' }).addFromUri('//Alice')
  const bob = new Keyring({ type: 'sr25519' }).addFromUri('//Bob')
  const charlie = new Keyring({ type: 'sr25519' }).addFromUri('//Charlie')

  const call = client.tx().balances().transferKeepAlive(charlie.address, ONE_AVAIL)
  const callHash = call.callHash().toString()

  const weight = new Weight(new BN('10000000000'), new BN('0'))
  const firstApproval = client.tx().multisig().approveAsMulti(2, [bob.address], null, callHash, weight)
  const firstSubmitted = await firstApproval.submitSigned(alice, {})
  const firstReceipt = await firstSubmitted.receipt()
  if (!firstReceipt) throw new Error('First approval should be included')

  const timepoint = new avail.multisig.types.Timepoint(firstReceipt.blockHeight, firstReceipt.extIndex)
  const execute = client.tx().multisig().asMulti(2, [alice.address], timepoint, call, weight)
  const executeSubmitted = await execute.submitSigned(bob, {})
  const receipt = await executeSubmitted.receipt()

  console.log(`Multisig execution included: ${receipt != null}`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
