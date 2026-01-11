#!/usr/bin/env bun

import { program } from "commander";
import { createServer } from "./server";

program
  .name("rpc-proxy")
  .description("Local RPC proxy for secure transaction signing via browser wallet")
  .requiredOption("-r, --rpc <url>", "Upstream RPC URL for read calls")
  .option("-p, --port <number>", "RPC proxy port", "8545")
  .option("--ui-port <number>", "Web UI port", "5173")
  .option("--no-open", "Disable auto-opening browser for transactions")
  .parse();

const options = program.opts<{
  rpc: string;
  port: string;
  uiPort: string;
  open: boolean;
}>();

const rpcPort = parseInt(options.port, 10);
const uiPort = parseInt(options.uiPort, 10);

async function openBrowser(url: string) {
  const args = [url];
  let command: string;

  if (process.platform === "darwin") {
    command = "open";
  } else if (process.platform === "win32") {
    command = "cmd";
    args.unshift("/c", "start", "");
  } else {
    command = "xdg-open";
  }

  try {
    Bun.spawn([command, ...args]);
  } catch (error) {
    console.error(`Failed to open browser: ${error}`);
  }
}

const server = createServer({
  upstreamRpcUrl: options.rpc,
  uiPort,
  onPendingRequest: (id, url) => {
    console.log(`\n🔐 Transaction pending: ${url}`);
    if (options.open) {
      openBrowser(url);
    }
  },
});

Bun.serve({
  fetch: server.fetch,
  port: rpcPort,
});

console.log(`
╔═══════════════════════════════════════════════════════════════╗
║                         rpc-proxy                             ║
╚═══════════════════════════════════════════════════════════════╝

  RPC Proxy:    http://localhost:${rpcPort}
  Upstream:     ${options.rpc}
  Web UI:       http://localhost:${uiPort}
  Auto-open:    ${options.open ? "enabled" : "disabled"}

  Use http://localhost:${rpcPort} as your RPC URL in Foundry/Hardhat.

  Example:
    forge script script/Deploy.s.sol --rpc-url http://localhost:${rpcPort}

`);
