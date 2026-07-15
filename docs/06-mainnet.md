# Step 6 — Switch to mainnet

**Canonical doc:** <https://docs.vana.org/build-a-vana-app/networks>

The same app and code go to mainnet. What changes: the network you select, the fee **asset**
(USDC.e instead of native VANA), and how you fund your wallet. Escrow balances are **per network**,
so you fund mainnet escrow separately from testnet.

## 1. Register a mainnet app identity

Repeat Step 2, but set the **Protocol network** toggle to **Mainnet** at
<https://account.vana.org/developers>. Use the App URL your app runs on in production (your
deployed origin, e.g. a Vercel URL), and put the new key/URL in your production environment.

> App registration is gasless on mainnet too — the gateway relays it for you.

## 2. Fund your wallet with USDC.e

On mainnet the fee asset is **USDC.e** on Vana. The desired state is that USDC.e is the **only**
asset you need — gas for on-chain actions is sponsored. Get USDC.e onto Vana by bridging (for
example via Stargate) from a source chain; you'll need a little ETH on the source chain to pay the
bridge transaction, but nothing on the Vana side. See the canonical
[Fund your wallet](https://docs.vana.org/build-a-vana-app/networks#fund-your-wallet-mainnet)
section for the current bridge route and addresses.

## 3. Fund mainnet escrow with USDC.e

Same **Fund escrow** flow as Step 3, but with the network toggle on **Mainnet** and the amount in
**USDC.e**.

> **Check the asset before you fund.** The deployed mainnet funding surface is still being
> finalized ([unity-surfaces #716](https://github.com/vana-com/unity-surfaces/issues/716)).
> Confirm the funded asset is USDC.e, and confirm the escrow shows a finalized USDC.e balance
> before relying on paid reads.

## 4. Point the app at mainnet

The transport defaults to the Moksha testnet, so mainnet must be requested explicitly: open your
production app with `?network=mainnet`. There is no other code change — just deploy with the
mainnet `VANA_PRIVATE_KEY` / `APP_URL`.

## Recap

| | Testnet (Moksha) | Mainnet |
|---|---|---|
| Select | Protocol network: **Testnet** | Protocol network: **Mainnet** |
| Fee asset | native VANA | USDC.e |
| Get funds | [faucet.vana.com/moksha](https://faucet.vana.com/moksha) | bridge USDC.e to Vana |
| Open app | default (or `?network=moksha`) | `?network=mainnet` |

That's the whole loop: request → approve → read → pay, on either network, from the same code.

**Stuck anywhere?** [Open an issue](../../issues/new/choose) — one template per step.
