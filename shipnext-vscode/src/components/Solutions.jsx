import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const solutionStyles = `/* ShipNext Solutions, Pricing Matrix and White-Label sections */
.shipnext-solutions {
  color: #0a2540;
  font-family: inherit;
}
.sn-section {
  padding: 88px 20px;
  border-top: 1px solid #e2e8f0;
  background: #f8fafc;
}
.sn-container {
  width: min(1180px, 100%);
  margin: 0 auto;
}
.sn-section-heading {
  max-width: 820px;
  margin: 0 auto 48px;
  text-align: center;
}
.sn-eyebrow {
  display: block;
  margin-bottom: 12px;
  color: #ff3b1f;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: .16em;
  text-transform: uppercase;
}
.sn-section-heading h2 {
  margin: 0 0 14px;
  color: #0a2540;
  font-size: clamp(30px, 4vw, 48px);
  line-height: 1.12;
  font-weight: 850;
}
.sn-section-heading p {
  margin: 0 auto;
  max-width: 720px;
  color: #64748b;
  font-size: 15px;
  line-height: 1.8;
}
.sn-solutions { background: #fff; }
.sn-solution-tabs, .sn-message-tabs {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 9px;
  margin-bottom: 24px;
}
.sn-solution-tabs button, .sn-message-tabs button {
  border: 1px solid #dbe2ea;
  border-radius: 999px;
  padding: 10px 16px;
  color: #475569;
  background: #fff;
  font-size: 12px;
  font-weight: 750;
  cursor: pointer;
}
.sn-solution-tabs button.active, .sn-message-tabs button.active {
  color: #fff;
  border-color: #ff3b1f;
  background: #ff3b1f;
}
.sn-solution-card, .sn-panel {
  border: 1px solid #e2e8f0;
  border-radius: 20px;
  padding: 28px;
  background: #fff;
  box-shadow: 0 10px 28px rgba(15, 23, 42, .06);
}
.sn-solution-card {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px 36px;
}
.sn-solution-card h3, .sn-panel h3 {
  margin: 0 0 12px;
  color: #0a2540;
  font-size: 22px;
}
.sn-solution-card p { color: #64748b; line-height: 1.7; }
.sn-solution-rate { display: inline-block; margin-top: 8px; color: #ff3b1f; }
.sn-solution-card ul { margin: 0; padding: 0; list-style: none; }
.sn-solution-card li { padding: 8px 0; color: #475569; font-size: 14px; }
.sn-primary-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 0;
  border-radius: 999px;
  padding: 14px 22px;
  color: #fff;
  background: #ff3b1f;
  font-size: 13px;
  font-weight: 800;
  cursor: pointer;
  transition: transform .2s, background .2s;
}
.sn-primary-button:hover { background: #e0341a; transform: translateY(-2px); }
.sn-solution-card .sn-primary-button { grid-column: 1 / -1; justify-self: start; }
.sn-pricing { background: #f8fafc; }
.sn-pricing-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.4fr) minmax(320px, .9fr);
  gap: 26px;
  align-items: start;
}
.sn-panel-title, .sn-comparison-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  padding-bottom: 18px;
  margin-bottom: 20px;
  border-bottom: 1px solid #edf1f5;
}
.sn-panel-title h3, .sn-comparison-heading h3 { margin: 0; font-size: 21px; }
.sn-panel-title > span:not(.sn-zone) { color: #64748b; font-size: 10px; font-weight: 800; text-transform: uppercase; }
.sn-form-grid, .sn-dimensions { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; }
.sn-dimensions { grid-template-columns: repeat(3, minmax(0, 1fr)); margin-top: 12px; }
.sn-field { display: block; margin-bottom: 20px; color: #475569; font-size: 12px; font-weight: 750; }
.sn-field > span { display: block; margin-bottom: 9px; text-transform: uppercase; letter-spacing: .06em; }
.sn-field small { display: block; margin-bottom: 6px; color: #64748b; }
.sn-field input {
  width: 100%;
  box-sizing: border-box;
  border: 1px solid #dbe2ea;
  border-radius: 9px;
  padding: 11px 12px;
  color: #0f172a;
  background: #f8fafc;
  font-size: 13px;
  font-weight: 650;
  outline: none;
}
.sn-field input:focus { border-color: #ff3b1f; background: #fff; }
.sn-mode-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 8px; }
.sn-mode-grid button, .sn-weight-presets button {
  border: 1px solid #dbe2ea;
  border-radius: 8px;
  padding: 10px 7px;
  color: #475569;
  background: #f8fafc;
  font-size: 11px;
  font-weight: 750;
  cursor: pointer;
}
.sn-mode-grid button.active { color: #fff; border-color: #ff3b1f; background: #ff3b1f; }
.sn-weight-label { display: flex; justify-content: space-between; align-items: center; gap: 10px; margin-bottom: 12px; color: #475569; font-size: 12px; }
.sn-weight-label strong { color: #0a2540; }
.sn-weight-presets { display: flex; gap: 5px; }
.sn-weight-presets button { padding: 6px 9px; }
.sn-range { width: 100%; accent-color: #ff3b1f; }
.sn-range-labels { display: flex; justify-content: space-between; color: #94a3b8; font-size: 10px; }
.sn-weight-summary { display: flex; justify-content: space-between; gap: 12px; padding: 12px; border: 1px solid #e2e8f0; border-radius: 9px; background: #f8fafc; color: #64748b; font-size: 11px; }
.sn-weight-summary strong { color: #0a2540; }
.sn-weight-summary span:last-child strong { color: #ff3b1f; }
.sn-quote { border: 2px solid #e2e8f0; }
.sn-zone { flex-shrink: 0; border: 1px solid #bbf7d0; border-radius: 999px; padding: 7px 10px; color: #15803d; background: #f0fdf4; font-size: 10px; font-weight: 800; }
.sn-breakdown { display: grid; gap: 15px; padding: 8px 0 20px; color: #64748b; font-size: 12px; }
.sn-breakdown div { display: flex; justify-content: space-between; gap: 12px; }
.sn-breakdown strong { color: #0f172a; }
.sn-breakdown .muted { color: #94a3b8; }
.sn-total { display: flex; align-items: center; justify-content: space-between; gap: 10px; padding-top: 20px; border-top: 1px solid #e2e8f0; }
.sn-total strong, .sn-total small { display: block; }
.sn-total strong { color: #334155; font-size: 13px; }
.sn-total small { margin-top: 5px; color: #94a3b8; font-size: 10px; }
.sn-total b { color: #ff3b1f; font-size: 32px; }
.sn-transit-note { margin-top: 20px; padding: 14px; border: 1px solid #e2e8f0; border-radius: 11px; background: #f8fafc; }
.sn-transit-note strong { color: #0a2540; font-size: 11px; }
.sn-transit-note p, .sn-disclaimer { color: #94a3b8; font-size: 10px; line-height: 1.6; }
.sn-quote .sn-primary-button { width: 100%; margin-top: 18px; }
.sn-warning { padding: 10px; border-radius: 8px; color: #92400e; background: #fffbeb; font-size: 10px; line-height: 1.5; }
.sn-comparison { margin-top: 28px; }
.sn-comparison-heading { align-items: flex-end; }
.sn-comparison-heading h3 { margin-top: 4px; }
.sn-table-wrap { overflow-x: auto; }
.sn-rate-table { width: 100%; min-width: 850px; border-collapse: collapse; text-align: left; font-size: 11px; }
.sn-rate-table th { padding: 13px 12px; color: #64748b; background: #f8fafc; font-size: 10px; letter-spacing: .04em; }
.sn-rate-table td { padding: 16px 12px; border-bottom: 1px solid #edf1f5; color: #475569; }
.sn-rate-table td strong { color: #0a2540; }
.sn-rate-table td small { display: block; margin-top: 5px; color: #ff3b1f; font-size: 10px; }
.sn-rate-table td button { border: 0; border-radius: 999px; padding: 8px 12px; color: #fff; background: #ff3b1f; font-size: 10px; font-weight: 800; cursor: pointer; }
.sn-rate-table td button.secondary { color: #334155; background: #e2e8f0; }
.sn-rate-table td button.outline { color: #ff3b1f; border: 1px solid #fecaca; background: #fff1f2; }
.sn-rate-table .green { color: #16a34a; }
.sn-disclaimer { margin: 12px 0 0; }
.sn-white-label { background: #fff; }
.sn-white-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; align-items: center; }
.sn-white-left { display: grid; gap: 16px; }
.sn-leak-panel { padding: 26px; background: #f8fafc; }
.sn-leak-panel h3 { font-size: 19px; }
.sn-customer-view, .sn-masked-view { margin-top: 12px; padding: 16px; border: 1px solid #bbf7d0; border-radius: 12px; background: #ecfdf5; }
.sn-customer-view strong, .sn-masked-view strong { display: block; margin-bottom: 6px; color: #064e3b; font-size: 12px; }
.sn-customer-view p, .sn-masked-view p { margin: 0; color: #047857; font-size: 11px; line-height: 1.7; }
.sn-customer-view code { color: #ff3b1f; font-weight: 800; }
.sn-masked-view { border-color: #e2e8f0; background: #fff; }
.sn-masked-view strong { color: #0a2540; }
.sn-masked-view p { color: #64748b; }
.sn-feature-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 18px; padding-top: 16px; border-top: 1px solid #e2e8f0; color: #475569; font-size: 11px; font-weight: 750; }
.sn-simulator-launch { display: flex; justify-content: space-between; align-items: center; gap: 14px; padding: 18px; border: 1px solid #e2e8f0; border-radius: 15px; background: #f8fafc; }
.sn-simulator-launch strong, .sn-simulator-launch small { display: block; }
.sn-simulator-launch strong { font-size: 13px; }
.sn-simulator-launch small { margin-top: 5px; color: #64748b; font-size: 10px; }
.sn-simulator-status { color: #15803d; font-size: 10px; font-weight: 800; }
.sn-phone-area { display: flex; flex-direction: column; align-items: center; }
.sn-message-tabs { margin-bottom: 16px; }
.sn-message-tabs button { padding: 8px 12px; font-size: 10px; }
.sn-phone { width: min(340px, 100%); overflow: hidden; border: 7px solid #cbd5e1; border-radius: 34px; background: #0b141a; box-shadow: 0 22px 50px rgba(15, 23, 42, .2); }
.sn-phone-notch { width: 100px; height: 13px; margin: 0 auto 3px; border-radius: 0 0 12px 12px; background: #1f2937; }
.sn-phone-header { display: flex; align-items: center; gap: 10px; padding: 14px; color: #fff; background: #1f2c34; }
.sn-avatar { display: grid; place-items: center; width: 34px; height: 34px; border-radius: 50%; color: #fff; background: #ff3b1f; font-size: 11px; font-weight: 900; }
.sn-phone-header strong, .sn-phone-header small { display: block; }
.sn-phone-header strong { font-size: 11px; }
.sn-phone-header small { margin-top: 4px; color: #86efac; font-size: 9px; }
.sn-chat-area { display: flex; min-height: 330px; flex-direction: column; justify-content: flex-end; gap: 20px; padding: 16px; background: #0b141a; }
.sn-chat-bubble { max-width: 94%; padding: 13px; border-radius: 4px 14px 14px 14px; color: #e9edef; background: #005c4b; white-space: pre-line; }
.sn-chat-bubble p { margin: 0; font-size: 11px; line-height: 1.65; }
.sn-chat-bubble small { display: block; margin-top: 8px; color: #a7f3d0; text-align: right; font-size: 9px; }
.sn-encrypted { color: #94a3b8; text-align: center; font-size: 9px; }
.sn-phone-input { padding: 12px; color: #94a3b8; background: #1f2c34; font-size: 10px; }
.sn-white-disclaimer { max-width: 900px; margin: 24px auto 0; text-align: center; }
@media (max-width: 900px) {
  .sn-pricing-grid, .sn-white-grid { grid-template-columns: 1fr; }
}
@media (max-width: 600px) {
  .sn-section { padding: 60px 15px; }
  .sn-panel, .sn-solution-card { padding: 19px; }
  .sn-solution-card { grid-template-columns: 1fr; }
  .sn-form-grid { grid-template-columns: 1fr; }
  .sn-mode-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .sn-weight-label { align-items: flex-start; flex-direction: column; }
  .sn-comparison-heading { align-items: flex-start; flex-direction: column; }
  .sn-feature-grid { grid-template-columns: 1fr; }
  .sn-simulator-launch { align-items: flex-start; flex-direction: column; }
}
`;

const solutionTabs = [
  {
    id: 'domestic',
    label: 'Domestic Shipping',
    title: 'Domestic Shipping',
    rate: 'Reference starting rate: ₹29 / 500g',
    description: 'Ship parcels across India with air and surface express corridors, automated courier allocation and a unified ShipNext experience.',
    features: ['29,400+ PIN code reach (reference figure)', 'Air and surface service options', 'Doorstep pickup scheduling', 'COD and prepaid shipment workflows', 'Shipment milestone notifications'],
  },
  {
    id: 'cargo',
    label: 'B2B Cargo',
    title: 'B2B Cargo & Bulk Freight Solutions',
    rate: 'Reference starting rate: ₹6.50 / kg',
    description: 'Freight options for wholesale merchants, manufacturers and heavy retail shipments, including PTL and FTL workflows.',
    features: ['Weight-slab pricing for heavier consignments', 'Palletised cargo handling', 'Commercial GST invoice workflow', 'Appointment delivery options', 'Transit insurance options subject to provider terms'],
  },
  {
    id: 'hyperlocal',
    label: 'Hyperlocal',
    title: 'Hyperlocal 2-Hour Intra-City Delivery',
    rate: 'Reference starting rate: ₹39 / delivery',
    description: 'A local delivery workflow for urgent retail orders, essentials and documents within supported service areas.',
    features: ['Rider assignment workflow', 'GPS tracking when provider integration is enabled', 'OTP handover verification', 'Local delivery status updates', 'City availability must be confirmed before launch'],
  },
  {
    id: 'international',
    label: 'International',
    title: 'ShipNext International',
    rate: 'Reference starting rate: ₹290 / parcel',
    description: 'Cross-border shipping workflows for merchants exporting to international destinations.',
    features: ['Export documentation workflow', 'Air cargo partner integration', 'DDP and DDU options where supported', 'Currency and wallet billing support', 'Customs clearance subject to carrier and destination rules'],
  },
  {
    id: 'fulfillment',
    label: 'Warehousing',
    title: 'Distributed Warehousing & Fulfilment',
    rate: 'Flexible storage pricing',
    description: 'Inventory storage and fulfilment workflows designed to connect warehouse operations with parcel dispatch.',
    features: ['Inventory receiving and storage', 'Pick, pack and label workflows', 'Inventory visibility', 'Regional stock allocation', 'Warehouse locations and SLAs subject to actual operations'],
  },
];

const pinDirectory = {
  '110001': { state: 'Delhi', zone: 'North', days: 1 },
  '110020': { state: 'Delhi', zone: 'North', days: 1 },
  '122001': { state: 'Haryana', zone: 'North', days: 1 },
  '201301': { state: 'Uttar Pradesh', zone: 'North', days: 1 },
  '400001': { state: 'Maharashtra', zone: 'West', days: 2 },
  '400051': { state: 'Maharashtra', zone: 'West', days: 2 },
  '411001': { state: 'Maharashtra', zone: 'West', days: 2 },
  '380001': { state: 'Gujarat', zone: 'West', days: 2 },
  '395001': { state: 'Gujarat', zone: 'West', days: 2 },
  '560001': { state: 'Karnataka', zone: 'South', days: 2 },
  '560100': { state: 'Karnataka', zone: 'South', days: 2 },
  '500001': { state: 'Telangana', zone: 'South', days: 2 },
  '500081': { state: 'Telangana', zone: 'South', days: 2 },
  '700001': { state: 'West Bengal', zone: 'East', days: 2 },
  '600001': { state: 'Tamil Nadu', zone: 'South', days: 2 },
};

function calculateEstimate(origin, destination, deadWeight, mode, length, width, height) {
  const actualWeight = Math.max(500, Number(deadWeight) || 500);
  const volumetricWeight = Math.round((Number(length) * Number(width) * Number(height) / 5000) * 1000) || 0;
  const billableWeight = Math.max(actualWeight, volumetricWeight);
  const from = pinDirectory[origin];
  const to = pinDirectory[destination];

  let zoneCategory = 'National Metro-to-Metro';
  let basePerSlab = 55;
  if (origin === destination) {
    zoneCategory = 'Same City / Intra-City';
    basePerSlab = 35;
  } else if (from && to && from.state === to.state) {
    zoneCategory = 'Intra-State Regional';
    basePerSlab = 40;
  } else if (from && to && from.zone === to.zone) {
    zoneCategory = 'Regional Zone';
    basePerSlab = 45;
  }

  const multiplier = {
    'Standard Surface': 1,
    'Express Air': 1.45,
    'Heavy Cargo': 0.85,
    'Fragile Express': 1.65,
  }[mode] || 1;

  const weightSlabs = Math.ceil(billableWeight / 500);
  const baseFreight = Math.round(weightSlabs * basePerSlab * multiplier);
  const fuelSurcharge = Math.round(baseFreight * 0.12);
  const docketFee = 15;
  const subtotal = baseFreight + fuelSurcharge + docketFee;
  const gstAmount = Number((subtotal * 0.18).toFixed(2));
  const totalCost = Number((subtotal + gstAmount).toFixed(2));
  const estimatedDays = Math.max(1, (from?.days || 2) + (to?.days || 2) - 1);

  return {
    volumetricWeight,
    billableWeight,
    weightSlabs,
    zoneCategory,
    baseFreight,
    fuelSurcharge,
    docketFee,
    subtotal,
    gstAmount,
    totalCost,
    estimatedDays,
    isKnownRoute: Boolean(from && to),
  };
}

const whatsappMessages = {
  booking: {
    label: 'Booking Confirmed',
    time: '10:30 AM',
    body: '📦 ShipNext Booking Confirmed\n\nHi Arjun, your shipment booking has been confirmed.\n\n• AWB: SN-4192044-IN\n• Service: Express Air\n• Pickup: Scheduled\n\nTrack your shipment using your ShipNext tracking link.',
  },
  pickup: {
    label: 'Pickup',
    time: '11:45 AM',
    body: '🚚 ShipNext Pickup Update\n\nYour parcel has been picked up successfully.\n\n• Verified weight: 850 grams\n• Next step: Transit sort facility\n\nThank you for shipping with ShipNext.',
  },
  transit: {
    label: 'In Transit',
    time: '06:15 AM',
    body: '✈️ ShipNext Transit Update\n\nYour parcel has reached the next transit hub.\n\n• Shipment status: In Transit\n• Delivery estimate: Subject to live carrier scan\n\nTrack the latest status on ShipNext.',
  },
  delivery: {
    label: 'Delivered',
    time: '01:15 PM',
    body: '✅ ShipNext Delivered Successfully\n\nYour parcel has been marked delivered.\n\n• Proof of delivery: Available when supplied by the carrier\n• Thank you for choosing ShipNext!\n\nShip Smarter. Move Faster.',
  },
};

function SectionHeading({ eyebrow, title, description }) {
  return (
    <div className="sn-section-heading">
      <span className="sn-eyebrow">{eyebrow}</span>
      <h2>{title}</h2>
      <p>{description}</p>
    </div>
  );
}

function PricingMatrix({ onBook }) {
  const [origin, setOrigin] = useState('110020');
  const [destination, setDestination] = useState('400051');
  const [weight, setWeight] = useState(850);
  const [mode, setMode] = useState('Express Air');
  const [length, setLength] = useState(20);
  const [width, setWidth] = useState(15);
  const [height, setHeight] = useState(10);

  const quote = useMemo(
    () => calculateEstimate(origin, destination, weight, mode, length, width, height),
    [origin, destination, weight, mode, length, width, height]
  );

  const money = (amount) => `₹${Number(amount).toFixed(2)}`;

  return (
    <section className="sn-section sn-pricing" id="rates">
      <div className="sn-container">
        <SectionHeading
          eyebrow="Transparent Pricing Matrix"
          title="Calculate Accurate Shipping Rates Instantly"
          description="Estimate shipping using dead weight, volumetric measurements and regional logistics zones."
        />

        <div className="sn-pricing-grid">
          <div className="sn-panel sn-parameters">
            <div className="sn-panel-title">
              <h3>Shipment Parameters</h3>
              <span>Minimum weight: 500g</span>
            </div>

            <div className="sn-form-grid">
              <label className="sn-field">
                <span>Origin / Pickup PIN</span>
                <input value={origin} maxLength={6} inputMode="numeric" onChange={(e) => setOrigin(e.target.value.replace(/\D/g, ''))} placeholder="e.g. 110020" />
              </label>
              <label className="sn-field">
                <span>Destination / Delivery PIN</span>
                <input value={destination} maxLength={6} inputMode="numeric" onChange={(e) => setDestination(e.target.value.replace(/\D/g, ''))} placeholder="e.g. 400051" />
              </label>
            </div>

            <div className="sn-field">
              <span>Speed & Carrier Mode</span>
              <div className="sn-mode-grid">
                {['Standard Surface', 'Express Air', 'Heavy Cargo', 'Fragile Express'].map((item) => (
                  <button type="button" key={item} className={mode === item ? 'active' : ''} onClick={() => setMode(item)}>{item}</button>
                ))}
              </div>
            </div>

            <div className="sn-field">
              <div className="sn-weight-label">
                <span>Dead Weight: <strong>{weight.toLocaleString('en-IN')} grams</strong> ({(weight / 1000).toFixed(2)} kg)</span>
                <div className="sn-weight-presets">
                  {[500, 1000, 2000, 5000].map((value) => (
                    <button type="button" key={value} onClick={() => setWeight(value)}>{value >= 1000 ? `${value / 1000}kg` : `${value}g`}</button>
                  ))}
                </div>
              </div>
              <input className="sn-range" type="range" min="500" max="20000" step="50" value={weight} onChange={(e) => setWeight(Number(e.target.value))} />
              <div className="sn-range-labels"><span>500g (Min)</span><span>5,000g (5kg)</span><span>20,000g (20kg)</span></div>
            </div>

            <div className="sn-field">
              <span>Parcel Dimensions (cm) – Volumetric Factor</span>
              <div className="sn-dimensions">
                {[['Length', length, setLength], ['Width', width, setWidth], ['Height', height, setHeight]].map(([label, value, setter]) => (
                  <label className="sn-field" key={label}>
                    <small>{label} (cm)</small>
                    <input type="number" min="1" max="200" value={value} onChange={(e) => setter(Math.max(1, Number(e.target.value)))} />
                  </label>
                ))}
              </div>
              <div className="sn-weight-summary">
                <span>Volumetric: <strong>{quote.volumetricWeight}g</strong></span>
                <span>Billable: <strong>{quote.billableWeight}g</strong></span>
              </div>
            </div>
          </div>

          <div className="sn-panel sn-quote">
            <div className="sn-panel-title">
              <div><span className="sn-eyebrow">Estimated Quote</span><h3>Rate Breakdown</h3></div>
              <span className="sn-zone">Zone: {quote.zoneCategory}</span>
            </div>
            <div className="sn-breakdown">
              <div><span>Base Freight ({quote.weightSlabs} × 500g slabs)</span><strong>{money(quote.baseFreight)}</strong></div>
              <div><span>Fuel Surcharge (12%)</span><strong>{money(quote.fuelSurcharge)}</strong></div>
              <div><span>Docket & White-Label Manifest Fee</span><strong>{money(quote.docketFee)}</strong></div>
              <div className="muted"><span>Subtotal</span><strong>{money(quote.subtotal)}</strong></div>
              <div className="muted"><span>GST (18%)</span><strong>{money(quote.gstAmount)}</strong></div>
            </div>
            <div className="sn-total">
              <div><strong>Total Shipping Rate</strong><small>Prepaid from ShipNext Wallet</small></div>
              <b>{money(quote.totalCost)}</b>
            </div>
            <div className="sn-transit-note">
              <strong>✓ Estimated Doorstep Transit: ~{quote.estimatedDays} business days</strong>
              <p>Transit estimate is indicative. Actual delivery depends on serviceability and carrier scans.</p>
            </div>
            {!quote.isKnownRoute && <p className="sn-warning">One or both PIN codes are not in this demo lookup. This estimate uses the default national zone. Confirm the live tariff and serviceability with the backend before booking.</p>}
            <button className="sn-primary-button" type="button" onClick={onBook}>Book Parcel with this Rate</button>
          </div>
        </div>

        <div className="sn-panel sn-comparison">
          <div className="sn-comparison-heading">
            <div><span className="sn-eyebrow">Multi-Carrier Rate Comparison</span><h3>Compare Available ShipNext Service Tiers</h3></div>
            <span className="sn-zone">Route: {origin || '—'} → {destination || '—'} ({quote.billableWeight}g)</span>
          </div>
          <div className="sn-table-wrap">
            <table className="sn-rate-table">
              <thead><tr><th>Carrier Service Tier</th><th>Transit SLA</th><th>Tracking & Features</th><th>COD Handling</th><th>Estimated Total</th><th>Action</th></tr></thead>
              <tbody>
                <tr><td><strong>ShipNext Air Express</strong><small>Priority Air Cargo Flight</small></td><td>1–2 Business Days</td><td>GPS · Doorstep Pickup · WhatsApp Alerts</td><td>₹25 or 1.5%*</td><td><strong>{money(quote.totalCost)}</strong></td><td><button type="button" onClick={() => { setMode('Express Air'); onBook(); }}>Ship Air</button></td></tr>
                <tr><td><strong>ShipNext Surface Economy</strong><small>National Freight Express Corridor</small></td><td>2–4 Business Days</td><td>Lowest Tariff · Free Pickup · Digital POD</td><td>₹25 or 1.5%*</td><td><strong className="green">{money(quote.totalCost * 0.75)}</strong></td><td><button type="button" className="secondary" onClick={() => { setMode('Standard Surface'); onBook(); }}>Ship Economy</button></td></tr>
                <tr><td><strong>ShipNext B2B Cargo Bulk</strong><small>Heavy Consignments & Pallets</small></td><td>3–5 Business Days</td><td>Tail-Lift Trucks · Commercial Invoice · Insurance options</td><td>Commercial Terms</td><td><strong>{money(quote.totalCost * 0.65)}</strong></td><td><button type="button" className="outline" onClick={() => { setMode('Heavy Cargo'); onBook(); }}>Ship Cargo</button></td></tr>
              </tbody>
            </table>
          </div>
          <p className="sn-disclaimer">*Comparison prices and COD charges are illustrative placeholders from the reference design, not confirmed carrier offers. Final rates must come from ShipNext's configured tariff or connected courier APIs.</p>
        </div>
      </div>
    </section>
  );
}

function WhiteLabelGuarantee() {
  const [activeMessage, setActiveMessage] = useState('transit');
  const current = whatsappMessages[activeMessage];

  return (
    <section className="sn-section sn-white-label" id="white-label">
      <div className="sn-container">
        <SectionHeading
          eyebrow="Enterprise White-Label Guarantee"
          title="100% ShipNext Brand Immersion"
          description="Behind the scenes, intelligent routing can coordinate national air and surface carriers. Your customer-facing booking, tracking, labels and notifications should remain ShipNext-branded wherever provider APIs allow it."
        />

        <div className="sn-white-grid">
          <div className="sn-white-left">
            <div className="sn-panel sn-leak-panel">
              <h3>✓ Zero 3rd-Party Courier Leaks</h3>
              <div className="sn-customer-view">
                <strong>What Your Customers & Buyers See:</strong>
                <p>Branded tracking URLs ( <code>track.shipnext.io/AWB</code> ), custom ShipNext shipping labels and ShipNext-branded WhatsApp notifications.</p>
              </div>
              <div className="sn-masked-view">
                <strong>Masked Carrier Aggregation:</strong>
                <p>Provider references and external tracking links are hidden from customer-facing screens where the carrier's API, labels and contractual terms permit it.</p>
              </div>
              <div className="sn-feature-grid">
                <span>✓ Custom AWB Labels</span><span>✓ Verified WhatsApp Sender</span>
                <span>✓ Dedicated Tracking Domain</span><span>✓ Single Unified Invoice</span>
              </div>
            </div>

            <div className="sn-simulator-launch">
              <div><strong>Live WhatsApp Simulator</strong><small>Preview shipment notification examples</small></div>
              <span className="sn-simulator-status">Interactive preview below</span>
            </div>
          </div>

          <div className="sn-phone-area">
            <div className="sn-message-tabs">
              {Object.entries(whatsappMessages).map(([key, message]) => (
                <button type="button" key={key} className={activeMessage === key ? 'active' : ''} onClick={() => setActiveMessage(key)}>{message.label}</button>
              ))}
            </div>
            <div className="sn-phone">
              <div className="sn-phone-notch" />
              <div className="sn-phone-header">
                <div className="sn-avatar">SN</div>
                <div><strong>ShipNext Logistics</strong><small>Official Business Account · Preview</small></div>
              </div>
              <div className="sn-chat-area">
                <div className="sn-chat-bubble"><p>{current.body}</p><small>{current.time}　✓✓</small></div>
                <div className="sn-encrypted">End-to-end encrypted · ShipNext preview</div>
              </div>
              <div className="sn-phone-input">Type a reply or question...</div>
            </div>
          </div>
        </div>
        <p className="sn-disclaimer sn-white-disclaimer">White-label delivery depends on each courier partner's API, label, tracking-page and notification capabilities. These controls must be validated during integration; this frontend preview does not yet connect to a WhatsApp Business API or courier gateway.</p>
      </div>
    </section>
  );
}

export default function Solutions() {
  const navigate = useNavigate();
  const [activeSolution, setActiveSolution] = useState('domestic');
  const selected = solutionTabs.find((item) => item.id === activeSolution) || solutionTabs[0];

  const goToDashboard = () => navigate('/dashboard');

  return (
    <div className="shipnext-solutions">
      <style>{solutionStyles}</style>
      <section className="sn-section sn-solutions" id="solutions">
        <div className="sn-container">
          <SectionHeading
            eyebrow="Comprehensive Logistics System"
            title="One Platform. Every Shipping Need."
            description="Explore ShipNext shipping, freight, fulfilment and delivery workflows in one connected platform."
          />
          <div className="sn-solution-tabs">
            {solutionTabs.map((item) => (
              <button type="button" key={item.id} className={activeSolution === item.id ? 'active' : ''} onClick={() => setActiveSolution(item.id)}>{item.label}</button>
            ))}
          </div>
          <div className="sn-solution-card">
            <div>
              <span className="sn-eyebrow">ShipNext Solutions</span>
              <h3>{selected.title}</h3>
              <p>{selected.description}</p>
              <strong className="sn-solution-rate">{selected.rate}</strong>
            </div>
            <ul>{selected.features.map((feature) => <li key={feature}>✓ {feature}</li>)}</ul>
            <button className="sn-primary-button" type="button" onClick={goToDashboard}>Explore in Customer Dashboard</button>
          </div>
        </div>
      </section>

      <PricingMatrix onBook={goToDashboard} />
      <WhiteLabelGuarantee />
    </div>
  );
}
