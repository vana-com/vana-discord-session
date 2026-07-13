# Step 2 — Create an app identity

**Canonical doc:** <https://docs.vana.org/build-a-vana-app/app-identity>

An **app identity** is an EVM keypair for your app. Its address is:

- the **grantee address** users approve, and
- the address you **fund** in escrow.

Everything here happens on the **Developers** page of Vana Account. You do not write any
key-generation code.

## Create it

1. Open <https://account.vana.org/developers> and **sign in** (Google, wallet, or email code).
2. Set the **Protocol network** toggle to **Testnet** (Moksha).
3. In **Create new app identity**, enter your **App URL**. For local DevCord, use exactly:
   ```
   http://localhost:3010
   ```
4. Click **Create app identity** and approve the wallet signature. This generates the app key and
   registers the identity with the Vana Data Gateway in one step.
5. **Copy the private key now** — the page shows it only once.
6. **Copy the app address** too; you'll reuse it when funding escrow.

## Put it in your environment

Copy `.env.example` to `.env.local` and fill in:

```dotenv
VANA_PRIVATE_KEY=0x...        # the generated key
APP_URL=http://localhost:3010 # must match the App URL you registered
```

Restart `pnpm dev` after editing `.env.local`.

> **Already have a key?** Use **Use existing app identity** instead → **Show registration
> snippet**, set your key and `APP_URL`, and run the snippet from Node. The private key stays in
> your environment and is never imported into Vana Account.

> **Gas note:** app registration is **sponsored** — you don't pay VANA gas to register. Funding
> escrow (Step 3) is the only action that currently costs gas on testnet.

**Next:** [Step 3 — Fund escrow](03-escrow.md)
