
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const dispatchSteps = [
  {
    num: 1,
    icon: '📍',
    title: 'Enter Pickup & Delivery Details',
    subtitle: 'Smart Address Engine',
    description:
      'Input sender and recipient addresses or select from your saved warehouse locations. Instant PIN validation verifies zone serviceability and transit timelines.',
    highlight: 'Auto-saves for repeat orders',
  },
  {
    num: 2,
    icon: '📦',
    title: 'Add Parcel Weight & Dimensions',
    subtitle: 'Volumetric & Dead Weight Check',
    description:
      'Enter weight (minimum 500 grams) along with parcel length, width, and height. Our algorithm automatically applies the optimal billable slab.',
    highlight: 'Minimum parcel booking: 500g',
  },
  {
    num: 3,
    icon: '₹',
    title: 'View Transparent Shipping Charges',
    subtitle: 'Clear Rate Matrix',
    description:
      'Review complete itemized pricing: base freight, fuel surcharge, docket fee, and 18% GST with zero hidden post-delivery billings.',
    highlight: 'Instant real-time quote',
  },
  {
    num: 4,
    icon: '🚀',
    title: 'Pay via ShipNext Wallet & Confirm',
    subtitle: '1-Click Dispatch & AWB',
    description:
      'Deduct shipping charges automatically from your prepay balance. Instantly receive your ShipNext AWB barcode label and trigger automated WhatsApp alerts.',
    highlight: 'Automated AWB generation',
  },
];

function FrictionlessDispatch() {
  const [activeStep, setActiveStep] = useState(1);
  const navigate = useNavigate();

 const launchBookingWizard = () => {
  navigate('/dashboard');
};

  return (
    <section className="frictionless-section" id="how-it-works">

      <div className="frictionless-decoration frictionless-decoration-one"></div>
      <div className="frictionless-decoration frictionless-decoration-two"></div>

      <div className="frictionless-container">

        {/* SECTION HEADING */}
        <div className="frictionless-heading">
          <span className="frictionless-eyebrow">
            FRICTIONLESS DISPATCH
          </span>

          <h2>
            How ShipNext Works In 4 Easy Steps
          </h2>

          <p>
            From doorstep pickup to final recipient delivery,
            our automated workflow handles booking, rating,
            and white-label transit effortlessly.
          </p>
        </div>

        {/* FOUR DISPATCH CARDS */}
        <div className="frictionless-cards-wrapper">

          <div className="frictionless-connecting-line">
            <div
              className="frictionless-connecting-progress"
              style={{
                width: `${((activeStep - 1) / 3) * 100}%`,
              }}
            ></div>
          </div>

          <div className="frictionless-cards">

            {dispatchSteps.map((step) => {
              const isActive = activeStep === step.num;

              return (
                <button
                  type="button"
                  key={step.num}
                  className={`frictionless-card ${
                    isActive ? 'frictionless-card-active' : ''
                  }`}
                  onClick={() => setActiveStep(step.num)}
                >

                  <div className="frictionless-card-top">

                    <span className="frictionless-number">
                      0{step.num}
                    </span>

                    <span className="frictionless-icon">
                      {step.icon}
                    </span>

                  </div>

                  <div className="frictionless-card-content">

                    <span className="frictionless-subtitle">
                      {step.subtitle}
                    </span>

                    <h3>{step.title}</h3>

                    <p>{step.description}</p>

                  </div>

                  <div className="frictionless-card-highlight">
                    <span className="frictionless-check">✓</span>
                    <span>{step.highlight}</span>
                  </div>

                  {isActive && (
                    <div className="frictionless-active-indicator">
                      ACTIVE STEP
                    </div>
                  )}

                </button>
              );
            })}

          </div>
        </div>

        {/* LAUNCH BOOKING WIZARD */}
        <div className="frictionless-cta">

          <div className="frictionless-cta-content">
            <h3>
              Ready to ship your first parcel? Minimum weight is 500g.
            </h3>

            <p>
              Open the Customer Portal to book shipments with
              preloaded wallet balance and instant AWB generation.
            </p>
          </div>

          <button
            type="button"
            className="frictionless-launch-button"
            onClick={launchBookingWizard}
          >
            <span>Launch Booking Wizard</span>
            <span className="frictionless-launch-arrow">↗</span>
          </button>

        </div>

      </div>
    </section>
  );
}

export default FrictionlessDispatch;
