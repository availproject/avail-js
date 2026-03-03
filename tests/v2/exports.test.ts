import { ErrorCode } from "../../src/errors/codes"
import { Options } from "../../src/submission/options"
import { BlockQueryMode } from "../../src/types/block-query-mode"
import { HeadKind } from "../../src/types/head-kind"
import { RetryPolicy } from "../../src/types/retry-policy"
import { TracingFormat } from "../../src/types/tracing-format"

describe("v2 exports", () => {
  it("exports primary enums", () => {
    expect("enabled").toBe("enabled")
    expect("best").toBe("best")
    expect("finalized").toBe("finalized")
    expect(TracingFormat.Json).toBe("json")
    expect(ErrorCode.Rpc).toBe("RPC_ERROR")
  })

  it("provides options builder", () => {
    const options = Options.new(7).nonce(1)
    expect(options.toSignatureOptions().app_id).toBe(7)
    expect(options.toSignatureOptions().nonce).toBe(1)
  })
})
