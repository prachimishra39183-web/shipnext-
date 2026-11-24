
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import AdminNotificationBell from '../components/AdminNotificationBell';
import API_URL from '../config/api';
import {
  LayoutDashboard,
  Users,
  Package,
  ClipboardList,
  Wallet,
  MessageSquare,
  Headset,
  Building2,
  Globe,
  LogOut,
  ArrowUpRight,
  Activity,
  ShieldCheck,
  Clock3,
  TrendingUp,
  MapPin,
  IndianRupee,
   Calculator,
   ChartNoAxesCombined,
History
} from 'lucide-react';

import './AdminDashboard.css';

const navigation = [
  { title: 'OVERVIEW', items: [
    { label: 'Dashboard', path: '/admin', icon: LayoutDashboard, active: true },
    { label: 'Customers', path: '/admin/customers', icon: Users },
      { label: 'Customer Analytics', path: '/admin/customer-analytics', icon: ChartNoAxesCombined },
      { label: 'Customer Delivery History', path: '/admin/customer-history', icon: History },
    { label: 'Shipments', path: '/admin/shipments', icon: Package },
    { label: 'Bookings', path: '/admin/bookings', icon: ClipboardList },
    { label: 'PIN Rate Calculator', path: '/admin/pincode-rates', icon: Calculator },
    { label: 'Rate Approvals', path: '/admin/rate-approvals', icon: IndianRupee },
  ]},
 {
  title: 'OPERATIONS',
  items: [
    { label: 'Wallet Management', path: '/admin/wallet', icon: Wallet },
    { label: 'Enquiries', path: '/admin/enquiries', icon: MessageSquare },
    { label: 'Support Tickets', path: '/admin/support', icon: Headset },
    { label: 'Child Accounts', path: '/admin/child-accounts', icon: Building2 },
    { label: 'PIN Code Blockage', path: '/admin/pincode-blockage', icon: MapPin },
    { label: 'Reports & Analytics', path: '/admin/reports', icon: ChartNoAxesCombined },
    { label: 'COD Remittance', path: '/admin/cod-remittance', icon: IndianRupee },
   
  ]
}
];
const statCards = [
  {
    label: 'Total Customers',
    note: 'Registered customer accounts',
    icon: Users,
    tone: 'orange',
    index: '01',
    key: 'totalCustomers'
  },
  {
    label: 'Total Shipments',
    note: 'All shipment records',
    icon: Package,
    tone: 'blue',
    index: '02',
    key: 'totalShipments'
  },
  {
    label: 'Pending Shipments',
    note: 'Awaiting processing',
    icon: Clock3,
    tone: 'purple',
    index: '03',
    key: 'pendingShipments'
  },
  {
    label: 'Total Enquiries',
    note: 'Customer enquiries received',
    icon: MessageSquare,
    tone: 'green',
    index: '04',
    key: 'totalEnquiries'
  }
];
function AdminDashboard() {
    const loggedInUser = JSON.parse(
    sessionStorage.getItem('shipnextUser') || '{}'
  );

  const adminName =
    loggedInUser.name ||
    loggedInUser.fullName ||
    loggedInUser.email ||
    'Administrator';
  const [dashboardStats, setDashboardStats] = useState({
    totalCustomers: 0,
    totalShipments: 0,
    pendingShipments: 0,
    totalEnquiries: 0
  });

  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = sessionStorage.getItem('shipnextToken');
        const headers = { Authorization: `Bearer ${token}` };

        const [customersRes, shipmentsRes, enquiriesRes] =
          await Promise.all([
            fetch(`${API_URL}/api/admin/customers`, { headers }),
            fetch(`${API_URL}/api/admin/shipments`, { headers }),
            fetch(`${API_URL}/api/admin/enquiries`, { headers })
          ]);

        if (!customersRes.ok || !shipmentsRes.ok || !enquiriesRes.ok) {
          throw new Error('Failed to fetch dashboard statistics');
        }

        const [customersData, shipmentsData, enquiriesData] =
          await Promise.all([
            customersRes.json(),
            shipmentsRes.json(),
            enquiriesRes.json()
          ]);

        const customers = Array.isArray(customersData)
          ? customersData
          : customersData.customers || customersData.data || [];

        const shipments = Array.isArray(shipmentsData)
          ? shipmentsData
          : shipmentsData.shipments || shipmentsData.data || [];

        const enquiries = Array.isArray(enquiriesData)
          ? enquiriesData
          : enquiriesData.enquiries || enquiriesData.data || [];

        setDashboardStats({
          totalCustomers: customers.length,
          totalShipments: shipments.length,
          pendingShipments: shipments.filter(
            item => item.status === 'PENDING'
          ).length,
          totalEnquiries: enquiries.length
        });
      } catch (error) {
        console.error('Dashboard stats error:', error);
      } finally {
        setStatsLoading(false);
      }
    };

    fetchStats();
  }, []);

  
  return (
    <div className="sn-admin">

      <aside className="sn-admin-sidebar">
        <div className="sn-admin-brand">
          <img src="/logo.jpeg" alt="ShipNext" />
          <div>
            
           
          </div>
        </div>

        <div className="sn-admin-profile">
         
          <div className="sn-admin-profile-info">
            <strong>Administrator</strong>
            <span><i /> System access</span>
          </div>
          <ShieldCheck size={18} />
        </div>

        <nav className="sn-admin-navigation">
          {navigation.map((group) => (
            <div className="sn-admin-nav-group" key={group.title}>
              <p className="sn-admin-nav-heading">{group.title}</p>

              {group.items.map((item) => {
                const Icon = item.icon;

                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`sn-admin-nav-link ${item.active ? 'active' : ''}`}
                  >
                    <Icon size={18} strokeWidth={1.8} />
                    <span>{item.label}</span>
                    {item.active && <i className="sn-admin-active-line" />}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="sn-admin-sidebar-bottom">
          <div className="sn-admin-security">
            <div className="sn-admin-security-mark">
              <ShieldCheck size={18} />
            </div>
            <div>
              <strong>Secure workspace</strong>
              <span>Protected admin access</span>
            </div>
          </div>

          <Link to="/" className="sn-admin-bottom-link">
            <Globe size={17} />
            View Website
            <ArrowUpRight size={14} />
          </Link>

          <Link to="/login" className="sn-admin-bottom-link sn-admin-logout">
            <LogOut size={17} />
            Logout
          </Link>

          <p className="sn-admin-version">SHIPNEXT ADMIN • CONTROL CENTRE</p>
        </div>
      </aside>

      <main className="sn-admin-main">

        <header className="sn-admin-topbar">
          <div className="sn-admin-breadcrumb">
            <span>SHIPNEXT</span>
            <b>/</b>
            <strong>Dashboard</strong>
          </div>

          <div className="sn-admin-top-actions">
  <div className="sn-admin-live">
    <i />
    ADMIN WORKSPACE
  </div>

  <div className="sn-admin-top-profile">
    <div className="sn-admin-top-avatar">
      <ShieldCheck size={19} />
    </div>
    <div className="sn-admin-top-user">
      <strong>{adminName}</strong>
      <span>Administrator</span>
    </div>
  </div>

  <AdminNotificationBell />
</div>
        </header>

        <div className="sn-admin-content">

          <section className="sn-admin-welcome">
            <div className="sn-admin-welcome-copy">
              <div className="sn-admin-eyebrow">
                <span /> SHIPNEXT MANAGEMENT SYSTEM
              </div>

              <h1>Command <span>Centre.</span></h1>

              <p>
                Your central workspace for managing customers,
                shipments and logistics operations across ShipNext.
              </p>

              <div className="sn-admin-welcome-meta">
                <span><Activity size={15} /> Operations overview</span>
                <span><ShieldCheck size={15} /> Secure administration</span>
              </div>
            </div>

            <div className="sn-admin-hero-visual" aria-hidden="true">
              <div className="sn-admin-hero-ring ring-one" />
              <div className="sn-admin-hero-ring ring-two" />
              <div className="sn-admin-hero-ring ring-three" />
              <div className="sn-admin-hero-core">
                <span>SN</span>
                <small>CONTROL</small>
              </div>
              <div className="sn-admin-orbit-dot dot-one" />
              <div className="sn-admin-orbit-dot dot-two" />
            </div>

            <div className="sn-admin-hero-index">01 / OVERVIEW</div>
          </section>

          <section className="sn-admin-section-heading">
            <div>
              <span className="sn-admin-section-kicker">LIVE OVERVIEW</span>
              <h2>Business Snapshot</h2>
              <p>Key metrics from your administration workspace.</p>
            </div>
            <div className="sn-admin-section-status">
              <span /> Dashboard
            </div>
          </section>

                     <section className="sn-admin-stats">
  {statCards.map((stat) => {
    const Icon = stat.icon;

    return (
      <article
        className={`sn-admin-stat-card ${stat.tone}`}
        key={stat.label}
      >
        <div className="sn-admin-stat-top">
          <div className="sn-admin-stat-icon">
            <Icon size={21} strokeWidth={1.8} />
          </div>
          <span className="sn-admin-stat-index">{stat.index}</span>
        </div>

        <p>{stat.label}</p>

        <h3>
          {statsLoading ? '...' : dashboardStats[stat.key]}
        </h3>

        <div className="sn-admin-stat-footer">
          <span>{stat.note}</span>
          <TrendingUp size={15} />
        </div>
      </article>
    );
  })}
</section>

          <section className="sn-admin-lower-grid">

            <div className="sn-admin-panel sn-admin-recent">
              <div className="sn-admin-panel-heading">
                <div>
                  <span className="sn-admin-section-kicker">SHIPMENT ACTIVITY</span>
                  <h2>Recent Shipments</h2>
                  <p>Latest shipment records across your platform.</p>
                </div>

                <Link to="/admin/shipments" className="sn-admin-view-all">
                  View all <ArrowUpRight size={15} />
                </Link>
              </div>

              <div className="sn-admin-empty">
                <div className="sn-admin-empty-graphic">
                  <div className="sn-admin-empty-square square-back" />
                  <div className="sn-admin-empty-square square-front">
                    <Package size={30} strokeWidth={1.5} />
                  </div>
                </div>
                <h3>Shipment activity will appear here</h3>
                
                <Link to="/admin/shipments">
                  Open shipment management <ArrowUpRight size={15} />
                </Link>
              </div>
            </div>

            <div className="sn-admin-panel sn-admin-quick-panel">
              <div className="sn-admin-panel-heading">
                <div>
                  <span className="sn-admin-section-kicker">WORKSPACE</span>
                  <h2>Quick Access</h2>
                  <p>Jump directly to an admin module.</p>
                </div>
              </div>

              <div className="sn-admin-quick-links">
                <Link to="/admin/customers">
                  <span className="quick-symbol">01</span>
                  <span className="quick-copy">
                    <strong>Customer Directory</strong>
                    <small>Manage registered accounts</small>
                  </span>
                  <ArrowUpRight size={17} />
                </Link>

                <Link to="/admin/bookings">
                  <span className="quick-symbol">02</span>
                  <span className="quick-copy">
                    <strong>Booking Operations</strong>
                    <small>Review shipment bookings</small>
                  </span>
                  <ArrowUpRight size={17} />
                </Link>
                <Link to="/admin/rate-approvals">
  <span className="quick-symbol">02</span>
  <span className="quick-copy">
    <strong>Rate Approvals</strong>
    <small>Compare and approve shipment rates</small>
  </span>
  <ArrowUpRight size={17} />
</Link>

                <Link to="/admin/wallet">
                  <span className="quick-symbol">03</span>
                  <span className="quick-copy">
                    <strong>Wallet Control</strong>
                    <small>Manage recharge requests</small>
                  </span>
                  <ArrowUpRight size={17} />
                </Link>

                <Link to="/admin/support">
                  <span className="quick-symbol">04</span>
                  <span className="quick-copy">
                    <strong>Support Centre</strong>
                    <small>Handle customer tickets</small>
                  </span>
                  <ArrowUpRight size={17} />
                </Link>
              </div>
            </div>

          </section>

          <footer className="sn-admin-footer">
            <span>SHIPNEXT <b>ADMINISTRATION</b></span>
            <span>LOGISTICS MANAGEMENT PLATFORM</span>
          </footer>

        </div>
      </main>
    </div>
  );
}

export default AdminDashboard;
