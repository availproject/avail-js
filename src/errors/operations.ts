export const ErrorOperation = {
  NormalizeThrown: "NORMALIZE_THROWN",
  RetryExecute: "RETRY_EXECUTE",
  ChainAccountInfo: "CHAIN_ACCOUNT_INFO",
  ChainBlockInfoFrom: "CHAIN_BLOCK_INFO_FROM",
  ChainBlockAuthor: "CHAIN_BLOCK_AUTHOR",
  ChainBlockEventCount: "CHAIN_BLOCK_EVENT_COUNT",
  ChainBlockWeight: "CHAIN_BLOCK_WEIGHT",
  HeadBlockHeader: "HEAD_BLOCK_HEADER",
  HeadSignedBlock: "HEAD_SIGNED_BLOCK",
  BlockHeader: "BLOCK_HEADER",
  BlockSigned: "BLOCK_SIGNED",
  SubscriptionNext: "SUBSCRIPTION_NEXT",
  SubmissionReceiptRange: "SUBMISSION_RECEIPT_RANGE",
  SubmissionWaitForReceipt: "SUBMISSION_WAIT_FOR_RECEIPT",
  RuntimeTxLookup: "RUNTIME_TX_LOOKUP",
} as const

export type ErrorOperation = (typeof ErrorOperation)[keyof typeof ErrorOperation]
