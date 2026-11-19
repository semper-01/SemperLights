import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const workflow = readFileSync(
  join(repositoryRoot, ".github", "workflows", "docker.yml"),
  "utf8",
);

test("production release depends on backend and frontend verification", () => {
  const releaseJob = workflow.slice(workflow.indexOf("\n  release:"));

  assert.match(releaseJob, /needs:\s*\n\s+- backend-tests\s*\n\s+- frontend-tests/);
  assert.match(releaseJob, /github\.event_name == 'push'/);
  assert.match(releaseJob, /inputs\.deploy_production/);
  assert.match(releaseJob, /github\.ref != "refs\/heads\/main"|GITHUB_REF.*refs\/heads\/main/);
});

test("both production images are published with commit tags and deployed by digest", () => {
  assert.match(workflow, /context: \.\/backend[\s\S]*?push: true\s+tags: .*semperlights-backend:\$\{\{ github\.sha \}\}/);
  assert.match(workflow, /context: \.\/frontend[\s\S]*?push: true\s+tags: .*semperlights-frontend:\$\{\{ github\.sha \}\}/);
  assert.match(workflow, /semperlights-backend@\$\{BACKEND_DIGEST\}/);
  assert.match(workflow, /semperlights-frontend@\$\{FRONTEND_DIGEST\}/);
  assert.doesNotMatch(workflow, /semperlights-(?:backend|frontend):latest/);
});

test("release uses OIDC and checks durable media before building images", () => {
  assert.match(workflow, /id-token: write/);
  assert.match(workflow, /uses: azure\/login@v2/);
  assert.doesNotMatch(workflow, /AZURE_ACR_(?:USERNAME|PASSWORD)|secrets\.AZURE_CREDENTIALS/);

  const preflight = workflow.indexOf("Verify Container Apps and durable media prerequisites");
  const backendBuild = workflow.indexOf("Build and publish backend image");
  const frontendBuild = workflow.indexOf("Build and publish frontend image");
  assert.ok(preflight >= 0 && preflight < backendBuild && backendBuild < frontendBuild);
  assert.match(workflow, /MEDIA_URL/);
  assert.match(workflow, /BACKEND_INGRESS_EXTERNAL/);
  assert.match(workflow, /MEDIA_HOST.*BACKEND_FQDN/);
  assert.match(workflow, /mountPath=='\/app\/media'/);
  assert.match(workflow, /properties\.azureFile\.accessMode/);
});

test("backend tests use an isolated SQLite database in CI", () => {
  const backendJob = workflow.slice(workflow.indexOf("\n  backend-tests:"));
  const nextJob = backendJob.indexOf("\n  frontend-tests:");
  const job = backendJob.slice(0, nextJob);

  assert.match(job, /DATABASE_URL:\s*"sqlite:\/\/\/:memory:"/);
  assert.match(job, /python -m pytest/);
});
