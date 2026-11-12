
import { useState } from 'react';


const recommendations = {
  speed: {
    label: 'FASTEST DELIVERY',
    service: 'ShipNext Express Air',
    carrier: 'BlueDart Air Network',
    time: '24–36 Hours',
    rate: '₹148.68',
    score: '99.4/100',
    reason: 'Priority air allocation for faster transit on this route.',
    icon: '⚡',
  },
  cost: {
    label: 'LOWEST SHIPPING COST',
    service: 'ShipNext Surface Economy',
    carrier: 'Delhivery Surface Network',
    time: '2–3 Days',
    rate: '₹84.50',
    score: '97.8/100',
    reason: 'Economical surface routing with a lower estimated shipment cost.',
    icon: '₹',
  },
  sla: {
    label: 'BEST DELIVERY PERFORMANCE',
    service: 'ShipNext Verified Courier Priority',
    carrier: 'Shadowfax Priority Fleet',
    time: '36–48 Hours',
    rate: '₹112.00',
    score: '99.8/100',
    reason: 'Prioritises historical first-attempt delivery performance.',
    icon: '✓',
  },
};

export default function AIEngineNDR() {
  const [rule, setRule] = useState('speed');
  const [ndrAction, setNdrAction] = useState('');
  const [deliveryWindow, setDeliveryWindow] = useState(
    'Tomorrow (10 AM – 2 PM)'
  );
  const [landmark, setLandmark] = useState('');
  const [confirmed, setConfirmed] = useState(false);

  const selected = recommendations[rule];

  const chooseNdrAction = (action) => {
    setNdrAction(action);
    setConfirmed(false);
  };

  const confirmNdr = () => {
    if (ndrAction === 'address' && !landmark.trim()) return;
    setConfirmed(true);
  };

  return (
    <section className="ai-ndr-section" id="ai-engine">
      <div className="ai-ndr-glow ai-ndr-glow-one"></div>
      <div className="ai-ndr-glow ai-ndr-glow-two"></div>

      <div className="ai-ndr-container">

        <div className="ai-ndr-heading">
          <span className="ai-ndr-eyebrow">
            ✦ PROPRIETARY AI LOGISTICS INFRASTRUCTURE
          </span>

          <h2>
            AI Courier Recommendation
            <span> & Smart NDR Redressal</span>
          </h2>

          <p>
            Intelligent courier recommendations and proactive delivery
            recovery workflows designed to reduce shipping costs,
            improve delivery performance and minimise avoidable RTO.
          </p>
        </div>

        <div className="ai-ndr-grid">

          {/* AI COURIER ENGINE */}

          <div className="ai-engine-card">
            <div className="ai-card-heading">
              <div className="ai-card-icon">🧠</div>

              <div>
                <h3>AI Courier Recommendation Engine (CORE)</h3>
                <p>Smart carrier selection system</p>
              </div>

              <span className="ai-status">DEMO</span>
            </div>

            <p className="ai-card-description">
              Choose how ShipNext should optimise a shipment.
              The recommendation preview changes based on your
              selected dispatch priority.
            </p>

            <div className="ai-rule-label">
              SELECT DISPATCH OPTIMISATION RULE
            </div>

            <div className="ai-rule-buttons">
              <button
                className={rule === 'speed' ? 'active' : ''}
                onClick={() => setRule('speed')}
              >
                ⚡ Speed
              </button>

              <button
                className={rule === 'cost' ? 'active' : ''}
                onClick={() => setRule('cost')}
              >
                ₹ Cost
              </button>

              <button
                className={rule === 'sla' ? 'active' : ''}
                onClick={() => setRule('sla')}
              >
                ✓ SLA
              </button>
            </div>

            <div className="ai-recommendation">
              <div className="ai-recommendation-top">
                <span>✦ AI RECOMMENDATION</span>
                <span className="ai-recommended-badge">RECOMMENDED</span>
              </div>

              <div className="ai-service-name">
                <div className="ai-service-symbol">{selected.icon}</div>

                <div>
                  <h4>{selected.service}</h4>
                  <p>{selected.carrier}</p>
                </div>
              </div>

              <div className="ai-metrics">
                <div>
                  <span>EST. TRANSIT</span>
                  <strong>{selected.time}</strong>
                </div>

                <div>
                  <span>EST. RATE</span>
                  <strong>{selected.rate}</strong>
                </div>

                <div>
                  <span>DEMO SCORE</span>
                  <strong>{selected.score}</strong>
                </div>
              </div>

              <div className="ai-reason">
                <strong>{selected.label}</strong>
                <p>{selected.reason}</p>
              </div>
            </div>

            <div className="ai-engine-features">
              <span>✓ PIN-code serviceability checks</span>
              <span>✓ Rate and transit comparison</span>
              <span>✓ Historical SLA evaluation</span>
              <span>✓ ShipNext-branded tracking experience</span>
            </div>

            <div className="ai-engine-footer">
              <span>✦ Intelligent routing preview</span>
              <span>CORE / 01</span>
            </div>
          </div>

          {/* NDR ENGINE */}

          <div className="ndr-card">
            <div className="ndr-card-heading">
              <div className="ndr-icon">🛡️</div>

              <div>
                <h3>Smart NDR & RTO Reduction Suite</h3>
                <p>Automated delivery recovery workflow</p>
              </div>

              <span className="ndr-status">DEMO</span>
            </div>

            <div className="ndr-highlight">
              <strong>−38%</strong>
              <span>Illustrative RTO reduction target</span>
            </div>

            <p className="ndr-description">
              When a delivery attempt fails because the buyer is
              unavailable or the address is incomplete, ShipNext can
              trigger a WhatsApp message with simple resolution options.
            </p>

            <div className="ndr-comparison">
              <div className="ndr-failure">
                <span className="ndr-comparison-icon">✕</span>
                <div>
                  <strong>Traditional Delivery Failure</strong>
                  <p>
                    Delivery fails. The parcel may remain at the hub
                    before being returned to the merchant.
                  </p>
                </div>
              </div>

              <div className="ndr-success">
                <span className="ndr-comparison-icon">✓</span>
                <div>
                  <strong>ShipNext Smart NDR Workflow</strong>
                  <p>
                    Buyer receives a WhatsApp recovery message
                    with options to reschedule or correct the address.
                  </p>
                </div>
              </div>
            </div>

            <div className="ndr-workflow">
              <div className="ndr-workflow-heading">
                <div>
                  <strong>Interactive NDR Workflow</strong>
                  <p>Sample shipment: SN-5521908-IN</p>
                </div>

                <span className="ndr-action-needed">ATTEMPT FAILED</span>
              </div>

              <div className="ndr-alert">
                <strong>⚠ Delivery Attempt Failed</strong>
                <p>
                  Reason: Customer unavailable / premises closed.
                  Choose a resolution to preview the recovery process.
                </p>
              </div>

              <div className="ndr-action-buttons">
                <button
                  className={ndrAction === 'reschedule' ? 'selected' : ''}
                  onClick={() => chooseNdrAction('reschedule')}
                >
                  📅 Reschedule Delivery
                </button>

                <button
                  className={ndrAction === 'address' ? 'selected' : ''}
                  onClick={() => chooseNdrAction('address')}
                >
                  📍 Update Address
                </button>

                <button
                  className={ndrAction === 'rto' ? 'selected' : ''}
                  onClick={() => chooseNdrAction('rto')}
                >
                  ↩ Request RTO
                </button>
              </div>

              {ndrAction === 'reschedule' && (
                <div className="ndr-input-panel">
                  <label>Select re-attempt window</label>

                  <select
                    value={deliveryWindow}
                    onChange={(e) => setDeliveryWindow(e.target.value)}
                  >
                    <option>Tomorrow (10 AM – 2 PM)</option>
                    <option>Tomorrow (2 PM – 6 PM)</option>
                    <option>Day After Tomorrow (Anytime)</option>
                  </select>

                  <button onClick={confirmNdr}>
                    Confirm Re-attempt
                  </button>
                </div>
              )}

              {ndrAction === 'address' && (
                <div className="ndr-input-panel">
                  <label>New landmark / address details</label>

                  <input
                    value={landmark}
                    onChange={(e) => setLandmark(e.target.value)}
                    placeholder="Enter house number or landmark"
                  />

                  <button onClick={confirmNdr}>
                    Confirm Address Update
                  </button>
                </div>
              )}

              {ndrAction === 'rto' && (
                <div className="ndr-input-panel">
                  <p>
                    Preview a request to return this parcel
                    to the merchant.
                  </p>

                  <button onClick={confirmNdr}>
                    Confirm RTO Request
                  </button>
                </div>
              )}

              {confirmed && (
                <div className="ndr-confirmation">
                  ✓ Demo action recorded successfully.
                  <p>
                    {ndrAction === 'reschedule'
                      ? `Selected window: ${deliveryWindow}`
                      : ndrAction === 'address'
                      ? `New landmark: ${landmark}`
                      : 'RTO request preview confirmed.'}
                  </p>
                  <small>
                    This is a frontend demonstration, not a live courier instruction.
                  </small>
                </div>
              )}
            </div>

            <div className="ndr-footer">
              <span>✓ WhatsApp recovery preview</span>
              <span>NDR / 02</span>
            </div>
          </div>

        </div>

        <p className="ai-ndr-disclaimer">
          Demonstration only: courier scores, rates and RTO reduction
          figures are illustrative. Live carrier recommendations,
          WhatsApp messaging, NDR actions and delivery updates require
          backend logic and connected courier and WhatsApp APIs.
        </p>

      </div>
    </section>
  );
}
