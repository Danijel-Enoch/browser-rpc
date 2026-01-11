# Claude Context for rpc-proxy

This file provides context for AI assistants working on this project.

## Project Overview

`rpc-proxy` is a local RPC proxy server that intercepts Ethereum transactions from development tools (Foundry, Hardhat) and routes them through a browser wallet for signing. This eliminates the need for developers to manage separate deployer keys with private keys in `.env` files.

## Current State

**Status: MVP feature-complete, ready for end-to-end testing**

All core components are built and the project compiles successfully. The next step is testing the full flow with a real transaction.

### What's Working
- Server starts and proxies RPC calls to upstream
- Transaction interception logic is implemented
- Web UI builds and renders
- Wallet connection via RainbowKit works
- API endpoints for pending transactions exist

### What Needs Testing
- Full end-to-end flow: script → server → browser → wallet → back to script
- The transfer test script in `packages/scripts/src/transfer.ts` is ready to use

## Quick Start for Testing

```bash
# Terminal 1: Start the RPC proxy server
bun run packages/server/src/index.ts -- --rpc https://mainnet.base.org

# Terminal 2: Start the web UI dev server
bun run --filter @rpc-proxy/web dev

# Terminal 3: Run the test transfer script
bun run packages/scripts/src/transfer.ts
```

When the script runs, it should:
1. Call `eth_sendTransaction` to localhost:8545
2. Server intercepts and opens browser to http://localhost:5173/tx/{uuid}
3. User connects wallet and approves transaction
4. Transaction hash returns to the script

## Key Files

### Server
- `packages/server/src/index.ts` - CLI entry point
- `packages/server/src/server.ts` - Hono app setup
- `packages/server/src/rpc/handler.ts` - RPC request routing
- `packages/server/src/rpc/methods.ts` - Which methods to intercept vs pass-through
- `packages/server/src/pending/store.ts` - In-memory store for pending transactions

### Web UI
- `packages/web/src/App.tsx` - Main app with providers
- `packages/web/src/pages/Transaction.tsx` - Transaction review/execute page
- `packages/web/src/lib/wagmi.ts` - Wallet configuration
- `packages/web/src/hooks/usePendingTransaction.ts` - Fetch pending tx data

### Scripts
- `packages/scripts/src/transfer.ts` - Simple ETH transfer for testing

## Architecture Notes

1. **No private keys on server**: The server never touches private keys. It just forwards the transaction request to the browser, where the wallet handles signing.

2. **Wallet executes directly**: When the user clicks "Execute" in the web UI, the wallet sends the transaction directly to the network (using its own RPC). The server only receives the tx hash back.

3. **Promise-based pending store**: The server holds the HTTP connection open using a Promise that resolves when the web UI calls `/api/complete/{id}`.

4. **Extensible method routing**: To add new intercepted methods, edit `packages/server/src/rpc/methods.ts`.

## Known Issues / TODOs

1. **Type casting in wagmi config**: The wagmi config uses `createConfig` with `getDefaultWallets` due to type compatibility issues between RainbowKit and wagmi. This works but isn't ideal.

2. **Large bundle size**: The web UI bundle is large (~1MB) due to wallet connector dependencies. Could be optimized with code splitting.

3. **No persistent config**: Users must pass `--rpc` every time. Could add a config file.

4. **Single chain per session**: The upstream RPC is fixed at startup. Multi-chain switching would require changes.

## Development Commands

```bash
# Install dependencies
bun install

# Run server in dev mode (with watch)
bun run --filter @rpc-proxy/server dev -- --rpc https://mainnet.base.org

# Run web UI in dev mode
bun run --filter @rpc-proxy/web dev

# Build everything
bun run build

# Run transfer test script
bun run packages/scripts/src/transfer.ts
```

## Package Versions (as of last update)

- Bun: 1.2.8
- Hono: 4.x
- React: 19.2
- Vite: 7.3
- Wagmi: 2.16
- RainbowKit: 2.2
- viem: 2.37
- Tailwind CSS: 4.1
