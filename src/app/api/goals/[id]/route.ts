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

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  const { id } = await params;

  try {
    const body = await request.json();
    const goal = await prisma.financialGoal.update({
      where: { id, userId },
      data: {
        name: body.name,
        targetAmount: parseFloat(body.targetAmount),
        currentAmount: parseFloat(body.currentAmount || '0'),
        deadline: body.deadline ? new Date(body.deadline) : null,
        icon: body.icon || 'target',
        color: body.color || '#10b981',
        isCompleted: body.isCompleted,
      }
    });
    return NextResponse.json(goal);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Erro ao atualizar meta' }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  const { id } = await params;

  try {
    await prisma.financialGoal.delete({
      where: { id, userId }
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Erro ao excluir meta' }, { status: 500 });
  }
}
