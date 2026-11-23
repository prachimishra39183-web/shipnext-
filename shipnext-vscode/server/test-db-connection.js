const prisma = require('./prisma');

async function test() {
  try {
    const result = await prisma.$queryRaw`SELECT 1 AS connected`;
    console.log('Database connection successful:', result);
  } catch (error) {
    console.error('Database connection failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

test();