
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import API_URL from '../config/api';
import './BookShipment.css';

const initialData = {
  paymentMode: 'PREPAID',
  codAmount: '',
  pickupName: '',
  pickupPhone: '',
  pickupAddress: '',
  pickupCity: '',
  pickupPincode: '',
  deliveryName: '',
  deliveryPhone: '',
  deliveryAddress: '',
  deliveryCity: '',
  deliveryPincode: '',
  rtoName: '',
  rtoPhone: '',
  rtoAddress: '',
  rtoCity: '',
  rtoPincode: '',
  alternateName: '',
  alternatePhone: '',
  alternateRelation: '',
  pickupDate: '',
  preferredDeliveryDate: '',
  shipmentType: 'DOCUMENT',
  itemCategory: '',
  itemName: '',
  itemDescription: '',
  quantity: '1',
  weight: '',
  length: '',
  width: '',
  height: '',
  productValue: '',
};

const steps = [
  { title: 'Shipment Route', subtitle: 'Where is your shipment going?', icon: '⌖' },
  { title: 'Pickup Details', subtitle: 'Enter sender and pickup information.', icon: '📍' },
  { title: 'Delivery Details', subtitle: 'Enter receiver and delivery information.', icon: '🏠' },
  { title: 'Parcel Details', subtitle: 'Tell us what you are shipping.', icon: '📦' },
  { title: 'RTO Details', subtitle: 'Add your return-to-origin address.', icon: '↩' },
  { title: 'Payment Details', subtitle: 'Choose your shipment payment method.', icon: '₹' },
];
const Field = ({
  label,
  name,
  type = 'text',
  required = true,
  formData = {},
  handleChange,
  ...props
}) => (
  <div className="sn-wizard-field">
    <label htmlFor={name}>
      {label}{required ? ' *' : ''}
    </label>

    <input
      id={name}
      name={name}
      type={type}
      value={formData[name] ?? ''}
      onChange={handleChange || (() => {})}
      required={required}
      {...props}
    />
  </div>
);
const Area = ({ label, name, required = true, formData, handleChange }) => (
  <div className="sn-wizard-field sn-wizard-full">
    <label htmlFor={name}>{label}{required ? ' *' : ''}</label>
    <textarea
      id={name}
      name={name}
      rows={3}
      value={formData[name] ?? ''}
      onChange={handleChange}
      required={required}
      placeholder="House/flat number, street, area and landmark"
    />
  </div>
);

const Select = ({ label, name, children, formData, handleChange }) => (
  <div className="sn-wizard-field">
    <label htmlFor={name}>{label} *</label>
    <select
      id={name}
      name={name}
      value={formData[name] ?? ''}
      onChange={handleChange}
    >
      {children}
    </select>
  </div>
);
function BookShipment() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState(initialData);
  const [alternateEnabled, setAlternateEnabled] = useState(false);
  const [sameRto, setSameRto] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
const [draftId, setDraftId] = useState('');
// PIN CODE SERVICEABILITY
const [courierResults, setCourierResults] = useState([]);
const [checkingServiceability, setCheckingServiceability] = useState(false);
const [serviceabilityError, setServiceabilityError] = useState('');
const [hasCheckedServiceability, setHasCheckedServiceability] = useState(false);
const [availableModes, setAvailableModes] = useState([]);
const [assignedMode, setAssignedMode] = useState('');

// SHIPPING RATE CALCULATOR
const [rateMode, setRateMode] = useState('EXPRESS_AIR');
const [selectedCourier, setSelectedCourier] = useState('SKYKING');
const [shipmentWeight, setShipmentWeight] = useState('0.5');
const [rateResult, setRateResult] = useState(null);
const [rateError, setRateError] = useState('');
const [pickupLocation, setPickupLocation] = useState(null);
const [deliveryLocation, setDeliveryLocation] = useState(null);

const courierNames = {
  DELHIVERY: 'Delhivery',
  SKYKING: 'Skyking',
  BLUEDART: 'Blue Dart',
  SHADOWFAX: 'Shadowfax',
};

const modeNames = {
  EXPRESS_AIR: 'Express Air',
  NORMAL_AIR: 'Normal Air',
  EXPRESS_SURFACE: 'Express Surface',
  NORMAL_SURFACE: 'Normal Surface',
};

// Surface courier options (Skyking is excluded)
const serviceableSurfaceCouriers = courierResults
  .filter((item) => item.serviceable)
  .map((item) => item.courier)
  .filter((courier) =>
    ['DELHIVERY', 'BLUEDART', 'SHADOWFAX'].includes(courier)
  );

// CHECK PIN CODE SERVICEABILITY
const handleServiceabilityCheck = async (e) => {
  e.preventDefault();

  const pickup = formData.pickupPincode.trim();
  const delivery = formData.deliveryPincode.trim();

  if (!/^\d{6}$/.test(pickup) || !/^\d{6}$/.test(delivery)) {
    setServiceabilityError('Please enter valid six-digit PIN codes.');
    return;
  }

  setCheckingServiceability(true);
  setServiceabilityError('');
  setCourierResults([]);
  setAvailableModes([]);
  setPickupLocation(null);
setDeliveryLocation(null);
  setAssignedMode('');
  setRateResult(null);
  setRateError('');
  setHasCheckedServiceability(false);

  try {
    const response = await fetch(
      `${API_URL}/api/serviceability/couriers/check`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pickupPincode: pickup,
          deliveryPincode: delivery,
        }),
      }
    );

    const data = await response.json();
    setPickupLocation(data.pickupLocation || null);
setDeliveryLocation(data.deliveryLocation || null);
console.log('PIN LOCATION API RESPONSE:', data);
    if (!response.ok) {
      throw new Error(data.message || 'Unable to check PIN-code serviceability.');
    }

    const results = data.courierResults || [];
    setCourierResults(results);

    // Check available shipping modes
    const modeResponse = await fetch(
      `${API_URL}/api/serviceability/check`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pickupPincode: pickup,
          deliveryPincode: delivery,
        }),
      }
    );

    const modeData = await modeResponse.json();
    if (modeData.blocked) {
  throw new Error(modeData.message || 'Service is unavailable for these PIN codes.');
}

    if (!modeResponse.ok || !modeData.success) {
      throw new Error(modeData.message || 'Unable to check available shipping modes.');
    }

    const modes = Array.isArray(modeData.availableModes)
      ? modeData.availableModes
      : [];

    setAvailableModes(modes);
    setAssignedMode(modeData.assignedMode || '');

    // Select a valid default mode
    const defaultMode = modeData.assignedMode && modes.includes(modeData.assignedMode)
      ? modeData.assignedMode
      : modes[0];

    if (defaultMode) {
      setRateMode(defaultMode);
      setSelectedCourier(
        defaultMode.includes('AIR')
          ? 'SKYKING'
          : (
              results.find(
                (item) =>
                  item.serviceable &&
                  ['DELHIVERY', 'BLUEDART', 'SHADOWFAX'].includes(item.courier)
              )?.courier || 'DELHIVERY'
            )
      );
    }

    setHasCheckedServiceability(true);

  } catch (error) {
    setServiceabilityError(
      error.message || 'Unable to check serviceability.'
    );
  } finally {
    setCheckingServiceability(false);
  }
};

// CALCULATE SHIPPING RATE
const calculateRate = async () => {
  try {
    setRateError('');
    setRateResult(null);

    if (!hasCheckedServiceability) {
      throw new Error('Please check PIN-code serviceability first.');
    }

    if (!availableModes.includes(rateMode)) {
      throw new Error('This shipping mode is not available for these PIN codes.');
    }

    if (!rateMode.includes('AIR') &&
        !serviceableSurfaceCouriers.includes(selectedCourier)) {
      throw new Error('Please select an available surface courier.');
    }

    if (Number(shipmentWeight) < 0.5) {
      throw new Error('Minimum shipment weight is 0.5 kg.');
    }

    const response = await fetch(
      `${API_URL}/api/serviceability/quote`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pickupPincode: formData.pickupPincode.trim(),
          deliveryPincode: formData.deliveryPincode.trim(),
          weight: Number(shipmentWeight),
          mode: rateMode,
          courier: rateMode.includes('AIR') ? 'SKYKING' : selectedCourier,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.message || 'Unable to calculate shipping charges.');
    }

    setRateResult(data);

  } catch (error) {
    setRateError(error.message || 'Unable to calculate shipping charges.');
  }
};

const handleRateCalculation = (e) => {
  e.preventDefault();
  calculateRate();
};

  const update = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

 const handleChange = (e) => {
  const { name, value } = e.target;

  update(name, value);

  if (name === 'pickupPincode' || name === 'deliveryPincode') {
    setCourierResults([]);
    setAvailableModes([]);
    setAssignedMode('');
    setRateResult(null);
    setRateError('');
    setServiceabilityError('');
    setHasCheckedServiceability(false);
  }
  if (name === 'weight') {
  setShipmentWeight(value);
  setRateResult(null);
  setRateError('');
}
};
const fieldProps = {
  formData,
  handleChange,
};
 
const validateStep = () => {
  const d = formData;

  if (step === 0) {
    if (
      !/^\d{6}$/.test(d.pickupPincode) ||
      !/^\d{6}$/.test(d.deliveryPincode)
    ) {
      alert('Please enter valid six-digit pickup and delivery PIN codes.');
      return false;
    }

    if (!hasCheckedServiceability) {
      alert('Please check PIN code serviceability first.');
      return false;
    }

    if (!availableModes.length) {
      alert('No shipping mode is available for these PIN codes.');
      return false;
    }
    if (!rateResult) {
  alert('Please calculate shipping charges before continuing.');
  return false;
}
  }

  if (step === 1) {
    if (
      !d.pickupName.trim() ||
      !/^\d{10}$/.test(d.pickupPhone) ||
      !d.pickupAddress.trim() ||
      !d.pickupCity.trim()
    ) {
      alert('Please complete all required pickup details.');
      return false;
    }
  }

  if (step === 2) {
  if (
    !String(d.deliveryName || '').trim() ||
    !/^\d{10}$/.test(String(d.deliveryPhone || '').trim()) ||
    !String(d.deliveryAddress || '').trim() ||
    !String(d.deliveryCity || '').trim()
  ) {
    alert('Please complete all required delivery details.');
    return false;
  }

  if (
    alternateEnabled &&
    (
      !String(d.alternateName || '').trim() ||
      !/^\d{10}$/.test(String(d.alternatePhone || '').trim())
    )
  ) {
    alert('Please enter a valid alternate receiver name and mobile number.');
    return false;
  }
}

  if (step === 3) {
    if (!d.itemName.trim()) {
      alert('Please enter the product or item name.');
      return false;
    }

    if (!d.weight || !Number.isFinite(Number(d.weight)) ||
        Number(d.weight) < 0.5) {
      alert('Minimum parcel weight must be 0.5 kg.');
      return false;
    }

    if (!d.productValue || !Number.isFinite(Number(d.productValue)) ||
        Number(d.productValue) <= 0) {
      alert('Please enter a valid declared value.');
      return false;
    }

    if (d.shipmentType === 'NON_DOCUMENT' && !d.itemCategory) {
      alert('Please select an item category.');
      return false;
    }

    if (Number(d.quantity) < 1 ||
        !Number.isInteger(Number(d.quantity))) {
      alert('Please enter a valid quantity.');
      return false;
    }

    const dimensions = [d.length, d.width, d.height];

    if (dimensions.some(value =>
      value !== '' &&
      (!Number.isFinite(Number(value)) || Number(value) <= 0)
    )) {
      alert('Please enter valid parcel dimensions.');
      return false;
    }

    if (Number(shipmentWeight) !== Number(d.weight)) {
      alert('Your parcel weight has changed. Please go back to Shipment Route and recalculate the shipping charges.');
      return false;
    }
  }

  if (step === 4 && !sameRto) {
    if (
      !d.rtoName.trim() ||
      !/^\d{10}$/.test(d.rtoPhone) ||
      !d.rtoAddress.trim() ||
      !d.rtoCity.trim() ||
      !/^\d{6}$/.test(d.rtoPincode)
    ) {
      alert('Please complete the RTO address details.');
      return false;
    }
  }

  if (step === 5 && d.paymentMode === 'COD') {
    if (
      !d.codAmount ||
      !Number.isFinite(Number(d.codAmount)) ||
      Number(d.codAmount) <= 0
    ) {
      alert('Please enter a valid COD collection amount.');
      return false;
    }
  }

  return true;
};


const buildDraftPayload = () => {
  const d = formData;

  return {
    pickupName: d.pickupName,
    pickupPhone: d.pickupPhone,
    pickupAddress: d.pickupAddress,
    pickupCity: d.pickupCity,
    pickupPincode: d.pickupPincode,

    deliveryName: d.deliveryName,
    deliveryPhone: d.deliveryPhone,
    deliveryAddress: d.deliveryAddress,
    deliveryCity: d.deliveryCity,
    deliveryPincode: d.deliveryPincode,

    weight: shipmentWeight,
   productValue: Number(d.productValue),
    paymentMode: d.paymentMode,
    codAmount: d.paymentMode === 'COD' ? d.codAmount : null,

    shipmentType: d.shipmentType,
    itemCategory: d.itemCategory,
    itemName: d.itemName,
    itemDescription: d.itemDescription,

    sameRto,
    rtoName: sameRto ? null : d.rtoName,
    rtoPhone: sameRto ? null : d.rtoPhone,
    rtoAddress: sameRto ? null : d.rtoAddress,
    rtoCity: sameRto ? null : d.rtoCity,
    rtoPincode: sameRto ? null : d.rtoPincode,

    alternateEnabled,
    alternateName: alternateEnabled ? d.alternateName : null,
    alternatePhone: alternateEnabled ? d.alternatePhone : null,
    alternateRelation: alternateEnabled ? d.alternateRelation : null,

    pickupDate: d.pickupDate || null,
    preferredDeliveryDate: d.preferredDeliveryDate || null,

    quantity: Number(d.quantity || 1),
    length: d.length || null,
    width: d.width || null,
    height: d.height || null,

    shippingMode: rateMode,
    selectedCourier: rateMode.includes('AIR') ? 'SKYKING' : selectedCourier,
    quotedShippingCharge: rateResult?.total ?? null,
  };
};

const saveDraft = async (createNew = false) => {
  const token = sessionStorage.getItem('shipnextToken');

  if (!token) {
    navigate('/login');
    throw new Error('Please log in before saving your shipment.');
  }

  const id = createNew ? '' : draftId;

  const response = await fetch(
    id
      ? `${API_URL}/api/shipments/drafts/${id}`
      : `${API_URL}/api/shipments/drafts`,
    {
      method: id ? 'PUT' : 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(buildDraftPayload()),
    }
  );

  const data = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(data.message || 'Unable to save shipment details.');
  }

  const savedId = data.draft.id;

  setDraftId(savedId);
  sessionStorage.setItem('shipnextDraftId', savedId);

  return savedId;
};
const nextStep = async () => {
  if (!validateStep()) return;

  const shouldCreateDraft = step === 3 && !draftId;
  const shouldUpdateDraft = Boolean(draftId);

  if (shouldCreateDraft || shouldUpdateDraft) {
    try {
      setIsSubmitting(true);
      await saveDraft(shouldCreateDraft);
    } catch (error) {
      alert(error.message || 'Unable to save shipment details.');
      return;
    } finally {
      setIsSubmitting(false);
    }
  }

  setStep((prev) => Math.min(prev + 1, steps.length - 1));
};

  const previousStep = () => setStep((prev) => Math.max(prev - 1, 0));
const handleSubmit = async () => {
  if (!validateStep()) return;

  try {
    setIsSubmitting(true);

    const savedId = await saveDraft();

    navigate('/shipping-charges', {
      state: { draftId: savedId },
    });
  } catch (error) {
    alert(error.message || 'Unable to save shipment details.');
  } finally {
    setIsSubmitting(false);
  }
};
  return (
    <div className="sn-wizard-page">
      <header className="sn-wizard-header">
        <Link to="/dashboard">
          <img src="/logo.jpeg" alt="ShipNext" />
        </Link>
        <Link to="/dashboard">← Dashboard</Link>
      </header>

      <main className="sn-wizard-container">
        <div className="sn-wizard-top">
          <div>
            <span className="sn-wizard-eyebrow">SHIP WITH SHIPNEXT</span>
            <h1>Create Shipment</h1>
            <p>Complete each step to prepare your shipment.</p>
          </div>
          <Link to="/bulk-booking" className="sn-wizard-bulk">
            <span>▦</span> Bulk Booking →
          </Link>
        </div>

        <div className="sn-wizard-layout">
          <aside className="sn-wizard-sidebar">
            <div className="sn-wizard-progress-title">BOOKING PROGRESS</div>
            {steps.map((item, index) => (
              <button
                type="button"
                key={item.title}
                className={`sn-wizard-step ${step === index ? 'active' : ''} ${step > index ? 'completed' : ''}`}
                onClick={() => index < step && setStep(index)}
              >
                <span className="sn-wizard-step-number">
                  {step > index ? '✓' : index + 1}
                </span>
                <span className="sn-wizard-step-label">{item.title}</span>
              </button>
            ))}
            <div className="sn-wizard-progress-track">
              <div style={{ width: `${((step + 1) / steps.length) * 100}%` }} />
            </div>
            <small>Step {step + 1} of {steps.length}</small>
          </aside>

          <section className="sn-wizard-panel">
            <div className="sn-wizard-panel-heading">
              <span className="sn-wizard-panel-icon">{steps[step].icon}</span>
              <div>
                <h2>{steps[step].title}</h2>
                <p>{steps[step].subtitle}</p>
              </div>
            </div>

            <div className="sn-wizard-content">
              
{step === 0 && (
  <div className="sn-wizard-grid">

    {/* PIN CODE INPUTS */}
    <Field {...fieldProps}
      label="Pickup PIN Code"
      name="pickupPincode"
      placeholder="6-digit pickup PIN"
      inputMode="numeric"
      maxLength={6}
    />

    <Field {...fieldProps}
      label="Delivery PIN Code"
      name="deliveryPincode"
      placeholder="6-digit delivery PIN"
      inputMode="numeric"
      maxLength={6}
    />

    {/* CHECK SERVICEABILITY */}
    <div className="sn-wizard-full">
      <button
        type="button"
        className="sn-wizard-primary"
        onClick={handleServiceabilityCheck}
        disabled={checkingServiceability}
      >
        {checkingServiceability
          ? 'Checking PIN Codes...'
          : 'Check Serviceability →'}
      </button>
    </div>
    {/* PIN CODE LOCATIONS */}
{hasCheckedServiceability && (
  <div className="sn-wizard-full sn-booking-location-grid">

    <div className="sn-booking-location-card">
      <strong>Pickup Location</strong>
      {pickupLocation ? (
        <p>
          {pickupLocation.district || 'District unavailable'},
          {' '}
          {pickupLocation.stateCode || 'State unavailable'}
        </p>
      ) : (
        <p>Location details unavailable for this PIN.</p>
      )}
      <small>PIN: {formData.pickupPincode}</small>
    </div>

    <div className="sn-booking-location-card">
      <strong>Delivery Location</strong>
      {deliveryLocation ? (
        <p>
          {deliveryLocation.district || 'District unavailable'},
          {' '}
          {deliveryLocation.stateCode || 'State unavailable'}
        </p>
      ) : (
        <p>Location details unavailable for this PIN.</p>
      )}
      <small>PIN: {formData.deliveryPincode}</small>
    </div>

  </div>
)}

    {serviceabilityError && (
      <div className="sn-wizard-error sn-wizard-full">
        {serviceabilityError}
      </div>
    )}

    {/* SERVICEABILITY RESULTS */}
    {hasCheckedServiceability && (
     <div className="sn-booking-serviceability sn-wizard-full">

  <h3>ShipNext Serviceability Results</h3>

  <div className="sn-booking-courier-grid">
    {courierResults.map((item) => (
      <div className="sn-booking-courier-card" key={item.courier}>
        <strong>{courierNames[item.courier] || item.courier}</strong>
        <span className={item.serviceable ? 'available' : 'unavailable'}>
          {item.serviceable ? '✓ Available' : '✕ Unavailable'}
        </span>
      </div>
    ))}
  </div>

  <h4>Available Shipping Modes</h4>

  {availableModes.length > 0 ? (
    <div className="sn-booking-mode-grid">
      {availableModes.map((mode) => (
        <div className="sn-booking-mode-card" key={mode}>
          <span>{modeNames[mode] || mode}</span>
          {assignedMode === mode && (
            <small>Recommended</small>
          )}
        </div>
      ))}
    </div>
  ) : (
    <p>No shipping modes are available for these PIN codes.</p>
  )}


        {/* RATE CALCULATOR */}
        {availableModes.length > 0 && (
          <div className="sn-booking-rate">

            <h3>Calculate Shipping Charges</h3>
            <p>Choose your shipping mode, courier and parcel weight.</p>

            <div className="sn-wizard-grid">

              <div className="sn-wizard-field">
                <label>Shipping Mode *</label>
                <select
                  value={rateMode}
                  onChange={(e) => {
                    const newMode = e.target.value;

                    setRateMode(newMode);
                    setRateResult(null);
                    setRateError('');

                    if (newMode.includes('AIR')) {
                      setSelectedCourier('SKYKING');
                    } else {
                      setSelectedCourier(serviceableSurfaceCouriers[0] || '');
                    }
                  }}
                >
                  {availableModes.map((mode) => (
                    <option key={mode} value={mode}>
                      {modeNames[mode] || mode}
                    </option>
                  ))}
                  
                </select>
                
              </div>

              <div className="sn-wizard-field">
                <label>Courier Partner *</label>

                {rateMode.includes('AIR') ? (
                  <input value="Skyking" disabled />
                ) : serviceableSurfaceCouriers.length > 0 ? (
                  <select
                    value={selectedCourier}
                    onChange={(e) => {
                      setSelectedCourier(e.target.value);
                      setRateResult(null);
                      setRateError('');
                    }}
                  >
                    {serviceableSurfaceCouriers.map((courier) => (
                      <option key={courier} value={courier}>
                        {courierNames[courier]}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input value="No surface courier available" disabled />
                )}
              </div>

              <div className="sn-wizard-field">
                <label>Shipment Weight (kg) *</label>
                <input
                  type="number"
                  min="0.5"
                  step="0.01"
                  value={shipmentWeight}
                  onChange={(e) => {
                    setShipmentWeight(e.target.value);
                    setRateResult(null);
                    setRateError('');
                  }}
                  placeholder="Example: 0.5"
                />
              </div>

            </div>

            <button
              type="button"
              className="sn-wizard-primary"
              onClick={handleRateCalculation}
              disabled={
                !rateMode ||
                !shipmentWeight ||
                Number(shipmentWeight) < 0.5 ||
                (!rateMode.includes('AIR') &&
                  serviceableSurfaceCouriers.length === 0)
              }
            >
              Calculate Shipping Charges →
            </button>

            {rateError && (
              <div className="sn-wizard-error">{rateError}</div>
            )}

            {rateResult && (
              <div className="sn-booking-rate-result">

                <span>YOUR ESTIMATED SHIPPING CHARGE</span>

                <h2>
                  ₹{Number(rateResult.total).toFixed(2)}
                </h2>

                <div className="sn-booking-rate-details">
                  <p>
                    Shipping Mode:
                    <strong>{modeNames[rateResult.mode] || rateResult.mode}</strong>
                  </p>

                  <p>
                    Courier:
                    <strong>{courierNames[rateMode.includes('AIR') ? 'SKYKING' : selectedCourier]}</strong>
                  </p>

                  <p>
                    Chargeable Weight:
                    <strong>{rateResult.weight} kg</strong>
                  </p>

                  <p>
                    First 500g:
                    <strong>₹{Number(rateResult.base).toFixed(2)}</strong>
                  </p>

                  <p>
                    Additional Weight Charges:
                    <strong>₹{Number(rateResult.additionalCharge).toFixed(2)}</strong>
                  </p>
                </div>

                <small>
                  Estimated tariff. Final charges are subject to shipment verification and applicable fees.
                </small>

              </div>
            )}

          </div>
        )}

      </div>
    )}

  </div>
)}


              {step === 1 && (
                <div className="sn-wizard-grid">
                   <Field {...fieldProps} label="Pickup Contact Name" name="pickupName" />
                  <Field {...fieldProps} label="Contact Number" name="pickupPhone" type="tel" maxLength={10} />
                  <Area {...fieldProps} label="Pickup Address" name="pickupAddress" />
                  <Field {...fieldProps} label="City" name="pickupCity" />
                
                  <Field {...fieldProps} label="Preferred Pickup Date" name="pickupDate" type="date" required={false} />
                </div>
              )}

              {step === 2 && (
                <div className="sn-wizard-grid">
                  <Field {...fieldProps} label="Receiver Full Name" name="deliveryName" />
                  <Field {...fieldProps} label="Contact Number" name="deliveryPhone" type="tel" maxLength={10} />
                  <Area {...fieldProps} label="Delivery Address" name="deliveryAddress" />
                  <Field {...fieldProps} label="City" name="deliveryCity" />
                   
                  <Field {...fieldProps} label="Preferred Delivery Date" name="preferredDeliveryDate" type="date" required={false} />

                  <div className="sn-wizard-full sn-wizard-subsection">
                    <label className="sn-wizard-checkbox">
                      <input type="checkbox" checked={alternateEnabled} onChange={(e) => setAlternateEnabled(e.target.checked)} />
                      Add alternate receiver (optional)
                    </label>
                  </div>

                  {alternateEnabled && (
                    <>
                      <Field {...fieldProps} label="Alternate Person Name" name="alternateName" />
                      <Field {...fieldProps} label="Alternate Mobile Number" name="alternatePhone" type="tel" maxLength={10} />
                      <Field {...fieldProps} label="Relationship" name="alternateRelation" required={false} />
                    </>
                  )}
                </div>
              )}

              {step === 3 && (
                <div className="sn-wizard-grid">
                  <Select {...fieldProps} label="Shipment Type" name="shipmentType">
                    <option value="DOCUMENT">Documents</option>
                    <option value="NON_DOCUMENT">Non-Documents</option>
                  </Select>
                  <Field {...fieldProps} label="Product / Item Name" name="itemName" />
                  {formData.shipmentType === 'NON_DOCUMENT' && (
                    <>
                      <Select {...fieldProps} label="Item Category" name="itemCategory">
                        <option value="">Select category</option>
                        <option>Clothes</option>
                        <option>Electronics</option>
                        <option>Accessories</option>
                        <option>Household Items</option>
                        <option>Gifts</option>
                        <option>Other</option>
                      </Select>
                      <div className="sn-wizard-field">
                        <label>Item Description</label>
                        <textarea name="itemDescription" rows={3} value={formData.itemDescription} onChange={handleChange} />
                      </div>
                    </>
                  )}
                  <Field {...fieldProps} label="Quantity" name="quantity" type="number" min="1" />
                  <Field {...fieldProps} label="Weight (kg) – Minimum 0.5 kg" name="weight" type="number" min="0.5" step="0.01" />
                  <Field {...fieldProps} label="Declared Value (₹)" name="productValue" type="number" min="1" step="0.01" />
                  <div className="sn-wizard-full sn-wizard-subsection">Parcel dimensions (cm) – Optional</div>
                  <Field {...fieldProps} label="Length" name="length" type="number" required={false} />
                  <Field {...fieldProps} label="Width" name="width" type="number" required={false} />
                  <Field {...fieldProps} label="Height" name="height" type="number" required={false} />
                </div>
              )}

              {step === 4 && (
                <>
                  <label className="sn-wizard-checkbox sn-wizard-rto-toggle">
                    <input type="checkbox" checked={sameRto} onChange={(e) => setSameRto(e.target.checked)} />
                    Use pickup address as RTO address
                  </label>
                  {!sameRto && (
                    <div className="sn-wizard-grid sn-wizard-rto-grid">
                      <Field {...fieldProps} label="RTO Contact Name" name="rtoName" />
                      <Field {...fieldProps} label="RTO Contact Number" name="rtoPhone" type="tel" maxLength={10} />
                      <Area {...fieldProps} label="RTO Address" name="rtoAddress" />
                      <Field {...fieldProps} label="RTO City" name="rtoCity" />
                      <Field {...fieldProps} label="RTO PIN Code" name="rtoPincode" maxLength={6} />
                    </div>
                  )}
                  {sameRto && (
                    <div className="sn-wizard-info">
                      Your pickup address will be used as the return address.
                    </div>
                  )}
                </>
              )}

              {step === 5 && (
                <div className="sn-wizard-payment">
                  <label className={`sn-wizard-payment-card ${formData.paymentMode === 'PREPAID' ? 'selected' : ''}`}>
                    <input type="radio" name="paymentMode" value="PREPAID" checked={formData.paymentMode === 'PREPAID'} onChange={handleChange} />
                    <span className="sn-wizard-radio" />
                    <span><strong>Prepaid</strong><small>Payment made in advance</small></span>
                  </label>

                  <label className={`sn-wizard-payment-card ${formData.paymentMode === 'COD' ? 'selected' : ''}`}>
                    <input type="radio" name="paymentMode" value="COD" checked={formData.paymentMode === 'COD'} onChange={handleChange} />
                    <span className="sn-wizard-radio" />
                    <span><strong>Cash on Delivery (COD)</strong><small>Receiver pays on delivery</small></span>
                  </label>

                  {formData.paymentMode === 'COD' && (
                    <div className="sn-wizard-field sn-wizard-cod">
                      <label>COD Collection Amount (₹) *</label>
                      <input type="number" name="codAmount" min="0.01" step="0.01" value={formData.codAmount} onChange={handleChange} placeholder="Enter amount to collect" />
                    </div>
                  )}

                  <div className="sn-wizard-info">
                    Your selected shipping mode and calculated shipping charge are already saved. Continue to review your final amount and complete payment.
                  </div>
                </div>
              )}
            </div>

            <div className="sn-wizard-actions">
              <button type="button" className="sn-wizard-back" onClick={previousStep} disabled={step === 0}>
                ← Back
              </button>

              {step < steps.length - 1 ? (
                <button
  type="button"
  className="sn-wizard-next"
  onClick={nextStep}
  disabled={isSubmitting}
>
  {isSubmitting ? 'Saving Details...' : 'Save & Continue →'}
</button>
              ) : (
               <button
  type="button"
  className="sn-wizard-next"
  onClick={handleSubmit}
  disabled={isSubmitting}
>
  {isSubmitting
    ? 'Saving Shipment...'
    : 'Continue to Payment →'}
</button>
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

export default BookShipment;
