import { BN } from "../../src/core/polkadot"
import { normalizeSignatureOptions, Options } from "../../src/submission/options"

describe("v2 submission options builder", () => {
  it("builds fluent signature options", () => {
    const tip = new BN(10)
    const options = Options.new(3).nonce(9).tip(tip).toSignatureOptions()

    expect(options.app_id).toBe(3)
    expect(options.nonce).toBe(9)
    expect(options.tip?.toString()).toBe("10")
  })

  it("normalizes plain and builder inputs", () => {
    const built = normalizeSignatureOptions(Options.new(5).nonce(2))
    expect(built?.app_id).toBe(5)
    expect(built?.nonce).toBe(2)

    const plain = normalizeSignatureOptions({ app_id: 1, nonce: 4 })
    expect(plain?.app_id).toBe(1)
    expect(plain?.nonce).toBe(4)
  })
})
