import 'dotenv/config';
import { PrismaClient, CourierPartner } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { parse } from 'csv-parse/sync';
import fs from 'fs';
import path from 'path';

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({ adapter });

async function main() {
  const filePath = path.join(process.cwd(), 'data', 'SKYKING.csv');

  const csv = fs.readFileSync(filePath, 'utf8');

  const rows = parse(csv, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    bom: true,
  });

  const pins = new Map();

  for (const row of rows) {
    const pincode = String(row['SK PINCODE'] || '').trim();

    if (!/^\d{6}$/.test(pincode)) continue;

    const firstMile = String(row.FM || '').trim().toUpperCase() === 'YES';
    const lastMile = String(row.LM || '').trim().toUpperCase() === 'YES';

    const existing = pins.get(pincode);

    pins.set(pincode, {
      firstMile: firstMile || existing?.firstMile || false,
      lastMile: lastMile || existing?.lastMile || false,
    });
  }

  console.log(`Unique Skyking PINs found: ${pins.size}`);

  let count = 0;

  for (const [pincode, data] of pins) {
    await prisma.courierPincodeServiceability.upsert({
      where: {
        courier_pincode: {
          courier: CourierPartner.SKYKING,
          pincode,
        },
      },
      update: {
        firstMile: data.firstMile,
        lastMile: data.lastMile,
      },
      create: {
        courier: CourierPartner.SKYKING,
        pincode,
        firstMile: data.firstMile,
        lastMile: data.lastMile,
      },
    });

    count++;
  }

  console.log(`Successfully imported ${count} Skyking PIN records.`);
}

main()
  .catch((error) => {
    console.error('Skyking import failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });