import {
  AccessNotApprovedError,
  type AccessRequestStatus,
} from "@opendatalabs/vana-sdk/server";
import type { VanaAppDefinition } from "./constants";

export function assertScopeReadReady(status: AccessRequestStatus, app: VanaAppDefinition): void {
  if (
    (status.status !== "approved" && status.status !== "ready_for_read") ||
    status.scope !== app.scope
  ) {
    throw new AccessNotApprovedError(`${app.name} capability is not ready.`);
  }
}
