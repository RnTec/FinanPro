import { NextResponse } from 'next/server';
import { hash } from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const registerSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
});

const DEFAULT_EXPENSE_CATEGORIES = [
  { name: 'Alimentação', icon: 'utensils', color: '#f97316' },
  { name: 'Moradia', icon: 'home', color: '#8b5cf6' },
  { name: 'Transporte', icon: 'car', color: '#3b82f6' },
  { name: 'Saúde', icon: 'heart-pulse', color: '#ef4444' },
  { name: 'Educação', icon: 'graduation-cap', color: '#06b6d4' },
  { name: 'Lazer', icon: 'gamepad-2', color: '#ec4899' },
  { name: 'Vestuário', icon: 'shirt', color: '#f59e0b' },
  { name: 'Impostos', icon: 'receipt', color: '#64748b' },
  { name: 'Seguros', icon: 'shield-check', color: '#14b8a6' },
  { name: 'Assinaturas', icon: 'tv', color: '#a855f7' },
  { name: 'Pets', icon: 'paw-print', color: '#d97706' },
  { name: 'Outros', icon: 'ellipsis', color: '#6b7280' },
];

const DEFAULT_INCOME_CATEGORIES = [
  { name: 'Salário', icon: 'briefcase', color: '#10b981' },
  { name: 'Freelance', icon: 'laptop', color: '#06b6d4' },
  { name: 'Investimentos', icon: 'trending-up', color: '#8b5cf6' },
  { name: 'Vendas', icon: 'shopping-bag', color: '#f97316' },
  { name: 'Presentes', icon: 'gift', color: '#ec4899' },
  { name: 'Outros', icon: 'ellipsis', color: '#6b7280' },
];

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: (parsed.error as any).issues[0].message },
        { status: 400 }
      );
    }

    const { name, email, password } = parsed.data;

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Este email já está cadastrado' },
        { status: 400 }
      );
    }

    const passwordHash = await hash(password, 12);

    const user = await prisma.user.create({
      data: { name, email, passwordHash },
    });

    // Create default account
    await prisma.account.create({
      data: {
        userId: user.id,
        name: 'Conta Principal',
        type: 'CHECKING',
        balance: 0,
        color: '#6366f1',
        icon: 'wallet',
      },
    });

    // Create default categories
    for (const cat of DEFAULT_EXPENSE_CATEGORIES) {
      await prisma.category.create({
        data: {
          userId: user.id,
          name: cat.name,
          icon: cat.icon,
          color: cat.color,
          type: 'EXPENSE',
          isDefault: true,
        },
      });
    }

    for (const cat of DEFAULT_INCOME_CATEGORIES) {
      await prisma.category.create({
        data: {
          userId: user.id,
          name: cat.name,
          icon: cat.icon,
          color: cat.color,
          type: 'INCOME',
          isDefault: true,
        },
      });
    }

    return NextResponse.json(
      { message: 'Conta criada com sucesso!', userId: user.id },
      { status: 201 }
    );
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
