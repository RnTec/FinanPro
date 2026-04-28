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

  const categories = await prisma.category.findMany({
    where: { userId },
    include: { subCategories: true, _count: { select: { transactions: true } } },
    orderBy: { name: 'asc' },
  });
  return NextResponse.json(categories);
}

export async function POST(request: Request) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  try {
    const body = await request.json();
    const category = await prisma.category.create({
      data: { userId, name: body.name, icon: body.icon || 'tag', color: body.color || '#6366f1', type: body.type },
      include: { subCategories: true },
    });
    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Erro ao criar categoria' }, { status: 500 });
  }
}
