
const prisma = require('../prisma');
const crypto = require('crypto');

// Generate a stable UUID for each historical event.
// This prevents duplicate imports when the script is run again.
function makeNotificationId(source, recordId) {
  const hash = crypto
    .createHash('sha256')
    .update(`shipnext-admin-history:${source}:${recordId}`)
    .digest('hex')
    .slice(0, 32)
    .split('');

  hash[12] = '5';
  hash[16] = ((parseInt(hash[16], 16) & 3) | 8).toString(16);

  const value = hash.join('');

  return [
    value.slice(0, 8),
    value.slice(8, 12),
    value.slice(12, 16),
    value.slice(16, 20),
    value.slice(20, 32),
  ].join('-');
}

function notification(source, record, title, message, type, link) {
  return {
    id: makeNotificationId(source, record.id),
    title,
    message,
    type,
    link,
    isRead: false,
    createdAt: record.createdAt,
  };
}

async function main() {
  console.log('Starting historical admin notification import...');

  const [
    customers,
    drafts,
    shipments,
    recharges,
    tickets,
    children,
    enquiries,
    refunds,
  ] = await Promise.all([
    prisma.user.findMany({
      where: { role: 'CUSTOMER' },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
      },
    }),

    prisma.shipmentDraft.findMany({
      include: {
        customer: {
          select: { name: true, email: true },
        },
      },
    }),

    prisma.shipment.findMany({
      include: {
        customer: {
          select: { name: true, email: true },
        },
      },
    }),

    prisma.walletRechargeRequest.findMany({
      include: {
        user: {
          select: { name: true, email: true },
        },
      },
    }),

    prisma.supportTicket.findMany({
      include: {
        customer: {
          select: { name: true, email: true },
        },
        shipment: {
          select: {
            trackingId: true,
            docketNumber: true,
          },
        },
      },
    }),

    prisma.childAccount.findMany({
      include: {
        parent: {
          select: { name: true, email: true },
        },
      },
    }),

    prisma.enquiry.findMany(),

    prisma.refundRequest.findMany({
      include: {
        user: {
          select: { name: true, email: true },
        },
        shipment: {
          select: { trackingId: true },
        },
      },
    }),
  ]);

  const rows = [];

  // 1. Customer registrations
  for (const customer of customers) {
    rows.push(
      notification(
        'customer',
        customer,
        'New Customer Registered',
        `${customer.name} (${customer.email}) registered on ShipNext.`,
        'CUSTOMER_REGISTERED',
        '/admin/customers'
      )
    );
  }

  // 2. Shipment drafts
  for (const draft of drafts) {
    const name =
      draft.customer.name || draft.customer.email || 'A customer';

    rows.push(
      notification(
        'draft',
        draft,
        'New Shipment Draft',
        `${name} saved a shipment draft (${draft.pickupPincode} → ${draft.deliveryPincode}).`,
        'SHIPMENT_DRAFT',
        '/admin/shipments'
      )
    );
  }

  // 3. Shipment bookings
  for (const shipment of shipments) {
    const name =
      shipment.customer.name || shipment.customer.email || 'A customer';

    rows.push(
      notification(
        'shipment',
        shipment,
        'New Shipment Booked',
        `${name} booked shipment ${shipment.trackingId}.`,
        'SHIPMENT_BOOKED',
        '/admin/shipments'
      )
    );
  }

  // 4. Wallet recharge requests
  for (const recharge of recharges) {
    const name =
      recharge.user.name || recharge.user.email || 'A customer';

    rows.push(
      notification(
        'recharge',
        recharge,
        'New Wallet Recharge',
        `${name} submitted a wallet recharge of ₹${recharge.amount.toString()} through ${recharge.paymentMethod}. Reference: ${recharge.upiReference}.`,
        'WALLET_TOPUP',
        '/admin/wallet'
      )
    );
  }

  // 5. Support tickets
  for (const ticket of tickets) {
    const name =
      ticket.customer.name || ticket.customer.email || 'A customer';

    const shipmentReference =
      ticket.shipment?.docketNumber ||
      ticket.shipment?.trackingId ||
      'Not linked';

    rows.push(
      notification(
        'support',
        ticket,
        'New Support Ticket',
        `${name} raised ticket ${ticket.ticketNumber}: ${ticket.subject}. Shipment: ${shipmentReference}.`,
        'SUPPORT_TICKET',
        '/admin/support'
      )
    );
  }

  // 6. Child accounts
  for (const child of children) {
    const name =
      child.parent.name || child.parent.email || 'A customer';

    rows.push(
      notification(
        'child',
        child,
        'New Child Account Created',
        `${name} created branch "${child.branchName}" (${child.branchCode}).`,
        'CHILD_ACCOUNT_CREATED',
        '/admin/child-accounts'
      )
    );
  }

  // 7. Website enquiries
  for (const enquiry of enquiries) {
    rows.push(
      notification(
        'enquiry',
        enquiry,
        'New Website Enquiry',
        `${enquiry.name} submitted an enquiry: ${enquiry.message}`,
        'NEW_ENQUIRY',
        '/admin/enquiries'
      )
    );
  }

  // 8. Refund requests
  for (const refund of refunds) {
    const name =
      refund.user.name || refund.user.email || 'A customer';

    rows.push(
      notification(
        'refund',
        refund,
        'New Refund Request',
        `${name} requested a refund of ₹${refund.amount.toString()}. Reason: ${refund.reason}.`,
        'REFUND_REQUEST',
        '/admin/shipments'
      )
    );
  }

  console.log(`Found ${rows.length} historical events.`);
  console.log('Importing notifications...');

  let inserted = 0;

  // Insert in batches. Existing IDs are skipped.
  for (let i = 0; i < rows.length; i += 500) {
    const batch = rows.slice(i, i + 500);

    const result = await prisma.adminNotification.createMany({
      data: batch,
      skipDuplicates: true,
    });

    inserted += result.count;
  }

  console.log('--------------------------------');
  console.log('Historical import completed!');
  console.log(`Events found: ${rows.length}`);
  console.log(`Notifications inserted: ${inserted}`);
  console.log(`Already imported/skipped: ${rows.length - inserted}`);
  console.log('--------------------------------');
}

main()
  .catch((error) => {
    console.error('Historical notification import failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
