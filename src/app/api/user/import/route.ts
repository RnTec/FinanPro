import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  try {
    const { data } = await request.json();
    if (!data) return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 });

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });

    const userId = user.id;

    // Iniciar transação para garantir que tudo ou nada seja importado
    await prisma.$transaction(async (tx) => {
      // 1. Limpar dados atuais
      await tx.transaction.deleteMany({ where: { userId } });
      await tx.recurringBill.deleteMany({ where: { userId } });
      await tx.creditCard.deleteMany({ where: { userId } });
      await tx.financialGoal.deleteMany({ where: { userId } });
      await tx.category.deleteMany({ where: { userId } });

      // 2. Importar Categorias primeiro (dependência)
      if (data.categories) {
        for (const cat of data.categories) {
          const { id, userId: _, ...catData } = cat;
          await tx.category.create({ data: { ...catData, userId } });
        }
      }

      // 3. Buscar categorias recém criadas para mapear IDs se necessário
      // Mas para simplificar neste estágio, vamos assumir que o usuário pode querer manter nomes
      const newCats = await tx.category.findMany({ where: { userId } });
      const catMap = new Map(newCats.map(c => [c.name, c.id]));

      // 4. Importar Cartões
      if (data.cards) {
        for (const card of data.cards) {
          const { id, userId: _, ...cardData } = card;
          await tx.creditCard.create({ data: { ...cardData, userId } });
        }
      }

      // 5. Importar Transações
      if (data.transactions) {
        for (const t of data.transactions) {
          const { id, userId: _, categoryId, ...tData } = t;
          // Tentar encontrar a categoria pelo nome original se possível, ou usar a primeira disponível
          // Nota: Em uma exportação real, o JSON tem o categoryId. Se as categorias foram recriadas, 
          // os IDs mudaram. Aqui, vamos tentar mapear pelo nome.
          const catName = data.categories?.find((c: any) => c.id === categoryId)?.name;
          const newCatId = catMap.get(catName) || null;

          await tx.transaction.create({ 
            data: { 
              ...tData, 
              userId, 
              categoryId: newCatId,
              date: new Date(tData.date)
            } 
          });
        }
      }

      // 6. Importar Contas Recorrentes
      if (data.recurringBills) {
        for (const rb of data.recurringBills) {
          const { id, userId: _, categoryId, ...rbData } = rb;
          const catName = data.categories?.find((c: any) => c.id === categoryId)?.name;
          const newCatId = catMap.get(catName) || null;

          await tx.recurringBill.create({
            data: {
              ...rbData,
              userId,
              categoryId: newCatId,
              nextDueDate: new Date(rbData.nextDueDate)
            }
          });
        }
      }

      // 7. Importar Metas
      if (data.goals) {
        for (const goal of data.goals) {
          const { id, userId: _, ...goalData } = goal;
          await tx.financialGoal.create({ data: { ...goalData, userId, deadline: goalData.deadline ? new Date(goalData.deadline) : null } });
        }
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Import error:', error);
    return NextResponse.json({ error: 'Falha na importação. Verifique o formato do arquivo.' }, { status: 500 });
  }
}
