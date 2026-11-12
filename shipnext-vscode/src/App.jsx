
import { BrowserRouter, Routes, Route } from 'react-router-dom';

import Home from './pages/Home.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import CustomerDashboard from './pages/CustomerDashboard.jsx';
import BookShipment from './pages/BookShipment.jsx';
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


function App() {
  return (
    <BrowserRouter>
      <div className="website-background">

        {/* Global Video Background */}
        <video
          className="website-bg-video"
          autoPlay
          muted
          loop
          playsInline
        >
          <source src="/shipnext-bg.mp4" type="video/mp4" />
        </video>

        {/* Dark Overlay */}
        <div className="website-bg-overlay"></div>

        {/* All Website Pages */}
        <div className="website-content">
          <Routes>
            <Route path="/" element={<Home />} />

            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            <Route path="/dashboard" element={<CustomerDashboard />} />
            <Route path="/book-shipment" element={<BookShipment />} />
            <Route path="/shipping-charges" element={<ShippingCharges />} />
            <Route path="/wallet" element={<Wallet />} />
            <Route path="/shipments" element={<MyShipments />} />
            <Route path="/profile" element={<MyProfile />} />

            <Route path="/track" element={<TrackShipment />} />
            <Route path="/track/:trackingId" element={<TrackShipment />} />

            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/customers" element={<AdminCustomers />} />
            <Route path="/admin/shipments" element={<AdminShipments />} />
            <Route path="/admin/bookings" element={<AdminBookings />} />
            <Route path="/admin/wallet" element={<AdminWallet />} />
            <Route path="/admin/enquiries" element={<AdminEnquiries />} />
          </Routes>
        </div>

      </div>
    </BrowserRouter>
  );
}

export default App;
