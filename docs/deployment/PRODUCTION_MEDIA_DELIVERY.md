# Production Media Delivery

## Architecture

The intended production design is an existing Azure Files share mounted
read/write at `/app/media` in the backend Container App. Django keeps its
existing filesystem storage and `ImageField` names, so database rows and upload
forms do not change. The backend serves `/media/<path>` through a
production-safe file response endpoint; it does not rely on `DEBUG=True`,
Django's development media helper, or the container's ephemeral filesystem.

The source code supports this design, but the live Azure configuration did not
have the required storage setup at the read-only inspection on 2026-11-19:

- The backend Container App had no volume or mount at `/app/media`.
- No Azure Files storage registration was listed for its Container Apps
  environment.
- The backend had no `MEDIA_URL` environment variable.

Therefore production media is not yet durably configured or verified. The
deployment workflow now checks these prerequisites and stops before publishing
images or changing either app if they are missing. Do not infer that the
`docker-compose.prod.yml` Azure Files declaration is active in Container Apps.

`MEDIA_URL` is the canonical public HTTPS URL for that same serving route. Set
it to the backend app's public origin (or a public proxy that routes `/media/`
to the mounted backend media). Django then emits absolute media URLs for all
`ImageField`/`FileField` API fields, including the founder profile image.
The current deployment preflight specifically requires external backend
ingress and that `MEDIA_URL` use its FQDN. If an approved proxy is adopted,
update and test that preflight before using the proxy URL.

See [AUTOMATED_AZURE_DEPLOYMENT.md](./AUTOMATED_AZURE_DEPLOYMENT.md) for the
GitHub Actions deployment flow, required OIDC configuration, media preflight,
manual deployment, and rollback steps.

## Required Azure owner/ICT actions

Perform these checks in the authorized Azure subscription before releasing the
backend image. These commands return resource metadata only; do not query or
print storage keys, secrets, or connection strings:

```bash
az containerapp list \
  --query "[].{name:name,resourceGroup:resourceGroup,environment:managedEnvironmentId,ingress:properties.configuration.ingress.fqdn,targetPort:properties.configuration.ingress.targetPort}" \
  --output table

az containerapp env storage list \
  --resource-group <resource-group> \
  --name <container-app-environment> \
  --query "[].{name:name,account:properties.azureFile.accountName,share:properties.azureFile.shareName,accessMode:properties.azureFile.accessMode}" \
  --output table

az containerapp show \
  --resource-group <resource-group> \
  --name <backend-app> \
  --query "properties.template.{volumes:volumes,containers:containers[].{name:name,volumeMounts:volumeMounts}}" \
  --output json
```

1. Reuse an existing Azure Files share only after verifying it is the intended
   media share and backing up its contents. No share was registered in the
   inspected Container Apps environment. If no approved share exists, the
   owner/ICT team must provision one and register it with that environment.
   Supply storage credentials only through the approved Azure control
   plane/secret workflow; never paste them into source, logs, or shell history.
2. In the Container Apps environment, register the share under **Storage** as
   an Azure Files mount with read/write access. In the backend Container App's
   next revision, add a volume using that registered storage name and mount it
   into the backend container at `/app/media`. Do not add a new empty volume
   over a share containing production media. Confirm every backend replica and
   replacement revision uses that same volume.
3. Configure the backend app's `MEDIA_URL` to
   `https://<public-backend-host>/media/` (or the public proxy URL if that
   proxy serves `/media/`). The value must use HTTPS and end in `/media/`.
   Keep `MEDIA_ROOT` at its default `/app/media`; do not store the share
   credential in an application environment variable. The URL can be set
   without exposing a credential:

   ```bash
   az containerapp update \
     --resource-group <resource-group> \
     --name <backend-app> \
     --set-env-vars "MEDIA_URL=https://<public-backend-host>/media/"
   ```

4. The automated release workflow checks that the mount, registered
   read/write share, and `MEDIA_URL` are configured before it builds, publishes,
   or deploys either application. Configure these prerequisites before enabling
   a production release. The backend image contains the URL validation and
   media endpoint; the frontend image includes the favicon correction.
5. After release, upload one test image through the existing dashboard, read
   its API URL, and verify it returns HTTP 200 with the correct image content
   type. Restart or replace a backend revision and confirm the same URL still
   returns the same image.

If the backend app is internal-only, `MEDIA_URL` must instead use a public
origin whose ingress explicitly forwards `/media/` to the backend. Do not point
the browser at an internal Container Apps hostname.

## Existing media and migration safety

The local `backend/media/` directory contained 89 files at this inspection,
including profile, service, technology, and project assets. This does not
establish that these are the complete originals for production, nor whether an
Azure share contains them. The backend Docker build excludes local media. A
production 404 does not prove that the share is empty; it can also result from
the missing mount or media route/configuration.

All seven Home page image paths previously observed failing in production had
matching files in the local `backend/media/` tree. This establishes local
copies for those visible examples only, not for every production database
reference.

The full set of production database file references has not been compared with
the local inventory or an Azure share. The live share was not
mounted/registered, and no production database or share contents were read. Do
not migrate on the basis of a 404 response alone.

Before migrating any files:

1. Back up the current share and inventory production media field names against
   files on that share using an authorized, read-only check. Keep any path
   inventory in an access-controlled location because filenames can contain
   personal information.
2. Compare only missing relative paths with the local `backend/media/`
   inventory. Confirm each candidate is the intended original; do not alter
   database field values.
3. Upload only the individually confirmed missing files, preserving their
   relative names (for example, `profiles/...` or
   `projects/thumbnails/...`) and using a transfer operation configured to
   **skip existing files**, never overwrite. Verify the destination after
   transfer.
4. If a production original is absent locally and in the share, stop and ask
   the owner for the original. Do not substitute, rename, compress, or delete
   media.

No database migration is required. Existing `ImageField` paths remain
unchanged. No files are copied into the container image. No media migration has
been performed.

## Favicon

The old `/vite.svg` reference was removed. The checked-in public images are a
branding concept board and unrelated website mockups, not an approved
standalone favicon, so none was repurposed. The frontend currently has no
favicon until the owner supplies or approves a dedicated asset; the frontend
regression test prevents references to missing local favicon files.

## Verification

From an authorized client, check representative URLs for profile, service,
technology, project thumbnail, project cover/gallery, and site logo/favicon
fields. For each existing image, expect HTTP 200 and a format-matching
`Content-Type` such as `image/png`, `image/jpeg`, or `image/svg+xml`—never the
SPA's `text/html`. In a browser, confirm each rendered image has
`naturalWidth > 0`. Repeat after a backend replica restart/replacement and
confirm the URL and image bytes remain available.
