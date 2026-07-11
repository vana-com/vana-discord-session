import { createRequestBinding, setRequestBindingCookie } from "@/lib/vana/binding";
import {
  DEFAULT_VANA_SOURCE,
  isVanaSource,
  resolveVanaApp,
  type VanaAppDefinition,
} from "@/lib/vana/constants";
import { mapClientError } from "@/lib/vana/errors";
import { jsonNoStore, noStore } from "@/lib/vana/response";
import { resolveLaunchRuntime } from "@/lib/vana/runtime";
import { getVanaController, getVanaServerConfig } from "@/lib/vana/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const app = appFromUrl(request.url);
  if (!app) {
    return jsonNoStore(
      { kind: "invalid_request", error: "Unknown data source." },
      { status: 400 },
    );
  }

  try {
    const runtime = resolveLaunchRuntime(new URL(request.url).searchParams);
    const config = getVanaServerConfig();
    const controller = getVanaController(runtime, app, config);
    const accessRequest = await controller.createAccessRequest({ returnUrl: config.returnUrl });
    const binding = createRequestBinding(
      {
        requestId: accessRequest.requestId,
        app,
        runtime,
        returnOrigin: config.returnOrigin,
      },
      config.appPrivateKey,
    );
    const response = noStore(NextResponse.json(accessRequest));
    setRequestBindingCookie(
      response.cookies,
      accessRequest.requestId,
      binding,
      process.env.NODE_ENV === "production",
    );
    return response;
  } catch (error) {
    const clientError = mapClientError(error);
    console.error("[vana/request] Request creation failed", error);
    return jsonNoStore(
      { kind: clientError.kind, error: clientError.error },
      { status: clientError.status },
    );
  }
}

function appFromUrl(url: string): VanaAppDefinition | null {
  const values = new URL(url).searchParams.getAll("source");
  if (values.length === 0) return resolveVanaApp(DEFAULT_VANA_SOURCE);
  if (values.length !== 1 || !isVanaSource(values[0])) return null;
  return resolveVanaApp(values[0]);
}
