import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });

  const today = new Date();
  const next3Days = new Date();
  next3Days.setDate(today.getDate() + 3);

  // Buscar contas recorrentes vencendo nos próximos 3 dias
  const urgentBills = await prisma.recurringBill.findMany({
    where: {
      userId: user.id,
      isActive: true,
      nextDueDate: {
        lte: next3Days,
        gte: new Date(new Date().setHours(0,0,0,0))
      }
    }
  });

  // Buscar metas próximas (90% ou mais concluídas)
  const goals = await prisma.goal.findMany({ where: { userId: user.id } });
  const urgentGoals = goals.filter(g => (g.currentAmount / g.targetAmount) >= 0.9 && (g.currentAmount < g.targetAmount));

  const alerts = [
    ...urgentBills.map(b => ({
      id: `bill-${b.id}`,
      type: 'BILL',
      title: 'Conta a Vencer',
      message: `${b.name} vence em ${new Date(b.nextDueDate).toLocaleDateString('pt-BR')}`,
      severity: new Date(b.nextDueDate) <= today ? 'HIGH' : 'MEDIUM'
    })),
    ...urgentGoals.map(g => ({
      id: `goal-${g.id}`,
      type: 'GOAL',
      title: 'Meta Quase Lá!',
      message: `Você atingiu 90% da sua meta: ${g.name}`,
      severity: 'INFO'
    }))
  ];

  return NextResponse.json(alerts);
}
