# Step 4 — Integrate Vana into DevCord

**Canonical doc:** <https://docs.vana.org/build-a-vana-app/example-app>

This is where DevCord goes from "no user data" to "reads user-approved data." The whole transport
layer ships as a reusable bundle you install with one command. The `final` branch of this repo is
the completed result — you can diff against it at any point:

```bash
git diff main final
```

## Install the Vana transport bundle

From the repo root:

```bash
npx shadcn@latest add vana-com/vana-data-app-starter/direct-vana-linkedin-next#v0.1.0
```

This uses `shadcn` purely as a file-distribution registry (no Tailwind or UI framework required).
It creates the server-side transport and installs `@opendatalabs/vana-sdk`:

```text
src/lib/vana/*.ts                       # request session binding, capability, runtime, server config
src/app/api/vana/{request,status,read}/ # three backend routes
src/app/connect/return/page.tsx         # verified status fallback surface
src/lib/linkedin-profile.ts             # maps raw approved data → a typed snapshot
src/data/linkedin-profile.fixture.ts    # credential-free sample data
```

Then install and re-run:

```bash
pnpm install
pnpm dev
```

## Wire it into the profile panel

The bundle owns the transport. You own the product. DevCord's profile panel calls the
`useDirectVanaConnect` hook and turns the returned snapshot into a bio. Two files carry that:

- **`src/lib/bio.ts`** — `generateBio(snapshot)` turns the approved LinkedIn snapshot into an
  intro bio. It's a deterministic template so the demo needs no API key. **This is the seam where
  a real app calls an LLM** — pass the snapshot as context and ask for the bio. The model only
  ever sees data the user approved.
- **`src/components/ProfileCard.tsx`** — renders the bio, shows a **Connect LinkedIn** button, and
  drives the request → approve → read state machine. In sample mode (no keys) it renders the
  fixture bio; on a live `done` it renders the approved bio.

See both files on the `final` branch for the exact code.

## What the app requests

DevCord requests a single scope, `linkedin.profile`, set in `src/lib/vana/constants.ts`:

```ts
export const VANA_APP = {
  id: "linkedin-profile-snapshot",
  name: "LinkedIn Profile Snapshot",
  source: "linkedin",
  scope: "linkedin.profile",
} as const;
```

Scopes are **lowercase and case-sensitive**. Browse the full catalog — every source, scope ID, and
whether it's Web- or Desktop-fulfillable — in the public
[Scope Coverage Registry](https://github.com/vana-com/data-connectors/blob/main/SCOPES.md).
`linkedin.profile` is Web-fulfillable, so a user can satisfy it without the desktop app.

## Verify the local proof

```bash
pnpm test        # bundle contract tests + the bio test
pnpm typecheck
```

Open <http://localhost:3010>. The profile panel now shows a bio generated from **sample** data and
a **Connect LinkedIn** button. That's the local proof. The live proof is Step 5.

**Next:** [Step 5 — Run a live request](05-live-request.md)
