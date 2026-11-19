// L1/L2: the mock backend and the main-process handler are both held to the
// shared contract. If someone changes the greeting in the main process they
// must change contracts/greet.ts, and this suite plus the real-shell suite
// keep the mock and main from drifting apart.
import { describe, expect, it } from "vitest";
import { greeting } from "../../contracts/greet";
import { greet } from "../../electron/handlers";
import { mock, selectBackend } from "../../src/api";

describe("mock backend conformance", () => {
  it("greets exactly as the contract says", async () => {
    await expect(mock.greet("Keel")).resolves.toBe(greeting("Keel"));
  });

  it("labels itself as a mock", () => {
    expect(mock.kind).toBe("mock");
  });

  it("reports a platform shape the UI can render", async () => {
    const info = await mock.platformInfo();
    expect(info).toMatchObject({ os: expect.any(String), arch: expect.any(String) });
  });
});

describe("main-process handler", () => {
  it("greets exactly as the contract says", () => {
    expect(greet("Keel")).toBe(greeting("Keel"));
  });

  // Arguments cross IPC as unknown. Anything that is not the declared type is
  // rejected, never coerced into an answer.
  it.each([42, null, undefined, {}, ["Keel"], new Date(0)])("rejects a name that is not a string: %j", (name) => {
    expect(() => greet(name)).toThrow("name must be a string");
  });
});

describe("backend selection", () => {
  const bridge = {
    greet: async (name: string) => `bridge:${name}`,
    platformInfo: async () => ({ os: "win32", arch: "x64", electron: "0", packaged: true }),
  };

  it("uses the bridge when the preload exposed one", async () => {
    const backend = selectBackend(bridge, false);
    expect(backend.kind).toBe("native");
    await expect(backend.greet("Keel")).resolves.toBe("bridge:Keel");
  });

  it("falls back to the mock only under the dev server", () => {
    expect(selectBackend(undefined, true).kind).toBe("mock");
  });

  it("refuses to run a built app on the mock when the bridge is missing", () => {
    expect(() => selectBackend(undefined, false)).toThrow("could not reach its main process");
  });
});
