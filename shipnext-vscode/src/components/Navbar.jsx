
import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Package,
  Truck,
  Plane,
  Route,
  MapPin,
  Bell,
  RotateCcw,
  Bot,
  MapPinned,
  Calculator,
  Network,
  ClipboardList,
  WalletCards,
  LayoutDashboard,
  Headset,
  BrainCircuit,
} from 'lucide-react';

const productGroups = [
  {
    title: 'SHIPPING SERVICES',
    items: [
      { icon: Package, name: 'Domestic Shipping', desc: 'Reliable nationwide parcel delivery', path: '/products/domestic-shipping' },
      { icon: Truck, name: 'Cargo & Bulk Shipping', desc: 'Shipping solutions for large consignments', path: '/products/cargo-shipping' },
      { icon: Plane, name: 'Express Air Shipping', desc: 'Faster delivery through air networks', path: '/products/express-air' },
      { icon: Route, name: 'Surface Shipping', desc: 'Economical road-based shipping', path: '/products/surface-shipping' },
    ],
  },
  {
    title: 'TRACKING & DELIVERY',
    items: [
      { icon: MapPin, name: 'Shipment Tracking', desc: 'Track shipments with ShipNext', path: '/products/tracking' },
      { icon: Bell, name: 'Delivery Notifications', desc: 'Stay updated on shipment progress', path: '/products/notifications' },
      { icon: RotateCcw, name: 'Returns & RTO', desc: 'Manage return-to-origin shipments', path: '/products/returns-rto' },
      { icon: Bot, name: 'NDR Management', desc: 'Manage delivery exceptions efficiently', path: '/products/ndr-management' },
    ],
  },
];

const platformGroups = [
  {
    title: 'SHIPPING MANAGEMENT',
    items: [
      { icon: MapPinned, name: 'PIN Serviceability', desc: 'Check pickup and delivery coverage', path: '/platform/serviceability' },
      { icon: Calculator, name: 'Rate Calculator', desc: 'Explore shipping charges by mode', path: '/platform/rate-calculator' },
      { icon: Network, name: 'Multi-Courier Allocation', desc: 'Manage internal courier allocation', path: '/platform/courier-allocation' },
      { icon: ClipboardList, name: 'Shipment Management', desc: 'Manage bookings and shipments', path: '/platform/shipment-management' },
    ],
  },
  {
    title: 'BUSINESS OPERATIONS',
    items: [
      { icon: WalletCards, name: 'Wallet & Billing', desc: 'Manage wallet and transactions', path: '/platform/wallet-billing' },
      { icon: LayoutDashboard, name: 'Admin Dashboard', desc: 'Monitor shipping operations', path: '/platform/admin-dashboard' },
      { icon: Headset, name: 'Customer Support', desc: 'Manage customer queries and tickets', path: '/platform/customer-support' },
      { icon: BrainCircuit, name: 'AI Engine', desc: 'Explore AI-powered shipping solutions', path: '/platform/ai-engine' },
    ],
  },
];

function Navbar() {
  const [activeMenu, setActiveMenu] = useState(null);

  const closeMenu = () => setActiveMenu(null);

  const renderGroups = (groups) => (
    <div className="mega-menu-grid">
      {groups.map((group) => (
        <div className="mega-menu-column" key={group.title}>
          <h4>{group.title}</h4>

          {group.items.map((item) => {
            const Icon = item.icon;

            return (
              <Link
                to={item.path}
                className="mega-menu-item"
                key={item.path}
                onClick={closeMenu}
              >
                <span className="mega-menu-icon">
                  <Icon size={21} strokeWidth={1.8} />
                </span>

                <span className="mega-menu-text">
                  <strong>{item.name}</strong>
                  <small>{item.desc}</small>
                </span>
              </Link>
            );
          })}
        </div>
      ))}
    </div>
  );

  return (
    <header className="navbar" onMouseLeave={closeMenu}>
      <Link to="/" className="logo" onClick={closeMenu}>
        <img
          src="/logo.png"
          alt="ShipNext Logo"
          className="logo-image"
        />
      </Link>

      <nav className="main-navigation">
        <button
          type="button"
          className={`nav-menu-trigger ${activeMenu === 'products' ? 'active' : ''}`}
          aria-expanded={activeMenu === 'products'}
          onClick={() =>
            setActiveMenu(activeMenu === 'products' ? null : 'products')
          }
          onMouseEnter={() => setActiveMenu('products')}
        >
          Products <span className="nav-chevron"></span>
        </button>

        <button
          type="button"
          className={`nav-menu-trigger ${activeMenu === 'platform' ? 'active' : ''}`}
          aria-expanded={activeMenu === 'platform'}
          onClick={() =>
            setActiveMenu(activeMenu === 'platform' ? null : 'platform')
          }
          onMouseEnter={() => setActiveMenu('platform')}
        >
          Platform <span className="nav-chevron"></span>
        </button>

        <Link to="/#solutions" className="nav-simple-link" onClick={closeMenu}>
          Solutions
        </Link>

        <Link to="/track" className="nav-simple-link" onClick={closeMenu}>
          Track Order
        </Link>

        <Link to="/enquiry" className="nav-simple-link" onClick={closeMenu}>
          Enquire Now
        </Link>
      </nav>

      <div className="nav-actions">
        <Link to="/login" className="login-link" onClick={closeMenu}>
          Login
        </Link>
      </div>

      {activeMenu && (
        <div className="mega-menu">
          <div className="mega-menu-heading">
            <div>
              <span className="mega-menu-eyebrow">
                SHIPNEXT {activeMenu.toUpperCase()}
              </span>

              <h2>
                {activeMenu === 'products'
                  ? 'Shipping solutions for every business'
                  : 'One platform. Complete shipping control.'}
              </h2>

              <p>
                {activeMenu === 'products'
                  ? 'Discover smarter ways to ship, track and manage deliveries.'
                  : 'Manage your shipping operations from one unified platform.'}
              </p>
            </div>
          </div>

          {renderGroups(
            activeMenu === 'products' ? productGroups : platformGroups
          )}

          <div className="mega-menu-footer">
            <div>
              <strong>
                {activeMenu === 'products'
                  ? 'Everything your shipping business needs.'
                  : 'Your shipping operations, connected.'}
              </strong>
              <p>Experience the ShipNext advantage.</p>
            </div>

            <Link to="/enquiry" onClick={closeMenu}>
              Talk to ShipNext →
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}

export default Navbar;
