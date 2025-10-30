import { AvailError, Client, TURING_ENDPOINT, avail } from "avail-js"
import { EncodedExtrinsic, Extrinsic, SignedExtrinsic } from "avail-js/core"
import { ICall } from "avail-js/core/interface"
import { ExtrinsicInfo } from "avail-js/core/rpc"

async function main() {
  const client = await Client.create(TURING_ENDPOINT)
  if (client instanceof AvailError) throw client

  const block = client.block(2470159)

  const infos1 = await block.extrinsicInfos({ encodeAs: "None" })
  if (infos1 instanceof AvailError) throw infos1
  console.log(`Number of extrinsics in block 2470159: ${infos1.length}`)
  printoutDetails(infos1)
  console.log("")

  // 1
  const infos2 = await block.extrinsicInfos({ encodeAs: "None", filter: { TxIndex: [1] } })
  if (infos2 instanceof AvailError) throw infos2
  console.log(`Number of extrinsics in block 2470159 with Extrinsic Index 1: ${infos2.length}`)
  printoutDetails(infos2)
  console.log("")

  const extHash = "0xede18e2b5714cf4f77b94fab2e1ab45b815da1af88914cc950c0d4eff7c5eef5"
  const infos3 = await block.extrinsicInfos({ encodeAs: "None", filter: { TxHash: [extHash] } })
  if (infos3 instanceof AvailError) throw infos3
  console.log(`Number of extrinsics in block 2470159 with Extrinsic Hash ${extHash}:  ${infos3.length}`)
  printoutDetails(infos3)
  console.log("")

  // 2
  const infos4 = await block.extrinsicInfos({ encodeAs: "None", filter: { TxIndex: [1, 3] } })
  if (infos4 instanceof AvailError) throw infos4
  console.log(`Number of extrinsics in block 2470159 with tx index filter:: ${infos4.length}`)
  printoutDetails(infos4)
  console.log("")

  const extHash1 = "0xede18e2b5714cf4f77b94fab2e1ab45b815da1af88914cc950c0d4eff7c5eef5"
  const extHash2 = "0x92cdb77314063a01930b093516d19a453399710cc8ae635ff5ab6cf76b26f218"
  const infos5 = await block.extrinsicInfos({ encodeAs: "None", filter: { TxHash: [extHash1, extHash2] } })
  if (infos5 instanceof AvailError) throw infos5
  console.log(`Number of extrinsics in block 2470159 with tx hash filter:  ${infos5.length}`)
  printoutDetails(infos5)
  console.log("")

  // 3
  const infos6 = await block.extrinsicInfos({ encodeAs: "None", filter: { Pallet: [29] } })
  if (infos6 instanceof AvailError) throw infos6
  console.log(`Number of extrinsics in block 2470159 with pallet id 29: ${infos6.length}`)
  printoutDetails(infos6)
  console.log("")

  const infos7 = await block.extrinsicInfos({ encodeAs: "None", filter: { PalletCall: [[29, 100]] } })
  if (infos7 instanceof AvailError) throw infos7
  console.log(`Number of extrinsics in block 2470159 with pallet id 29 and variant id 100: ${infos7.length}`)
  printoutDetails(infos7)
  console.log("")

  // 4
  const infos8 = await block.extrinsicInfos({ encodeAs: "None", filter: { Pallet: [3, 39] } })
  if (infos8 instanceof AvailError) throw infos8
  console.log(`Number of extrinsics in block 2470159 with pallet id 3 and 39: ${infos8.length}`)
  printoutDetails(infos8)
  console.log("")

  const infos9 = await block.extrinsicInfos({
    encodeAs: "None",
    filter: {
      PalletCall: [
        [29, 100],
        [3, 0],
      ],
    },
  })
  if (infos9 instanceof AvailError) throw infos9
  console.log(`Number of extrinsics in block 2470159 with PV 29/100 or 3/0: ${infos9.length}`)
  printoutDetails(infos9)
  console.log("")

  // 5
  const infos10 = await block.extrinsicInfos({ encodeAs: "None", appId: 246 })
  if (infos10 instanceof AvailError) throw infos10
  console.log(`Number of extrinsics in block 2470159 with app id 246: ${infos10.length}`)
  printoutDetails(infos10)
  console.log("")

  const infos11 = await block.extrinsicInfos({ encodeAs: "None", nonce: 2221 })
  if (infos11 instanceof AvailError) throw infos11
  console.log(`Number of extrinsics in block 2470159 with nonce 2221: ${infos11.length}`)
  printoutDetails(infos11)
  console.log("")

  const address = "5E9MGdHYokTQzhhfPhfFXfvyMVVnmjdYLy6DcG78srBnYZLA"
  const infos12 = await block.extrinsicInfos({ encodeAs: "None", ss58Address: address })
  if (infos12 instanceof AvailError) throw infos12
  console.log(`Number of extrinsics in block 2470159 with ss58 address ${address}: ${infos12.length}`)
  printoutDetails(infos12)
  console.log("")

  // 6
  const address2 = "5E9MGdHYokTQzhhfPhfFXfvyMVVnmjdYLy6DcG78srBnYZLA"
  const infos13 = await block.extrinsicInfos({ encodeAs: "None", appId: 246, ss58Address: address2 })
  if (infos13 instanceof AvailError) throw infos13
  console.log(`Number of extrinsics in block 2470159 with app id 246 and address ${address}: ${infos13.length}`)
  printoutDetails(infos13)
  console.log("")

  // 7
  const address3 = "5E9MGdHYokTQzhhfPhfFXfvyMVVnmjdYLy6DcG78srBnYZLA"
  const infos14 = await block.extrinsicInfos({
    encodeAs: "None",
    filter: { PalletCall: [[29, 1]] },
    appId: 246,
    ss58Address: address3,
  })
  if (infos14 instanceof AvailError) throw infos14
  console.log(
    `Number of data submission extrinsics in block 2470159 with app id 246 and address ${address}: ${infos14.length}`,
  )
  printoutDetails(infos14)
  console.log("")

  // 8
  const infos15 = await block.extrinsicInfos({ encodeAs: "Call", filter: { TxIndex: [0, 1] } })
  if (infos15 instanceof AvailError) throw infos15
  printoutDetails(infos15)

  if (infos15[0].data == null || infos15[1].data == null) throw "Failed to fetch data"
  const call1 = ICall.decode(avail.timestamp.tx.Set, infos15[0].data)
  const call2 = ICall.decode(avail.dataAvailability.tx.SubmitData, infos15[1].data)
  console.log(`Timestamp::Set now: ${call1?.now}`)
  console.log(`DataAvailability::SubmitData data: ${new TextDecoder().decode(call2?.data)}`)
  console.log("")

  // 9
  const infos16 = await block.extrinsicInfos({ encodeAs: "Extrinsic", filter: { TxIndex: [0, 1] } })
  if (infos16 instanceof AvailError) throw infos16
  printoutDetails(infos16)

  if (infos16[0].data == null || infos16[1].data == null) throw "Failed to fetch data"
  const encExt1 = EncodedExtrinsic.decode(infos16[0].data)
  if (encExt1 instanceof AvailError) throw encExt1
  console.log(
    `Encoded Extrinsic Timestamp::Set call length: ${encExt1.call.length}, Tip: ${encExt1.signature?.extra.tip.toString()}`,
  )

  const ext1 = Extrinsic.decode(avail.timestamp.tx.Set, infos16[0].data)
  if (ext1 instanceof AvailError) throw ext1
  console.log(`Extrinsic Timestamp::Set now: ${ext1.call.now}, Tip: ${ext1.signature?.extra.tip.toString()}`)

  const encExt2 = EncodedExtrinsic.decode(infos16[1].data)
  if (encExt2 instanceof AvailError) throw encExt2
  console.log(
    `Encoded Extrinsic DataAvailability::SubmitData call length: ${encExt2.call.length}, Tip: ${encExt2.signature?.extra.tip.toString()}`,
  )

  const ext2 = Extrinsic.decode(avail.dataAvailability.tx.SubmitData, infos16[1].data)
  if (ext2 instanceof AvailError) throw ext2
  console.log(
    `Extrinsic DataAvailability::SubmitData data: ${new TextDecoder().decode(ext2.call.data)}, Tip: ${ext2.signature?.extra.tip.toString()}`,
  )

  const ext3 = SignedExtrinsic.decode(avail.dataAvailability.tx.SubmitData, infos16[1].data)
  if (ext3 instanceof AvailError) throw ext3
  console.log(
    `Signed Extrinsic DataAvailability::SubmitData data: ${new TextDecoder().decode(ext3.call.data)}, Tip: ${ext3.signature.extra.tip.toString()}`,
  )

  process.exit()
}

main().catch((e) => console.log(e))

function printoutDetails(infos: ExtrinsicInfo[]) {
  for (const info of infos) {
    console.log(
      `Index: ${info.extIndex}, Hash: ${info.extHash}, Pallet ID: ${info.palletId}, Variant ID: ${info.variantId}, App ID: ${info.signerPayload?.appId}, SS58 Address: ${info.signerPayload?.ss58Address}, Data: ${info.data}`,
    )
  }
}

/* 
  Expected Output:

  Number of extrinsics in block 2470159: 8
  Index: 0, Hash: 0x5627989c7e34303f78753e0bada2b9c626fc08a562fecdbe8562140272502818, Pallet ID: 3, Variant ID: 0, App ID: undefined, SS58 Address: undefined, Data: null
  Index: 1, Hash: 0xe1ed26bcdc700418e4629af82065a1d99fb6491c0ceaccade0300d1ee42e6a5c, Pallet ID: 29, Variant ID: 1, App ID: 1, SS58 Address: 5DPDXCcqk1YNVZ3M9s9iwJnr9XAVfTxf8hNa4LS51fjHKAzk, Data: null
  Index: 2, Hash: 0xede18e2b5714cf4f77b94fab2e1ab45b815da1af88914cc950c0d4eff7c5eef5, Pallet ID: 29, Variant ID: 1, App ID: 2, SS58 Address: 5Ev2jfLbYH6ENZ8ThTmqBX58zoinvHyqvRMvtoiUnLLcv1NJ, Data: null
  Index: 3, Hash: 0x6baab0e3ab7e11007dc952d1e2fdbc7031279315438df54e0be10304214c4ee4, Pallet ID: 29, Variant ID: 1, App ID: 246, SS58 Address: 5CPeyHASCF938Zi8NER26czZCpNfX6HPRpCiw5iZAXsY4wpq, Data: null
  Index: 4, Hash: 0x58706d6b50934a572eeb6f261ee9e05d5e6c1d50869fc412aaf5336c47898c82, Pallet ID: 29, Variant ID: 1, App ID: 246, SS58 Address: 5E9MGdHYokTQzhhfPhfFXfvyMVVnmjdYLy6DcG78srBnYZLA, Data: null
  Index: 5, Hash: 0x6750897f5996257c4aad0edd972f2b27442b8ee52e06b10fae07778ac9f6cc46, Pallet ID: 29, Variant ID: 1, App ID: 246, SS58 Address: 5CyjVVqLznydpJ6zU2QKtpu1ZVcoxg2GWD4qc3npwdaPuVyq, Data: null
  Index: 6, Hash: 0x6a06c3db2e4f6f933ef9d6ceeee237f75b77b031cdfc3eec33160727c06f2497, Pallet ID: 29, Variant ID: 1, App ID: 246, SS58 Address: 5H5wVAbv1unXga1eKKdc9mC3UHjLuU8fLyj35jJPf9SFdVYm, Data: null
  Index: 7, Hash: 0x92cdb77314063a01930b093516d19a453399710cc8ae635ff5ab6cf76b26f218, Pallet ID: 39, Variant ID: 11, App ID: undefined, SS58 Address: undefined, Data: null

  Number of extrinsics in block 2470159 with Extrinsic Index 1: 1
  Index: 1, Hash: 0xe1ed26bcdc700418e4629af82065a1d99fb6491c0ceaccade0300d1ee42e6a5c, Pallet ID: 29, Variant ID: 1, App ID: 1, SS58 Address: 5DPDXCcqk1YNVZ3M9s9iwJnr9XAVfTxf8hNa4LS51fjHKAzk, Data: null

  Number of extrinsics in block 2470159 with Extrinsic Hash 0xede18e2b5714cf4f77b94fab2e1ab45b815da1af88914cc950c0d4eff7c5eef5:  1
  Index: 2, Hash: 0xede18e2b5714cf4f77b94fab2e1ab45b815da1af88914cc950c0d4eff7c5eef5, Pallet ID: 29, Variant ID: 1, App ID: 2, SS58 Address: 5Ev2jfLbYH6ENZ8ThTmqBX58zoinvHyqvRMvtoiUnLLcv1NJ, Data: null

  Number of extrinsics in block 2470159 with tx index filter:: 2
  Index: 1, Hash: 0xe1ed26bcdc700418e4629af82065a1d99fb6491c0ceaccade0300d1ee42e6a5c, Pallet ID: 29, Variant ID: 1, App ID: 1, SS58 Address: 5DPDXCcqk1YNVZ3M9s9iwJnr9XAVfTxf8hNa4LS51fjHKAzk, Data: null
  Index: 3, Hash: 0x6baab0e3ab7e11007dc952d1e2fdbc7031279315438df54e0be10304214c4ee4, Pallet ID: 29, Variant ID: 1, App ID: 246, SS58 Address: 5CPeyHASCF938Zi8NER26czZCpNfX6HPRpCiw5iZAXsY4wpq, Data: null

  Number of extrinsics in block 2470159 with tx hash filter:  2
  Index: 2, Hash: 0xede18e2b5714cf4f77b94fab2e1ab45b815da1af88914cc950c0d4eff7c5eef5, Pallet ID: 29, Variant ID: 1, App ID: 2, SS58 Address: 5Ev2jfLbYH6ENZ8ThTmqBX58zoinvHyqvRMvtoiUnLLcv1NJ, Data: null
  Index: 7, Hash: 0x92cdb77314063a01930b093516d19a453399710cc8ae635ff5ab6cf76b26f218, Pallet ID: 39, Variant ID: 11, App ID: undefined, SS58 Address: undefined, Data: null

  Number of extrinsics in block 2470159 with pallet id 29: 6
  Index: 1, Hash: 0xe1ed26bcdc700418e4629af82065a1d99fb6491c0ceaccade0300d1ee42e6a5c, Pallet ID: 29, Variant ID: 1, App ID: 1, SS58 Address: 5DPDXCcqk1YNVZ3M9s9iwJnr9XAVfTxf8hNa4LS51fjHKAzk, Data: null
  Index: 2, Hash: 0xede18e2b5714cf4f77b94fab2e1ab45b815da1af88914cc950c0d4eff7c5eef5, Pallet ID: 29, Variant ID: 1, App ID: 2, SS58 Address: 5Ev2jfLbYH6ENZ8ThTmqBX58zoinvHyqvRMvtoiUnLLcv1NJ, Data: null
  Index: 3, Hash: 0x6baab0e3ab7e11007dc952d1e2fdbc7031279315438df54e0be10304214c4ee4, Pallet ID: 29, Variant ID: 1, App ID: 246, SS58 Address: 5CPeyHASCF938Zi8NER26czZCpNfX6HPRpCiw5iZAXsY4wpq, Data: null
  Index: 4, Hash: 0x58706d6b50934a572eeb6f261ee9e05d5e6c1d50869fc412aaf5336c47898c82, Pallet ID: 29, Variant ID: 1, App ID: 246, SS58 Address: 5E9MGdHYokTQzhhfPhfFXfvyMVVnmjdYLy6DcG78srBnYZLA, Data: null
  Index: 5, Hash: 0x6750897f5996257c4aad0edd972f2b27442b8ee52e06b10fae07778ac9f6cc46, Pallet ID: 29, Variant ID: 1, App ID: 246, SS58 Address: 5CyjVVqLznydpJ6zU2QKtpu1ZVcoxg2GWD4qc3npwdaPuVyq, Data: null
  Index: 6, Hash: 0x6a06c3db2e4f6f933ef9d6ceeee237f75b77b031cdfc3eec33160727c06f2497, Pallet ID: 29, Variant ID: 1, App ID: 246, SS58 Address: 5H5wVAbv1unXga1eKKdc9mC3UHjLuU8fLyj35jJPf9SFdVYm, Data: null

  Number of extrinsics in block 2470159 with pallet id 29 and variant id 100: 0

  Number of extrinsics in block 2470159 with pallet id 3 and 39: 2
  Index: 0, Hash: 0x5627989c7e34303f78753e0bada2b9c626fc08a562fecdbe8562140272502818, Pallet ID: 3, Variant ID: 0, App ID: undefined, SS58 Address: undefined, Data: null
  Index: 7, Hash: 0x92cdb77314063a01930b093516d19a453399710cc8ae635ff5ab6cf76b26f218, Pallet ID: 39, Variant ID: 11, App ID: undefined, SS58 Address: undefined, Data: null

  Number of extrinsics in block 2470159 with PV 29/100 or 3/0: 1
  Index: 0, Hash: 0x5627989c7e34303f78753e0bada2b9c626fc08a562fecdbe8562140272502818, Pallet ID: 3, Variant ID: 0, App ID: undefined, SS58 Address: undefined, Data: null

  Number of extrinsics in block 2470159 with app id 246: 4
  Index: 3, Hash: 0x6baab0e3ab7e11007dc952d1e2fdbc7031279315438df54e0be10304214c4ee4, Pallet ID: 29, Variant ID: 1, App ID: 246, SS58 Address: 5CPeyHASCF938Zi8NER26czZCpNfX6HPRpCiw5iZAXsY4wpq, Data: null
  Index: 4, Hash: 0x58706d6b50934a572eeb6f261ee9e05d5e6c1d50869fc412aaf5336c47898c82, Pallet ID: 29, Variant ID: 1, App ID: 246, SS58 Address: 5E9MGdHYokTQzhhfPhfFXfvyMVVnmjdYLy6DcG78srBnYZLA, Data: null
  Index: 5, Hash: 0x6750897f5996257c4aad0edd972f2b27442b8ee52e06b10fae07778ac9f6cc46, Pallet ID: 29, Variant ID: 1, App ID: 246, SS58 Address: 5CyjVVqLznydpJ6zU2QKtpu1ZVcoxg2GWD4qc3npwdaPuVyq, Data: null
  Index: 6, Hash: 0x6a06c3db2e4f6f933ef9d6ceeee237f75b77b031cdfc3eec33160727c06f2497, Pallet ID: 29, Variant ID: 1, App ID: 246, SS58 Address: 5H5wVAbv1unXga1eKKdc9mC3UHjLuU8fLyj35jJPf9SFdVYm, Data: null

  Number of extrinsics in block 2470159 with nonce 2221: 1
  Index: 3, Hash: 0x6baab0e3ab7e11007dc952d1e2fdbc7031279315438df54e0be10304214c4ee4, Pallet ID: 29, Variant ID: 1, App ID: 246, SS58 Address: 5CPeyHASCF938Zi8NER26czZCpNfX6HPRpCiw5iZAXsY4wpq, Data: null

  Number of extrinsics in block 2470159 with ss58 address 5E9MGdHYokTQzhhfPhfFXfvyMVVnmjdYLy6DcG78srBnYZLA: 1
  Index: 4, Hash: 0x58706d6b50934a572eeb6f261ee9e05d5e6c1d50869fc412aaf5336c47898c82, Pallet ID: 29, Variant ID: 1, App ID: 246, SS58 Address: 5E9MGdHYokTQzhhfPhfFXfvyMVVnmjdYLy6DcG78srBnYZLA, Data: null

  Number of extrinsics in block 2470159 with app id 246 and address 5E9MGdHYokTQzhhfPhfFXfvyMVVnmjdYLy6DcG78srBnYZLA: 1
  Index: 4, Hash: 0x58706d6b50934a572eeb6f261ee9e05d5e6c1d50869fc412aaf5336c47898c82, Pallet ID: 29, Variant ID: 1, App ID: 246, SS58 Address: 5E9MGdHYokTQzhhfPhfFXfvyMVVnmjdYLy6DcG78srBnYZLA, Data: null

  Number of data submission extrinsics in block 2470159 with app id 246 and address 5E9MGdHYokTQzhhfPhfFXfvyMVVnmjdYLy6DcG78srBnYZLA: 1
  Index: 4, Hash: 0x58706d6b50934a572eeb6f261ee9e05d5e6c1d50869fc412aaf5336c47898c82, Pallet ID: 29, Variant ID: 1, App ID: 246, SS58 Address: 5E9MGdHYokTQzhhfPhfFXfvyMVVnmjdYLy6DcG78srBnYZLA, Data: null

  Index: 0, Hash: 0x5627989c7e34303f78753e0bada2b9c626fc08a562fecdbe8562140272502818, Pallet ID: 3, Variant ID: 0, App ID: undefined, SS58 Address: undefined, Data: 03000b0092660c9a01
  Index: 1, Hash: 0xe1ed26bcdc700418e4629af82065a1d99fb6491c0ceaccade0300d1ee42e6a5c, Pallet ID: 29, Variant ID: 1, App ID: 1, SS58 Address: 5DPDXCcqk1YNVZ3M9s9iwJnr9XAVfTxf8hNa4LS51fjHKAzk, Data: 1d01144558542031
  Timestamp::Set now: 1761144640000
  DataAvailability::SubmitData data: EXT 1

  Index: 0, Hash: 0x5627989c7e34303f78753e0bada2b9c626fc08a562fecdbe8562140272502818, Pallet ID: 3, Variant ID: 0, App ID: undefined, SS58 Address: undefined, Data: 280403000b0092660c9a01
  Index: 1, Hash: 0xe1ed26bcdc700418e4629af82065a1d99fb6491c0ceaccade0300d1ee42e6a5c, Pallet ID: 29, Variant ID: 1, App ID: 1, SS58 Address: 5DPDXCcqk1YNVZ3M9s9iwJnr9XAVfTxf8hNa4LS51fjHKAzk, Data: c10184003a5a8284d650213a9e29f4b87efdb1f6c119fbd0e4f4838c39ec2beb6a3409390130e45f934e82212e0a6fb9cc198ee21622cbd651367afc97ce144c34bce21125d79242c57ee4f021bbd350afa5c0483a0bc53a3e6672454116747b0c76deb385d4000800041d01144558542031
  Encoded Extrinsic Timestamp::Set call length: 9, Tip: undefined
  Extrinsic Timestamp::Set now: 1761144640000, Tip: undefined
  Encoded Extrinsic DataAvailability::SubmitData call length: 8, Tip: 0
  Extrinsic DataAvailability::SubmitData data: EXT 1, Tip: 0
  Signed Extrinsic DataAvailability::SubmitData data: EXT 1, Tip: 0
*/
