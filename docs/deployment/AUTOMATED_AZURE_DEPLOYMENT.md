# Automated Azure Container Apps Deployment

## What the workflow does

`.github/workflows/docker.yml` runs backend tests, frontend tests/build, and
deployment-workflow checks for pull requests and relevant pushes to `main`.
Production release runs only after every test job passes:

1. A push to `main` that changes `backend/**`, `frontend/**`, or workflow files
   starts a release automatically.
2. A manual `workflow_dispatch` run deploys only when the selected ref is
   `main` and `deploy_production` is explicitly enabled.
3. GitHub authenticates to Azure using OIDC. It logs in to the existing ACR,
   builds both Dockerfiles, and pushes images tagged with the full Git commit
   SHA.
4. Container Apps are updated to the pushed image digests, not a mutable
   `latest` tag.
5. Before either image is built or published, the workflow confirms that the
   backend has an absolute HTTPS `MEDIA_URL`, a volume mounted at `/app/media`,
   and a registered read/write Azure Files share behind that volume.
6. After each update, the workflow verifies the configured image digest and
   that the latest revision is also the latest ready revision. It then
   smoke-tests the backend health endpoint and frontend root page.

The workflow does not provision Azure resources, change database records,
copy media, or modify storage contents. It does not configure Container Apps'
ACR pull credentials. It stops before image publishing and deployment if the
durable media preflight fails.

## GitHub repository variables

Configure these under **Settings → Secrets and variables → Actions → Variables**.
They are identifiers or public URLs, not credentials:

| Variable | Required value |
|---|---|
| `AZURE_CLIENT_ID` | Application/client ID of the Entra identity used by GitHub OIDC |
| `AZURE_TENANT_ID` | Entra tenant ID |
| `AZURE_SUBSCRIPTION_ID` | Subscription containing the existing Container Apps and ACR |
| `AZURE_RESOURCE_GROUP` | Resource group containing the two Container Apps |
| `VITE_API_BASE_URL` | Public HTTPS API base URL ending in `/api/v1`, for example `https://<backend-host>/api/v1` |

No Azure username, password, service-principal secret, ACR admin password, or
connection string is required as a GitHub secret by this workflow.

## Azure and OIDC setup (owner/ICT action)

Use an approved Entra application or service principal with a federated
credential. Configure:

- **Issuer:** `https://token.actions.githubusercontent.com`
- **Subject:** `repo:semper-01/SemperLights:ref:refs/heads/main`
- **Audience:** `api://AzureADTokenExchange`

The identity requires:

- `AcrPush` scoped to the existing `semperlightsregistry` registry.
- `Container Apps Contributor` scoped to only the resource group containing
  `semperlights-backend` and `semperlights-frontend`.

Do not grant subscription-wide Owner or Contributor for this workflow. The
Container Apps themselves must already be able to pull from ACR using their
existing valid registry configuration. If that authentication is not working,
the owner/ICT team must repair it separately (prefer a managed identity with
`AcrPull` scoped to the registry over admin credentials).

The workflow uses the existing registry server
`semperlightsregistry.azurecr.io` and the existing app names
`semperlights-backend` and `semperlights-frontend`. Do not create duplicate
apps or registries to satisfy it.

## Required media configuration before a release

The workflow preflight requires all of the following:

1. An approved Azure Files share is registered with the backend Container Apps
   environment using read/write access.
2. The backend Container App mounts that registered storage at `/app/media`.
   All backend replicas and replacement revisions must use the same share.
3. The backend has external HTTPS ingress, and `MEDIA_URL` is set to that
   backend app's public FQDN ending in `/media/` (for example,
   `https://<backend-host>/media/`). The current release preflight requires
   this direct-serving host to match the backend Container App ingress. If an
   approved public proxy is introduced later, review and update this check so
   the proxy is verified to route `/media/` to the mounted backend volume.
4. The frontend `VITE_API_BASE_URL` variable points to the public HTTPS backend
   API and ends in `/api/v1`.

At the read-only Azure inspection on 2026-11-19, the backend app had no media
volume/mount and no `MEDIA_URL`, and no storage was registered in its Container
Apps environment. The workflow will intentionally fail its media preflight
until the owner/ICT team configures and verifies a durable share. Do not remove
or bypass that check to force a release.

The same inspection found the apps in resource group `semperlights-prod` and
environment `semperlights-env`. The active backend image was tagged with an
older commit SHA and the frontend used the tag `20260921-api-base-3`, rather
than the current repository revision. This confirmed that the earlier
build-only workflow had not deployed the current source. These are point-in-time
observations; recheck the active revisions before a release.

See [PRODUCTION_MEDIA_DELIVERY.md](./PRODUCTION_MEDIA_DELIVERY.md) for the
storage setup, backup, inventory, and media migration procedure. No share has
been provisioned or migrated by this repository change.

## Run a controlled release

After setting the GitHub variables, OIDC federation and Azure roles, ACR pull
access, and media prerequisites:

1. Push the approved change to `main`, or open
   **Actions → Test and deploy Semper Lights → Run workflow**.
2. For a manual run, select `main` and set `deploy_production` to `true`.
3. Confirm the test jobs, media preflight, image push, app updates, revision
   verification, and HTTP smoke tests all succeed.
4. The log reports each image digest and the resulting ready revision. These
   values identify the release. Logs do not include Azure secrets.

Pull requests run the tests and configuration checks but do not authenticate
to Azure, publish images, or deploy.

## Manual deployment if the workflow cannot be used

Use an authorized deployment workstation, first confirm the media prerequisites
above, and run tests on the exact commit being released. Do not use a local
`.env` file or paste credentials into command history.

The following Bash example builds and pushes commit-SHA tags and deploys their
resolved digests. It assumes Azure CLI, Docker Buildx, and `jq` are
installed and that `az login` uses an authorized identity with the roles above:

```bash
set -euo pipefail

RESOURCE_GROUP="<existing-resource-group>"
ACR_NAME="semperlightsregistry"
ACR_SERVER="semperlightsregistry.azurecr.io"
BACKEND_APP="semperlights-backend"
FRONTEND_APP="semperlights-frontend"
VITE_API_BASE_URL="<public-https-backend-api-ending-in-/api/v1>"
TAG="$(git rev-parse HEAD)"

az acr login --name "$ACR_NAME"

docker buildx build \
  --push \
  --tag "$ACR_SERVER/semperlights-backend:$TAG" \
  --metadata-file backend-build.json \
  ./backend
BACKEND_DIGEST="$(jq -r '."containerimage.digest"' backend-build.json)"

docker buildx build \
  --push \
  --build-arg "VITE_API_BASE_URL=$VITE_API_BASE_URL" \
  --build-arg "VITE_APP_NAME=Semper Lights" \
  --tag "$ACR_SERVER/semperlights-frontend:$TAG" \
  --metadata-file frontend-build.json \
  ./frontend
FRONTEND_DIGEST="$(jq -r '."containerimage.digest"' frontend-build.json)"

az containerapp update \
  --resource-group "$RESOURCE_GROUP" \
  --name "$BACKEND_APP" \
  --image "$ACR_SERVER/semperlights-backend@$BACKEND_DIGEST"
az containerapp update \
  --resource-group "$RESOURCE_GROUP" \
  --name "$FRONTEND_APP" \
  --image "$ACR_SERVER/semperlights-frontend@$FRONTEND_DIGEST"
```

Keep the build metadata files in an access-controlled release record; do not
commit them. Verify the app images, latest ready revisions, HTTP health checks,
and media delivery as described below. If a command fails, stop and investigate
instead of bypassing media or health checks.

## Verify a release

Using Azure CLI with authorized read access, inspect only non-secret fields:

```bash
az containerapp show \
  --resource-group "<existing-resource-group>" \
  --name semperlights-backend \
  --query "{image:properties.template.containers[0].image,revision:properties.latestRevisionName,readyRevision:properties.latestReadyRevisionName}" \
  --output table

az containerapp show \
  --resource-group "<existing-resource-group>" \
  --name semperlights-frontend \
  --query "{image:properties.template.containers[0].image,revision:properties.latestRevisionName,readyRevision:properties.latestReadyRevisionName}" \
  --output table

az containerapp revision list \
  --resource-group "<existing-resource-group>" \
  --name semperlights-backend \
  --query "[].{name:name,active:properties.active,health:properties.healthState,provisioning:properties.provisioningState}" \
  --output table
```

Then verify the backend health route and frontend root return HTTP success. Test
representative profile, service, technology, project thumbnail/cover/gallery,
logo, and favicon URLs. Existing media should return HTTP 200 with a matching
image content type; in the browser each image should have `naturalWidth > 0`.
Upload a test image through the dashboard, verify its API URL and response, and
confirm it remains available after replacing/restarting a backend replica.
Never report media as fixed based only on a successful image build or healthy
revision.

## Rollback

Before a release, record the two current image references and ready revision
names using the non-secret `az containerapp show` query above. Commit-SHA tags
identify source revisions, but ACR tags can be retargeted unless tag write
protection is configured. The workflow deploys by immutable image digest and
reports that digest in its run logs; retain the previous image reference or
digest as the rollback target.

To roll back one app, deploy its previously recorded commit tag (or digest):

```bash
az containerapp update \
  --resource-group "<existing-resource-group>" \
  --name semperlights-backend \
  --image "semperlightsregistry.azurecr.io/semperlights-backend@sha256:<previous-digest>"
```

Use the corresponding frontend repository for a frontend rollback. A
commit-SHA tag is also usable after confirming it still points to the intended
image. Verify the new ready revision and health before proceeding. If traffic
or data behavior remains unhealthy, follow the Azure Container Apps revision
rollback procedure approved by the owner/ICT team. Do not reverse database
migrations or alter media records as part of an image rollback unless
separately reviewed and authorized.

## Troubleshooting

| Symptom | Check |
|---|---|
| Azure login fails | Required GitHub variables, federated credential issuer/subject/audience, and job `id-token: write` permission |
| ACR login/push fails | `AcrPush` assignment on the intended registry and registry name |
| App cannot pull image | Existing Container App registry authentication or its managed identity's `AcrPull` permission |
| Workflow stops at media preflight | `MEDIA_URL`, `/app/media` volume mount, registered Azure Files storage name, and `ReadWrite` access |
| Backend revision does not become ready | Container App revision status, health probes, app logs, database connectivity, and required production environment configuration; do not print secret values |
| Image URL returns 404 HTML | Confirm the URL host/path, active backend image, `/app/media` mount, share contents, and Django media route |
| Rollback is needed | Use the previously recorded commit tag/digest and verify the resulting revision and health |
