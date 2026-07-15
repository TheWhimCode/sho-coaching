import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const row = await prisma.siteConfig.upsert({
    where: { id: "default" },
    create: { id: "default" },
    update: {},
    select: {
      twitchLiveManual: true,
      twitchStreamTitle: true,
      updatedAt: true,
    },
  });

  return NextResponse.json({
    isLive: row.twitchLiveManual,
    streamTitle: row.twitchStreamTitle,
    updatedAt: row.updatedAt.toISOString(),
  });
}

const PatchZ = z.object({
  isLive: z.boolean(),
  streamTitle: z.string().trim().max(140).nullable().optional(),
});

export async function PATCH(req: Request) {
  let body: z.infer<typeof PatchZ>;
  try {
    body = PatchZ.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  const streamTitle =
    body.streamTitle === undefined
      ? undefined
      : body.streamTitle === null || body.streamTitle === ""
        ? null
        : body.streamTitle;

  const row = await prisma.siteConfig.upsert({
    where: { id: "default" },
    create: {
      id: "default",
      twitchLiveManual: body.isLive,
      twitchStreamTitle: streamTitle ?? null,
    },
    update: {
      twitchLiveManual: body.isLive,
      ...(streamTitle !== undefined ? { twitchStreamTitle: streamTitle } : {}),
    },
    select: {
      twitchLiveManual: true,
      twitchStreamTitle: true,
      updatedAt: true,
    },
  });

  revalidatePath("/guide");

  return NextResponse.json({
    isLive: row.twitchLiveManual,
    streamTitle: row.twitchStreamTitle,
    updatedAt: row.updatedAt.toISOString(),
  });
}
