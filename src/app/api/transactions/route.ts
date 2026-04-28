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

export async function GET(request: Request) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const month = parseInt(searchParams.get('month') || String(new Date().getMonth()));
  const year = parseInt(searchParams.get('year') || String(new Date().getFullYear()));
  const type = searchParams.get('type');
  const categoryId = searchParams.get('categoryId');
  const search = searchParams.get('search');
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '50');

  const startDate = new Date(year, month, 1);
  const endDate = new Date(year, month + 1, 0, 23, 59, 59);

  const where: Record<string, unknown> = { userId, date: { gte: startDate, lte: endDate } };
  if (type) where.type = type;
  if (categoryId) where.categoryId = categoryId;
  if (search) where.description = { contains: search };

  const [transactions, total] = await Promise.all([
    prisma.transaction.findMany({
      where, include: { category: true, subCategory: true, creditCard: true, account: true },
      orderBy: { date: 'desc' }, skip: (page - 1) * limit, take: limit,
    }),
    prisma.transaction.count({ where }),
  ]);

  return NextResponse.json({ transactions, total, page, totalPages: Math.ceil(total / limit) });
}

export async function POST(request: Request) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  try {
    const body = await request.json();
    const transaction = await prisma.transaction.create({
      data: {
        userId, categoryId: body.categoryId || null, subCategoryId: body.subCategoryId || null,
        creditCardId: body.creditCardId || null, accountId: body.accountId || null,
        amount: parseFloat(body.amount), type: body.type, costType: body.costType || null,
        description: body.description, vendor: body.vendor || null,
        date: new Date(body.date), isPaid: body.isPaid ?? true,
        installmentNumber: body.installmentNumber || null, installmentTotal: body.installmentTotal || null,
        notes: body.notes || null,
      },
      include: { category: true },
    });
    return NextResponse.json(transaction, { status: 201 });
  } catch (error) {
    console.error('Create transaction error:', error);
    return NextResponse.json({ error: 'Erro ao criar transação' }, { status: 500 });
  }
}
