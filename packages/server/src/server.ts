import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { handleRpcRequest, type RpcHandlerConfig } from "./rpc/handler";
import { api } from "./api/routes";
import type { JsonRpcRequest } from "./rpc/types";

export interface ServerConfig {
  upstreamRpcUrl: string;
  uiPort: number;
  onPendingRequest: (id: string, url: string) => void;
}

export function createServer(config: ServerConfig) {
  const app = new Hono();

  // Middleware
  app.use("*", logger());
  app.use("*", cors());

  // Mount API routes
  app.route("/api", api);

  // RPC endpoint - handles both root and /rpc paths
  const handleRpc = async (c: any) => {
    try {
      const body = await c.req.json<JsonRpcRequest | JsonRpcRequest[]>();

      // Handle batch requests
      if (Array.isArray(body)) {
        const methods = body.map((req) => req.method).join(", ");
        console.log(`  RPC batch: [${methods}]`);
        const responses = await Promise.all(
          body.map((req) =>
            handleRpcRequest(req, {
              upstreamRpcUrl: config.upstreamRpcUrl,
              uiBaseUrl: `http://localhost:${config.uiPort}`,
              onPendingRequest: config.onPendingRequest,
            })
          )
        );
        return c.json(responses);
      }

      // Single request
      console.log(`  RPC: ${body.method}`);
      const response = await handleRpcRequest(body, {
        upstreamRpcUrl: config.upstreamRpcUrl,
        uiBaseUrl: `http://localhost:${config.uiPort}`,
        onPendingRequest: config.onPendingRequest,
      });

      return c.json(response);
    } catch (error) {
      return c.json(
        {
          jsonrpc: "2.0",
          id: null,
          error: {
            code: -32700,
            message: "Parse error",
          },
        },
        400
      );
    }
  };

  app.post("/", handleRpc);
  app.post("/rpc", handleRpc);

  // Health check
  app.get("/health", (c) => c.json({ ok: true }));

  return app;
}
