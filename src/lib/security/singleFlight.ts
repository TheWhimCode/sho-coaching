/** Bound concurrent work and combine identical requests within a function instance. */
export class SingleFlight {
  private readonly pending = new Map<string, Promise<unknown>>();
  constructor(private readonly maxPending = 32) {}

  async run<T>(key: string, task: () => Promise<T>): Promise<T> {
    const existing = this.pending.get(key);
    if (existing) return existing as Promise<T>;
    if (this.pending.size >= this.maxPending) throw new Error("Lookup service is busy. Please try again shortly.");
    const promise = Promise.resolve().then(task);
    this.pending.set(key, promise);
    try { return await promise; } finally { this.pending.delete(key); }
  }
}
