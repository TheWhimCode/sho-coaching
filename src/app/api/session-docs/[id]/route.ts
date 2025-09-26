// app/api/session-docs/[id]/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

// [id] = studentId
type Ctx = { params: { id: string } };

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
export async function GET(req: Request, { params }: Ctx) {
  const studentId = params.id;
  const sp = new URL(req.url).searchParams;
  const number = parseNumber(sp.get('number'));
  if (!studentId || !number) {
    return NextResponse.json({ error: 'studentId (path) and number (query) are required' }, { status: 400 });
  }

  const doc = await prisma.sessionDoc.findUnique({
    where: { studentId_number: { studentId, number } },
    select: { id: true, studentId: true, number: true, notes: true, updatedAt: true },
  });

  if (!doc) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ doc });
}

// PATCH /api/session-docs/:studentId?number=1
// body: { notes?: string|{ md?: string; title?: string }, number?: number }
export async function PATCH(req: Request, { params }: Ctx) {
  const studentId = params.id;
  const sp = new URL(req.url).searchParams;
  const numberFromQuery = parseNumber(sp.get('number'));

  const body = await req.json().catch(() => ({} as any));
  const numberFromBody = parseNumber(body?.number);
  const number = numberFromQuery ?? numberFromBody;

  if (!studentId || !number) {
    return NextResponse.json({ error: 'studentId (path) and number (query or body) are required' }, { status: 400 });
  }

  let notes: unknown = body?.notes ?? body?.content ?? {};
  if (typeof notes === 'string') {
    const t = notes.trim();
    if ((t.startsWith('{') && t.endsWith('}')) || (t.startsWith('[') && t.endsWith(']'))) {
      try { notes = JSON.parse(t); } catch {}
    }
  }
  const notesJson: Prisma.InputJsonValue = toJson(notes);

  const doc = await prisma.sessionDoc.upsert({
    where: { studentId_number: { studentId, number } },
    update: { notes: notesJson },
    create: { studentId, number, notes: notesJson },
    select: { id: true, studentId: true, number: true, notes: true, updatedAt: true },
  });

  return NextResponse.json({ doc });
}
