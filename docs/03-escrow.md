# Step 3 — Fund escrow

**Canonical doc:** <https://docs.vana.org/build-a-vana-app/escrow-and-fees>

Paid reads draw from your app identity's **Data Portability escrow balance**. You only fund it —
the SDK resolves the escrow contract for the selected network, so there's no contract address to
put in your code. Balances are **per network**: fund the one your app runs on (Moksha now).

## Fund it

1. On the same signed-in <https://account.vana.org/developers> page, confirm the **Protocol
   network** toggle is **Testnet** (Moksha).
2. In the **Fund escrow** section:
   - **Funding source** — your connected external wallet (the one you faucet-funded in Step 1).
   - **App identity address** — the app address from Step 2.
   - **Amount** — a small amount of **native VANA** (testnet). `0.1` VANA is plenty for many reads.
3. Click **Fund escrow** and submit the wallet transaction.
4. Wait for the app's available balance to update.

## How fees work

- Creating an access request and getting user approval is **free** — escrow is not touched.
- Payment happens when your backend **reads** approved data. The Personal Server returns a `402`
  challenge with the exact amount; the SDK pays it from escrow and retries automatically.
- On testnet the first paid read for a grant costs **about 0.01 VANA** (grant registration + data
  access). Treat that as an example — fees are set onchain in `FeeRegistry` and can change.

> If escrow is empty, request creation and approval still succeed, but the **read fails** with
> `Insufficient finalized balance`. Fund before you test the live read in Step 5.

**Next:** [Step 4 — Integrate Vana into DevCord](04-integrate.md)
