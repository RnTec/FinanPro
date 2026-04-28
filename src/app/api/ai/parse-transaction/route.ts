import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { openai } from '@/lib/openai';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    const { text } = await request.json();

    if (!text || text.trim().length === 0) {
      return NextResponse.json({ error: 'Nenhum texto fornecido' }, { status: 400 });
    }

    // Get user's categories to help mapping
    const categories = await prisma.category.findMany({
      where: {
        OR: [
          { userId: session.user.id },
          { isDefault: true }
        ]
      },
      select: { id: true, name: true, type: true }
    });

    const categoryList = categories.map(c => `${c.id}: ${c.name} (${c.type})`).join('\n');

    const prompt = `
      Você é um assistente financeiro especializado em extrair informações de transações a partir de texto (áudio transcrito ou OCR).
      Analise o seguinte texto e extraia os dados para uma transação financeira.
      
      TEXTO: "${text}"
      
      DATA ATUAL: ${new Date().toISOString().split('T')[0]} (Use esta data se nenhuma for mencionada).
      
      CATEGORIAS DISPONÍVEIS (Formato ID: Nome (Tipo)):
      ${categoryList}
      
      REGRAS:
      1. amount: O valor numérico (ex: 150.50).
      2. type: "INCOME" (Receita) ou "EXPENSE" (Despesa). Se não estiver claro, assuma "EXPENSE".
      3. description: Uma descrição curta e clara (ex: "Jantar", "Uber", "Salário").
      4. vendor: O nome do local ou empresa (ex: "Posto Shell", "Netflix", "Pão de Açúcar"). Se não identificar, deixe null.
      5. categoryId: Escolha o ID que melhor se encaixa nas categorias acima.
      6. costType: "FIXED" (Fixo), "VARIABLE" (Variável) ou "TAX" (Imposto). Use "VARIABLE" por padrão para despesas comuns.
      7. date: A data no formato YYYY-MM-DD.
      
      RETORNE APENAS UM JSON VÁLIDO.
    `;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'Você é um assistente de extração de dados financeiros que retorna apenas JSON.' },
        { role: 'user', content: prompt }
      ],
      response_format: { type: 'json_object' }
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');

    return NextResponse.json(result);
  } catch (error) {
    console.error('AI Parse error:', error);
    return NextResponse.json({ error: 'Erro ao processar dados com IA' }, { status: 500 });
  }
}
