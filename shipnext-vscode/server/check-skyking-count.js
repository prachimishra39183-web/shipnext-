const prisma = require('./prisma');

async function main() {
  const result = await prisma.courierPincodeServiceability.groupBy({
    by: ['courier', 'serviceabilityStatus'],
    _count: {
      pincode: true,
    },
  });

  console.log(result);
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });