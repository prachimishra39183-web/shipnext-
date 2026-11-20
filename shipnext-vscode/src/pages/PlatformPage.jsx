
import { Link, useParams } from 'react-router-dom';
import {
  ArrowRight, CheckCircle2, MapPin, Calculator, Layers,
  Package, Wallet, LayoutDashboard, Headset, Brain,
  Clock, ShieldCheck, BarChart3
} from 'lucide-react';
import Navbar from '../components/Navbar';
import '../styles/PlatformPage.css';

const platforms = {
  serviceability: {
    category: 'SHIPPING MANAGEMENT',
    title: 'PIN Serviceability',
    subtitle: 'Know Where You Can Deliver.',
    description: 'Check pickup and delivery PIN code coverage to understand which shipping services are available for your shipments.',
    icon: MapPin,
    features: [
      'Pickup PIN code verification',
      'Delivery PIN code verification',
      'Service availability checks',
      'Prepaid and COD service information',
      'Reverse pickup availability',
      'Multi-carrier coverage visibility'
    ],
    workflow: [
      ['01', 'Enter PIN Codes', 'Add pickup and delivery PIN codes.'],
      ['02', 'Check Coverage', 'Verify service availability for both locations.'],
      ['03', 'Review Services', 'Explore available shipping services.'],
      ['04', 'Proceed with Booking', 'Continue with a suitable available option.']
    ],
    benefits: ['Reduce serviceability errors', 'Make informed booking decisions', 'Check coverage before dispatch'],
    industries: ['E-commerce', 'Retail', 'D2C Brands', 'Distributors'],
    advantageTitle: <>Know Your Reach.<br />Ship with <span>Confidence.</span></>,
    advantageDescription: 'Make better shipping decisions with pickup and delivery PIN code serviceability visibility.',
    ctaTitle: 'Ready to check your shipping coverage?',
    ctaDescription: 'Use ShipNext to explore service availability for your shipments.'
  },

  'rate-calculator': {
    category: 'SHIPPING MANAGEMENT',
    title: 'Rate Calculator',
    subtitle: 'Understand Your Shipping Costs.',
    description: 'Explore estimated shipping charges based on shipment details, PIN codes, weight and available shipping modes.',
    icon: Calculator,
    features: [
      'Pickup and delivery PIN code inputs',
      'Shipment weight calculation',
      'Shipping mode selection',
      'Estimated shipping charges',
      'Service availability information',
      'Compare available shipping options'
    ],
    workflow: [
      ['01', 'Enter Locations', 'Provide pickup and delivery PIN codes.'],
      ['02', 'Add Shipment Details', 'Enter the parcel weight and requirements.'],
      ['03', 'Explore Rates', 'Review estimated charges for available modes.'],
      ['04', 'Choose an Option', 'Proceed with a suitable shipping option.']
    ],
    benefits: ['Improve cost visibility', 'Compare shipping modes', 'Plan dispatch expenses'],
    industries: ['E-commerce', 'Small Businesses', 'Retail', 'D2C Brands'],
    advantageTitle: <>Clearer Rates.<br />Smarter <span>Decisions.</span></>,
    advantageDescription: 'Understand estimated shipping costs before confirming your shipment.',
    ctaTitle: 'Want better visibility into shipping costs?',
    ctaDescription: 'Calculate estimated charges with ShipNext.'
  },

  'courier-allocation': {
    category: 'SHIPPING MANAGEMENT',
    title: 'Multi-Courier Allocation',
    subtitle: 'One Platform. Smarter Allocation.',
    description: 'Manage internal allocation across available shipping services through one centralized ShipNext experience.',
    icon: Layers,
    features: [
      'Centralized allocation workflow',
      'Multiple shipping service support',
      'PIN code serviceability checks',
      'Shipping mode-based allocation',
      'Shipment allocation visibility',
      'Organized dispatch management'
    ],
    workflow: [
      ['01', 'Create Shipment', 'Enter the shipment and destination details.'],
      ['02', 'Check Availability', 'Review available shipping services.'],
      ['03', 'Allocate Shipment', 'Use the available allocation workflow.'],
      ['04', 'Monitor Dispatch', 'Manage shipment progress centrally.']
    ],
    benefits: ['Centralize allocation activities', 'Improve dispatch coordination', 'Simplify shipping operations'],
    industries: ['E-commerce', 'Enterprise', 'Retail', '3PL Operations'],
    advantageTitle: <>Multiple Services.<br />One <span>Control Centre.</span></>,
    advantageDescription: 'Bring shipping allocation and dispatch coordination together through ShipNext.',
    ctaTitle: 'Ready to simplify courier allocation?',
    ctaDescription: 'Manage your shipping operations through one platform.'
  },

  'shipment-management': {
    category: 'SHIPPING MANAGEMENT',
    title: 'Shipment Management',
    subtitle: 'Every Shipment. One Place.',
    description: 'Manage shipment bookings, draft shipments and delivery information through a centralized platform.',
    icon: Package,
    features: [
      'Centralized shipment records',
      'Shipment booking management',
      'Draft shipment visibility',
      'Docket and tracking information',
      'Shipment status monitoring',
      'Organized shipment history'
    ],
    workflow: [
      ['01', 'Create Shipment', 'Enter sender, receiver and parcel details.'],
      ['02', 'Review Booking', 'Check shipment information before confirmation.'],
      ['03', 'Manage Shipment', 'Access shipment records and booking details.'],
      ['04', 'Track Progress', 'Follow available shipment status updates.']
    ],
    benefits: ['Keep shipment records organized', 'Improve booking visibility', 'Simplify daily operations'],
    industries: ['E-commerce', 'Retail', 'D2C Brands', 'Distributors'],
    advantageTitle: <>All Shipments.<br />Better <span>Control.</span></>,
    advantageDescription: 'Manage shipment bookings and records through a centralized shipping workspace.',
    ctaTitle: 'Ready to organize your shipments?',
    ctaDescription: 'Bring your shipment management activities together with ShipNext.'
  },

  'wallet-billing': {
    category: 'BUSINESS OPERATIONS',
    title: 'Wallet & Billing',
    subtitle: 'Keep Your Shipping Finances Organized.',
    description: 'View wallet balances, recharge activity and transaction records through your ShipNext account.',
    icon: Wallet,
    features: [
      'Wallet balance visibility',
      'Wallet recharge requests',
      'Transaction history',
      'Credit and debit records',
      'Recharge status visibility',
      'Centralized billing information'
    ],
    workflow: [
      ['01', 'Access Wallet', 'Open your ShipNext wallet dashboard.'],
      ['02', 'Review Balance', 'Check your available wallet balance.'],
      ['03', 'Manage Recharge', 'Submit a recharge request using supported methods.'],
      ['04', 'View Transactions', 'Review available wallet transaction records.']
    ],
    benefits: ['Improve balance visibility', 'Keep transaction records organized', 'Simplify wallet monitoring'],
    industries: ['E-commerce', 'Small Businesses', 'Retail', 'Growing Brands'],
    advantageTitle: <>Clear Transactions.<br />Better <span>Financial Visibility.</span></>,
    advantageDescription: 'Keep wallet activity and recharge information accessible in one place.',
    ctaTitle: 'Ready to manage your shipping wallet?',
    ctaDescription: 'Access wallet and billing information through ShipNext.'
  },

  'admin-dashboard': {
    category: 'BUSINESS OPERATIONS',
    title: 'Admin Dashboard',
    subtitle: 'Your Operations at a Glance.',
    description: 'Get a centralized view of customer activity, shipments, bookings, wallet operations and support requests.',
    icon: LayoutDashboard,
    features: [
      'Centralized operations overview',
      'Customer management',
      'Shipment and booking visibility',
      'Wallet activity monitoring',
      'Enquiry management',
      'Support ticket oversight'
    ],
    workflow: [
      ['01', 'Access Dashboard', 'Sign in with authorized administrator access.'],
      ['02', 'Review Activity', 'View available operational information.'],
      ['03', 'Manage Records', 'Access customer, shipment and booking records.'],
      ['04', 'Monitor Operations', 'Review wallet, enquiry and support activity.']
    ],
    benefits: ['Centralize administration', 'Improve operational visibility', 'Organize daily management tasks'],
    industries: ['E-commerce', 'Logistics Teams', 'Enterprise', 'Growing Businesses'],
    advantageTitle: <>One Dashboard.<br />Complete <span>Overview.</span></>,
    advantageDescription: 'Bring important shipping administration activities into one centralized workspace.',
    ctaTitle: 'Want a clearer view of your operations?',
    ctaDescription: 'Manage your shipping business through the ShipNext admin dashboard.'
  },

  'customer-support': {
    category: 'BUSINESS OPERATIONS',
    title: 'Customer Support',
    subtitle: 'Every Query Deserves Attention.',
    description: 'Organize customer support requests and monitor ticket information through a centralized support workflow.',
    icon: Headset,
    features: [
      'Customer support ticket creation',
      'Issue category organization',
      'Shipment-related query visibility',
      'Ticket status monitoring',
      'Centralized support records',
      'Admin-side ticket management'
    ],
    workflow: [
      ['01', 'Raise a Query', 'Create a support request with issue details.'],
      ['02', 'Categorize Issue', 'Organize the request by its issue category.'],
      ['03', 'Review Ticket', 'Access the request through support management.'],
      ['04', 'Monitor Resolution', 'Follow available ticket status updates.']
    ],
    benefits: ['Organize customer queries', 'Improve issue visibility', 'Centralize support requests'],
    industries: ['E-commerce', 'Retail', 'D2C Brands', 'Service Businesses'],
    advantageTitle: <>Better Support.<br />Stronger <span>Relationships.</span></>,
    advantageDescription: 'Bring customer queries and support ticket information into one organized workflow.',
    ctaTitle: 'Ready to organize customer support?',
    ctaDescription: 'Manage support requests through ShipNext.'
  },

  'ai-engine': {
    category: 'BUSINESS OPERATIONS',
    title: 'AI Engine',
    subtitle: 'Build Smarter Shipping Operations.',
    description: 'Explore the potential of intelligent shipping workflows designed to support operational visibility and decision-making.',
    icon: Brain,
    features: [
      'Intelligent shipping workflow concepts',
      'Operational data visibility',
      'Delivery exception insights',
      'NDR management support',
      'Process improvement opportunities',
      'Smarter logistics decision-making'
    ],
    workflow: [
      ['01', 'Review Information', 'Access available shipment and operational information.'],
      ['02', 'Identify Exceptions', 'Review available delivery exception details.'],
      ['03', 'Explore Insights', 'Use supported information to guide decisions.'],
      ['04', 'Improve Operations', 'Apply insights to your shipping workflow.']
    ],
    benefits: ['Explore smarter workflows', 'Improve operational awareness', 'Support informed decisions'],
    industries: ['E-commerce', 'Enterprise', 'D2C Brands', 'Logistics Teams'],
    advantageTitle: <>Smarter Insights.<br />Better <span>Operations.</span></>,
    advantageDescription: 'Explore intelligent approaches to shipping visibility, delivery exceptions and operational decision-making.',
    ctaTitle: 'Ready to explore smarter logistics?',
    ctaDescription: 'Discover the ShipNext approach to intelligent shipping operations.'
  }
};

function PlatformPage() {
  const { slug } = useParams();
  const platform = platforms[slug];

  if (!platform) {
    return (
      <div className="platform-not-found">
        <Navbar />
        <h1>Platform not found</h1>
        <Link to="/">Return Home</Link>
      </div>
    );
  }

  const PlatformIcon = platform.icon;

  return (
    <div className="platform-page">
      <Navbar />

      <section className="platform-hero">
        <div className="platform-hero-content">
          <span className="platform-eyebrow">{platform.category}</span>
          <h1>{platform.title}</h1>
          <h2>{platform.subtitle}</h2>
          <p>{platform.description}</p>

          <div className="platform-hero-actions">
            <Link to="/register" className="platform-primary-btn">
              Get Started <ArrowRight size={18} />
            </Link>
            <Link to="/enquiry" className="platform-secondary-btn">
              Contact Sales
            </Link>
          </div>

          <div className="platform-trust">
            <span><CheckCircle2 size={16} /> Unified Platform</span>
            <span><ShieldCheck size={16} /> Centralized Control</span>
            <span><Clock size={16} /> Better Visibility</span>
          </div>
        </div>

        <div className="platform-hero-visual">
          <div className="platform-visual-glow"></div>
          <div className="platform-icon-card">
            <PlatformIcon size={76} strokeWidth={1.4} />
          </div>
          <div className="platform-floating-card platform-floating-one">
            <CheckCircle2 size={18} />
            <span>Centralized Management</span>
          </div>
          <div className="platform-floating-card platform-floating-two">
            <BarChart3 size={18} />
            <span>Operational Visibility</span>
          </div>
        </div>
      </section>


      <section className="platform-features">
        <div className="platform-section-heading">
          <span className="platform-section-label">KEY CAPABILITIES</span>
          <h2>Everything You Need to <span>Work Smarter.</span></h2>
        </div>
        <div className="platform-feature-grid">
          {platform.features.map((feature, index) => (
            <div className="platform-feature-card" key={index}>
              <CheckCircle2 size={21} />
              <h3>{feature}</h3>
            </div>
          ))}
        </div>
      </section>

      <section className="platform-process">
        <div className="platform-section-heading">
          <span className="platform-section-label">HOW IT WORKS</span>
          <h2>A Simpler Way to <span>Stay in Control.</span></h2>
        </div>
        <div className="platform-process-grid">
          {platform.workflow.map(([number, title, description]) => (
            <div className="platform-process-card" key={number}>
              <span>{number}</span>
              <h3>{title}</h3>
              <p>{description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="platform-benefits">
        <div className="platform-benefits-content">
          <span className="platform-section-label">WHY SHIPNEXT</span>
          <h2>{platform.advantageTitle}</h2>
          <p>{platform.advantageDescription}</p>
        </div>
        <div className="platform-benefit-list">
          {platform.benefits.map((benefit, index) => (
            <div key={index}>
              <CheckCircle2 size={20} />
              <span>{benefit}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="platform-industries">
        <div className="platform-section-heading">
          <span className="platform-section-label">BUILT FOR BUSINESS</span>
          <h2>Designed for Different <span>Business Needs.</span></h2>
        </div>
        <div className="platform-industry-list">
          {platform.industries.map((industry, index) => (
            <span key={index}>{industry}</span>
          ))}
        </div>
      </section>

      <section className="platform-final-cta">
        <span className="platform-section-label">MOVE FORWARD WITH SHIPNEXT</span>
        <h2>{platform.ctaTitle}</h2>
        <p>{platform.ctaDescription}</p>
        <Link to="/register" className="platform-primary-btn">
          Get Started <ArrowRight size={18} />
        </Link>
      </section>
    </div>
  );
}

export default PlatformPage;
