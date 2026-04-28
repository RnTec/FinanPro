import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

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

async function main() {
  console.log('🌱 Seeding database...');

  // Create demo user
  const passwordHash = await hash('demo1234', 12);
  const user = await prisma.user.upsert({
    where: { email: 'demo@finanpro.com' },
    update: {},
    create: {
      name: 'Usuário Demo',
      email: 'demo@finanpro.com',
      passwordHash,
    },
  });

  console.log('👤 Demo user created:', user.email);

  // Create default account
  const account = await prisma.account.upsert({
    where: { id: 'default-account' },
    update: {},
    create: {
      id: 'default-account',
      userId: user.id,
      name: 'Conta Principal',
      type: 'CHECKING',
      balance: 5000,
      color: '#6366f1',
      icon: 'wallet',
    },
  });

  // Create expense categories
  for (const cat of DEFAULT_EXPENSE_CATEGORIES) {
    await prisma.category.upsert({
      where: { id: `exp-${cat.name.toLowerCase().replace(/\s/g, '-')}` },
      update: {},
      create: {
        id: `exp-${cat.name.toLowerCase().replace(/\s/g, '-')}`,
        userId: user.id,
        name: cat.name,
        icon: cat.icon,
        color: cat.color,
        type: 'EXPENSE',
        isDefault: true,
      },
    });
  }

  // Create income categories
  for (const cat of DEFAULT_INCOME_CATEGORIES) {
    await prisma.category.upsert({
      where: { id: `inc-${cat.name.toLowerCase().replace(/\s/g, '-')}` },
      update: {},
      create: {
        id: `inc-${cat.name.toLowerCase().replace(/\s/g, '-')}`,
        userId: user.id,
        name: cat.name,
        icon: cat.icon,
        color: cat.color,
        type: 'INCOME',
        isDefault: true,
      },
    });
  }

  console.log('📁 Default categories created');

  // Create sample transactions
  const now = new Date();
  const sampleTransactions = [
    { categoryId: 'inc-salário', amount: 8500, type: 'INCOME', description: 'Salário mensal', date: new Date(now.getFullYear(), now.getMonth(), 5), costType: 'FIXED' },
    { categoryId: 'exp-alimentação', amount: 450, type: 'EXPENSE', description: 'Supermercado Pão de Açúcar', vendor: 'Pão de Açúcar', date: new Date(now.getFullYear(), now.getMonth(), 8), costType: 'VARIABLE' },
    { categoryId: 'exp-moradia', amount: 2200, type: 'EXPENSE', description: 'Aluguel apartamento', date: new Date(now.getFullYear(), now.getMonth(), 10), costType: 'FIXED' },
    { categoryId: 'exp-transporte', amount: 280, type: 'EXPENSE', description: 'Combustível', vendor: 'Shell', date: new Date(now.getFullYear(), now.getMonth(), 12), costType: 'VARIABLE' },
    { categoryId: 'exp-saúde', amount: 350, type: 'EXPENSE', description: 'Plano de saúde Unimed', vendor: 'Unimed', date: new Date(now.getFullYear(), now.getMonth(), 15), costType: 'FIXED' },
    { categoryId: 'exp-lazer', amount: 120, type: 'EXPENSE', description: 'Cinema e jantar', date: new Date(now.getFullYear(), now.getMonth(), 18), costType: 'VARIABLE' },
    { categoryId: 'inc-freelance', amount: 2000, type: 'INCOME', description: 'Projeto web freelance', date: new Date(now.getFullYear(), now.getMonth(), 20), costType: 'VARIABLE' },
    { categoryId: 'exp-assinaturas', amount: 55.90, type: 'EXPENSE', description: 'Netflix + Spotify', date: new Date(now.getFullYear(), now.getMonth(), 1), costType: 'FIXED' },
    { categoryId: 'exp-educação', amount: 89.90, type: 'EXPENSE', description: 'Curso Udemy', vendor: 'Udemy', date: new Date(now.getFullYear(), now.getMonth(), 14), costType: 'VARIABLE' },
    { categoryId: 'exp-impostos', amount: 450, type: 'EXPENSE', description: 'IPTU parcela', date: new Date(now.getFullYear(), now.getMonth(), 20), costType: 'TAX' },
    // Previous month data
    { categoryId: 'inc-salário', amount: 8500, type: 'INCOME', description: 'Salário mensal', date: new Date(now.getFullYear(), now.getMonth() - 1, 5), costType: 'FIXED' },
    { categoryId: 'exp-alimentação', amount: 520, type: 'EXPENSE', description: 'Supermercado', date: new Date(now.getFullYear(), now.getMonth() - 1, 7), costType: 'VARIABLE' },
    { categoryId: 'exp-moradia', amount: 2200, type: 'EXPENSE', description: 'Aluguel', date: new Date(now.getFullYear(), now.getMonth() - 1, 10), costType: 'FIXED' },
    { categoryId: 'exp-transporte', amount: 310, type: 'EXPENSE', description: 'Combustível + estacionamento', date: new Date(now.getFullYear(), now.getMonth() - 1, 13), costType: 'VARIABLE' },
    { categoryId: 'exp-lazer', amount: 250, type: 'EXPENSE', description: 'Restaurante e bar', date: new Date(now.getFullYear(), now.getMonth() - 1, 22), costType: 'VARIABLE' },
    // 2 months ago
    { categoryId: 'inc-salário', amount: 8500, type: 'INCOME', description: 'Salário mensal', date: new Date(now.getFullYear(), now.getMonth() - 2, 5), costType: 'FIXED' },
    { categoryId: 'exp-alimentação', amount: 480, type: 'EXPENSE', description: 'Supermercado mensal', date: new Date(now.getFullYear(), now.getMonth() - 2, 9), costType: 'VARIABLE' },
    { categoryId: 'exp-moradia', amount: 2200, type: 'EXPENSE', description: 'Aluguel', date: new Date(now.getFullYear(), now.getMonth() - 2, 10), costType: 'FIXED' },
    { categoryId: 'inc-investimentos', amount: 350, type: 'INCOME', description: 'Dividendos', date: new Date(now.getFullYear(), now.getMonth() - 2, 15), costType: 'VARIABLE' },
  ];

  for (const t of sampleTransactions) {
    await prisma.transaction.create({
      data: {
        userId: user.id,
        categoryId: t.categoryId,
        accountId: account.id,
        amount: t.amount,
        type: t.type,
        costType: t.costType,
        description: t.description,
        vendor: (t as any).vendor || null,
        date: t.date,
        isPaid: true,
      },
    });
  }

  console.log('💰 Sample transactions created');

  // Create sample recurring bills
  const recurringBills = [
    { name: 'Aluguel', expectedAmount: 2200, dueDay: 10, categoryId: 'exp-moradia' },
    { name: 'Energia Elétrica', expectedAmount: 180, dueDay: 15, categoryId: 'exp-moradia' },
    { name: 'Água', expectedAmount: 85, dueDay: 20, categoryId: 'exp-moradia' },
    { name: 'Internet', expectedAmount: 119.90, dueDay: 12, categoryId: 'exp-assinaturas' },
    { name: 'Plano de Saúde', expectedAmount: 350, dueDay: 15, categoryId: 'exp-saúde' },
  ];

  for (const bill of recurringBills) {
    const nextDue = new Date(now.getFullYear(), now.getMonth(), bill.dueDay);
    if (nextDue < now) nextDue.setMonth(nextDue.getMonth() + 1);
    
    await prisma.recurringBill.create({
      data: {
        userId: user.id,
        categoryId: bill.categoryId,
        name: bill.name,
        expectedAmount: bill.expectedAmount,
        dueDay: bill.dueDay,
        nextDueDate: nextDue,
        alertDaysBefore: 3,
      },
    });
  }

  console.log('🔄 Recurring bills created');
  console.log('✅ Seed completed!');
  console.log('📧 Login: demo@finanpro.com / demo1234');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
