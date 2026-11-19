import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const html = readFileSync(join(projectRoot, "index.html"), "utf8");

test("the HTML does not reference the removed Vite favicon", () => {
  assert.doesNotMatch(html, /vite\.svg/i);
});

test("any declared favicon resolves to an existing public asset", () => {
  const iconTags = html.match(/<link\b[^>]*\brel=["'](?:shortcut )?icon["'][^>]*>/gi) ?? [];

  for (const tag of iconTags) {
    const href = tag.match(/\bhref=["']([^"']+)["']/i)?.[1];
    assert.ok(href, `Favicon tag has no href: ${tag}`);
    assert.ok(href.startsWith("/"), `Favicon must be a local public asset: ${href}`);
    assert.ok(
      existsSync(join(projectRoot, "public", decodeURIComponent(href.slice(1)))),
      `Favicon asset does not exist: ${href}`,
    );
  }
});
