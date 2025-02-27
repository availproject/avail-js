## TS-Node

1. Install [Node](https://nodejs.org/en/download/package-manager)
2. Install [TS-Node](https://www.npmjs.com/package/ts-node) globally

Save to `index.ts`

```ts
{{#include ./index.ts}}
```

Save to `package.json`

```json
{{#include ./package.json}}
```

Save to `tsconfig.json`

```json
{{#include ./tsconfig.json}}
```

You should now have the following files

- current directory
  - `index.ts`
  - `package.json`
  - `tsconfig.json`

Run the following commands:

- `npm i`
- `ts-node ./index.ts`

## Deno

1. Install [Deno](https://docs.deno.com/runtime/getting_started/installation)

Save to `index.ts`

```ts
{{#include ./index.ts}}
```

Save to `package.json`

```json
{{#include ./package.json}}
```

You should now have the following files

- current directory
  - `index.ts`
  - `package.json`

Run the following commands:

- `deno install`
- `deno run -A ./index.ts`

## Bun

1. Install [Bun](https://bun.sh/docs/installation)

Save to `index.ts`

```ts
{{#include ./index.ts}}
```

Save to `package.json`

```json
{{#include ./package.json}}
```

You should now have the following files

- current directory
  - `index.ts`
  - `package.json`

Run the following commands:

- `bun install`
- `bun run ./index.ts`
