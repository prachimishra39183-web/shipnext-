
import { BrowserRouter, Routes, Route } from 'react-router-dom';

import Home from './pages/Home.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Enquiry from './pages/Enquiry.jsx';
import CustomerDashboard from './pages/CustomerDashboard.jsx';
import BookShipment from './pages/BookShipment.jsx';
import BulkBooking from './pages/BulkBooking.jsx';
import ShippingCharges from './pages/ShippingCharges.jsx';
import Wallet from './pages/Wallet.jsx';
import MyShipments from './pages/MyShipments.jsx';
import MyProfile from './pages/MyProfile.jsx';
import TrackShipment from './pages/TrackShipment.jsx';

import AdminDashboard from './pages/AdminDashboard.jsx';
import AdminCustomers from './pages/AdminCustomers.jsx';
import AdminShipments from './pages/AdminShipments.jsx';
import AdminBookings from './pages/AdminBookings.jsx';
import AdminWallet from './pages/AdminWallet.jsx';
import AdminEnquiries from './pages/AdminEnquiries.jsx';

import ProtectedRoute from './components/ProtectedRoute.jsx';
import Support from './pages/Support.jsx';
import AdminSupport from './pages/AdminSupport.jsx';
import AdminServiceability from './pages/AdminServiceability.jsx';
import AdminReports from './pages/AdminReports';
import AdminLayout from './components/AdminLayout.jsx';
import AdminChildAccounts from './pages/AdminChildAccounts.jsx';
import AdminPincodeBlockage from './pages/AdminPincodeBlockage.jsx';
import CustomerChildAccounts from './pages/CustomerChildAccounts.jsx';
import ProductPage from './pages/ProductPage.jsx';
import PlatformPage from './pages/PlatformPage.jsx';
import AdminCodRemittance from './pages/AdminCodRemittance.jsx';
import CustomerCodRemittance from './pages/CustomerCodRemittance.jsx';
import AdminPincodeRates from './pages/AdminPincodeRates.jsx';
import AdminRateApprovals from './pages/AdminRateApprovals.jsx';
import CustomerSettings from './pages/CustomerSettings.jsx';
import CustomerInvoices from './pages/CustomerInvoices.jsx';
import AdminCustomerAnalytics from './pages/AdminCustomerAnalytics.jsx';
import AdminCustomerHistory from './pages/AdminCustomerHistory';
import AdminRefunds from './pages/AdminRefunds.jsx';
function App() {
  return (
    <BrowserRouter>
      <div className="website-background">

        <img
  className="website-bg-video"
  src="/bg.png"
  alt=""
/>

        <div className="website-bg-overlay"></div>

        <div className="website-content">
          <Routes>

            {/* PUBLIC PAGES */}
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
             <Route path="/enquiry" element={<Enquiry />} />
            <Route path="/track" element={<TrackShipment />} />
            <Route path="/track/:trackingId" element={<TrackShipment />} />
            <Route path="/products/:slug" element={<ProductPage />} />
            <Route path="/platform/:slug" element={<PlatformPage />} />

            {/* CUSTOMER PROTECTED PAGES */}
            <Route element={<ProtectedRoute allowedRole="CUSTOMER" />}>
              <Route path="/dashboard" element={<CustomerDashboard />} />
              <Route path="/book-shipment" element={<BookShipment />} />
              <Route path="/bulk-booking" element={<BulkBooking />} />
             <Route path="/shipping-charges" element={<ShippingCharges />} />

<Route path="/shipping-charges/:draftId" element={<ShippingCharges />} />
              <Route path="/wallet" element={<Wallet />} />
              <Route path="/shipments" element={<MyShipments />} />
              <Route path="/profile" element={<MyProfile />} />
              <Route path="/support" element={<Support />} />
              
              
              <Route
  path="/child-accounts"
  element={<CustomerChildAccounts />}
/>
<Route
  path="/cod-remittance"
  element={<CustomerCodRemittance />}
/>
              <Route path="/settings" element={<CustomerSettings />} />
              <Route path="/invoices" element={<CustomerInvoices />} />
              
            </Route>

           
{/* ADMIN PROTECTED PAGES */}
<Route element={<ProtectedRoute allowedRole="ADMIN" />}>
  <Route element={<AdminLayout />}>
    <Route path="/admin" element={<AdminDashboard />} />
    <Route path="/admin/customers" element={<AdminCustomers />} />
    <Route path="/admin/shipments" element={<AdminShipments />} />
    <Route path="/admin/bookings" element={<AdminBookings />} />
    <Route
  path="/admin/rate-approvals"
  element={<AdminRateApprovals />}
/>
    <Route path="/admin/wallet" element={<AdminWallet />} />
    <Route path="/admin/enquiries" element={<AdminEnquiries />} />
    <Route path="/admin/support" element={<AdminSupport />} />
    <Route path="/admin/serviceability" element={<AdminServiceability />} />
    <Route path="/admin/reports" element={<AdminReports />} />
    <Route path="/admin/child-accounts" element={<AdminChildAccounts />} />
    <Route
  path="/admin/pincode-blockage"
  element={<AdminPincodeBlockage />}
/>
  </Route>
  <Route
  path="/admin/cod-remittance"
  element={<AdminCodRemittance />}
/>
<Route
  path="/admin/customer-analytics"
  element={<AdminCustomerAnalytics />}
/>
<Route
  path="/admin/customer-history"
  element={<AdminCustomerHistory />}
/>
<Route
  path="/admin/pincode-rates"
  element={<AdminPincodeRates />}
/>
<Route path="/admin/refunds" element={<AdminRefunds />} />
</Route>



          </Routes>
        </div>
      </div>
    </BrowserRouter>
  );
}

export default App;
