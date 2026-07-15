import "server-only";

import { privateKeyToAccount } from "viem/accounts";
import { CONTRACTS, createEscrowGatewayClient } from "@opendatalabs/vana-sdk";
import {
  createDefaultAccessRequestClient,
  createDirectDataController,
  getDirectEndpoints,
  PersonalServerReadError,
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
 * A scope with no data on the Personal Server (HTTP 404 — e.g. the owner never
 * connected that source) is tolerated and left `null`. Any other failure —
 * 403 SCOPE_MISMATCH (the collision this whole change exists to prevent), a
 * payment error, an auth error, a 5xx — propagates so a real break surfaces
 * instead of silently returning a 200 with partial data.
 *
 * After every required scope resolves, the access request is acknowledged so
 * the DCR completes and the approval tab closes (matching the lifecycle that
 * `controller.readApprovedData` performs for a single scope).
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
    } catch (error) {
      // Only a "no data for this scope" 404 is non-fatal; everything else
      // (SCOPE_MISMATCH, payment, auth, transport) must surface.
      if (error instanceof PersonalServerReadError && error.status === 404) {
        console.warn(`[vana/read] No data for ${scope} (grant ${grantId}); leaving it empty`);
        continue;
      }
      throw error;
    }
  }

  // Acknowledge once so Vana Web completes the DCR and closes the approval tab.
  // Best-effort: an ack failure must not fail an otherwise-successful read.
  try {
    const accessRequestClient = createDefaultAccessRequestClient({
      baseUrl: endpoints.accessRequestBaseUrl,
      approvalBaseUrl: endpoints.approvalAppBaseUrl,
      appAddress: account.address,
      signMessage,
    });
    await accessRequestClient.acknowledgeRead?.(requestId);
  } catch (error) {
    console.warn(`[vana/read] acknowledgeRead failed for ${requestId}`, error);
  }

  return { scope: status.scope ?? app.scopes.join("+"), data: combined };
}

// Protocol chain id per network: Vana mainnet 1480, Moksha testnet 14800 —
// the keys present in CONTRACTS.*.addresses.
function chainIdForNetwork(network: VanaRuntime["network"]): 1480 | 14800 {
  return network === "mainnet" ? 1480 : 14800;
}
