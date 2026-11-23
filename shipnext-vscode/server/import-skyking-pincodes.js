
const fs = require('fs');
const path = require('path');
const prisma = require('./prisma');

async function main() {
  const filePath = path.join(
    __dirname,
    'skyking-pincode-serviceability.csv'
  );

  const lines = fs.readFileSync(filePath, 'utf8')
    .replace(/^\uFEFF/, '')
    .trim()
    .split(/\r?\n/);

  const records = lines.slice(1).map((line) => {
    const [pincode, serviceabilityStatus] = line.split(',');

    return {
      pincode: pincode.trim(),
      serviceabilityStatus: serviceabilityStatus.trim(),
    };
  }).filter((record) =>
    /^\d{6}$/.test(record.pincode) &&
    ['Serviceable', 'Partially Serviceable', 'No Service']
      .includes(record.serviceabilityStatus)
  );

  const uniqueRecords = [
    ...new Map(records.map((r) => [r.pincode, r])).values(),
  ];

  console.log(`Importing ${uniqueRecords.length} Skyking PIN codes...`);

  const batchSize = 500;

  for (let i = 0; i < uniqueRecords.length; i += batchSize) {
    const batch = uniqueRecords.slice(i, i + batchSize);

    await prisma.courierPincodeServiceability.createMany({
      data: batch.map((record) => ({
        courier: 'SKYKING',
        pincode: record.pincode,
        serviceabilityStatus: record.serviceabilityStatus,
      })),
      skipDuplicates: true,
    });

    for (const status of [
      'Serviceable',
      'Partially Serviceable',
      'No Service',
    ]) {
      const pincodes = batch
        .filter((record) => record.serviceabilityStatus === status)
        .map((record) => record.pincode);

      if (pincodes.length > 0) {
        await prisma.courierPincodeServiceability.updateMany({
          where: {
            courier: 'SKYKING',
            pincode: { in: pincodes },
          },
          data: {
            serviceabilityStatus: status,
          },
        });
      }
    }

    console.log(
      `Processed ${Math.min(i + batchSize, uniqueRecords.length)}/${uniqueRecords.length}`
    );
  }

  console.log('Skyking PIN import completed successfully.');
}

main()
  .catch((error) => {
    console.error('Skyking import failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
