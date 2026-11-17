
const fs = require('fs');
const { parse } = require('csv-parse/sync');
const prisma = require('./prisma');

const CSV_PATH =
  'C:/Users/kaushal Mishra/OneDrive/Documents/Pincode Serviceability (1).csv';

const COURIERS = ['DELHIVERY', 'SKYKING', 'BLUEDART'];

function toBoolean(value) {
  return String(value || '').trim().toUpperCase() === 'Y';
}

async function main() {
  console.log('Reading courier PIN-code CSV...');

  const fileContent = fs.readFileSync(CSV_PATH, 'utf8');

  const rows = parse(fileContent, {
    columns: true,
    skip_empty_lines: true,
    bom: true,
    trim: true,
  });

  console.log(`Found ${rows.length} PIN-code records.`);

  const records = [];

  for (const row of rows) {
    const pincode = String(row.Pincode || '').trim();

    if (!/^\d{6}$/.test(pincode)) {
      continue;
    }

    for (const courier of COURIERS) {
      records.push({
        courier,
        pincode,
        stateCode: row['State Code'] || null,
        district: row.District || null,
        prepaid: toBoolean(row.Prepaid),
        reversePickup: toBoolean(row['Reverse Pickup']),
        repl: toBoolean(row.REPL),
        cod: toBoolean(row.COD),
        cash: toBoolean(row.Cash),
      });
    }
  }

  console.log(`Preparing ${records.length} courier PIN-code records...`);

  let imported = 0;

  for (let i = 0; i < records.length; i += 500) {
    const batch = records.slice(i, i + 500);

    await prisma.courierPincodeServiceability.createMany({
      data: batch,
      skipDuplicates: true,
    });

    imported += batch.length;
    console.log(`Processed ${imported}/${records.length}`);
  }

  console.log('Courier PIN-code import completed.');
}

main()
  .catch((error) => {
    console.error('Import failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
