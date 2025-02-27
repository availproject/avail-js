import { H256 } from "./metadata";
import { Client } from "./client";
import { Metadata } from ".";

export async function transactionState(client: Client, txHash: string | H256, finalized?: boolean): Promise<Metadata.TransactionState[]> {
  finalized ??= false
  const json = await (client.api.rpc as any).transaction.state(txHash.toString(), finalized)
  const result: Metadata.TransactionState[] = []
  for (const elem of json) {
    result.push({
      blockHash: H256.fromString(elem.block_hash.toString()),
      blockHeight: elem.block_height.toNumber(),
      txHash: H256.fromString(elem.tx_hash.toString()),
      txIndex: elem.tx_index.toNumber(),
      txSuccess: elem.tx_success.toString() == "true",
      palletIndex: elem.pallet_index.toNumber(),
      callIndex: elem.call_index.toNumber(),
      isFinalized: elem.is_finalized.toString() == "true"
    })
  }

  return result
}

