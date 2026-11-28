
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
const refundsRoutes = require('./routes/refunds');
const profileRoutes = require('./routes/profile');
const pincodeBlockageRoutes = require('./routes/pincodeBlockage');
const codRemittanceRoutes = require('./routes/codRemittance');
const pickupLocationsRoutes = require('./routes/pickupLocations');
const invoiceSettingsRoutes = require('./routes/invoiceSettings');
const shippingLabelSettingsRoutes = require('./routes/shippingLabelSettings');
const customerApiKeysRoutes = require('./routes/customerApiKeys');
const customerTaxSettingsRoutes = require('./routes/customerTaxSettings');
const customerInvoicesRoutes = require('./routes/customerInvoices');
const adminCustomerAnalyticsRoutes = require('./routes/adminCustomerAnalytics');
const adminDeliveryHistoryRoutes = require('./routes/adminDeliveryHistory');
const skykingRoutes = require('./routes/skyking');
const rtoRoutes = require('./routes/rto');
// Middleware
app.use(cors());
app.use(express.json({
  verify: (req, res, buf) => {
    if (req.originalUrl === '/api/wallet/webhook') {
      req.rawBody = Buffer.from(buf);
    }
  }
}));
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
app.use('/api/refunds', refundsRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/admin/pincode-blockage', pincodeBlockageRoutes);
app.use('/api/cod-remittance', codRemittanceRoutes);
app.use('/api/pickup-locations', pickupLocationsRoutes);
app.use('/api/invoice-settings', invoiceSettingsRoutes);
app.use('/api/shipping-label-settings', shippingLabelSettingsRoutes);
app.use('/api/customer-api-keys', customerApiKeysRoutes);
app.use('/api/customer-tax-settings', customerTaxSettingsRoutes);
app.use('/api/customer-invoices', customerInvoicesRoutes);
app.use('/api/admin/customer-analytics', adminCustomerAnalyticsRoutes);
app.use('/api/admin/delivery-history', adminDeliveryHistoryRoutes);
app.use('/api/skyking', skykingRoutes);
app.use('/api/rto', rtoRoutes);
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
