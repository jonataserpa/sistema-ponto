import { PrismaClient } from '@prisma/client';

// Instância única do PrismaClient para toda a aplicação
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
});

export default prisma; 