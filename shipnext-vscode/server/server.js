
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const shipmentRoutes = require('./routes/shipments');
const walletRoutes = require('./routes/wallet');
const enquiryRoutes = require('./routes/enquiries');
const notificationRoutes = require('./routes/notifications');
const supportRoutes = require('./routes/support');
const adminSupportRoutes = require('./routes/adminSupport');
const serviceabilityRoutes = require('./routes/serviceability');
// Middleware
app.use(cors());
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/shipments', shipmentRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/enquiries', enquiryRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/support', supportRoutes);
app.use('/api/admin/support', adminSupportRoutes);
app.use('/api/serviceability', serviceabilityRoutes);
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
