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

  const bills = await prisma.recurringBill.findMany({
    where: { userId },
    include: { category: true },
    orderBy: { nextDueDate: 'asc' },
  });
  return NextResponse.json(bills);
}

export async function POST(request: Request) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  try {
    const body = await request.json();
    const bill = await prisma.recurringBill.create({
      data: {
        userId,
        categoryId: body.categoryId || null,
        name: body.name,
        expectedAmount: parseFloat(body.expectedAmount),
        dueDay: parseInt(body.dueDay),
        frequency: body.frequency || 'MONTHLY',
        nextDueDate: new Date(body.nextDueDate),
        alertDaysBefore: parseInt(body.alertDaysBefore || '3'),
      },
    });
    return NextResponse.json(bill, { status: 201 });
  } catch (error) {
    console.error('Create recurring bill error:', error);
    return NextResponse.json({ error: 'Erro ao criar conta recorrente' }, { status: 500 });
  }
}
