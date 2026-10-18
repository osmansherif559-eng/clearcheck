import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createServer } from "node:net";
import { after, before, describe, it } from "node:test";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const nextBin = path.join(projectRoot, "node_modules", "next", "dist", "bin", "next");
const routes = [
  ["/", "Not sure about a message? Check it first."],
  ["/check", "What are you unsure about?"],
  ["/recover", "Something happened."],
  ["/learn", "Small details are worth a pause."],
  ["/privacy", "Your message is yours."],
  ["/about", "Indicators are not proof."],
  ["/report", "No report is open."],
];

let appProcess;
let baseUrl;
let processOutput = "";

function wait(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function reservePort() {
  return new Promise((resolve, reject) => {
    const server = createServer();
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      assert.ok(address && typeof address === "object", "Could not reserve a local port");
      const port = address.port;
      server.close((error) => (error ? reject(error) : resolve(port)));
    });
  });
}

function captureOutput(chunk) {
  processOutput += chunk.toString();
  if (processOutput.length > 12000) processOutput = processOutput.slice(-12000);
}

async function waitForReady(url) {
  const deadline = Date.now() + 90000;
  let lastStatus = "no response";

  while (Date.now() < deadline) {
    if (appProcess.exitCode !== null) {
      throw new Error(`Next exited with code ${appProcess.exitCode}.\n${processOutput}`);
    }

    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(2000) });
      lastStatus = `${response.status} ${response.statusText}`;
      if (response.ok) return;
    } catch (error) {
      lastStatus = error instanceof Error ? error.message : String(error);
    }

    await wait(250);
  }

  throw new Error(`Next did not become ready (${lastStatus}).\n${processOutput}`);
}

function htmlLinks(html) {
  return [...html.matchAll(/<link\b[^>]*>/gi)].map(([tag]) => {
    const get = (attribute) => tag.match(new RegExp(`${attribute}\\s*=\\s*["']([^"']+)["']`, "i"))?.[1];
    return { rel: get("rel")?.toLowerCase().split(/\s+/) ?? [], href: get("href") };
  });
}

function sameOriginUrl(assetPath) {
  const url = new URL(assetPath, baseUrl);
  assert.equal(url.origin, new URL(baseUrl).origin, `Asset must stay on the local app origin: ${assetPath}`);
  return url;
}

async function get(pathname) {
  return fetch(new URL(pathname, baseUrl));
}

async function assertAsset(assetPath, contentTypePattern) {
  const url = sameOriginUrl(assetPath);
  const response = await fetch(url);
  assert.equal(response.status, 200, `${url.pathname} should be served`);
  assert.match(response.headers.get("content-type") ?? "", contentTypePattern, `${url.pathname} should have the expected content type`);
}

before(async () => {
  const port = await reservePort();
  baseUrl = `http://127.0.0.1:${port}`;
  appProcess = spawn(process.execPath, [nextBin, "dev", "--hostname", "127.0.0.1", "--port", String(port)], {
    cwd: projectRoot,
    env: { ...process.env, NEXT_TELEMETRY_DISABLED: "1" },
    stdio: ["ignore", "pipe", "pipe"],
  });
  appProcess.stdout.on("data", captureOutput);
  appProcess.stderr.on("data", captureOutput);
  await waitForReady(new URL("/", baseUrl));
}, { timeout: 120000 });

after(async () => {
  if (!appProcess || appProcess.exitCode !== null) return;

  await new Promise((resolve) => {
    const timeout = setTimeout(() => {
      appProcess.kill("SIGKILL");
      resolve();
    }, 5000);
    appProcess.once("exit", () => {
      clearTimeout(timeout);
      resolve();
    });
    appProcess.kill("SIGTERM");
  });
});

describe("local route and asset smoke checks", () => {
  it("renders each public route with a working linked stylesheet", async () => {
    for (const [pathname, expectedText] of routes) {
      const response = await get(pathname);
      const html = await response.text();
      assert.equal(response.status, 200, `${pathname} should render successfully`);
      assert.match(response.headers.get("content-type") ?? "", /text\/html/, `${pathname} should render HTML`);
      assert.match(html, /<html\b/i, `${pathname} should include an HTML document`);
      assert.match(html, new RegExp(expectedText.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")), `${pathname} should contain its route content`);

      const stylesheetLinks = htmlLinks(html).filter((link) => link.rel.includes("stylesheet"));
      assert.ok(stylesheetLinks.length > 0, `${pathname} should link to a stylesheet`);
      for (const link of stylesheetLinks) {
        assert.ok(link.href, `${pathname} stylesheet link should have an href`);
        await assertAsset(link.href, /text\/css/);
      }
    }
  });

  it("serves the manifest and every icon path it declares", async () => {
    const response = await get("/manifest.webmanifest");
    assert.equal(response.status, 200, "manifest should be served");
    assert.match(response.headers.get("content-type") ?? "", /json/, "manifest should be JSON");

    const manifest = await response.json();
    assert.equal(manifest.start_url, "/");
    assert.equal(manifest.scope, "/");
    assert.ok(Array.isArray(manifest.icons) && manifest.icons.length > 0, "manifest should declare icons");

    for (const icon of manifest.icons) {
      assert.equal(typeof icon.src, "string", "manifest icon should declare a source path");
      await assertAsset(icon.src, /image\/(?:png|svg\+xml)/);
    }
  });

  it("publishes manifest and icon links in the document head", async () => {
    const response = await get("/");
    const links = htmlLinks(await response.text());
    const manifestLink = links.find((link) => link.rel.includes("manifest"));
    const iconLinks = links.filter((link) => link.rel.includes("icon"));

    assert.ok(manifestLink?.href, "document should link to the web manifest");
    assert.equal(sameOriginUrl(manifestLink.href).pathname, "/manifest.webmanifest");
    assert.ok(iconLinks.length > 0, "document should link to an icon");
    for (const link of iconLinks) {
      assert.ok(link.href, "document icon link should have an href");
      await assertAsset(link.href, /image\/(?:png|svg\+xml)/);
    }
  });
});
