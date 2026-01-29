import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import crypto from "crypto";

/* -----------------------------
   helpers (same as submit route)
----------------------------- */

function getSubmitIp(req: Request) {
  const rawIp =
    req.headers.get("x-forwarded-for")?.split(",")[0] ??
    req.headers.get("x-real-ip") ??
    "unknown";

  return crypto
    .createHash("sha256")
    .update(rawIp)
    .digest("hex");
}

/* -----------------------------
   HTTP HANDLER
----------------------------- */

export async function GET(req: Request) {
  try {
    const submitIp = getSubmitIp(req);

    const startOfDay = new Date();
    startOfDay.setUTCHours(0, 0, 0, 0);

    const existing = await prisma.draft.findFirst({
      where: {
        submitIp,
        createdAt: { gte: startOfDay },
      },
      select: { id: true },
    });

    return NextResponse.json({
      exists: !!existing,
    });
  } catch {
    return NextResponse.json(
      { exists: false },
      { status: 500 }
    );
  }
}
