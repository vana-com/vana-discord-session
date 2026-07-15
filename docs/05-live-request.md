# Step 5 — Run a live request (testnet)

**Canonical doc:** <https://docs.vana.org/build-a-vana-app/test-the-flow>

Now read real data a user approves, on Moksha.

## Open the app on the right network

The transport defaults to the **Moksha testnet**, so plain `http://localhost:3010` is already
correct for this step. (Explicit `?network=moksha` also works.)

The app forwards the `network` param to its backend so the request is created against the same
chain your app identity is registered and funded on. Only pass `?network=mainnet` once you have a
mainnet identity (Step 6).

## Drive the flow

1. In the profile panel, click **Connect LinkedIn to personalize**.
2. Vana opens in a **new browser tab** (not a popup). If the browser blocks it, an **Open
   approval** link appears — click it.
3. In the Vana tab: **approve** the request, then let it **deliver the data**. Keep that tab open
   until it says the app has read the data.
4. Back in DevCord, the state moves `sample → creating → waiting → reading → approved`. The bio
   updates to one written from the data you just approved, and the badge flips to **From your
   approved data**.

```text
DevCord tab:  sample → creating → waiting → reading → approved bio
Vana tab:     approve → deliver data → wait for the app to acknowledge the read
```

## What just happened

- Your backend created an access request (free).
- The user approved a specific scope (`linkedin.profile`) on their terms.
- Your backend read the approved data from the user's **Personal Server**, and the SDK paid the
  `402` fee from your escrow. Check the balance drop on
  [moksha.vanascan.io](https://moksha.vanascan.io).

## If it doesn't work

- **Button seems to do nothing** — check `POST /api/vana/request` in the network tab. Missing env
  values fail request creation before the Vana tab opens.
- **Read fails with `Insufficient finalized balance`** — escrow isn't funded (Step 3).
- **Completion returns `denied` with no reason** — known upstream gap on Moksha,
  [unity-surfaces #715](https://github.com/vana-com/unity-surfaces/issues/715). Retry; if it
  persists, [open an issue here](../../issues/new/choose).
- The `/connect/return` page is a **verified fallback and status surface**, not the main UI. It
  fetches authoritative status instead of trusting forgeable browser query params.

**Next:** [Step 6 — Switch to mainnet](06-mainnet.md)
