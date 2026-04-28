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

export async function PUT(request: Request) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  try {
    const body = await request.json();
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        name: body.name,
        currency: body.currency,
        theme: body.theme,
      }
    });
    return NextResponse.json(user);
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao atualizar perfil' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  try {
    const { confirm } = await request.json();
    if (confirm !== 'RESET') return NextResponse.json({ error: 'Confirmação incorreta' }, { status: 400 });

    // Delete all user data except the user record itself
    await prisma.$transaction([
      prisma.transaction.deleteMany({ where: { userId } }),
      prisma.account.deleteMany({ where: { userId } }),
      prisma.recurringBill.deleteMany({ where: { userId } }),
      prisma.creditCard.deleteMany({ where: { userId } }),
      prisma.financialGoal.deleteMany({ where: { userId } }),
      prisma.category.deleteMany({ where: { userId, isDefault: false } }),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao resetar dados' }, { status: 500 });
  }
}
