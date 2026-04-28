import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const user = await prisma.user.findUnique({ 
    where: { email: session.user.email },
    select: { hasSeenTour: true }
  });

  return NextResponse.json({ hasSeenTour: user?.hasSeenTour || false });
}

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  await prisma.user.update({
    where: { email: session.user.email },
    data: { hasSeenTour: true }
  });

  return NextResponse.json({ success: true });
}
