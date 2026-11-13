const prisma = require('./prisma');

async function testConnection() {
  try {
    await prisma.$connect();
    console.log('Neon database connected successfully!');
  } catch (error) {
    console.error('Database connection failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();