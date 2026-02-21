import env from "@rahoot/web/env"
import { NextResponse } from "next/server"

export function GET() {
  return NextResponse.json({
    webUrl: env.WEB_ORIGIN,
    socketUrl: env.SOCKET_URL || env.WEB_ORIGIN,
  })
}

export const dynamic = "force-dynamic"
