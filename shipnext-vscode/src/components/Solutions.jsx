
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const solutionStyles = `
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
.sn-solution-tabs,
.sn-message-tabs {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 9px;
  margin-bottom: 24px;
}
.sn-solution-tabs button,
.sn-message-tabs button {
  border: 1px solid #dbe2ea;
  border-radius: 999px;
  padding: 10px 16px;
  color: #475569;
  background: #fff;
  font-size: 12px;
  font-weight: 750;
  cursor: pointer;
}
.sn-solution-tabs button.active,
.sn-message-tabs button.active {
  color: #fff;
  border-color: #ff3b1f;
  background: #ff3b1f;
}
.sn-solution-card,
.sn-panel {
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
.sn-solution-card h3,
.sn-panel h3 {
  margin: 0 0 12px;
  color: #0a2540;
  font-size: 22px;
}
.sn-solution-card p {
  color: #64748b;
  line-height: 1.7;
}
.sn-solution-rate {
  display: inline-block;
  margin-top: 8px;
  color: #ff3b1f;
}
.sn-solution-card ul {
  margin: 0;
  padding: 0;
  list-style: none;
}
.sn-solution-card li {
  padding: 8px 0;
  color: #475569;
  font-size: 14px;
}
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
}
.sn-primary-button:disabled {
  opacity: .6;
  cursor: not-allowed;
}
.sn-solution-card .sn-primary-button {
  grid-column: 1 / -1;
  justify-self: start;
}
.sn-pricing {
  background: #f8fafc;
}
.sn-pricing-card {
  max-width: 850px;
  margin: 35px auto;
  padding: 30px;
  background: #fff;
  border: 1px solid #e5eaf0;
  border-radius: 16px;
  box-shadow: 0 10px 35px rgba(10, 37, 64, .06);
}
.sn-pricing-inputs {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 20px;
  margin-bottom: 22px;
}
.sn-field {
  display: flex;
  flex-direction: column;
  gap: 8px;
  color: #475569;
  font-size: 13px;
  font-weight: 650;
}
.sn-field input {
  width: 100%;
  box-sizing: border-box;
  padding: 14px;
  border: 1px solid #d8e0e9;
  border-radius: 8px;
  font-size: 16px;
}
.sn-field input:focus {
  outline: 2px solid #bfdbfe;
  border-color: #0875e1;
}
.sn-serviceability-button {
  padding: 13px 22px;
  border: none;
  border-radius: 8px;
  background: #0875e1;
  color: #fff;
  font-weight: 700;
  cursor: pointer;
}
.sn-serviceability-button:disabled {
  opacity: .6;
  cursor: not-allowed;
}
.sn-serviceability-error {
  margin-top: 20px;
  padding: 14px;
  border-radius: 8px;
  background: #fff1f1;
  color: #b42318;
}
.sn-serviceability-result {
  margin-top: 25px;
}
.sn-serviceability-success {
  display: flex;
  align-items: center;
  gap: 12px;
  color: #147d45;
}
.sn-serviceability-success p {
  margin: 5px 0;
  color: #64748b;
}
.sn-assigned-mode {
  margin: 22px 0;
  padding: 20px;
  border-radius: 12px;
  background: #eff6ff;
}
.sn-assigned-mode span {
  color: #475569;
  font-size: 13px;
}
.sn-assigned-mode h3 {
  margin: 8px 0 0;
  color: #075db5;
  font-size: 23px;
}
.sn-available-modes {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  margin: 15px 0;
}
.sn-mode-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 14px;
  border: 1px solid #e2e8f0;
  border-radius: 9px;
}
.sn-mode-item.assigned {
  border-color: #86efac;
  background: #f0fdf4;
}
.sn-mode-item small {
  color: #64748b;
}
.sn-serviceability-note {
  margin: 20px 0;
  color: #64748b;
  font-size: 13px;
  line-height: 1.6;
}
.sn-mode-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
  margin-top: 30px;
}
.sn-mode-card {
  padding: 20px;
  border: 1px solid #e5eaf0;
  border-radius: 12px;
  background: #fff;
}
.sn-mode-card h3 {
  color: #0a2540;
  font-size: 16px;
}
.sn-mode-card p {
  color: #64748b;
  font-size: 14px;
  line-height: 1.6;
}
.sn-white-label { background: #fff; }
.sn-white-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 40px;
  align-items: center;
}
.sn-white-left {
  display: grid;
  gap: 16px;
}
.sn-leak-panel {
  padding: 26px;
  background: #f8fafc;
}
.sn-leak-panel h3 { font-size: 19px; }
.sn-customer-view,
.sn-masked-view {
  margin-top: 12px;
  padding: 16px;
  border: 1px solid #bbf7d0;
  border-radius: 12px;
  background: #ecfdf5;
}
.sn-customer-view strong,
.sn-masked-view strong {
  display: block;
  margin-bottom: 6px;
  color: #064e3b;
  font-size: 12px;
}
.sn-customer-view p,
.sn-masked-view p {
  margin: 0;
  color: #047857;
  font-size: 11px;
  line-height: 1.7;
}
.sn-customer-view code {
  color: #ff3b1f;
  font-weight: 800;
}
.sn-masked-view {
  border-color: #e2e8f0;
  background: #fff;
}
.sn-masked-view strong { color: #0a2540; }
.sn-masked-view p { color: #64748b; }
.sn-feature-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-top: 18px;
  padding-top: 16px;
  border-top: 1px solid #e2e8f0;
  color: #475569;
  font-size: 11px;
  font-weight: 750;
}
.sn-simulator-launch {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 14px;
  padding: 18px;
  border: 1px solid #e2e8f0;
  border-radius: 15px;
  background: #f8fafc;
}
.sn-simulator-launch strong,
.sn-simulator-launch small {
  display: block;
}
.sn-simulator-launch strong { font-size: 13px; }
.sn-simulator-launch small {
  margin-top: 5px;
  color: #64748b;
  font-size: 10px;
}
.sn-simulator-status {
  color: #15803d;
  font-size: 10px;
  font-weight: 800;
}
.sn-phone-area {
  display: flex;
  flex-direction: column;
  align-items: center;
}
.sn-message-tabs { margin-bottom: 16px; }
.sn-message-tabs button {
  padding: 8px 12px;
  font-size: 10px;
}
.sn-phone {
  width: min(340px, 100%);
  overflow: hidden;
  border: 7px solid #cbd5e1;
  border-radius: 34px;
  background: #0b141a;
  box-shadow: 0 22px 50px rgba(15, 23, 42, .2);
}
.sn-phone-notch {
  width: 100px;
  height: 13px;
  margin: 0 auto 3px;
  border-radius: 0 0 12px 12px;
  background: #1f2937;
}
.sn-phone-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px;
  color: #fff;
  background: #1f2c34;
}
.sn-avatar {
  display: grid;
  place-items: center;
  width: 34px;
  height: 34px;
  border-radius: 50%;
  color: #fff;
  background: #ff3b1f;
  font-size: 11px;
  font-weight: 900;
}
.sn-phone-header strong,
.sn-phone-header small { display: block; }
.sn-phone-header strong { font-size: 11px; }
.sn-phone-header small {
  margin-top: 4px;
  color: #86efac;
  font-size: 9px;
}
.sn-chat-area {
  display: flex;
  min-height: 330px;
  flex-direction: column;
  justify-content: flex-end;
  gap: 20px;
  padding: 16px;
  background: #0b141a;
}
.sn-chat-bubble {
  max-width: 94%;
  padding: 13px;
  border-radius: 4px 14px 14px 14px;
  color: #e9edef;
  background: #005c4b;
  white-space: pre-line;
}
.sn-chat-bubble p {
  margin: 0;
  font-size: 11px;
  line-height: 1.65;
}
.sn-chat-bubble small {
  display: block;
  margin-top: 8px;
  color: #a7f3d0;
  text-align: right;
  font-size: 9px;
}
.sn-encrypted {
  color: #94a3b8;
  text-align: center;
  font-size: 9px;
}
.sn-phone-input {
  padding: 12px;
  color: #94a3b8;
  background: #1f2c34;
  font-size: 10px;
}
.sn-disclaimer {
  color: #94a3b8;
  font-size: 10px;
  line-height: 1.6;
}
.sn-white-disclaimer {
  max-width: 900px;
  margin: 24px auto 0;
  text-align: center;
}
@media (max-width: 900px) {
  .sn-white-grid { grid-template-columns: 1fr; }
}
@media (max-width: 700px) {
  .sn-pricing-inputs,
  .sn-available-modes { grid-template-columns: 1fr; }
  .sn-mode-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .sn-pricing-card { padding: 18px; }
}
@media (max-width: 600px) {
  .sn-section { padding: 60px 15px; }
  .sn-panel,
  .sn-solution-card { padding: 19px; }
  .sn-solution-card { grid-template-columns: 1fr; }
  .sn-feature-grid { grid-template-columns: 1fr; }
  .sn-simulator-launch {
    align-items: flex-start;
    flex-direction: column;
  }
}
`;

const solutionTabs = [
  {
    id: 'domestic',
    label: 'Domestic Shipping',
    title: 'Domestic Shipping',
    rate: 'Rates based on configured route and shipping mode.',
    description: 'Ship parcels across India using the shipping modes configured for each pickup and delivery PIN combination.',
    features: [
      'PIN-to-PIN serviceability checking',
      'Express Air and Normal Air',
      'Express Surface and Normal Surface',
      'Doorstep pickup workflow',
      'Shipment status updates',
    ],
  },
  {
    id: 'cargo',
    label: 'B2B Cargo',
    title: 'B2B Cargo & Bulk Freight Solutions',
    rate: 'Pricing subject to verified freight tariffs.',
    description: 'Freight workflows for wholesale merchants, manufacturers and business shipments.',
    features: [
      'Business shipment workflows',
      'Bulk consignment management',
      'Commercial invoice workflow',
      'Pickup and delivery coordination',
      'Carrier integration subject to availability',
    ],
  },
  {
    id: 'hyperlocal',
    label: 'Hyperlocal',
    title: 'Hyperlocal Delivery',
    rate: 'Availability and pricing subject to service configuration.',
    description: 'Local delivery workflows for retail orders, documents and urgent consignments.',
    features: [
      'Local delivery workflow',
      'Service-area configuration',
      'Delivery status updates',
      'Provider integration',
      'Availability confirmation',
    ],
  },
  {
    id: 'international',
    label: 'International',
    title: 'ShipNext International',
    rate: 'Pricing subject to destination and courier integration.',
    description: 'Cross-border shipping workflows for merchants exporting to international destinations.',
    features: [
      'Export documentation workflow',
      'International carrier integration',
      'Destination serviceability',
      'Customs workflow subject to carrier rules',
      'International shipment management',
    ],
  },
  {
    id: 'fulfillment',
    label: 'Warehousing',
    title: 'Distributed Warehousing & Fulfilment',
    rate: 'Pricing subject to configured fulfilment services.',
    description: 'Inventory storage and fulfilment workflows designed to connect warehouse operations with parcel dispatch.',
    features: [
      'Inventory receiving and storage',
      'Pick and pack workflows',
      'Inventory visibility',
      'Regional stock allocation',
      'Warehouse operations management',
    ],
  },
];

const whatsappMessages = {
  booking: {
    label: 'Booking Confirmed',
    time: '10:30 AM',
    body: '📦 ShipNext Booking Confirmed\n\nYour shipment booking has been confirmed.\n\n• Service: Assigned shipping mode\n• Pickup: Scheduled\n\nTrack your shipment using your ShipNext tracking link.',
  },
  pickup: {
    label: 'Pickup',
    time: '11:45 AM',
    body: '🚚 ShipNext Pickup Update\n\nYour parcel has been picked up successfully.\n\n• Pickup status: Completed\n• Next step: Transit facility\n\nThank you for shipping with ShipNext.',
  },
  transit: {
    label: 'In Transit',
    time: '06:15 AM',
    body: '✈️ ShipNext Transit Update\n\nYour parcel is moving through the delivery network.\n\n• Shipment status: In Transit\n• Delivery estimate: Subject to carrier data\n\nTrack the latest status on ShipNext.',
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
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  const modeLabels = {
    EXPRESS_AIR: 'Express Air',
    NORMAL_AIR: 'Normal Air',
    EXPRESS_SURFACE: 'Express Surface',
    NORMAL_SURFACE: 'Normal Surface',
  };

  const checkServiceability = async (event) => {
    event.preventDefault();
    setError('');
    setResult(null);

    if (!/^\d{6}$/.test(origin) || !/^\d{6}$/.test(destination)) {
      setError('Please enter valid six-digit pickup and delivery PIN codes.');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/serviceability/check', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pickupPincode: origin,
          deliveryPincode: destination,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.serviceable) {
        setError(data.message || 'This route is currently not serviceable.');
        return;
      }

      setResult(data);
    } catch (err) {
      setError('Unable to connect to ShipNext. Check that the backend is running and your API proxy is configured.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="sn-section sn-pricing" id="rates">
      <div className="sn-container">
        <SectionHeading
          eyebrow="PIN Serviceability"
          title="Find Available Shipping Modes"
          description="Enter your pickup and delivery PIN codes. ShipNext checks the configured route and automatically assigns the active mode with the highest priority."
        />

        <div className="sn-pricing-card">
          <form onSubmit={checkServiceability}>
            <div className="sn-pricing-inputs">
              <label className="sn-field">
                Pickup PIN code
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="Enter pickup PIN"
                  value={origin}
                  onChange={(e) => {
                    setOrigin(e.target.value.replace(/\D/g, ''));
                    setResult(null);
                    setError('');
                  }}
                />
              </label>

              <label className="sn-field">
                Delivery PIN code
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="Enter delivery PIN"
                  value={destination}
                  onChange={(e) => {
                    setDestination(e.target.value.replace(/\D/g, ''));
                    setResult(null);
                    setError('');
                  }}
                />
              </label>
            </div>

            <button
              type="submit"
              className="sn-serviceability-button"
              disabled={loading}
            >
              {loading ? 'Checking...' : 'Check Serviceability'}
            </button>
          </form>

          {error && (
            <div className="sn-serviceability-error" role="alert">
              {error}
            </div>
          )}

          {result && (
            <div className="sn-serviceability-result">
              <div className="sn-serviceability-success">
                <span>✓</span>
                <div>
                  <strong>Route is serviceable</strong>
                  <p>{origin} → {destination}</p>
                </div>
              </div>

              <div className="sn-assigned-mode">
                <span>Automatically assigned shipping mode</span>
                <h3>
                  {modeLabels[result.assignedMode] || result.assignedMode}
                </h3>
              </div>

              <h4>Available shipping modes</h4>

              <div className="sn-available-modes">
                {result.availableModes.map((item) => (
                  <div
                    className={`sn-mode-item ${
                      item.mode === result.assignedMode ? 'assigned' : ''
                    }`}
                    key={item.mode}
                  >
                    <strong>
                      {modeLabels[item.mode] || item.mode}
                    </strong>
                    <small>
                      Priority {item.priority}
                      {item.mode === result.assignedMode ? ' · Assigned' : ''}
                    </small>
                  </div>
                ))}
              </div>

              <p className="sn-serviceability-note">
                Mode availability and allocation are based on active routes
                configured by ShipNext administrators. Shipping prices and
                delivery estimates are not displayed until verified tariffs
                and carrier transit data are integrated.
              </p>

              <button
                type="button"
                className="sn-serviceability-button"
                onClick={onBook}
              >
                Continue to Dashboard
              </button>
            </div>
          )}
        </div>

        <div className="sn-mode-grid">
          <div className="sn-mode-card">
            <h3>Express Air</h3>
            <p>Priority air shipping service.</p>
          </div>
          <div className="sn-mode-card">
            <h3>Normal Air</h3>
            <p>Standard air shipping service.</p>
          </div>
          <div className="sn-mode-card">
            <h3>Express Surface</h3>
            <p>Priority surface shipping service.</p>
          </div>
          <div className="sn-mode-card">
            <h3>Normal Surface</h3>
            <p>Standard surface shipping service.</p>
          </div>
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
          eyebrow="Enterprise White-Label"
          title="ShipNext Brand Experience"
          description="ShipNext is designed to provide a unified customer-facing booking, tracking and notification experience. Actual carrier integrations are configured separately."
        />

        <div className="sn-white-grid">
          <div className="sn-white-left">
            <div className="sn-panel sn-leak-panel">
              <h3>✓ ShipNext Branded Experience</h3>

              <div className="sn-customer-view">
                <strong>Customer-facing experience</strong>
                <p>
                  ShipNext-branded tracking pages, notifications and
                  shipment communication wherever provider APIs permit.
                </p>
              </div>

              <div className="sn-masked-view">
                <strong>Carrier integration</strong>
                <p>
                  Provider references and external tracking links can be
                  hidden where the carrier API and contractual terms allow.
                </p>
              </div>

              <div className="sn-feature-grid">
                <span>✓ ShipNext Tracking</span>
                <span>✓ Branded Notifications</span>
                <span>✓ Shipment Management</span>
                <span>✓ Unified Dashboard</span>
              </div>
            </div>

            <div className="sn-simulator-launch">
              <div>
                <strong>WhatsApp Message Preview</strong>
                <small>Preview example shipment notifications</small>
              </div>
              <span className="sn-simulator-status">Preview only</span>
            </div>
          </div>

          <div className="sn-phone-area">
            <div className="sn-message-tabs">
              {Object.entries(whatsappMessages).map(([key, message]) => (
                <button
                  type="button"
                  key={key}
                  className={activeMessage === key ? 'active' : ''}
                  onClick={() => setActiveMessage(key)}
                >
                  {message.label}
                </button>
              ))}
            </div>

            <div className="sn-phone">
              <div className="sn-phone-notch" />

              <div className="sn-phone-header">
                <div className="sn-avatar">SN</div>
                <div>
                  <strong>ShipNext Logistics</strong>
                  <small>Business Account · Preview</small>
                </div>
              </div>

              <div className="sn-chat-area">
                <div className="sn-chat-bubble">
                  <p>{current.body}</p>
                  <small>{current.time}　✓✓</small>
                </div>
                <div className="sn-encrypted">
                  ShipNext notification preview
                </div>
              </div>

              <div className="sn-phone-input">
                Type a reply or question...
              </div>
            </div>
          </div>
        </div>

        <p className="sn-disclaimer sn-white-disclaimer">
          This is a frontend preview. Actual WhatsApp notifications,
          carrier labels and live tracking require their respective
          provider integrations.
        </p>
      </div>
    </section>
  );
}

export default function Solutions() {
  const navigate = useNavigate();
  const [activeSolution, setActiveSolution] = useState('domestic');

  const selected =
    solutionTabs.find((item) => item.id === activeSolution) || solutionTabs[0];

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
              <button
                type="button"
                key={item.id}
                className={activeSolution === item.id ? 'active' : ''}
                onClick={() => setActiveSolution(item.id)}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="sn-solution-card">
            <div>
              <span className="sn-eyebrow">ShipNext Solutions</span>
              <h3>{selected.title}</h3>
              <p>{selected.description}</p>
              <strong className="sn-solution-rate">{selected.rate}</strong>
            </div>

            <ul>
              {selected.features.map((feature) => (
                <li key={feature}>✓ {feature}</li>
              ))}
            </ul>

            <button
              className="sn-primary-button"
              type="button"
              onClick={goToDashboard}
            >
              Explore in Customer Dashboard
            </button>
          </div>
        </div>
      </section>

      <PricingMatrix onBook={goToDashboard} />
      <WhiteLabelGuarantee />
    </div>
  );
}
