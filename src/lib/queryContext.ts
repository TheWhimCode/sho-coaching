import { AsyncLocalStorage } from "async_hooks";

type Store = { label: string };

const storage = new AsyncLocalStorage<Store>();

/** Current query label for this async execution (API route, cron, etc.). */
export function getQueryLabel(): string | undefined {
  return storage.getStore()?.label;
}

/**
 * Run `fn` with a label attached so Prisma can log it with each operation.
 * Use in Route Handlers and server actions:
 *
 *   return runWithQueryLabel(`GET ${new URL(req.url).pathname}`, async () => { ... });
 */
export function runWithQueryLabel<T>(label: string, fn: () => T): T {
  return storage.run({ label }, fn);
}

export function runWithQueryLabelAsync<T>(label: string, fn: () => Promise<T>): Promise<T> {
  return storage.run({ label }, fn);
}

/**
 * Convenience for API route handlers: label = `METHOD /path`.
 */
export function runWithRequestQueryLabel<T>(req: Request, fn: () => T): T {
  const path = new URL(req.url).pathname;
  const method = req.method || "GET";
  return runWithQueryLabel(`${method} ${path}`, fn);
}

export function runWithRequestQueryLabelAsync<T>(req: Request, fn: () => Promise<T>): Promise<T> {
  const path = new URL(req.url).pathname;
  const method = req.method || "GET";
  return runWithQueryLabelAsync(`${method} ${path}`, fn);
}
