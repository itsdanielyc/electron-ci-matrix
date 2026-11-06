// Shared contract: the exact text the main process's `greet` handler returns
// for a name. The mock backend and the real-shell test both import this, so
// the mock can never drift from the main process without a test noticing on
// one side or the other.
export function greeting(name: string): string {
  return `Hello, ${name}! You've been greeted from the main process!`;
}
