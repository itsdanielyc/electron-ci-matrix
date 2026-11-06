// L1/L2: the mock backend is held to the shared contract. If someone changes
// the greeting in the main process they must change contracts/greet.ts, and this
// test plus the real-shell suite keep the mock and main from drifting apart.
import { describe, expect, it } from "vitest";
import { greeting } from "../../contracts/greet";
import { mock } from "../../src/api";

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
