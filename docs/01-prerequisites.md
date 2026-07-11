# Step 1 — Prerequisites and testnet funds

**Canonical doc:** <https://docs.vana.org/build-a-vana-app/networks>

You'll develop and test on **Moksha (testnet)** with free faucet funds, then switch to mainnet in
Step 6. The same app and code carry over — only a network setting changes.

## What you need

- Node 22+ and pnpm
- A browser wallet (MetaMask or similar) — used to sign into Vana Account and to fund escrow
- The DevCord app running locally (`pnpm dev`, then <http://localhost:3010>)

## Get testnet VANA from the faucet

On Moksha, the protocol fee asset is **native VANA**, and you'll need a small amount to fund
escrow in Step 3.

1. Open <https://faucet.vana.com/moksha>.
2. Paste the wallet address you'll use to fund escrow.
3. Request funds. The faucet gives **10 VANA per address per 24 hours** — plenty for testing.

> The faucet funds your **wallet**. In Step 3 you move a little of it into your app's **escrow**
> balance, which is what actually pays for reads.

## Block explorer

Keep <https://moksha.vanascan.io> open. You'll use it to confirm your funding transactions and,
later, to see escrow balance changes.

**Next:** [Step 2 — Create an app identity](02-app-identity.md)
