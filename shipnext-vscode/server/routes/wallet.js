
const express = require('express');
const prisma = require('../prisma');
const Razorpay = require('razorpay');
const crypto = require('crypto');

const {
  authenticateToken,
  authorizeRole,
} = require('../middleware/auth');

const router = express.Router();

function getRazorpay() {
  if (
    !process.env.RAZORPAY_KEY_ID ||
    !process.env.RAZORPAY_KEY_SECRET
  ) {
    throw new Error('Razorpay API credentials are not configured.');
  }

  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
}

// GET CUSTOMER WALLET BALANCE AND TRANSACTION HISTORY
router.get(
  '/me',
  authenticateToken,
  authorizeRole('CUSTOMER'),
  async (req, res) => {
    try {
      const wallet = await prisma.wallet.upsert({
        where: { userId: req.user.userId },
        update: {},
        create: { userId: req.user.userId },
        include: {
          transactions: {
            orderBy: { createdAt: 'desc' },
            take: 50,
          },
        },
      });

      return res.json({
        success: true,
        wallet: {
          balance: wallet.balance.toString(),
          transactions: wallet.transactions,
        },
      });
    } catch (error) {
      console.error('Get wallet error:', error);

      return res.status(500).json({
        success: false,
        message: 'Unable to retrieve wallet details.',
      });
    }
  }
);

// CREATE RAZORPAY WALLET RECHARGE ORDER
router.post(
  '/recharge-orders',
  authenticateToken,
  authorizeRole('CUSTOMER'),
  async (req, res) => {
    try {
      const amountString = String(req.body.amount ?? '').trim();

      if (
        !/^\d+(\.\d{1,2})?$/.test(amountString) ||
        !Number.isFinite(Number(amountString)) ||
        Number(amountString) < 1 ||
        Number(amountString) > 1000000
      ) {
        return res.status(400).json({
          success: false,
          message: 'Enter an amount between ₹1 and ₹10,00,000.',
        });
      }

      const amountPaise = Math.round(Number(amountString) * 100);
      const amountRupees = (amountPaise / 100).toFixed(2);

      const razorpay = getRazorpay();

      const order = await razorpay.orders.create({
        amount: amountPaise,
        currency: 'INR',
        receipt: `wr_${crypto.randomUUID().replace(/-/g, '').slice(0, 24)}`,
        notes: {
          userId: req.user.userId,
          purpose: 'SHIPNEXT_WALLET_RECHARGE',
        },
      });

      const recharge = await prisma.walletRechargeRequest.create({
        data: {
          userId: req.user.userId,
          amount: amountRupees,
          razorpayOrderId: order.id,
          paymentMethod: 'RAZORPAY',
          status: 'PENDING',
        },
      });

      return res.status(201).json({
        success: true,
        message: 'Payment order created.',
        order: {
          id: order.id,
          amount: order.amount,
          currency: order.currency,
        },
        rechargeId: recharge.id,
        keyId: process.env.RAZORPAY_KEY_ID,
      });
    } catch (error) {
      console.error('Create Razorpay order error:', error);

      return res.status(500).json({
        success: false,
        message: 'Unable to create payment order.',
      });
    }
  }
);

// VERIFY PAYMENT AND CREDIT CUSTOMER WALLET
router.post(
  '/verify-recharge',
  authenticateToken,
  authorizeRole('CUSTOMER'),
  async (req, res) => {
    try {
      const {
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
      } = req.body;

      if (
        !razorpay_order_id ||
        !razorpay_payment_id ||
        !razorpay_signature
      ) {
        return res.status(400).json({
          success: false,
          message: 'Payment verification details are incomplete.',
        });
      }

      const recharge = await prisma.walletRechargeRequest.findFirst({
        where: {
          userId: req.user.userId,
          razorpayOrderId: razorpay_order_id,
        },
      });

      if (!recharge) {
        return res.status(404).json({
          success: false,
          message: 'Recharge order not found.',
        });
      }

      // Already credited: never credit the same order twice.
      if (recharge.status === 'COMPLETED') {
        if (recharge.razorpayPaymentId !== razorpay_payment_id) {
          return res.status(409).json({
            success: false,
            message: 'This order has already been processed.',
          });
        }

        const wallet = await prisma.wallet.findUnique({
          where: { userId: req.user.userId },
        });

        return res.json({
          success: true,
          message: 'Payment was already verified.',
          balance: wallet.balance.toString(),
        });
      }

      if (recharge.status !== 'PENDING') {
        return res.status(409).json({
          success: false,
          message: 'This recharge order cannot be processed.',
        });
      }

      const secret = process.env.RAZORPAY_KEY_SECRET;

      const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest('hex');

      const expectedBuffer = Buffer.from(expectedSignature, 'hex');
      const receivedBuffer = Buffer.from(razorpay_signature, 'hex');

      if (
        expectedBuffer.length !== receivedBuffer.length ||
        !crypto.timingSafeEqual(expectedBuffer, receivedBuffer)
      ) {
        return res.status(400).json({
          success: false,
          message: 'Invalid payment signature.',
        });
      }

      // Independently verify payment and order with Razorpay.
      const razorpay = getRazorpay();

      const [payment, order] = await Promise.all([
        razorpay.payments.fetch(razorpay_payment_id),
        razorpay.orders.fetch(razorpay_order_id),
      ]);

      const expectedPaise = Math.round(Number(recharge.amount) * 100);

      if (
        payment.order_id !== razorpay_order_id ||
        payment.amount !== expectedPaise ||
        order.amount !== expectedPaise ||
        payment.currency !== 'INR' ||
        order.currency !== 'INR' ||
        payment.status !== 'captured' ||
        order.status !== 'paid'
      ) {
        return res.status(400).json({
          success: false,
          message: 'Payment is not captured or the payment details do not match.',
        });
      }

      // Credit wallet, record transaction and notifications atomically.
      const result = await prisma.$transaction(async (tx) => {
        const updated = await tx.walletRechargeRequest.updateMany({
          where: {
            id: recharge.id,
            status: 'PENDING',
          },
          data: {
            status: 'COMPLETED',
            razorpayPaymentId: razorpay_payment_id,
            paymentMethod: 'RAZORPAY',
          },
        });

        if (updated.count !== 1) {
          throw new Error('RECHARGE_ALREADY_PROCESSED');
        }

        const wallet = await tx.wallet.upsert({
          where: { userId: req.user.userId },
          update: {
            balance: { increment: recharge.amount },
          },
          create: {
            userId: req.user.userId,
            balance: recharge.amount,
          },
        });

        await tx.walletTransaction.create({
          data: {
            userId: req.user.userId,
            walletId: wallet.id,
            type: 'CREDIT',
            amount: recharge.amount,
            description: 'Wallet recharge through Razorpay',
            reference: `RAZORPAY_${razorpay_payment_id}`,
          },
        });

        await tx.notification.create({
          data: {
            userId: req.user.userId,
            title: 'Wallet Recharge Successful',
            message: `₹${recharge.amount.toString()} has been added to your ShipNext wallet.`,
            type: 'WALLET',
          },
        });

        await tx.adminNotification.create({
          data: {
            title: 'New Wallet Recharge',
            message: `A customer has recharged their wallet with ₹${recharge.amount.toString()} through Razorpay.`,
            type: 'WALLET_TOPUP',
            link: '/admin/wallet',
          },
        });

        return wallet;
      });

      return res.json({
        success: true,
        message: 'Wallet recharged successfully.',
        balance: result.balance.toString(),
      });
    } catch (error) {
      if (
        error.message === 'RECHARGE_ALREADY_PROCESSED' ||
        error.code === 'P2002'
      ) {
        return res.status(409).json({
          success: false,
          message: 'This payment has already been processed.',
        });
      }

      console.error('Verify Razorpay payment error:', error);

      return res.status(500).json({
        success: false,
        message: 'Unable to verify payment. Please contact support if money was deducted.',
      });
    }
  }
);

// CUSTOMER: VIEW OWN RECHARGE HISTORY
router.get(
  '/recharge-requests',
  authenticateToken,
  authorizeRole('CUSTOMER'),
  async (req, res) => {
    try {
      const requests = await prisma.walletRechargeRequest.findMany({
        where: {
          userId: req.user.userId,
        },
        select: {
          id: true,
          amount: true,
          upiReference: true,
          razorpayOrderId: true,
          razorpayPaymentId: true,
          paymentMethod: true,
          status: true,
          createdAt: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      return res.json({
        success: true,
        requests,
      });
    } catch (error) {
      console.error('Get customer recharge requests error:', error);

      return res.status(500).json({
        success: false,
        message: 'Unable to retrieve recharge requests.',
      });
    }
  }
);
// RAZORPAY WEBHOOK: AUTOMATICALLY CONFIRM SUCCESSFUL RECHARGES
router.post('/webhook', async (req, res) => {
  try {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    const signature = req.headers['x-razorpay-signature'];

    if (!webhookSecret || !req.rawBody || !signature) {
      return res.status(400).send('Invalid webhook configuration.');
    }

    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(req.rawBody)
      .digest('hex');

    const expectedBuffer = Buffer.from(expectedSignature, 'hex');
    const receivedBuffer = Buffer.from(signature, 'hex');

    if (
      expectedBuffer.length !== receivedBuffer.length ||
      !crypto.timingSafeEqual(expectedBuffer, receivedBuffer)
    ) {
      return res.status(400).send('Invalid webhook signature.');
    }

    const event = JSON.parse(req.rawBody.toString('utf8'));

    // Only process successfully captured payments.
    if (event.event !== 'payment.captured') {
      return res.status(200).json({ received: true });
    }

    const payment = event.payload?.payment?.entity;

    if (
      !payment ||
      !payment.order_id ||
      payment.status !== 'captured' ||
      payment.currency !== 'INR'
    ) {
      return res.status(200).json({ received: true });
    }

    const recharge = await prisma.walletRechargeRequest.findUnique({
      where: { razorpayOrderId: payment.order_id },
    });

    if (!recharge) {
      console.error('Webhook: Recharge order not found:', payment.order_id);
      return res.status(200).json({ received: true });
    }

    // Already credited: never credit this recharge twice.
    if (recharge.status === 'COMPLETED') {
      return res.status(200).json({ received: true });
    }

    const expectedPaise = Math.round(Number(recharge.amount) * 100);

    if (payment.amount !== expectedPaise) {
      console.error('Webhook: Payment amount mismatch:', payment.order_id);
      return res.status(200).json({ received: true });
    }

    await prisma.$transaction(async (tx) => {
      const updated = await tx.walletRechargeRequest.updateMany({
        where: {
          id: recharge.id,
          status: 'PENDING',
        },
        data: {
          status: 'COMPLETED',
          razorpayPaymentId: payment.id,
          paymentMethod: 'RAZORPAY',
        },
      });

      if (updated.count !== 1) {
        throw new Error('RECHARGE_ALREADY_PROCESSED');
      }

      const wallet = await tx.wallet.upsert({
        where: { userId: recharge.userId },
        update: {
          balance: { increment: recharge.amount },
        },
        create: {
          userId: recharge.userId,
          balance: recharge.amount,
        },
      });

      await tx.walletTransaction.create({
        data: {
          userId: recharge.userId,
          walletId: wallet.id,
          type: 'CREDIT',
          amount: recharge.amount,
          description: 'Wallet recharge through Razorpay',
          reference: `RAZORPAY_${payment.id}`,
        },
      });

      await tx.notification.create({
        data: {
          userId: recharge.userId,
          title: 'Wallet Recharge Successful',
          message: `₹${recharge.amount.toString()} has been added to your ShipNext wallet.`,
          type: 'WALLET',
        },
      });

      await tx.adminNotification.create({
        data: {
          title: 'New Wallet Recharge',
          message: `A customer has recharged their wallet with ₹${recharge.amount.toString()} through Razorpay.`,
          type: 'WALLET_TOPUP',
          link: '/admin/wallet',
        },
      });
    });

    console.log('Razorpay webhook: Wallet recharge completed:', payment.id);

    return res.status(200).json({ received: true });
  } catch (error) {
    if (
      error.message === 'RECHARGE_ALREADY_PROCESSED' ||
      error.code === 'P2002'
    ) {
      return res.status(200).json({ received: true });
    }

    console.error('Razorpay webhook error:', error);
    return res.status(500).json({ received: false });
  }
});

module.exports = router;
