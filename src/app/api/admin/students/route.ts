// src/app/api/admin/students/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export async function GET() {
  try {
    const students = await prisma.student.findMany({
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true, name: true, discord: true, riotTag: true, server: true,
        puuid: true, summonerId: true, createdAt: true, updatedAt: true,
      },
    });
    return NextResponse.json(
      { students },
      { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } }
    );
  } catch (err) {
    console.error('GET /api/admin/students failed', err);
    return NextResponse.json({ students: [] }, { status: 500 });
  }
}
