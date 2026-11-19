
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const authRoutes = require('./routes/auth');
const childAccountsRoutes = require('./routes/childAccounts');
const adminRoutes = require('./routes/admin');
const shipmentRoutes = require('./routes/shipments');
const walletRoutes = require('./routes/wallet');
const enquiryRoutes = require('./routes/enquiries');
const notificationRoutes = require('./routes/notifications');
const supportRoutes = require('./routes/support');
const adminSupportRoutes = require('./routes/adminSupport');
const serviceabilityRoutes = require('./routes/serviceability');
const reportsRoutes = require('./routes/reports');

const adminNotificationsRoutes = require('./routes/adminNotifications');
const ndrRoutes = require('./routes/ndr');
// Middleware
app.use(cors());
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/child-accounts', childAccountsRoutes);
app.use('/api/shipments', shipmentRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/enquiries', enquiryRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/support', supportRoutes);
app.use('/api/admin/support', adminSupportRoutes);
app.use('/api/serviceability', serviceabilityRoutes);
app.use('/api/admin/reports', reportsRoutes);
app.use('/api/admin/notifications', adminNotificationsRoutes);
app.use('/api/ndr', ndrRoutes);
// Health check
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'ShipNext backend is running!'
  });
});

// Server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`ShipNext backend running on port ${PORT}`);
});
