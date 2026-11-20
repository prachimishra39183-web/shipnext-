const prisma = require('./prisma');

console.log({
  user: !!prisma.user,
  shipmentDraft: !!prisma.shipmentDraft,
  shipment: !!prisma.shipment,
  walletRechargeRequest: !!prisma.walletRechargeRequest,
  supportTicket: !!prisma.supportTicket,
  childAccount: !!prisma.childAccount,
  enquiry: !!prisma.enquiry,
  refundRequest: !!prisma.refundRequest,
  adminNotification: !!prisma.adminNotification,
});

prisma.$disconnect();