import type { Config } from "jest"

export default async (): Promise<Config> => {
  return {
    preset: "ts-jest",
    testEnvironment: "node",
    detectOpenHandles: true,
    silent: true,
    forceExit: true,
    modulePathIgnorePatterns: ["<rootDir>/build", "<rootDir>/examples"],
    transform: {
      "^.+\\.[tj]sx?$": [
        "ts-jest",
        {
          diagnostics: {
            ignoreCodes: [151002],
          },
        },
      ],
    },
  }
}
