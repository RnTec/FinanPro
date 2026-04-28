import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  const { id } = await params;

  try {
    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });

    const bill = await prisma.recurringBill.findUnique({
      where: { id, userId: user.id },
    });

    if (!bill) return NextResponse.json({ error: 'Conta não encontrada' }, { status: 404 });

    // 1. Create the transaction
    await prisma.transaction.create({
      data: {
        userId: user.id,
        categoryId: bill.categoryId,
        amount: bill.expectedAmount,
        type: 'EXPENSE',
        description: `Pagamento: ${bill.name}`,
        date: new Date(),
        isPaid: true,
        recurringBillId: bill.id,
      },
    });

    // 2. Update the next due date for the recurring bill
    const nextDate = new Date(bill.nextDueDate);
    if (bill.frequency === 'MONTHLY') {
      nextDate.setMonth(nextDate.getMonth() + 1);
    } else if (bill.frequency === 'YEARLY') {
      nextDate.setFullYear(nextDate.getFullYear() + 1);
    }

    const updatedBill = await prisma.recurringBill.update({
      where: { id },
      data: { nextDueDate: nextDate },
    });

    return NextResponse.json(updatedBill);
  } catch (error) {
    console.error('Pay bill error:', error);
    return NextResponse.json({ error: 'Erro ao processar pagamento' }, { status: 500 });
  }
}
