import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  try {
    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const transactions = await prisma.transaction.findMany({
      where: { userId: user.id },
      include: { category: true },
      orderBy: { date: 'desc' }
    });

    // Create CSV content
    const headers = ['Data', 'Descricao', 'Valor', 'Tipo', 'Categoria', 'Fornecedor', 'Pago'];
    const rows = transactions.map(t => [
      t.date.toISOString().split('T')[0],
      t.description,
      t.amount.toString(),
      t.type,
      t.category?.name || '',
      t.vendor || '',
      t.isPaid ? 'Sim' : 'Nao'
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    return new Response(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="transacoes_finanpro.csv"',
      }
    });
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao exportar' }, { status: 500 });
  }
}
