# Hosting Daily Diary on Render

This folder is the diary's source, already set up to build and run on Render as a
plain Node server. Your diary data is not in here — it stays in your existing
backend, so entries you wrote in the Lovable preview are still there after you deploy.

## Deploy (recommended: Blueprint)

1. Create a GitHub repo and push this folder's contents to it (branch `main`).
2. In Render: **New -> Blueprint -> pick your repo**.
3. Render reads `render.yaml` and shows the settings; confirm and deploy.
4. In the service's **Environment** tab, set the two keys marked `sync: false`:
   - `SUPABASE_URL` = `https://c--069da8fe-349e-4a3a-b07f-42684e6c7cf2-prod.lovable.cloud`
   - `SUPABASE_PUBLISHABLE_KEY` = `sb_publishable_sWJfjX69KEmyyX6n-f9hNg_28SVM9iP`
5. Open the printed `https://<name>.onrender.com` URL and sign in.

## Deploy manually instead (no render.yaml needed)

In Render: **New -> Web Service**, then set:

| Setting | Value |
| --- | --- |
| Runtime | Node |
| Build command | `NITRO_PRESET=node-server bun install --frozen-lockfile && NITRO_PRESET=node-server bun run build` |
| Start command | `node .output/server/index.mjs` |
| Health check path | `/` |
| Environment | `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY` (values above), `NODE_VERSION=22`, `BUN_VERSION=1.4.4` |

## What the build does

- `NITRO_PRESET=node-server` switches the output from a Cloudflare Worker (what
  Lovable's own hosting uses) to a Node server at `.output/server/index.mjs`.
- `.env.production` holds the public backend URL and publishable key, so the
  browser bundle is correct without extra setup. Move them to Render's
  Environment tab as `VITE_SUPABASE_URL` / `VITE_SUPABASE_PUBLISHABLE_KEY` if
  you'd rather not keep them in the repo — then delete the file.
- The server listens on the `PORT` Render gives it. Nothing else to configure.

## Use Bun, not npm

Install with `bun install`. `npm install` currently fails on this dependency
tree, so there is no `package-lock.json` in the folder.

## After the first deploy

Your new address is a different website origin, so two things need the new URL
allowlisted in your diary's backend (ask in Lovable to add it):

- **Email confirmation / password-reset links** must be allowed to return to
  `https://<name>.onrender.com`.
- **Sign in with Google** goes through an auth broker that checks the origin.
  If Google fails on the new URL, email + password still works, and the same
  allowlisting request fixes Google.

I have not tested the sign-in flow from a Render URL — check it once it is live.

## Good to know

- Free plan services sleep after inactivity; the first request after a sleep
  takes a few seconds.
- Both this deployment and the Lovable preview read the same backend, so the
  same accounts and the same diary entries appear in both.
- Your entries stay private to your own account (row-level security in the
  backend), whoever hosts the pages.
