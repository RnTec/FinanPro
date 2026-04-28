import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: {
      transactions: true,
      categories: true,
      creditCards: true,
      recurringBills: true,
      goals: true,
    },
  });

  if (!user) return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });

  // Remover informações sensíveis
  const { passwordHash, ...safeData } = user;

  return NextResponse.json({
    version: '1.0',
    exportedAt: new Date().toISOString(),
    data: safeData
  });
}
