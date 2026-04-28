import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

async function getUserId() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return null;
  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  return user?.id || null;
}

export async function GET() {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const goals = await prisma.financialGoal.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json(goals);
}

export async function POST(request: Request) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  try {
    const body = await request.json();
    const goal = await prisma.financialGoal.create({
      data: {
        userId,
        name: body.name,
        targetAmount: parseFloat(body.targetAmount),
        currentAmount: parseFloat(body.currentAmount || '0'),
        deadline: body.deadline ? new Date(body.deadline) : null,
        icon: body.icon || 'target',
        color: body.color || '#10b981',
      }
    });
    return NextResponse.json(goal, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao criar meta' }, { status: 500 });
  }
}
