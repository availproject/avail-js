build:
    just fmt
    tsc
fmt:
    npm run format
lint:
    npm run lint
test:
    cd tests && ts-node index.ts
