
const prisma = require('./prisma');

async function main() {
  const metroStates =  ['MH'];

  const districts = await prisma.courierPincodeServiceability.groupBy({
    by: ['stateCode', 'district'],
    where: {
      courier: 'DELHIVERY',
      stateCode: { in: metroStates },
    },
    _count: {
      pincode: true,
    },
    orderBy: [
      { stateCode: 'asc' },
      { district: 'asc' },
    ],
  });

  console.table(
    districts.map((item) => ({
      state: item.stateCode,
      district: item.district,
      pincodes: item._count.pincode,
    }))
  );
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
