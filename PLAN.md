# rpc-proxy

A local RPC proxy that lets developers execute blockchain transactions through their browser wallet (MetaMask, hardware wallets, etc.) instead of managing separate deployer keys.

## Problem

Deploying EVM smart contracts requires a private key. Most developers use a separate "deployer" key stored in a `.env` file, which:
- Has weaker security than a browser wallet or hardware wallet
- Requires maintaining ETH balances across multiple chains
- Is a hassle to set up correctly

## Solution

A local RPC proxy server that:
1. Receives RPC calls from Foundry/Hardhat scripts
2. Intercepts transaction requests and opens a browser UI
3. Lets users execute transactions through their preferred wallet
4. Returns the result back to the calling script

## Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Foundry/HH     │────▶│   rpc-proxy     │────▶│  Upstream RPC   │
│  Script         │◀────│   (localhost)   │◀────│  (Infura, etc)  │
└─────────────────┘     └────────┬────────┘     └─────────────────┘
                                 │
                                 │ Opens browser for signing
                                 ▼
                        ┌─────────────────┐     ┌─────────────────┐
                        │    Web UI       │────▶│  Browser Wallet │
                        │  (localhost)    │◀────│  (MetaMask)     │
                        └─────────────────┘     └─────────────────┘
```

## Transaction Flow

1. Foundry calls `eth_sendTransaction` to `localhost:8545`
2. Server generates unique request ID, stores tx data in memory
3. Server holds the HTTP connection open (doesn't respond yet)
4. Server opens `http://localhost:5173/tx/{id}` in browser (and logs URL)
5. Web UI loads, fetches pending tx data from `GET /api/pending/{id}`
6. User connects wallet via Rainbowkit
7. User reviews transaction details and clicks "Execute"
8. Wagmi's `useSendTransaction` sends tx directly through the wallet's RPC
9. Web UI receives tx hash from wallet
10. Web UI calls `POST /api/complete/{id}` with the tx hash
11. Server receives tx hash, responds to original Foundry request
12. Foundry continues (can poll `eth_getTransactionReceipt` as usual)

**Note:** The callback in step 10 is necessary so the server knows the tx hash to return to Foundry. The wallet executes the transaction directly (not the server), but we still need to communicate the result back.

## RPC Method Routing

| Method | Behavior |
|--------|----------|
| `eth_sendTransaction` | Intercept → open browser → wallet executes → return tx hash |
| `eth_signTypedData*` | Intercept → open browser → wallet signs → return signature |
| `eth_sign` | Intercept → open browser → wallet signs → return signature |
| `eth_call` | Pass through to upstream RPC |
| `eth_estimateGas` | Pass through to upstream RPC |
| `eth_chainId` | Pass through to upstream RPC |
| `eth_blockNumber` | Pass through to upstream RPC |
| `eth_getBalance` | Pass through to upstream RPC |
| `eth_getTransactionReceipt` | Pass through to upstream RPC |
| Everything else | Pass through to upstream RPC |

The code should be structured to easily add new intercepted methods later.

## Project Structure

```
rpc-proxy/
├── packages/
│   ├── server/                 # Hono RPC proxy server
│   │   ├── src/
│   │   │   ├── index.ts        # Entry point, CLI parsing
│   │   │   ├── server.ts       # Hono app setup
│   │   │   ├── rpc/
│   │   │   │   ├── handler.ts  # Main RPC request handler
│   │   │   │   ├── methods.ts  # Method routing logic
│   │   │   │   └── types.ts    # RPC types
│   │   │   ├── pending/
│   │   │   │   ├── store.ts    # In-memory pending tx store
│   │   │   │   └── types.ts    # Pending tx types
│   │   │   └── api/
│   │   │       └── routes.ts   # REST API for web UI
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── web/                    # React signing UI
│       ├── src/
│       │   ├── main.tsx        # Entry point
│       │   ├── App.tsx         # App wrapper with providers
│       │   ├── pages/
│       │   │   └── Transaction.tsx  # Transaction signing page
│       │   ├── components/
│       │   │   ├── WalletConnect.tsx
│       │   │   ├── TransactionDetails.tsx
│       │   │   └── ui/         # Shadcn components
│       │   ├── hooks/
│       │   │   └── usePendingTransaction.ts
│       │   └── lib/
│       │       ├── wagmi.ts    # Wagmi config
│       │       └── utils.ts    # Shadcn utils
│       ├── index.html
│       ├── package.json
│       ├── tsconfig.json
│       ├── vite.config.ts
│       ├── tailwind.config.js
│       └── postcss.config.js
│
├── package.json                # Workspace root
├── bunfig.toml                 # Bun configuration
├── tsconfig.json               # Base TypeScript config
└── README.md
```

## CLI Interface

```bash
# Basic usage
npx rpc-proxy --rpc https://mainnet.infura.io/v3/YOUR_KEY

# With options
npx rpc-proxy \
  --rpc https://mainnet.infura.io/v3/YOUR_KEY \
  --port 8545 \
  --ui-port 5173 \
  --no-open  # Disable auto-opening browser
```

### CLI Options

| Flag | Default | Description |
|------|---------|-------------|
| `--rpc`, `-r` | (required) | Upstream RPC URL for read calls |
| `--port`, `-p` | `8545` | Port for the RPC proxy server |
| `--ui-port` | `5173` | Port for the web UI |
| `--no-open` | `false` | Disable auto-opening browser |

## Tech Stack

### Server (`packages/server`)
- **Runtime**: Node.js (via Bun)
- **Framework**: Hono
- **Language**: TypeScript

### Web UI (`packages/web`)
- **Build**: Vite
- **Framework**: React 18
- **Language**: TypeScript
- **Wallet**: Wagmi + Rainbowkit
- **Styling**: Tailwind CSS + Shadcn/ui

### Tooling
- **Package Manager**: Bun
- **Workspaces**: Bun workspaces

## Implementation Phases

### Phase 1: Basic Infrastructure
- [ ] Set up monorepo with Bun workspaces
- [ ] Create server package with Hono
- [ ] Create web package with Vite + React
- [ ] Implement basic RPC pass-through

### Phase 2: Transaction Interception
- [ ] Implement pending transaction store
- [ ] Add `eth_sendTransaction` interception
- [ ] Add REST API for web UI (`/api/pending/:id`, `/api/complete/:id`)
- [ ] Implement browser opening logic

### Phase 3: Web UI
- [ ] Set up Wagmi + Rainbowkit
- [ ] Set up Shadcn/ui
- [ ] Build transaction review page
- [ ] Implement wallet connection
- [ ] Implement transaction execution
- [ ] Add callback to server on completion

### Phase 4: Polish
- [ ] Add CLI argument parsing
- [ ] Add error handling
- [ ] Add timeout handling for pending transactions
- [ ] Test with Foundry scripts

## Future Considerations (Not in MVP)

- Batch transaction page (queue multiple txs)
- `eth_signTypedData` support (EIP-712)
- Transaction simulation/preview
- Gas estimation display
- Multi-chain support in single session
- Persistent configuration file
