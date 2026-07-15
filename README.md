# Vana Discord Session — Build a Vana App

This repo is the self-paced companion to the 30-minute Vana Discord walkthrough on the
**Data Portability API**. It takes a plain chat app that knows nothing about its users and,
step by step, wires it to read **user-approved** data straight from each user's **Personal
Server** — no platform scraping, no OAuth to a third party.

You can follow along live during the session, or work through it at your own pace afterward.
**Stuck on a step? [Open an issue](../../issues/new/choose)** — there's a template per step.

---

## What you'll build

A tiny Discord-style app called **DevCord** with an "AI chat" and a profile panel. The bot
starts with zero context on its users. By the end, a user can click **Connect LinkedIn**, approve
the request in Vana, and the app writes them an intro bio from data they explicitly shared.

- `main` branch — the **starting point**: DevCord with no Vana integration. The bot has no data.
- `final` branch — the **finished result**: the same app after you complete the steps below.

Diff the two branches any time to see exactly what the integration adds:

```bash
git diff main final
```

---

## The two proofs

Like the canonical [Vana starter](https://github.com/vana-com/vana-data-app-starter), this app
gives you two independent proofs:

- **Local proof** — the app runs on sample data with no keys, no wallet, no Personal Server.
  Passing this only proves your UI and mapper work.
- **Live proof** — a registered app identity requests and reads approved data from a real
  Personal Server, and pays the protocol fee from your escrow balance.

Passing the local proof does **not** mean the live path is configured. Do both.

---

## Run the starting point (local proof)

```bash
git clone https://github.com/vana-com/vana-discord-session.git
cd vana-discord-session
pnpm install
pnpm dev
```

Open <http://localhost:3010>. You'll see DevCord. The profile panel says the bot has no data —
that's the problem the walkthrough solves.

> Requires Node 22+ and pnpm. Node 26 is fine for this app.

---

## Steps

Work through these in order. Each links the canonical reference on
[docs.vana.org](https://docs.vana.org/build-a-vana-app) and has a matching issue template if you
get stuck.

| # | Step | Local doc | Canonical doc |
|---|------|-----------|---------------|
| 1 | Get testnet funds from the faucet | [docs/01-prerequisites.md](docs/01-prerequisites.md) | [networks](https://docs.vana.org/build-a-vana-app/networks) |
| 2 | Create an app identity | [docs/02-app-identity.md](docs/02-app-identity.md) | [app-identity](https://docs.vana.org/build-a-vana-app/app-identity) |
| 3 | Fund escrow | [docs/03-escrow.md](docs/03-escrow.md) | [escrow-and-fees](https://docs.vana.org/build-a-vana-app/escrow-and-fees) |
| 4 | Integrate Vana into DevCord | [docs/04-integrate.md](docs/04-integrate.md) | [example-app](https://docs.vana.org/build-a-vana-app/example-app) |
| 5 | Run a live request (testnet) | [docs/05-live-request.md](docs/05-live-request.md) | [test-the-flow](https://docs.vana.org/build-a-vana-app/test-the-flow) |
| 6 | Switch to mainnet | [docs/06-mainnet.md](docs/06-mainnet.md) | [networks](https://docs.vana.org/build-a-vana-app/networks) |

**[docs.vana.org/build-a-vana-app](https://docs.vana.org/build-a-vana-app) is the source of truth.**
These local docs are a session-shaped path through it, pinned to the DevCord app.

---

## Environment

Copy `.env.example` to `.env.local` and fill it in during step 2:

```dotenv
VANA_PRIVATE_KEY=0x...
APP_URL=http://localhost:3010
```

Keep the private key server-side. It is never needed in the browser.

---

## Known production-readiness gates (July 2026)

These are tracked upstream and may affect a live run during the session. They do **not** affect
the local proof:

- [unity-surfaces #715](https://github.com/vana-com/unity-surfaces/issues/715) — a Moksha
  completion can return `denied` without an authoritative reason, so clients can't always
  distinguish a user decline from a platform routing failure.
- [unity-surfaces #716](https://github.com/vana-com/unity-surfaces/issues/716) — mainnet needs a
  self-service fee-asset (USDC.e) funding surface; the deployed funding UI may still deposit the
  wrong asset. On mainnet, confirm the asset before you fund.

---

## License

MIT. This is teaching material — fork it, break it, rebuild it.
