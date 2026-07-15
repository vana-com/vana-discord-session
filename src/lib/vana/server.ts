import "server-only";

import { privateKeyToAccount } from "viem/accounts";
import { CONTRACTS, createEscrowGatewayClient } from "@opendatalabs/vana-sdk";
import {
  createDirectDataController,
  getDirectEndpoints,
  readPersonalServerData,
  type EscrowPaymentConfig,
} from "@opendatalabs/vana-sdk/server";
import {
  applyScopeData,
  emptyCombinedSnapshot,
  type CombinedSnapshot,
} from "@/lib/combined-snapshot";
import { resolveAppUrl } from "./app-url";
import { assertGrantReadReady } from "./capability";
import { DEVCORD_APP, type VanaAppDefinition } from "./constants";
import type { VanaRuntime } from "./runtime";

type Controller = ReturnType<typeof createDirectDataController>;

const controllers = new Map<string, Controller>();

export type VanaServerConfig = {
  appPrivateKey: string;
  appUrl: string;
  returnOrigin: string;
  returnUrl: string;
};

export function getVanaServerConfig(): VanaServerConfig {
  const appPrivateKey = process.env.VANA_APP_PRIVATE_KEY?.trim();
  const rawAppUrl = process.env.VANA_APP_URL?.trim();

  if (!appPrivateKey) throw new Error("Missing VANA_APP_PRIVATE_KEY.");
  if (!rawAppUrl) throw new Error("Missing VANA_APP_URL.");

  const resolvedUrl = resolveAppUrl(rawAppUrl);
  return {
    appPrivateKey,
    ...resolvedUrl,
  };
}

export function getVanaController(
  runtime: VanaRuntime,
  app: VanaAppDefinition = DEVCORD_APP,
  config = getVanaServerConfig(),
): Controller {
  const key = `${app.id}:${runtime.env}:${runtime.network}`;
  const cached = controllers.get(key);
  if (cached) return cached;

  // SDK keeps production app/API endpoints for production+moksha while deriving
  // Moksha's escrow chain defaults from `network`. Do not hardcode a gateway
  // here: that would turn an SDK-owned endpoint decision into app drift.
  const controller = createDirectDataController({
    env: runtime.env,
    network: runtime.network,
    appPrivateKey: config.appPrivateKey,
    app: {
      id: app.id,
      name: app.name,
      homepageUrl: config.appUrl,
    },
    source: app.source,
    // Request every scope at once so the approval mints ONE grant covering all
    // of them (avoids the BUI-732 scope-overwrite from separate DCRs).
    scopes: [...app.scopes],
  });
  controllers.set(key, controller);
  return controller;
}

/**
 * Read every granted scope off the SINGLE grant the multi-scope DCR produced.
 *
 * The SDK's `controller.readApprovedData` reads only `status.scope` (which the
 * account API reports as the first requested scope), so it can't return all
 * scopes. `status.grantId`, however, covers every requested scope — so we read
 * each scope directly against that one grant with `readPersonalServerData`.
 * Because all reads share the one grant, none overwrites another.
 *
 * Per-scope read failures are logged and left `null` (e.g. the owner never
 * connected that source, so the Personal Server has no data for it); the other
 * scopes still return. If EVERY scope fails, the first error propagates so a
 * genuine break (e.g. a recurring SCOPE_MISMATCH) still surfaces.
 */
export async function readApprovedScopes(
  controller: Controller,
  runtime: VanaRuntime,
  app: VanaAppDefinition,
  config: VanaServerConfig,
  requestId: string,
): Promise<{ scope: string; data: CombinedSnapshot }> {
  const status = await controller.getAccessRequestStatus(requestId);
  assertGrantReadReady(status);
  // assertGrantReadReady guarantees both are present.
  const personalServerUrl = status.personalServerUrl as string;
  const grantId = status.grantId as string;

  const account = privateKeyToAccount(config.appPrivateKey as `0x${string}`);
  const chainId = chainIdForNetwork(runtime.network);
  const endpoints = getDirectEndpoints(runtime.env);
  const escrow: EscrowPaymentConfig = {
    client: createEscrowGatewayClient(endpoints.escrowGatewayUrl),
    escrowContract: CONTRACTS.DataPortabilityEscrow.addresses[chainId],
    chainId,
    signTypedData: account.signTypedData,
  };
  const signMessage = (message: string) => account.signMessage({ message });

  let combined = emptyCombinedSnapshot();
  let firstError: unknown = null;
  let anySucceeded = false;

  for (const scope of app.scopes) {
    try {
      const result = await readPersonalServerData({
        personalServerUrl,
        scope,
        grantId,
        payerAddress: account.address,
        signMessage,
        escrow,
      });
      combined = applyScopeData(combined, scope, result.data);
      anySucceeded = true;
    } catch (error) {
      firstError ??= error;
      console.error(
        `[vana/read] Scope read failed for ${scope} (grant ${grantId})`,
        error,
      );
    }
  }

  if (!anySucceeded && firstError) throw firstError;

  return { scope: status.scope ?? app.scopes.join("+"), data: combined };
}

// Protocol chain id per network: Vana mainnet 1480, Moksha testnet 14800 —
// the keys present in CONTRACTS.*.addresses.
function chainIdForNetwork(network: VanaRuntime["network"]): 1480 | 14800 {
  return network === "mainnet" ? 1480 : 14800;
}
