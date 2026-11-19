// L6: the real shell. Playwright launches the built app (out/, from
// `npm run build`) with Electron itself and drives its first window.
// Everything here crosses the preload bridge and IPC to the main process,
// which no browser-mode test can do.
import { _electron as electron, expect, test, type ElectronApplication, type Page } from "@playwright/test";
import { mkdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { greeting } from "../../contracts/greet";

let app: ElectronApplication;
let win: Page;
const consoleErrors: string[] = [];

test.describe.configure({ mode: "serial" });

test.beforeAll(async () => {
  app = await electron.launch({ args: ["."], cwd: process.cwd() });
  win = await app.firstWindow();
  win.on("console", (m) => {
    if (m.type() === "error") consoleErrors.push(m.text());
  });
  await win.waitForLoadState("domcontentloaded");
});

test.afterAll(async () => {
  await app?.close();
});

test.describe("spike in the real shell", () => {
  test("renders the main window with the native backend", async () => {
    // The title comes from index.html, so a renamed app is checked against its
    // own page, never a hard-coded string.
    const html = readFileSync("index.html", "utf8");
    const title = /<title>(.*?)<\/title>/.exec(html)?.[1];
    expect(title).toBeTruthy();
    await expect(win).toHaveTitle(title!);
    await expect(win.locator("h1")).toHaveText("Welcome to Electron");
    await expect(win.locator("#greet-input")).toBeVisible();
    // The badge proves the UI is talking to the main process, not the mock.
    await expect(win.getByTestId("backend-badge")).toHaveText("native");
    // contextIsolation and the sandbox: the page sees the bridge, not Node.
    const exposed = await win.evaluate(() => ({
      bridge: typeof window.electronBridge,
      require: typeof (window as unknown as { require?: unknown }).require,
      process: typeof (window as unknown as { process?: unknown }).process,
    }));
    expect(exposed).toEqual({ bridge: "object", require: "undefined", process: "undefined" });
  });

  test("round-trips a call to the main process and matches the shared contract", async () => {
    await win.locator("#greet-input").fill("Keel");
    await win.locator("#greet-form button[type=submit]").click();
    await expect(win.locator("#greet-msg")).toHaveText(greeting("Keel"));
  });

  test("reports the platform from the main process and saves a screenshot named after it", async () => {
    // Ask the main process directly, then the same question through the bridge.
    const main = await app.evaluate(({ app: electronApp }) => ({
      os: process.platform,
      arch: process.arch,
      packaged: electronApp.isPackaged,
    }));
    expect(["win32", "darwin", "linux"]).toContain(main.os);
    expect(["x64", "arm64"]).toContain(main.arch);
    expect(main.packaged).toBe(false);

    const viaBridge = await win.evaluate(() => window.electronBridge!.platformInfo());
    expect(viaBridge).toMatchObject(main);
    await expect(win.getByTestId("platform")).toHaveText(`${main.os} / ${main.arch}`);

    const dir = join(process.cwd(), "artifacts", "e2e");
    mkdirSync(dir, { recursive: true });
    const file = join(dir, `${main.os}-${main.arch}.png`);
    await win.screenshot({ path: file });
    console.log(`[e2e] screenshot saved: ${file}`);
  });

  test("the main process rejects a malformed argument instead of coercing it", async () => {
    // Straight through the bridge with a number where the contract says string.
    const outcome = await win.evaluate(() =>
      window.electronBridge!.greet(42 as unknown as string).then(
        (text) => `answered: ${text}`,
        (error: unknown) => `rejected: ${String(error)}`,
      ),
    );
    expect(outcome).toContain("rejected:");
    expect(outcome).toContain("name must be a string");
  });

  test("ships a content security policy with no dev-server allowance", async () => {
    const csp = await win.locator('meta[http-equiv="Content-Security-Policy"]').getAttribute("content");
    expect(csp).toContain("default-src 'self'");
    expect(csp).not.toMatch(/ws:|wss:|localhost|127.0.0.1|unsafe-eval/);
  });

  test("a built page with no preload bridge stops with an error, never the mock", async () => {
    // The same built renderer in a second window that has no preload.
    const page = join(process.cwd(), "out", "renderer", "index.html");
    const [orphan] = await Promise.all([
      app.waitForEvent("window"),
      app.evaluate(async ({ BrowserWindow }, file) => {
        const bare = new BrowserWindow({ show: false, webPreferences: { sandbox: true, contextIsolation: true } });
        await bare.loadFile(file);
      }, page),
    ]);
    await expect(orphan.getByRole("alert")).toContainText("could not reach its main process");
    await expect(orphan.getByTestId("backend-badge")).toHaveCount(0);
    await orphan.close();
  });

  test("logged no console errors (CSP violations, failed loads)", async () => {
    expect(consoleErrors).toEqual([]);
  });
});
