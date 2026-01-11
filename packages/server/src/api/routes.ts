import { Hono } from "hono";
import { cors } from "hono/cors";
import {
  getPendingRequest,
  resolvePendingRequest,
  getAllPendingIds,
} from "../pending/store";

const api = new Hono();

// Enable CORS for web UI
api.use("/*", cors());

// Get a pending request by ID
api.get("/pending/:id", (c) => {
  const { id } = c.req.param();
  const request = getPendingRequest(id);

  if (!request) {
    return c.json({ error: "Request not found or expired" }, 404);
  }

  return c.json(request);
});

// Complete a pending request
api.post("/complete/:id", async (c) => {
  const { id } = c.req.param();
  const body = await c.req.json<{
    success: boolean;
    result?: string;
    error?: string;
  }>();

  const resolved = resolvePendingRequest(id, {
    success: body.success,
    result: body.result,
    error: body.error,
  });

  if (!resolved) {
    return c.json({ error: "Request not found or already completed" }, 404);
  }

  return c.json({ ok: true });
});

// List all pending request IDs (useful for debugging)
api.get("/pending", (c) => {
  const ids = getAllPendingIds();
  return c.json({ pending: ids });
});

export { api };
