
const express = require('express');
const prisma = require('../prisma');
const { Prisma } = require('@prisma/client');
const crypto = require('crypto');
const {
  authenticateToken,
  authorizeRole
} = require('../middleware/auth');
const {
  calculateShippingCharge,
  calculateDelhiveryExpress,
  calculateDelhiveryStandard,
} = require('../utils/shippingPricing');

const { getShippingZone } = require('../utils/shippingZone');
const router = express.Router();

// GET ALL REGISTERED CUSTOMERS
router.get(
  '/customers',
  authenticateToken,
  authorizeRole('ADMIN'),
  async (req, res) => {
    try {
      const customers = await prisma.user.findMany({
        where: {
          role: 'CUSTOMER',
        },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          isActive: true,
          createdAt: true,
          customerDocuments: {
  select: {
    documentType: true,
    createdAt: true,
  }
}
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      return res.json({
        success: true,
        totalCustomers: customers.length,
        customers,
      });
    } catch (error) {
      console.error('Admin customers error:', error);

      return res.status(500).json({
        success: false,
        message: 'Unable to retrieve customers.',
      });
    }
  }
);
// VIEW CUSTOMER KYC DOCUMENT — ADMIN ONLY
router.get(
  '/customers/:customerId/documents/:documentType',
  authenticateToken,
  authorizeRole('ADMIN'),
  async (req, res) => {
    try {
      const { customerId, documentType } = req.params;

      const allowedTypes = [
        'AADHAAR',
        'PAN',
        'CANCELLED_CHEQUE'
      ];

      if (!allowedTypes.includes(documentType)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid document type.'
        });
      }

      const document = await prisma.customerDocument.findUnique({
        where: {
          customerId_documentType: {
            customerId,
            documentType
          }
        }
      });

      if (!document) {
        return res.status(404).json({
          success: false,
          message: 'Customer document not found.'
        });
      }

      const key = Buffer.from(
        process.env.KYC_ENCRYPTION_KEY || '',
        'base64'
      );

      if (key.length !== 32) {
        throw new Error('Invalid KYC encryption key.');
      }

      const decipher = crypto.createDecipheriv(
        'aes-256-gcm',
        key,
        Buffer.from(document.encryptionIv, 'hex')
      );

      decipher.setAuthTag(
        Buffer.from(document.authTag, 'hex')
      );

      const decryptedData = Buffer.concat([
        decipher.update(document.encryptedData),
        decipher.final()
      ]);

      res.set({
        'Content-Type': document.mimeType,
        'Content-Disposition': 'inline',
        'Content-Length': decryptedData.length,
        'Cache-Control': 'private, no-store',
        'X-Content-Type-Options': 'nosniff'
      });

      return res.send(decryptedData);

    } catch (error) {
      console.error('Admin KYC document error:', error);

      return res.status(500).json({
        success: false,
        message: 'Unable to retrieve customer document.'
      });
    }
  }
);

// GET ALL SHIPMENTS
router.get(
  '/shipments',
  authenticateToken,
  authorizeRole('ADMIN'),
  async (req, res) => {
    try {
      const shipments = await prisma.shipment.findMany({
        include: {
          customer: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      const stats = {
        total: shipments.length,
        inTransit: shipments.filter(
          shipment => shipment.status === 'IN_TRANSIT'
        ).length,
        delivered: shipments.filter(
          shipment => shipment.status === 'DELIVERED'
        ).length,
        pending: shipments.filter(
          shipment => shipment.status === 'PENDING'
        ).length
      };

      return res.json({
        success: true,
        stats,
        totalShipments: shipments.length,
        shipments
      });

    } catch (error) {
      console.error('Admin shipments error:', error);

      return res.status(500).json({
        success: false,
        message: 'Unable to retrieve shipments.'
      });
    }
  }
);


router.get(
  '/wallets',
  authenticateToken,
  authorizeRole('ADMIN'),
  async (req, res) => {
    try {
      const [customers, walletTotals, transactionGroups, totalTransactions] =
        await Promise.all([
          prisma.user.findMany({
            where: {
              role: 'CUSTOMER',
            },
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              isActive: true,
              wallet: {
                select: {
                  id: true,
                  balance: true,
                },
              },
            },
            orderBy: {
              createdAt: 'desc',
            },
          }),

          prisma.wallet.aggregate({
            _sum: {
              balance: true,
            },
          }),

          prisma.walletTransaction.groupBy({
            by: ['type'],
            _sum: {
              amount: true,
            },
          }),

          prisma.walletTransaction.count(),
        ]);

      const amounts = {};

      transactionGroups.forEach((group) => {
        amounts[group.type] = group._sum.amount || new Prisma.Decimal(0);
      });

      const totalCredits = (amounts.CREDIT || new Prisma.Decimal(0))
        .plus(amounts.REFUND || new Prisma.Decimal(0))
        .toString();

      const totalDebits = (
        amounts.DEBIT || new Prisma.Decimal(0)
      ).toString();

      const wallets = customers.map((customer) => ({
        id: customer.id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        isActive: customer.isActive,
        walletId: customer.wallet?.id || null,
        balance: customer.wallet?.balance.toString() || '0.00',
      }));

      return res.json({
        success: true,
        stats: {
          totalCustomers: wallets.length,
          totalWalletBalance:
            walletTotals._sum.balance?.toString() || '0.00',
          totalCredits,
          totalDebits,
          totalTransactions,
        },
        wallets,
      });
    } catch (error) {
      console.error('Admin wallet error:', error);

      return res.status(500).json({
        success: false,
        message: 'Unable to retrieve customer wallet records.',
      });
    }
  }
);
// GET ALL WALLET TRANSACTIONS (ADMIN)
router.get(
  '/wallet-transactions',
  authenticateToken,
  authorizeRole('ADMIN'),
  async (req, res) => {
    try {
      const transactions = await prisma.walletTransaction.findMany({
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 100,
      });

      return res.json({
        success: true,
        transactions: transactions.map((transaction) => ({
          id: transaction.id,
          customer: transaction.user.name,
          email: transaction.user.email,
          phone: transaction.user.phone,
          type: transaction.type,
          amount: transaction.amount.toString(),
          description: transaction.description,
          reference: transaction.reference,
          createdAt: transaction.createdAt,
        })),
      });
    } catch (error) {
      console.error('Admin wallet transactions error:', error);

      return res.status(500).json({
        success: false,
        message: 'Unable to retrieve wallet transactions.',
      });
    }
  }
);

// GET ALL CUSTOMER ENQUIRIES (ADMIN)
router.get(
  '/enquiries',
  authenticateToken,
  authorizeRole('ADMIN'),
  async (req, res) => {
    try {
      const search = req.query.search?.trim();

      const where = search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { email: { contains: search, mode: 'insensitive' } },
              { phone: { contains: search } },
              { message: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {};

      const [enquiries, total, resolved, newCount] = await Promise.all([
        prisma.enquiry.findMany({
          where,
          orderBy: { createdAt: 'desc' },
        }),
        prisma.enquiry.count(),
        prisma.enquiry.count({ where: { isResolved: true } }),
        prisma.enquiry.count({ where: { isResolved: false } }),
      ]);

      return res.json({
        success: true,
        stats: {
          total,
          new: newCount,
          inProgress: 0,
          resolved,
        },
        enquiries,
      });
    } catch (error) {
      console.error('Admin enquiries error:', error);

      return res.status(500).json({
        success: false,
        message: 'Unable to retrieve enquiries.',
      });
    }
  }
);

// MARK ENQUIRY AS RESOLVED OR UNRESOLVED (ADMIN)
router.patch(
  '/enquiries/:id/resolve',
  authenticateToken,
  authorizeRole('ADMIN'),
  async (req, res) => {
    try {
      const { isResolved } = req.body;

      if (typeof isResolved !== 'boolean') {
        return res.status(400).json({
          success: false,
          message: 'A valid resolution status is required.',
        });
      }

      const enquiry = await prisma.enquiry.update({
        where: { id: req.params.id },
        data: { isResolved },
      });

      return res.json({
        success: true,
        message: 'Enquiry status updated successfully.',
        enquiry,
      });
    } catch (error) {
      if (error.code === 'P2025') {
        return res.status(404).json({
          success: false,
          message: 'Enquiry not found.',
        });
      }

      console.error('Update enquiry error:', error);

      return res.status(500).json({
        success: false,
        message: 'Unable to update enquiry status.',
      });
    }
  }
);

// UPDATE SHIPMENT STATUS AND CREATE CUSTOMER NOTIFICATION
router.patch(
  '/shipments/:id/status',
  authenticateToken,
  authorizeRole('ADMIN'),
  async (req, res) => {
    try {
      const { status } = req.body;

      const validStatuses = [
        'PENDING',
        'CONFIRMED',
        'PICKED_UP',
        'IN_TRANSIT',
        'OUT_FOR_DELIVERY',
        'DELIVERED',
        'CANCELLED',
        'RTO',
      ];

      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid shipment status.',
        });
      }

      const shipment = await prisma.shipment.findUnique({
        where: { id: req.params.id },
      });

      if (!shipment) {
        return res.status(404).json({
          success: false,
          message: 'Shipment not found.',
        });
      }

      // Avoid duplicate notifications when status has not changed.
      if (shipment.status === status) {
        return res.json({
          success: true,
          message: 'Shipment already has this status.',
          shipment,
          notificationCreated: false,
        });
      }

      const notificationDetails = {
        PENDING: {
          title: 'Shipment Pending',
          message: 'Your shipment is currently pending confirmation.',
          type: 'BOOKING',
        },
        CONFIRMED: {
          title: 'Booking Confirmed',
          message: 'Your shipment booking has been confirmed successfully.',
          type: 'BOOKING',
        },
        PICKED_UP: {
          title: 'Parcel Picked Up',
          message: 'Your parcel has been picked up and is on its way to the next facility.',
          type: 'PICKUP',
        },
        IN_TRANSIT: {
          title: 'Shipment In Transit',
          message: 'Your shipment is moving through our delivery network.',
          type: 'TRANSIT',
        },
        OUT_FOR_DELIVERY: {
          title: 'Out for Delivery',
          message: 'Your parcel is out for delivery. Please keep your phone available.',
          type: 'DELIVERY',
        },
        DELIVERED: {
          title: 'Shipment Delivered',
          message: 'Your parcel has been marked as delivered successfully.',
          type: 'DELIVERED',
        },
        CANCELLED: {
          title: 'Shipment Cancelled',
          message: 'Your shipment has been cancelled. Please contact ShipNext support if you need assistance.',
          type: 'SHIPMENT',
        },
        RTO: {
          title: 'Shipment Return Initiated',
          message: 'Your shipment is being returned to the sender.',
          type: 'SHIPMENT',
        },
      };

      const details = notificationDetails[status];

      const [updatedShipment, notification] = await prisma.$transaction([
        prisma.shipment.update({
          where: { id: shipment.id },
          data: { status },
        }),

        prisma.notification.create({
          data: {
            userId: shipment.customerId,
            title: details.title,
            message: details.message,
            type: details.type,
            trackingId: shipment.trackingId,
          },
        }),
      ]);

      return res.json({
        success: true,
        message: 'Shipment status updated and customer notification created.',
        shipment: updatedShipment,
        notificationCreated: true,
      });
    } catch (error) {
      console.error('Update shipment status error:', error);

      return res.status(500).json({
        success: false,
        message: 'Unable to update shipment status.',
      });
    }
  }
);


// GET COMPLETED CUSTOMER WALLET RECHARGES — ADMIN VIEW ONLY
router.get(
  '/wallet-recharge-requests',
  authenticateToken,
  authorizeRole('ADMIN'),
  async (req, res) => {
    try {
      const requests = await prisma.walletRechargeRequest.findMany({
        where: {
          status: 'COMPLETED',
        },
        select: {
          id: true,
          userId: true,
          amount: true,
          upiReference: true,
          razorpayPaymentId: true,
          paymentMethod: true,
          status: true,
          createdAt: true,
          user: {
            select: {
              name: true,
              email: true,
              phone: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      return res.json({
        success: true,
        requests: requests.map((request) => ({
          id: request.id,
          customerId: request.userId,
          customer: request.user.name,
          email: request.user.email,
          phone: request.user.phone,
          amount: request.amount.toString(),
          paymentMethod: request.paymentMethod,
          status: request.status,
          reference: request.razorpayPaymentId || request.upiReference,
          createdAt: request.createdAt,
        })),
      });
    } catch (error) {
      console.error('Admin recharge requests error:', error);
      return res.status(500).json({
        success: false,
        message: 'Unable to retrieve completed payments.',
      });
    }
  }
);


// VIEW PAYMENT PROOF — ADMIN ONLY
router.get(
  '/wallet-recharge-requests/:id/proof',
  authenticateToken,
  authorizeRole('ADMIN'),
  async (req, res) => {
    try {
      const request = await prisma.walletRechargeRequest.findUnique({
        where: { id: req.params.id },
        select: {
          proofEncryptedData: true,
          proofEncryptionIv: true,
          proofAuthTag: true,
          proofMimeType: true,
          proofOriginalName: true,
        },
      });

      if (
        !request ||
        !request.proofEncryptedData ||
        !request.proofEncryptionIv ||
        !request.proofAuthTag
      ) {
        return res.status(404).json({
          success: false,
          message: 'Payment document not found.',
        });
      }

      const allowedTypes = [
        'image/jpeg',
        'image/png',
        'image/webp',
        'application/pdf',
      ];

      if (!allowedTypes.includes(request.proofMimeType)) {
        return res.status(400).json({
          success: false,
          message: 'Unsupported payment document type.',
        });
      }

      const key = Buffer.from(
        process.env.KYC_ENCRYPTION_KEY || '',
        'base64'
      );

      if (key.length !== 32) {
        throw new Error('Invalid payment proof encryption key.');
      }

      const decipher = crypto.createDecipheriv(
        'aes-256-gcm',
        key,
        Buffer.from(request.proofEncryptionIv, 'hex')
      );

      decipher.setAuthTag(
        Buffer.from(request.proofAuthTag, 'hex')
      );

      const decryptedData = Buffer.concat([
        decipher.update(request.proofEncryptedData),
        decipher.final(),
      ]);

      res.set({
        'Content-Type': request.proofMimeType,
        'Content-Disposition': 'inline',
        'Content-Length': decryptedData.length,
        'Cache-Control': 'private, no-store',
        'X-Content-Type-Options': 'nosniff',
      });

      return res.send(decryptedData);
    } catch (error) {
      console.error('Admin payment proof error:', error);
      return res.status(500).json({
        success: false,
        message: 'Unable to open payment document.',
      });
    }
  }
);

// ==========================================
// CHILD ACCOUNT MANAGEMENT — ADMIN ONLY
// ==========================================

// GET ALL CHILD ACCOUNTS
router.get(
  '/child-accounts',
  authenticateToken,
  authorizeRole('ADMIN'),
  async (req, res) => {
    try {
      const children = await prisma.childAccount.findMany({
        include: {
          parent: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      return res.json({
        success: true,
        total: children.length,
        children,
      });
    } catch (error) {
      console.error('Admin child accounts error:', error);
      return res.status(500).json({
        success: false,
        message: 'Unable to retrieve child accounts.',
      });
    }
  }
);

// CREATE CHILD ACCOUNT
router.post(
  '/child-accounts',
  authenticateToken,
  authorizeRole('ADMIN'),
  async (req, res) => {
    try {
      const {
        parentId,
        accountName,
        branchName,
        branchCode,
        contactPerson,
        email,
        phone,
        address,
        city,
        state,
        pincode,
        dailyShipmentLimit,
        dailyWalletLimit,
      } = req.body;

      if (
        !parentId ||
        !accountName ||
        !branchName ||
        !branchCode ||
        !contactPerson ||
        !email ||
        !phone ||
        !address ||
        !city ||
        !state ||
        !pincode
      ) {
        return res.status(400).json({
          success: false,
          message: 'Please provide all required child account details.',
        });
      }

      const parent = await prisma.user.findFirst({
        where: {
          id: parentId,
          role: 'CUSTOMER',
        },
      });

      if (!parent) {
        return res.status(404).json({
          success: false,
          message: 'Parent customer account not found.',
        });
      }

      const child = await prisma.childAccount.create({
        data: {
          parentId,
          accountName: accountName.trim(),
          branchName: branchName.trim(),
          branchCode: branchCode.trim().toUpperCase(),
          contactPerson: contactPerson.trim(),
          email: email.trim().toLowerCase(),
          phone: phone.trim(),
          address: address.trim(),
          city: city.trim(),
          state: state.trim(),
          pincode: pincode.trim(),
          dailyShipmentLimit:
            dailyShipmentLimit === '' || dailyShipmentLimit == null
              ? null
              : Number(dailyShipmentLimit),
          dailyWalletLimit:
            dailyWalletLimit === '' || dailyWalletLimit == null
              ? null
              : dailyWalletLimit,
          status: 'INACTIVE',
        },
      });

      return res.status(201).json({
        success: true,
        message: 'Child account created successfully. Activate it after setup.',
        child,
      });
    } catch (error) {
      if (error.code === 'P2002') {
        return res.status(409).json({
          success: false,
          message: 'This branch code already exists for this parent account.',
        });
      }

      console.error('Create child account error:', error);
      return res.status(500).json({
        success: false,
        message: 'Unable to create child account.',
      });
    }
  }
);

// UPDATE CHILD ACCOUNT DETAILS
router.patch(
  '/child-accounts/:id',
  authenticateToken,
  authorizeRole('ADMIN'),
  async (req, res) => {
    try {
      const allowedFields = [
        'accountName',
        'branchName',
        'branchCode',
        'contactPerson',
        'email',
        'phone',
        'address',
        'city',
        'state',
        'pincode',
        'dailyShipmentLimit',
        'dailyWalletLimit',
      ];

      const data = {};

      for (const field of allowedFields) {
        if (req.body[field] !== undefined) {
          data[field] = req.body[field];
        }
      }

      if (data.branchCode) {
        data.branchCode = data.branchCode.trim().toUpperCase();
      }

      if (data.email) {
        data.email = data.email.trim().toLowerCase();
      }

      const child = await prisma.childAccount.update({
        where: { id: req.params.id },
        data,
      });

      return res.json({
        success: true,
        message: 'Child account updated successfully.',
        child,
      });
    } catch (error) {
      if (error.code === 'P2025') {
        return res.status(404).json({
          success: false,
          message: 'Child account not found.',
        });
      }

      if (error.code === 'P2002') {
        return res.status(409).json({
          success: false,
          message: 'Branch code already exists for this parent.',
        });
      }

      console.error('Update child account error:', error);
      return res.status(500).json({
        success: false,
        message: 'Unable to update child account.',
      });
    }
  }
);

// ACTIVATE / DEACTIVATE / SUSPEND CHILD ACCOUNT
router.patch(
  '/child-accounts/:id/status',
  authenticateToken,
  authorizeRole('ADMIN'),
  async (req, res) => {
    try {
      const { status } = req.body;

      const validStatuses = [
        'ACTIVE',
        'INACTIVE',
        'SUSPENDED',
      ];

      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Status must be ACTIVE, INACTIVE, or SUSPENDED.',
        });
      }

      const child = await prisma.childAccount.update({
        where: { id: req.params.id },
        data: { status },
      });

      return res.json({
        success: true,
        message: `Child account status changed to ${status}.`,
        child,
      });
    } catch (error) {
      if (error.code === 'P2025') {
        return res.status(404).json({
          success: false,
          message: 'Child account not found.',
        });
      }

      console.error('Child account status error:', error);
      return res.status(500).json({
        success: false,
        message: 'Unable to update child account status.',
      });
    }
  }
);

// ==========================================
// SHIPMENT RATE APPROVAL — ADMIN ONLY
// ==========================================

// GET SHIPMENTS AWAITING RATE APPROVAL
router.get(
  '/rate-approvals',
  authenticateToken,
  authorizeRole('ADMIN'),
  async (req, res) => {
    try {
      const drafts = await prisma.shipmentDraft.findMany({
        where: {
          rateApprovalStatus: 'PENDING',
        },
        select: {
          id: true,
          customerId: true,
          pickupName: true,
          pickupPincode: true,
          deliveryName: true,
          deliveryPincode: true,
          pickupCity: true,
          deliveryCity: true,
          weightGrams: true,
          paymentMode: true,
          codAmount: true,
          shippingMode: true,
          productValue: true,

          shipNextRate: true,
          delhiveryExpressRate: true,
          delhiveryStandardRate: true,
         shippingMode: true,
          rateApprovalStatus: true,
          createdAt: true,

          customer: {
            select: {
              name: true,
              email: true,
              phone: true,
              companyName: true,
            },
          },
        },
        orderBy: {
          createdAt: 'asc',
        },
      });

      return res.json({
        success: true,
        total: drafts.length,
        drafts: drafts.map((draft) => ({
          ...draft,
          weightKg: Number(draft.weightGrams) / 1000,
          shipNextRate: draft.shipNextRate?.toString() ?? null,
          delhiveryExpressRate:
            draft.delhiveryExpressRate?.toString() ?? null,
          delhiveryStandardRate:
            draft.delhiveryStandardRate?.toString() ?? null,
          productValue: draft.productValue?.toString() ?? null,
          codAmount: draft.codAmount?.toString() ?? null,
        })),
      });
    } catch (error) {
      console.error('Admin rate approval list error:', error);

      return res.status(500).json({
        success: false,
        message: 'Unable to retrieve shipment rate approvals.',
      });
    }
  }
);
// CALCULATE ALL THREE RATES FOR ADMIN
router.post(
  '/rate-approvals/:draftId/calculate',
  authenticateToken,
  authorizeRole('ADMIN'),
  async (req, res) => {
    try {
      const { expressZone, standardZone } = req.body;
      const { draftId } = req.params;

      const validExpressZones = ['A', 'B', 'C', 'D', 'E', 'F'];

      const validStandardZones = [
        'A', 'B', 'C1', 'C2', 'D1', 'D2', 'E', 'F',
      ];

      if (!validExpressZones.includes(expressZone)) {
        return res.status(400).json({
          success: false,
          message: 'Please select a valid Delhivery Express zone.',
        });
      }

      if (!validStandardZones.includes(standardZone)) {
        return res.status(400).json({
          success: false,
          message: 'Please select a valid Delhivery Standard zone.',
        });
      }

      const draft = await prisma.shipmentDraft.findUnique({
        where: { id: draftId },
      });

      if (!draft) {
        return res.status(404).json({
          success: false,
          message: 'Shipment draft not found.',
        });
      }

      if (draft.rateApprovalStatus !== 'PENDING') {
        return res.status(409).json({
          success: false,
          message: 'Only pending shipments can have rates calculated.',
        });
      }

      // VALIDATE WEIGHT
      const weightGrams = Number(draft.weightGrams);
      const weightKg = weightGrams / 1000;

      if (!Number.isFinite(weightKg) || weightKg < 0.5) {
        return res.status(400).json({
          success: false,
          message: 'Minimum shipment weight is 500 grams.',
        });
      }

      // FIND SERVICEABILITY RECORDS FOR SHIPNEXT ZONE
      const isAirMode =
        draft.shippingMode === 'EXPRESS_AIR' ||
        draft.shippingMode === 'NORMAL_AIR';
         if (!draft.shippingMode) {
  return res.status(400).json({
    success: false,
    message: 'This shipment has no shipping mode. Please ask the customer to select a shipping mode and request rate approval again.',
  });
}
      const locationRecords =
        await prisma.courierPincodeServiceability.findMany({
          where: {
            pincode: {
              in: [
                draft.pickupPincode,
                draft.deliveryPincode,
              ],
            },
            ...(isAirMode ? { courier: 'SKYKING' } : {}),
          },
        });

      let pickup;
      let delivery;

      if (isAirMode) {
        pickup = locationRecords.find(
          (item) =>
            item.courier === 'SKYKING' &&
            item.pincode === draft.pickupPincode
        );

        delivery = locationRecords.find(
          (item) =>
            item.courier === 'SKYKING' &&
            item.pincode === draft.deliveryPincode
        );

        if (
          pickup?.firstMile !== true ||
          delivery?.lastMile !== true
        ) {
          return res.status(404).json({
            success: false,
            message:
              'Skyking Air requires First Mile at pickup and Last Mile at delivery.',
          });
        }
      } else {
        const matchingCourier = locationRecords.find((item) =>
          locationRecords.some(
            (other) =>
              other.courier === item.courier &&
              other.pincode === draft.deliveryPincode
          ) &&
          item.pincode === draft.pickupPincode
        );

        if (!matchingCourier) {
          return res.status(404).json({
            success: false,
            message:
              'Unable to determine ShipNext serviceability for this route.',
          });
        }

        pickup = matchingCourier;

        delivery = locationRecords.find(
          (item) =>
            item.courier === matchingCourier.courier &&
            item.pincode === draft.deliveryPincode
        );
      }

      // SHIPNEXT STANDARD — EXISTING PRICING LOGIC
      const shipNextZone = getShippingZone(pickup, delivery);

      const pricingMode = String(draft.shippingMode).endsWith('_AIR')
  ? 'AIR'
  : 'SURFACE';

      const shipNextCharge = calculateShippingCharge(
        shipNextZone,
        pricingMode,
        weightKg
      );

      // DELHIVERY EXPRESS — EXCEL TARIFF
      const expressRate = calculateDelhiveryExpress(
        weightGrams,
        expressZone
      );

      // DELHIVERY STANDARD — EXCEL TARIFF
      const standardRate = calculateDelhiveryStandard(
        weightGrams,
        standardZone
      );

      // SAVE ALL THREE RATES
      const updatedDraft = await prisma.shipmentDraft.update({
        where: { id: draftId },
        data: {
          shipNextRate: shipNextCharge.total,
          delhiveryExpressRate: expressRate,
          delhiveryStandardRate: standardRate,
          shippingMode: draft.shippingMode,
        },
        select: {
          id: true,
          shipNextRate: true,
          delhiveryExpressRate: true,
          delhiveryStandardRate: true,
          rateApprovalStatus: true,
        },
      });

      return res.json({
        success: true,
        message: 'All three shipping rates calculated successfully.',
        rates: {
          shipNext: updatedDraft.shipNextRate,
          delhiveryExpress: updatedDraft.delhiveryExpressRate,
          delhiveryStandard: updatedDraft.delhiveryStandardRate,
        },
      });
    } catch (error) {
      console.error('Admin rate calculation error:', error);

      return res.status(400).json({
        success: false,
        message: error.message || 'Unable to calculate shipping rates.',
      });
    }
  }
);

// APPROVE ONE OF THE THREE SHIPPING RATES
router.patch(
  '/rate-approvals/:draftId',
  authenticateToken,
  authorizeRole('ADMIN'),
  async (req, res) => {
    try {
      const { selectedRateOption } = req.body;
      const { draftId } = req.params;

      const rateFields = {
        SHIPNEXT: 'shipNextRate',
        DELHIVERY_EXPRESS: 'delhiveryExpressRate',
        DELHIVERY_STANDARD: 'delhiveryStandardRate',
      };

      const rateField = rateFields[selectedRateOption];

      if (!rateField) {
        return res.status(400).json({
          success: false,
          message: 'Please select a valid shipping rate option.',
        });
      }

      const draft = await prisma.shipmentDraft.findUnique({
        where: { id: draftId },
      });

      if (!draft) {
        return res.status(404).json({
          success: false,
          message: 'Shipment draft not found.',
        });
      }

      if (draft.rateApprovalStatus !== 'PENDING') {
        return res.status(409).json({
          success: false,
          message: 'This shipment rate has already been approved.',
        });
      }

      const selectedRate = draft[rateField];

      if (
        selectedRate === null ||
        selectedRate === undefined ||
        !Number.isFinite(Number(selectedRate)) ||
        Number(selectedRate) <= 0
      ) {
        return res.status(409).json({
          success: false,
          message: 'The selected rate has not been calculated yet. Please calculate all three rates first.',
        });
      }

      const updatedDraft = await prisma.shipmentDraft.update({
        where: { id: draftId },
        data: {
          rateApprovalStatus: 'APPROVED',
          selectedRateOption,
          approvedShippingCharge: selectedRate,
          rateApprovedById: req.user.userId,
          rateApprovedAt: new Date(),
        },
        select: {
          id: true,
          rateApprovalStatus: true,
          selectedRateOption: true,
          approvedShippingCharge: true,
          rateApprovedById: true,
          rateApprovedAt: true,
        },
      });

      return res.json({
        success: true,
        message: 'Shipping rate approved successfully.',
        approval: {
          ...updatedDraft,
          approvedShippingCharge:
            updatedDraft.approvedShippingCharge.toString(),
        },
      });
    } catch (error) {
      console.error('Admin rate approval error:', error);

      return res.status(500).json({
        success: false,
        message: 'Unable to approve shipping rate.',
      });
    }
  }
);



module.exports = router;
