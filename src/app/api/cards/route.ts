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

  const cards = await prisma.creditCard.findMany({
    where: { userId },
    include: {
      _count: {
        select: { transactions: true }
      }
    },
    orderBy: { name: 'asc' },
  });

  // Calculate current invoice for each card
  const cardsWithBalances = await Promise.all(cards.map(async (card) => {
    const transactions = await prisma.transaction.findMany({
      where: {
        creditCardId: card.id,
        date: {
          // This is a simplified logic: current month transactions
          gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          lte: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0),
        }
      }
    });

    const currentInvoice = transactions.reduce((sum, t) => sum + t.amount, 0);
    return { ...card, currentInvoice };
  }));

  return NextResponse.json(cardsWithBalances);
}

export async function POST(request: Request) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  try {
    const body = await request.json();
    const card = await prisma.creditCard.create({
      data: {
        userId,
        name: body.name,
        brand: body.brand || 'Visa',
        lastFourDigits: body.lastFourDigits || '',
        creditLimit: parseFloat(body.creditLimit || '0'),
        closingDay: parseInt(body.closingDay || '1'),
        dueDay: parseInt(body.dueDay || '10'),
        color: body.color || '#6366f1',
      }
    });
    return NextResponse.json(card, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao criar cartão' }, { status: 500 });
  }
}
