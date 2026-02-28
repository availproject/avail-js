build:
    just fmt
    npx tsc --noEmit
fmt:
    npm run format
lint:
    npm run lint
test:
    cd tests && ts-node index.ts
circular:
    npx madge --circular --extensions ts ./