// src/app/api/session-docs/[id]/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

type Ctx = { params: Promise<{ id: string }> }; // [id] = studentId

const parseNumber = (n: unknown): number | null => {
  const v = typeof n === 'string' ? parseInt(n, 10) : typeof n === 'number' ? n : NaN;
  return Number.isFinite(v) && v > 0 ? v : null;
};

const toJson = (v: unknown): Prisma.InputJsonValue => {
  if (v === null || v === undefined) return {} as any;
  if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') return v as any;
  if (Array.isArray(v)) return v as unknown as Prisma.InputJsonValue;
  if (typeof v === 'object') return v as unknown as Prisma.InputJsonValue;
  return String(v);
};

// GET /api/session-docs/:studentId?number=1
export async function GET(req: Request, ctx: Ctx) {
  const { id: studentId } = await ctx.params;
  const sp = new URL(req.url).searchParams;
  const number = parseNumber(sp.get('number'));

  if (!studentId || !number) {
    return NextResponse.json(
      { error: 'studentId (path) and number (query) are required' },
      { status: 400 }
    );
  }

  const doc = await prisma.sessionDoc.findUnique({
    where: { studentId_number: { studentId, number } },
    select: { id: true, studentId: true, number: true, notes: true, updatedAt: true, sessionId: true },
  });

  if (!doc) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ doc });
}

// PATCH /api/session-docs/:studentId?number=1
// body: { notes?: string|{ md?: string; title?: string; [k: string]: any }, content?: any, number?: number, sessionId?: string|null }
export async function PATCH(req: Request, ctx: Ctx) {
  const { id: studentId } = await ctx.params;
  const sp = new URL(req.url).searchParams;
  const numberFromQuery = parseNumber(sp.get('number'));

  const body = await req.json().catch(() => ({} as any));
  const numberFromBody = parseNumber(body?.number);
  const number = numberFromQuery ?? numberFromBody;

  if (!studentId || !number) {
    return NextResponse.json(
      { error: 'studentId (path) and number (query or body) are required' },
      { status: 400 }
    );
  }

  // Optional: allow linking doc to session
  const sessionId: string | null | undefined =
    typeof body?.sessionId === 'string' ? body.sessionId : body?.sessionId === null ? null : undefined;

  // Accept string or object; try to parse JSON-looking strings
  let incomingNotes: any = body?.notes ?? body?.content ?? {};
  if (typeof incomingNotes === 'string') {
    const t = incomingNotes.trim();
    if ((t.startsWith('{') && t.endsWith('}')) || (t.startsWith('[') && t.endsWith(']'))) {
      try {
        incomingNotes = JSON.parse(t);
      } catch {
        // treat as raw md
        incomingNotes = { md: incomingNotes };
      }
    } else {
      // treat as raw md
      incomingNotes = { md: incomingNotes };
    }
  }

  // Merge with existing notes so partial updates (e.g. only md) don't wipe other keys (e.g. title)
  const existing = await prisma.sessionDoc.findUnique({
    where: { studentId_number: { studentId, number } },
    select: { notes: true, sessionId: true },
  });

  const existingNotes =
    existing?.notes && typeof existing.notes === 'object' && !Array.isArray(existing.notes)
      ? (existing.notes as any)
      : {};

  const mergedNotes = toJson({ ...existingNotes, ...(incomingNotes ?? {}) });

  const doc = await prisma.sessionDoc.upsert({
    where: { studentId_number: { studentId, number } },
    update: {
      notes: mergedNotes,
      ...(sessionId !== undefined ? { sessionId } : {}),
    },
    create: {
      studentId,
      number,
      notes: mergedNotes,
      ...(sessionId !== undefined ? { sessionId } : {}),
    },
    select: { id: true, studentId: true, number: true, notes: true, updatedAt: true, sessionId: true },
  });

  return NextResponse.json({ doc });
}
