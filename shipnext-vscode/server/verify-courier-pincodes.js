
const prisma = require('./prisma');

async function main() {
  const total = await prisma.courierPincodeServiceability.count();

  const delhivery = await prisma.courierPincodeServiceability.count({
    where: { courier: 'DELHIVERY' },
  });

  const skyking = await prisma.courierPincodeServiceability.count({
    where: { courier: 'SKYKING' },
  });

  const blueDart = await prisma.courierPincodeServiceability.count({
    where: { courier: 'BLUEDART' },
  });

  console.log('Total:', total);
  console.log('Delhivery:', delhivery);
  console.log('Skyking:', skyking);
  console.log('Blue Dart:', blueDart);
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
