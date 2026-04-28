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
    const transaction = await prisma.transaction.update({
      where: { id, userId },
      data: {
        categoryId: body.categoryId || null, subCategoryId: body.subCategoryId || null,
        amount: body.amount ? parseFloat(body.amount) : undefined, type: body.type,
        costType: body.costType || null, description: body.description, vendor: body.vendor || null,
        date: body.date ? new Date(body.date) : undefined, isPaid: body.isPaid, notes: body.notes || null,
      },
      include: { category: true },
    });
    return NextResponse.json(transaction);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Erro ao atualizar' }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  const { id } = await params;
  try {
    await prisma.transaction.delete({ where: { id, userId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Erro ao excluir' }, { status: 500 });
  }
}
