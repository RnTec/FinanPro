import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  const userId = user.id;

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  const transactions = await prisma.transaction.findMany({
    where: { userId, date: { gte: startOfMonth, lte: endOfMonth } },
    include: { category: true },
  });

  const totalIncome = transactions.filter(t => t.type === 'INCOME').reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = transactions.filter(t => t.type === 'EXPENSE').reduce((sum, t) => sum + t.amount, 0);

  const prevStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const prevEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
  const prevTx = await prisma.transaction.findMany({ where: { userId, date: { gte: prevStart, lte: prevEnd } } });
  const prevExpense = prevTx.filter(t => t.type === 'EXPENSE').reduce((s, t) => s + t.amount, 0);
  const prevIncome = prevTx.filter(t => t.type === 'INCOME').reduce((s, t) => s + t.amount, 0);

  const expensesByCategory = transactions
    .filter(t => t.type === 'EXPENSE' && t.category)
    .reduce((acc: Record<string, { name: string; color: string; total: number }>, t) => {
      const key = t.categoryId || 'other';
      if (!acc[key]) acc[key] = { name: t.category?.name || 'Outros', color: t.category?.color || '#6b7280', total: 0 };
      acc[key].total += t.amount;
      return acc;
    }, {});

  const monthlyData = [];
  for (let i = 5; i >= 0; i--) {
    const mStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const mEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);
    const mTx = await prisma.transaction.findMany({ where: { userId, date: { gte: mStart, lte: mEnd } } });
    monthlyData.push({
      month: mStart.getMonth(), year: mStart.getFullYear(),
      income: mTx.filter(t => t.type === 'INCOME').reduce((s, t) => s + t.amount, 0),
      expense: mTx.filter(t => t.type === 'EXPENSE').reduce((s, t) => s + t.amount, 0),
    });
  }

  const recent = await prisma.transaction.findMany({
    where: { userId }, include: { category: true }, orderBy: { date: 'desc' }, take: 8,
  });

  const bills = await prisma.recurringBill.findMany({
    where: { userId, isActive: true }, orderBy: { nextDueDate: 'asc' },
  });

  const fixedCosts = transactions.filter(t => t.type === 'EXPENSE' && t.costType === 'FIXED').reduce((s, t) => s + t.amount, 0);
  const variableCosts = transactions.filter(t => t.type === 'EXPENSE' && t.costType === 'VARIABLE').reduce((s, t) => s + t.amount, 0);
  const taxCosts = transactions.filter(t => t.type === 'EXPENSE' && t.costType === 'TAX').reduce((s, t) => s + t.amount, 0);

  return NextResponse.json({
    summary: {
      totalIncome, totalExpense, balance: totalIncome - totalExpense,
      prevIncome, prevExpense, fixedCosts, variableCosts, taxCosts,
      savingsRate: totalIncome > 0 ? ((totalIncome - totalExpense) / totalIncome * 100) : 0,
    },
    expensesByCategory: Object.values(expensesByCategory).sort((a, b) => b.total - a.total),
    monthlyData, recentTransactions: recent, upcomingBills: bills.slice(0, 5),
  });
}
