// What the main process does for each IPC call, kept free of Electron imports
// so the unit suite can call it directly. Arguments arrive from the renderer
// as `unknown`. Every handler checks what it was given and rejects anything
// else: coercing (`String(name)`) or defaulting a malformed argument turns a
// renderer bug, or a compromised page, into a wrong answer.
//
// The greeting is implemented here on its own, not imported from contracts/,
// so the unit and real-shell suites are what hold it to the contract.

export function greet(name: unknown): string {
  if (typeof name !== "string") throw new TypeError("greet: name must be a string");
  return `Hello, ${name}! You've been greeted from the main process!`;
}
