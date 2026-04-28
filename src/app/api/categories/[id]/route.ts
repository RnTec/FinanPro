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
    const category = await prisma.category.update({
      where: { id, userId },
      data: { name: body.name, color: body.color, icon: body.icon, type: body.type },
    });
    return NextResponse.json(category);
  } catch { return NextResponse.json({ error: 'Erro ao atualizar' }, { status: 500 }); }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  const { id } = await params;
  try {
    await prisma.category.delete({ where: { id, userId } });
    return NextResponse.json({ success: true });
  } catch { return NextResponse.json({ error: 'Erro ao excluir' }, { status: 500 }); }
}
