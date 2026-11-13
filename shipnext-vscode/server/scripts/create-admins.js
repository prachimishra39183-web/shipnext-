
require('dotenv').config();

const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const prisma = require('../prisma');

async function createAdmins() {
  try {
    const emails = [
      process.env.ADMIN_EMAIL_1,
      process.env.ADMIN_EMAIL_2,
      process.env.ADMIN_EMAIL_3,
    ];

    if (emails.some(email => !email || !email.includes('@'))) {
      throw new Error('Please configure all three admin emails in .env');
    }

    const normalizedEmails = emails.map(email => email.trim().toLowerCase());

    if (new Set(normalizedEmails).size !== 3) {
      throw new Error('All three admin email addresses must be different.');
    }

    const passwords = normalizedEmails.map(() =>
      crypto.randomBytes(24).toString('base64url')
    );

    const passwordHashes = await Promise.all(
      passwords.map(password => bcrypt.hash(password, 12))
    );

    const admins = await prisma.$transaction(async (tx) => {
      const createdAdmins = [];

      for (let i = 0; i < normalizedEmails.length; i++) {
        const email = normalizedEmails[i];

        const existing = await tx.user.findUnique({
          where: { email }
        });

        if (existing) {
          throw new Error(`An account already exists for ${email}. No admins were created.`);
        }

        const admin = await tx.user.create({
          data: {
            name: `ShipNext Admin ${i + 1}`,
            email,
            passwordHash: passwordHashes[i],
            role: 'ADMIN',
            wallet: {
              create: {
                balance: 0
              }
            }
          },
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        });

        createdAdmins.push(admin);
      }

      return createdAdmins;
}, {
  maxWait: 10000,
  timeout: 30000
});

    console.log('\nTHREE ADMIN ACCOUNTS CREATED SUCCESSFULLY\n');

    admins.forEach((admin, i) => {
      console.log(`ADMIN ${i + 1}`);
      console.log('Email:', admin.email);
      console.log('Password:', passwords[i]);
      console.log('Role:', admin.role);
      console.log('----------------------------');
    });

    console.log('\nSAVE THESE PASSWORDS SECURELY. They will not be shown again.');

  } catch (error) {
    console.error('Admin setup failed:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

createAdmins();
