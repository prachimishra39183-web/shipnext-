
const express = require('express');
const prisma = require('../prisma');
const {
  authenticateToken,
  authorizeRole,
} = require('../middleware/auth');

const router = express.Router();

const VALID_STATUSES = [
  'OPEN',
  'ACTION_REQUIRED',
  'REATTEMPT_SCHEDULED',
  'RESOLVED',
  'RTO_INITIATED',
];

// DATE FILTER HELPER
function getDateFilter(from, to) {
  const filter = {};

  if (from) {
    const start = new Date(`${from}T00:00:00.000Z`);
    if (Number.isNaN(start.getTime())) {
      throw new Error('Invalid start date.');
    }
    filter.gte = start;
  }

  if (to) {
    const end = new Date(`${to}T00:00:00.000Z`);
    if (Number.isNaN(end.getTime())) {
      throw new Error('Invalid end date.');
    }
    end.setUTCDate(end.getUTCDate() + 1);
    filter.lt = end;
  }

  if (from && to && new Date(from) > new Date(to)) {
    throw new Error('Start date cannot be after end date.');
  }

  return Object.keys(filter).length ? filter : undefined;
}

// CSV HELPER
function makeCSV(records) {
  const headers = [
    'Shipment ID',
    'Booking Date',
    'NDR Date',
    'Attempt Number',
    'NDR Reason',
    'NDR Status',
    'Action Required',
    'Remarks',
  ];

  const escapeCSV = (value) =>
    `"${String(value ?? '').replace(/"/g, '""')}"`;

  const rows = records.map((record) => [
    record.shipmentId,
    record.shipment?.createdAt,
    record.reportedAt,
    record.attemptNumber,
    record.reason,
    record.status,
    record.actionRequired,
    record.remarks,
  ]);

  return [
    headers.map(escapeCSV).join(','),
    ...rows.map((row) => row.map(escapeCSV).join(',')),
  ].join('\n');
}

// MERCHANT: VIEW OWN NDR REPORT
router.get(
  '/my',
  authenticateToken,
  authorizeRole('CUSTOMER'),
  async (req, res) => {
    try {
      const dateFilter = getDateFilter(req.query.from, req.query.to);

      const where = {
        shipment: {
          customerId: req.user.userId,
        },
        ...(dateFilter ? { reportedAt: dateFilter } : {}),
        ...(req.query.status
          ? { status: req.query.status }
          : {}),
      };

      const records = await prisma.nDRRecord.findMany({
        where,
        include: {
          shipment: true,
        },
        orderBy: {
          reportedAt: 'desc',
        },
      });

      res.json({
        success: true,
        total: records.length,
        records,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }
);

// MERCHANT: DOWNLOAD OWN NDR CSV
router.get(
  '/my/export',
  authenticateToken,
  authorizeRole('CUSTOMER'),
  async (req, res) => {
    try {
      const dateFilter = getDateFilter(req.query.from, req.query.to);

      const records = await prisma.nDRRecord.findMany({
        where: {
          shipment: {
            customerId: req.user.userId,
          },
          ...(dateFilter ? { reportedAt: dateFilter } : {}),
          ...(req.query.status
            ? { status: req.query.status }
            : {}),
        },
        include: {
          shipment: true,
        },
        orderBy: {
          reportedAt: 'desc',
        },
      });

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader(
        'Content-Disposition',
        'attachment; filename="shipnext-ndr-report.csv"'
      );

      res.send('\uFEFF' + makeCSV(records));
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }
);

// ADMIN: VIEW ALL MERCHANT NDR RECORDS
router.get(
  '/admin',
  authenticateToken,
  authorizeRole('ADMIN'),
  async (req, res) => {
    try {
      const dateFilter = getDateFilter(req.query.from, req.query.to);

      const records = await prisma.nDRRecord.findMany({
        where: {
          ...(dateFilter ? { reportedAt: dateFilter } : {}),
          ...(req.query.status
            ? { status: req.query.status }
            : {}),
        },
        include: {
          shipment: {
            include: {
              customer: true,
            },
          },
        },
        orderBy: {
          reportedAt: 'desc',
        },
      });

      res.json({
        success: true,
        total: records.length,
        records,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }
);

// ADMIN: DOWNLOAD ALL NDR RECORDS
router.get(
  '/admin/export',
  authenticateToken,
  authorizeRole('ADMIN'),
  async (req, res) => {
    try {
      const dateFilter = getDateFilter(req.query.from, req.query.to);

      const records = await prisma.nDRRecord.findMany({
        where: {
          ...(dateFilter ? { reportedAt: dateFilter } : {}),
          ...(req.query.status
            ? { status: req.query.status }
            : {}),
        },
        include: {
          shipment: true,
        },
        orderBy: {
          reportedAt: 'desc',
        },
      });

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader(
        'Content-Disposition',
        'attachment; filename="shipnext-admin-ndr-report.csv"'
      );

      res.send('\uFEFF' + makeCSV(records));
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }
);

// ADMIN: CREATE NDR RECORD
router.post(
  '/admin',
  authenticateToken,
  authorizeRole('ADMIN'),
  async (req, res) => {
    try {
      const {
        shipmentId,
        reason,
        attemptNumber = 1,
        status = 'OPEN',
      } = req.body;

      if (!shipmentId || !reason?.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Shipment ID and NDR reason are required.',
        });
      }

      if (
        !Number.isInteger(Number(attemptNumber)) ||
        Number(attemptNumber) < 1
      ) {
        return res.status(400).json({
          success: false,
          message: 'Invalid attempt number.',
        });
      }

      if (!VALID_STATUSES.includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid NDR status.',
        });
      }

      const shipment = await prisma.shipment.findUnique({
        where: { id: shipmentId },
      });

      if (!shipment) {
        return res.status(404).json({
          success: false,
          message: 'Shipment not found.',
        });
      }

      const record = await prisma.nDRRecord.create({
        data: {
          shipmentId,
          reason: reason.trim(),
          attemptNumber: Number(attemptNumber),
          status,
        },
      });

      res.status(201).json({
        success: true,
        message: 'NDR record created successfully.',
        record,
      });
    } catch (error) {
      console.error('NDR creation error:', error);
      res.status(500).json({
        success: false,
        message: 'Unable to create NDR record.',
      });
    }
  }
);

// MERCHANT: SUBMIT ACTION FOR OWN NDR
router.patch(
  '/:id/action',
  authenticateToken,
  authorizeRole('CUSTOMER'),
  async (req, res) => {
    try {
      const { actionRequired, remarks } = req.body;

      if (!actionRequired?.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Please select an action.',
        });
      }

      const existing = await prisma.nDRRecord.findFirst({
        where: {
          id: req.params.id,
          shipment: {
            customerId: req.user.userId,
          },
        },
      });

      if (!existing) {
        return res.status(404).json({
          success: false,
          message: 'NDR record not found.',
        });
      }

      const record = await prisma.nDRRecord.update({
        where: { id: existing.id },
        data: {
          actionRequired: actionRequired.trim(),
          remarks: remarks?.trim() || null,
          status: 'ACTION_REQUIRED',
        },
      });

      res.json({
        success: true,
        message: 'NDR action submitted.',
        record,
      });
    } catch (error) {
      console.error('NDR action error:', error);
      res.status(500).json({
        success: false,
        message: 'Unable to submit NDR action.',
      });
    }
  }
);

// ADMIN: UPDATE NDR STATUS
router.patch(
  '/:id/status',
  authenticateToken,
  authorizeRole('ADMIN'),
  async (req, res) => {
    try {
      const { status, remarks, nextAttemptDate } = req.body;

      if (!VALID_STATUSES.includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid NDR status.',
        });
      }

      const existing = await prisma.nDRRecord.findUnique({
        where: { id: req.params.id },
      });

      if (!existing) {
        return res.status(404).json({
          success: false,
          message: 'NDR record not found.',
        });
      }

      let nextDate = null;

      if (nextAttemptDate) {
        nextDate = new Date(nextAttemptDate);

        if (Number.isNaN(nextDate.getTime())) {
          return res.status(400).json({
            success: false,
            message: 'Invalid next attempt date.',
          });
        }
      }

      const record = await prisma.nDRRecord.update({
        where: { id: req.params.id },
        data: {
          status,
          remarks: remarks?.trim() || existing.remarks,
          nextAttemptDate: nextDate,
          resolvedAt:
            status === 'RESOLVED' ? new Date() : null,
        },
      });

      res.json({
        success: true,
        message: 'NDR status updated.',
        record,
      });
    } catch (error) {
      console.error('NDR status update error:', error);
      res.status(500).json({
        success: false,
        message: 'Unable to update NDR status.',
      });
    }
  }
);

module.exports = router;
