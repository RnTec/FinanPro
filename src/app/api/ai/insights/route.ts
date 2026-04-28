import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { openai } from '@/lib/openai';
import { prisma } from '@/lib/prisma';

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  try {
    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    const userId = user.id;

    // 1. Gather current month financial data
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const [transactions, categories, bills] = await Promise.all([
      prisma.transaction.findMany({
        where: { userId, date: { gte: startOfMonth } },
        include: { category: true }
      }),
      prisma.category.findMany({ where: { userId } }),
      prisma.recurringBill.findMany({ where: { userId, isActive: true } })
    ]);

    const totalIncome = transactions.filter(t => t.type === 'INCOME').reduce((s, t) => s + t.amount, 0);
    const totalExpense = transactions.filter(t => t.type === 'EXPENSE').reduce((s, t) => s + t.amount, 0);
    
    const expenseByCategory = transactions
      .filter(t => t.type === 'EXPENSE' && t.category)
      .reduce((acc: Record<string, number>, t) => {
        const catName = t.category?.name || 'Outros';
        acc[catName] = (acc[catName] || 0) + t.amount;
        return acc;
      }, {});

    // 2. Prepare context for OpenAI
    const summary = {
      period: `${now.getMonth() + 1}/${now.getFullYear()}`,
      totalIncome,
      totalExpense,
      balance: totalIncome - totalExpense,
      topExpenses: Object.entries(expenseByCategory).sort((a, b) => b[1] - a[1]).slice(0, 5),
      recurringCommitments: bills.map(b => ({ name: b.name, amount: b.expectedAmount }))
    };

    const prompt = `
      Você é um consultor financeiro pessoal de alto nível. Analise o resumo financeiro abaixo e forneça insights acionáveis.
      
      DADOS: ${JSON.stringify(summary)}
      
      RETORNE UM JSON COM:
      1. generalStatus: Uma frase curta resumindo a saúde financeira do mês.
      2. keyObservations: Array com 3 observações importantes sobre os gastos.
      3. savingTips: Array com 3 dicas práticas para economizar baseado nos dados.
      4. score: Um score de 0 a 100 para a saúde financeira do mês.
      
      Mantenha um tom profissional, motivador e direto.
    `;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'Você é um consultor financeiro que responde apenas em JSON.' },
        { role: 'user', content: prompt }
      ],
      response_format: { type: 'json_object' }
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');

    return NextResponse.json(result);
  } catch (error) {
    console.error('AI Insights error:', error);
    return NextResponse.json({ error: 'Erro ao gerar insights' }, { status: 500 });
  }
}
