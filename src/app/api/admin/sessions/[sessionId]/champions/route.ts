import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma'; // Adjust path to your prisma client

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await context.params;
    const body = await request.json();
    const { champions } = body;

    if (!Array.isArray(champions)) {
      return NextResponse.json(
        { error: 'Champions must be an array' },
        { status: 400 }
      );
    }

    const updated = await prisma.session.update({
      where: { id: sessionId },
      data: { champions },
      select: { id: true, champions: true },
    });

    return NextResponse.json({ success: true, session: updated });
  } catch (error) {
    console.error('Failed to update champions:', error);
    return NextResponse.json(
      { error: 'Failed to update champions' },
      { status: 500 }
    );
  }
}