// app/api/session-docs/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const studentId = searchParams.get('studentId');
  if (!studentId) return NextResponse.json({ docs: [] });

  const docs = await prisma.sessionDoc.findMany({
    where: { studentId },
    select: { id: true, number: true },
    orderBy: { number: 'asc' },
  });
  return NextResponse.json({ docs });
}

const toJson = (v: unknown): Prisma.InputJsonValue => {
  if (v === null || v === undefined) return {} as any;
  if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') return v as any;
  if (Array.isArray(v)) return v as unknown as Prisma.InputJsonValue;
  if (typeof v === 'object') return v as unknown as Prisma.InputJsonValue;
  return String(v);
};

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({} as any));
  const studentId: string | undefined = body?.studentId;
  let number: number | undefined = typeof body?.number === 'number' ? body.number : undefined;

  if (!studentId) return NextResponse.json({ error: 'studentId required' }, { status: 400 });

  let notes: unknown = body?.notes ?? {};
  if (typeof notes === 'string') {
    const t = notes.trim();
    if ((t.startsWith('{') && t.endsWith('}')) || (t.startsWith('[') && t.endsWith(']'))) {
      try { notes = JSON.parse(t); } catch {}
    }
  }
  const notesJson: Prisma.InputJsonValue = toJson(notes);

  if (typeof number !== 'number') {
    const agg = await prisma.sessionDoc.aggregate({
      _max: { number: true },
      where: { studentId },
    });
    number = (agg._max.number ?? 0) + 1;
  }

  const doc = await prisma.sessionDoc.create({
    data: { studentId, number: number!, notes: notesJson },
    select: { id: true, number: true, notes: true },
  });

  return NextResponse.json({ doc });
}
