
import { Link, useParams } from 'react-router-dom';
import { ArrowRight, CheckCircle2, Package, Plane, Truck, MapPin, Bell, RotateCcw, ClipboardCheck, Layers, Clock, ShieldCheck, BarChart3 } from 'lucide-react';
import Navbar from '../components/Navbar';
import '../styles/ProductPage.css';

const products = {
  'domestic-shipping': {
    category: 'SHIPPING SERVICES',
    title: 'Deliver Across India. Without Limits.',
    subtitle: 'Simplify your domestic shipping with one intelligent platform.',
    description: 'ShipNext brings your domestic shipping operations together, helping businesses manage parcel deliveries, discover suitable shipping options and track shipments through one unified experience.',
    icon: Package,
    features: [
      ['Pan-India Delivery', 'Connect with delivery networks to reach customers across destinations in India.'],
      ['Smart Courier Allocation', 'Find suitable shipping options based on PIN code serviceability and shipment requirements.'],
      ['Real-Time Tracking', 'Monitor shipment progress and stay informed throughout the delivery journey.'],
      ['Simplified Management', 'Manage bookings, shipments and delivery information from one platform.']
    ],
    benefits: ['Simplified domestic shipping operations', 'Greater shipment visibility', 'Flexible shipping options', 'One unified shipping platform'],
    industries: ['E-commerce', 'Retail', 'D2C Brands', 'Small Businesses', 'Enterprises'],
    workflow: [
  ['01', 'Enter Details', 'Add pickup and delivery PIN codes along with parcel information.'],
  ['02', 'Find Services', 'Check available shipping services and suitable delivery options.'],
  ['03', 'Book Shipment', 'Confirm your booking and generate shipment details.'],
  ['04', 'Track Delivery', 'Monitor shipment progress until delivery.']
],
advantageTitle: <>Reach Every Corner.<br />Deliver with <span>Confidence.</span></>,
advantageDescription: 'Simplify nationwide parcel delivery with centralized bookings, PIN code serviceability and shipment visibility.',
ctaTitle: 'Ready to expand your delivery reach?',
ctaDescription: 'Start managing your domestic shipments with ShipNext.'
  },

  'cargo-shipping': {
    category: 'SHIPPING SERVICES',
    title: 'Move More. Manage Better.',
    subtitle: 'Scalable shipping solutions for growing business requirements.',
    description: 'Manage large consignments and bulk dispatch requirements with ShipNext. Simplify your logistics operations through a centralized shipping management experience.',
    icon: Layers,
    features: [
      ['Bulk Consignment Management', 'Organize large consignments and multiple dispatch requirements.'],
      ['Business-Focused Logistics', 'Explore shipping solutions designed around your operational needs.'],
      ['Flexible Shipping Options', 'Choose suitable shipping methods based on shipment size and destination.'],
      ['Centralized Visibility', 'Keep your shipping operations organized through one platform.']
    ],
    benefits: ['Simplified bulk shipment coordination', 'Better operational visibility', 'Business-focused logistics', 'Scalable shipping management'],
    industries: ['Manufacturing', 'Wholesale', 'Distribution', 'Retail Chains', 'Enterprises'],
    workflow: [
  ['01', 'Share Requirements', 'Provide your consignment size, weight and destination details.'],
  ['02', 'Explore Solutions', 'Identify suitable shipping arrangements for your cargo.'],
  ['03', 'Coordinate Dispatch', 'Organize your bulk shipment requirements.'],
  ['04', 'Monitor Movement', 'Keep track of shipment progress and delivery information.']
],
advantageTitle: <>Big Shipments.<br />Better <span>Coordination.</span></>,
advantageDescription: 'Bring large consignments and business shipping operations into a more organized workflow.',
ctaTitle: 'Planning your next bulk dispatch?',
ctaDescription: 'Connect with ShipNext to discuss your cargo shipping requirements.'
  },

  'express-air': {
    category: 'SHIPPING SERVICES',
    title: 'When Time Matters. Ship Express.',
    subtitle: 'Move time-sensitive shipments with express air shipping.',
    description: 'Accelerate your shipping operations with ShipNext Express Air. Explore suitable air shipping options for urgent consignments with simplified booking and shipment visibility.',
    icon: Plane,
    features: [
      ['Priority Air Movement', 'Access suitable air shipping options for time-sensitive shipments.'],
      ['Faster Transit Options', 'Explore available express services based on route and serviceability.'],
      ['Shipment Tracking', 'Monitor your shipment throughout its delivery journey.'],
      ['Simplified Booking', 'Create and manage express shipments through one platform.']
    ],
    benefits: ['Express shipping options', 'Streamlined booking experience', 'Greater shipment visibility', 'Suitable for urgent deliveries'],
    industries: ['E-commerce', 'Electronics', 'Fashion', 'Healthcare Supplies', 'Businesses'],
    workflow: [
  ['01', 'Create Shipment', 'Enter parcel details and destination PIN code.'],
  ['02', 'Check Availability', 'Explore available express air shipping options.'],
  ['03', 'Confirm Booking', 'Book the suitable service for your shipment.'],
  ['04', 'Track Progress', 'Monitor your shipment through its delivery journey.']
],
advantageTitle: <>Speed Matters.<br />Choose <span>Express.</span></>,
advantageDescription: 'Manage time-sensitive shipments with suitable air shipping options and centralized tracking.',
ctaTitle: 'Need to move a shipment faster?',
ctaDescription: 'Explore express air shipping options with ShipNext.'
  },

  'surface-shipping': {
    category: 'SHIPPING SERVICES',
    title: 'Smarter Routes. Economical Deliveries.',
    subtitle: 'Reliable road-based shipping for everyday business needs.',
    description: 'Optimize your shipping expenses with ShipNext Surface Shipping. Explore economical road-based delivery options for regular parcels and larger consignments.',
    icon: Truck,
    features: [
      ['Economical Shipping', 'Explore cost-conscious road transportation options.'],
      ['Flexible Delivery Options', 'Find suitable surface shipping services for your destinations.'],
      ['Shipment Visibility', 'Monitor delivery progress through the ShipNext platform.'],
      ['Easy Shipment Management', 'Manage your surface shipping bookings in one place.']
    ],
    benefits: ['Cost-conscious shipping options', 'Suitable for regular dispatches', 'Centralized shipment management', 'Better delivery visibility'],
    industries: ['Retail', 'Wholesale', 'E-commerce', 'Distribution', 'Manufacturing'],
    workflow: [
  ['01', 'Enter Shipment Details', 'Provide parcel weight, dimensions and destination.'],
  ['02', 'Check Serviceability', 'Explore available road-based shipping options.'],
  ['03', 'Book Dispatch', 'Confirm your shipment through ShipNext.'],
  ['04', 'Follow Delivery', 'Stay informed about shipment movement and delivery.']
],
advantageTitle: <>Optimize Costs.<br />Move <span>Smarter.</span></>,
advantageDescription: 'Choose economical road-based shipping options for regular dispatches and suitable larger consignments.',
ctaTitle: 'Looking for economical shipping?',
ctaDescription: 'Explore surface shipping options for your business.'
  },

  'tracking': {
    category: 'TRACKING & DELIVERY',
    title: 'Every Shipment. Every Update. One Place.',
    subtitle: 'Complete visibility throughout your shipment journey.',
    description: 'Stay informed with ShipNext shipment tracking. Access shipment progress and delivery information through a unified tracking experience.',
    icon: MapPin,
    features: [
      ['Shipment Status', 'View the latest available shipment status.'],
      ['Tracking Information', 'Access shipment tracking details from one place.'],
      ['Delivery Visibility', 'Stay informed about shipment movement and delivery progress.'],
      ['Centralized Tracking', 'Track your shipments through the ShipNext platform.']
    ],
    benefits: ['Centralized tracking experience', 'Easy access to shipment information', 'Improved delivery visibility', 'Simplified shipment monitoring'],
    industries: ['E-commerce', 'Retail', 'D2C Brands', 'Distributors', 'Enterprises'],
    workflow: [
  ['01', 'Enter Tracking ID', 'Provide your shipment tracking or docket number.'],
  ['02', 'Retrieve Shipment', 'Access the available shipment tracking information.'],
  ['03', 'Check Status', 'Review the latest available shipment progress.'],
  ['04', 'Stay Informed', 'Follow the delivery journey through ShipNext.']
],
advantageTitle: <>Know Where It Is.<br />Stay <span>In Control.</span></>,
advantageDescription: 'Access shipment information and monitor delivery progress through a centralized tracking experience.',
ctaTitle: 'Want complete shipment visibility?',
ctaDescription: 'Track your ShipNext shipments with ease.'
  },

  'notifications': {
    category: 'TRACKING & DELIVERY',
    title: 'Stay Informed. At Every Step.',
    subtitle: 'Keep customers updated throughout the delivery journey.',
    description: 'Improve the shipping experience with delivery notifications. Keep customers informed about important shipment and delivery updates.',
    icon: Bell,
    features: [
      ['Shipment Updates', 'Communicate important shipment progress information.'],
      ['Delivery Notifications', 'Keep customers informed about delivery-related updates.'],
      ['Better Communication', 'Reduce uncertainty with timely shipment information.'],
      ['Improved Experience', 'Build a more transparent delivery experience for customers.']
    ],
    benefits: ['Better customer communication', 'Greater shipment transparency', 'Reduced delivery uncertainty', 'Improved customer experience'],
    industries: ['E-commerce', 'Retail', 'D2C Brands', 'Online Marketplaces', 'Enterprises'],
    workflow: [
  ['01', 'Shipment Created', 'Begin the shipment journey with booking information.'],
  ['02', 'Track Progress', 'Monitor available shipment status updates.'],
  ['03', 'Receive Updates', 'Keep customers informed through supported notification channels.'],
  ['04', 'Confirm Delivery', 'Access delivery-related updates when available.']
],
advantageTitle: <>Every Update Counts.<br /><span>Keep Customers Informed.</span></>,
advantageDescription: 'Improve communication and create a more transparent delivery experience through timely shipment updates.',
ctaTitle: 'Make every delivery update count.',
ctaDescription: 'Create a better shipping communication experience with ShipNext.'
  },

  'returns-rto': {
    category: 'TRACKING & DELIVERY',
    title: 'Returns Made Simpler. Operations Made Smarter.',
    subtitle: 'Bring better visibility to your reverse logistics operations.',
    description: 'Manage return-to-origin shipments through ShipNext. Organize return-related shipment information and improve visibility across your reverse logistics workflow.',
    icon: RotateCcw,
    features: [
      ['RTO Visibility', 'Monitor return-to-origin shipment information.'],
      ['Return Management', 'Keep return-related shipment details organized.'],
      ['Shipment Monitoring', 'Access available updates on return shipment progress.'],
      ['Centralized Operations', 'Manage return-related information through one platform.']
    ],
    benefits: ['Organized return operations', 'Better RTO visibility', 'Centralized shipment information', 'Simplified reverse logistics'],
    industries: ['E-commerce', 'Fashion', 'Electronics', 'Retail', 'D2C Brands'],
    workflow: [
  ['01', 'Identify Return', 'Access return-to-origin shipment information.'],
  ['02', 'Review Status', 'Check the latest available return shipment updates.'],
  ['03', 'Monitor Movement', 'Follow the shipment through its return journey.'],
  ['04', 'Manage Records', 'Keep return-related shipment information organized.']
],
advantageTitle: <>Manage Returns.<br />Regain <span>Visibility.</span></>,
advantageDescription: 'Bring more structure to reverse logistics with organized return shipment information and better RTO visibility.',
ctaTitle: 'Make reverse logistics simpler.',
ctaDescription: 'Manage your return-to-origin shipments with ShipNext.'
  },

  'ndr-management': {
    category: 'TRACKING & DELIVERY',
    title: 'Turn Delivery Exceptions Into Opportunities.',
    subtitle: 'Manage non-delivery reports with better visibility and coordination.',
    description: 'Simplify non-delivery report management with ShipNext. Organize delivery exceptions, coordinate resolution actions and improve visibility into unsuccessful delivery attempts.',
    icon: ClipboardCheck,
    features: [
      ['NDR Visibility', 'Access information about reported unsuccessful delivery attempts.'],
      ['Exception Management', 'Organize non-delivery cases in one place.'],
      ['Resolution Coordination', 'Support follow-up actions to address delivery exceptions.'],
      ['Delivery Insights', 'Improve visibility into delivery challenges and outcomes.']
    ],
    benefits: ['Organized NDR management', 'Better exception visibility', 'Improved resolution coordination', 'More informed delivery operations'],
    industries: ['E-commerce', 'Retail', 'D2C Brands', 'Online Marketplaces', 'Enterprises'],
    workflow: [
  ['01', 'Identify NDR', 'Review reported unsuccessful delivery attempts.'],
  ['02', 'Understand Reasons', 'Examine available non-delivery reason information.'],
  ['03', 'Coordinate Action', 'Follow up with the relevant customer or delivery team.'],
  ['04', 'Monitor Resolution', 'Track the available outcome of the resolution process.']
],
advantageTitle: <>Resolve Exceptions.<br />Improve <span>Deliveries.</span></>,
advantageDescription: 'Organize non-delivery reports and improve coordination around delivery exceptions.',
ctaTitle: 'Turn delivery challenges into action.',
ctaDescription: 'Bring better visibility to NDR management with ShipNext.'
  }
};

function ProductPage() {
  const { slug } = useParams();
  const product = products[slug];

  if (!product) {
    return <div className="product-not-found">Product not found.</div>;
  }

  const Icon = product.icon;

  return (
    <div className="product-page">
      <Navbar />

      <section className="product-hero">
        <div className="product-hero-content">
          <span className="product-eyebrow">{product.category}</span>

          <h1>{product.title}</h1>

          <p className="product-hero-subtitle">{product.subtitle}</p>
          <p className="product-hero-description">{product.description}</p>

          <div className="product-hero-actions">
            <Link to="/register" className="product-primary-btn">
              Get Started <ArrowRight size={18} />
            </Link>
            <Link to="/enquiry" className="product-secondary-btn">
              Contact Sales
            </Link>
          </div>

          <div className="product-trust">
            <span><CheckCircle2 /> Unified Platform</span>
            <span><ShieldCheck /> Smart Shipping</span>
            <span><Clock /> Better Visibility</span>
          </div>
        </div>

        <div className="product-hero-visual">
          <div className="product-visual-glow"></div>
          <div className="product-icon-card">
            <Icon size={100} strokeWidth={1.1} />
            <span>SHIPNEXT</span>
            <small>SMARTER LOGISTICS</small>
          </div>
          <div className="product-floating-card product-floating-one">
            <Package size={20} />
            <div><strong>Shipment</strong><small>Management</small></div>
          </div>
          <div className="product-floating-card product-floating-two">
            <MapPin size={20} />
            <div><strong>One Platform</strong><small>Better Visibility</small></div>
          </div>
        </div>
      </section>

      <section className="product-intro">
        <span className="product-section-label">BUILT FOR BUSINESS</span>
        <h2>Shipping, Simplified.</h2>
        <p>{product.description}</p>
      </section>

      <section className="product-features">
        <div className="product-section-heading">
          <span className="product-section-label">OUR CAPABILITIES</span>
          <h2>Everything You Need.<br /><span>All in One Platform.</span></h2>
          <p>Powerful capabilities designed to make your shipping operations simpler and smarter.</p>
        </div>

        <div className="product-feature-grid">
          {product.features.map(([title, description], index) => (
            <div className="product-feature-card" key={title}>
              <span className="product-feature-number">0{index + 1}</span>
              <div className="product-feature-icon"><CheckCircle2 size={25} /></div>
              <h3>{title}</h3>
              <p>{description}</p>
              <ArrowRight className="product-feature-arrow" size={20} />
            </div>
          ))}
        </div>
      </section>

      <div className="product-process-grid">
  {product.workflow.map(([number, title, description]) => (
    <div className="product-process-card" key={number}>
      <span>{number}</span>
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  ))}
</div>

      <section className="product-benefits">
        <div>
          <span className="product-section-label">THE SHIPNEXT ADVANTAGE</span>
         <h2>{product.advantageTitle}</h2>
<p>{product.advantageDescription}</p>
        </div>

        <div className="product-benefit-list">
          {product.benefits.map((benefit) => (
            <div key={benefit}>
              <CheckCircle2 size={22} />
              <span>{benefit}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="product-industries">
        <span className="product-section-label">WHO WE SERVE</span>
        <h2>Built for Businesses That Move.</h2>
        <p>Flexible shipping solutions for businesses across industries.</p>
        <div className="product-industry-list">
          {product.industries.map((industry) => (
            <span key={industry}>{industry}</span>
          ))}
        </div>
      </section>

      <section className="product-final-cta">
        <span>MOVE FORWARD WITH SHIPNEXT</span>
       <h2>{product.ctaTitle}</h2>
<p>{product.ctaDescription}</p>
        <Link to="/register" className="product-primary-btn">
          Get Started <ArrowRight size={18} />
        </Link>
      </section>
    </div>
  );
}

export default ProductPage;
