
import { useState } from 'react';
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

const Area = ({
  label,
  name,
  required = true,
  formData,
  handleChange,
}) => (
  <div className="sn-wizard-field sn-wizard-full">
    <label htmlFor={name}>
      {label}{required ? ' *' : ''}
    </label>
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

const Select = ({
  label,
  name,
  children,
  formData,
  handleChange,
}) => (
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
  const [pickupLocation, setPickupLocation] = useState(null);
  const [deliveryLocation, setDeliveryLocation] = useState(null);

  // SHIPPING RATE CALCULATOR
  const [rateMode, setRateMode] = useState('EXPRESS_AIR');
  const [selectedCourier, setSelectedCourier] = useState('SKYKING');
  const [shipmentWeight, setShipmentWeight] = useState('0.5');
  const [rateResult, setRateResult] = useState(null);
  const [rateError, setRateError] = useState('');
const [bookingTab, setBookingTab] = useState('single');
  // COURIER OPTIONS
  const serviceableSurfaceCouriers = courierResults
    .filter((item) => item.serviceable)
    .map((item) => item.courier)
    .filter((courier) =>
      ['DELHIVERY', 'BLUEDART', 'SHADOWFAX'].includes(courier)
    );

  // PACKAGE WEIGHT CALCULATIONS
  const deadWeight = Number(formData.weight) || 0;
  const length = Number(formData.length) || 0;
  const width = Number(formData.width) || 0;
  const height = Number(formData.height) || 0;

  // Volumetric divisor used for the displayed estimate.
  // Confirm your courier-specific divisor before using this for final billing.
  const volumetricWeight =
    length > 0 && width > 0 && height > 0
      ? (length * width * height) / 5000
      : 0;

  const applicableWeight = Math.max(deadWeight, volumetricWeight);

  const update = (name, value) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
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
      setPickupLocation(null);
      setDeliveryLocation(null);
    }

    if (name === 'weight') {
      setShipmentWeight(value);
      setRateResult(null);
      setRateError('');
    }

    if (['length', 'width', 'height'].includes(name)) {
      setRateResult(null);
      setRateError('');
    }
  };

  const fieldProps = {
    formData,
    handleChange,
  };

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

      if (!response.ok) {
        throw new Error(
          data.message || 'Unable to check PIN-code serviceability.'
        );
      }

      setPickupLocation(data.pickupLocation || null);
      setDeliveryLocation(data.deliveryLocation || null);

      const results = data.courierResults || [];
      setCourierResults(results);

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
        throw new Error(
          modeData.message || 'Service is unavailable for these PIN codes.'
        );
      }

      if (!modeResponse.ok || !modeData.success) {
        throw new Error(
          modeData.message || 'Unable to check available shipping modes.'
        );
      }

      const modes = Array.isArray(modeData.availableModes)
        ? modeData.availableModes
        : [];

      setAvailableModes(modes);
      setAssignedMode(modeData.assignedMode || '');

      const defaultMode =
        modeData.assignedMode && modes.includes(modeData.assignedMode)
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
        throw new Error(
          'This shipping mode is not available for these PIN codes.'
        );
      }

      if (
        !rateMode.includes('AIR') &&
        !serviceableSurfaceCouriers.includes(selectedCourier)
      ) {
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
        throw new Error(
          data.message || 'Unable to calculate shipping charges.'
        );
      }

      setRateResult(data);
    } catch (error) {
      setRateError(
        error.message || 'Unable to calculate shipping charges.'
      );
    }
  };

  const handleRateCalculation = (e) => {
    e.preventDefault();
    calculateRate();
  };

  // VALIDATION
  const validateStep = (stepToValidate) => {
    const d = formData;

    if (stepToValidate === 0) {
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

    if (stepToValidate === 1) {
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

    if (stepToValidate === 2) {
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
        alert(
          'Please enter a valid alternate receiver name and mobile number.'
        );
        return false;
      }
    }

    if (stepToValidate === 3 && d.paymentMode === 'COD') {
      if (
        !d.codAmount ||
        !Number.isFinite(Number(d.codAmount)) ||
        Number(d.codAmount) <= 0
      ) {
        alert('Please enter a valid COD collection amount.');
        return false;
      }
    }

    if (stepToValidate === 4) {
      if (!d.itemName.trim()) {
        alert('Please enter the product or item name.');
        return false;
      }

      if (
        !d.productValue ||
        !Number.isFinite(Number(d.productValue)) ||
        Number(d.productValue) <= 0
      ) {
        alert('Please enter a valid declared value.');
        return false;
      }

      if (d.shipmentType === 'NON_DOCUMENT' && !d.itemCategory) {
        alert('Please select an item category.');
        return false;
      }

      if (
        Number(d.quantity) < 1 ||
        !Number.isInteger(Number(d.quantity))
      ) {
        alert('Please enter a valid quantity.');
        return false;
      }
    }

    if (stepToValidate === 5) {
      if (
        !d.weight ||
        !Number.isFinite(Number(d.weight)) ||
        Number(d.weight) < 0.5
      ) {
        alert('Minimum parcel weight must be 0.5 kg.');
        return false;
      }

      const dimensions = [d.length, d.width, d.height];

      if (
        dimensions.some((value) =>
          value !== '' &&
          (!Number.isFinite(Number(value)) || Number(value) <= 0)
        )
      ) {
        alert('Please enter valid parcel dimensions.');
        return false;
      }

      if (Number(shipmentWeight) !== Number(d.weight)) {
        alert(
          'Your parcel weight has changed. Please recalculate shipping charges.'
        );
        return false;
      }
    }

    if (stepToValidate === 6 && !sameRto) {
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

    return true;
  };

  // BUILD DRAFT PAYLOAD
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

  // SAVE DRAFT
  const saveDraft = async () => {
    const token = sessionStorage.getItem('shipnextToken');

    if (!token) {
      navigate('/login');
      throw new Error('Please log in before saving your shipment.');
    }

    const response = await fetch(
      draftId
        ? `${API_URL}/api/shipments/drafts/${draftId}`
        : `${API_URL}/api/shipments/drafts`,
      {
        method: draftId ? 'PUT' : 'POST',
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

  // FINAL SUBMISSION
  const handleSubmit = async () => {
    for (let currentStep = 0; currentStep <= 6; currentStep++) {
      if (!validateStep(currentStep)) {
        return;
      }
    }

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

                  {/* PAGE HEADER */}
<div className="sn-wizard-top">
  <div>
    <span className="sn-wizard-eyebrow">SHIP WITH SHIPNEXT</span>
    <h1>
      {bookingTab === 'single' ? 'Create Shipment' : 'Bulk Booking'}
    </h1>
    <p>
      {bookingTab === 'single'
        ? 'Enter your shipment details below to create an order.'
        : 'Upload multiple shipment details and create orders together.'}
    </p>
  </div>

   <div className="sn-booking-tabs">
  <button
    type="button"
    className={bookingTab === 'single' ? 'active' : ''}
    onClick={() => setBookingTab('single')}
  >
    Single Order
  </button>

  <button
    type="button"
    className={bookingTab === 'bulk' ? 'active' : ''}
    onClick={() => setBookingTab('bulk')}
  >
    Bulk Booking
  </button>
</div>
</div>

{/* BOOKING CONTENT */}
<div className="sn-wizard-layout">
  <section className="sn-wizard-panel">

    {/* SINGLE ORDER TAB */}
    {bookingTab === 'single' && (
      <>
        <div className="sn-wizard-panel-heading">
          <div>
            <h2>Single Order</h2>
            <p>Complete all sections to prepare your shipment.</p>
          </div>
        </div>

        <div className="sn-wizard-content">

          {/* 1. PIN CODE SERVICEABILITY */}
              
              <section className="sn-booking-section">
                <div className="sn-booking-section-title">
                  <span>01</span>
                  <div>
                    <h2>PIN Code Serviceability & Shipping Charges</h2>
                    <p>Check your route and calculate the shipping charges.</p>
                  </div>
                </div>

                <div className="sn-wizard-grid">
                  <Field
                    {...fieldProps}
                    label="Pickup PIN Code"
                    name="pickupPincode"
                    placeholder="6-digit pickup PIN"
                    inputMode="numeric"
                    maxLength={6}
                  />

                  <Field
                    {...fieldProps}
                    label="Delivery PIN Code"
                    name="deliveryPincode"
                    placeholder="6-digit delivery PIN"
                    inputMode="numeric"
                    maxLength={6}
                  />

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

                  {serviceabilityError && (
                    <div className="sn-wizard-error sn-wizard-full">
                      {serviceabilityError}
                    </div>
                  )}

                  {hasCheckedServiceability && (
                    <>
                      <div className="sn-wizard-full sn-booking-location-grid">
                        <div className="sn-booking-location-card">
                          <strong>Pickup Location</strong>
                          <p>
                            {pickupLocation
                              ? `${pickupLocation.district || 'District unavailable'}, ${pickupLocation.stateCode || 'State unavailable'}`
                              : 'Location details unavailable'}
                          </p>
                          <small>PIN: {formData.pickupPincode}</small>
                        </div>

                        <div className="sn-booking-location-card">
                          <strong>Delivery Location</strong>
                          <p>
                            {deliveryLocation
                              ? `${deliveryLocation.district || 'District unavailable'}, ${deliveryLocation.stateCode || 'State unavailable'}`
                              : 'Location details unavailable'}
                          </p>
                          <small>PIN: {formData.deliveryPincode}</small>
                        </div>
                      </div>

                      <div className="sn-booking-serviceability sn-wizard-full">
                        <h3>ShipNext Serviceability Results</h3>

                        <div className="sn-booking-courier-grid">
                          {courierResults.map((item) => (
                            <div
                              className="sn-booking-courier-card"
                              key={item.courier}
                            >
                              <strong>
                                {courierNames[item.courier] || item.courier}
                              </strong>
                              <span className={
                                item.serviceable ? 'available' : 'unavailable'
                              }>
                                {item.serviceable
                                  ? '✓ Available'
                                  : '✕ Unavailable'}
                              </span>
                            </div>
                          ))}
                        </div>

                        <h4>Available Shipping Modes</h4>

                        {availableModes.length > 0 ? (
                          <div className="sn-booking-mode-grid">
                            {availableModes.map((mode) => (
                              <div
                                className="sn-booking-mode-card"
                                key={mode}
                              >
                                <span>{modeNames[mode] || mode}</span>
                                {assignedMode === mode && (
                                  <small>Recommended</small>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p>No shipping modes are available.</p>
                        )}

                        {availableModes.length > 0 && (
                          <div className="sn-booking-rate">
                            <h3>Calculate Shipping Charges</h3>
                            <p>
                              Select your shipping mode, courier and parcel weight.
                            </p>

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
                                      setSelectedCourier(
                                        serviceableSurfaceCouriers[0] || ''
                                      );
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
                                  <input
                                    value="No surface courier available"
                                    disabled
                                  />
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
                                (
                                  !rateMode.includes('AIR') &&
                                  serviceableSurfaceCouriers.length === 0
                                )
                              }
                            >
                              Calculate Shipping Charges →
                            </button>

                            {rateError && (
                              <div className="sn-wizard-error">
                                {rateError}
                              </div>
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
                                    <strong>
                                      {modeNames[rateResult.mode] || rateResult.mode}
                                    </strong>
                                  </p>
                                  <p>
                                    Courier:
                                    <strong>
                                      {courierNames[
                                        rateMode.includes('AIR')
                                          ? 'SKYKING'
                                          : selectedCourier
                                      ]}
                                    </strong>
                                  </p>
                                  <p>
                                    Chargeable Weight:
                                    <strong>{rateResult.weight} kg</strong>
                                  </p>
                                  <p>
                                    First 500g:
                                    <strong>
                                      ₹{Number(rateResult.base).toFixed(2)}
                                    </strong>
                                  </p>
                                  <p>
                                    Additional Weight Charges:
                                    <strong>
                                      ₹{Number(rateResult.additionalCharge).toFixed(2)}
                                    </strong>
                                  </p>
                                </div>

                                <small>
                                  Estimated tariff. Final charges are subject
                                  to shipment verification and applicable fees.
                                </small>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </section>

              {/* 2. PICKUP ADDRESS */}
              <section className="sn-booking-section">
                <div className="sn-booking-section-title">
                  <span>02</span>
                  <div>
                    <h2>Pickup Address</h2>
                    <p>Enter the sender and pickup address details.</p>
                  </div>
                </div>

                <div className="sn-wizard-grid">
                  <Field
                    {...fieldProps}
                    label="Pickup Contact Name"
                    name="pickupName"
                  />
                  <Field
                    {...fieldProps}
                    label="Contact Number"
                    name="pickupPhone"
                    type="tel"
                    maxLength={10}
                    inputMode="numeric"
                  />
                  <Area
                    {...fieldProps}
                    label="Pickup Address"
                    name="pickupAddress"
                  />
                  <Field
                    {...fieldProps}
                    label="City"
                    name="pickupCity"
                  />
                  <Field
                    {...fieldProps}
                    label="Preferred Pickup Date"
                    name="pickupDate"
                    type="date"
                    required={false}
                  />
                </div>
              </section>

              {/* 3. DELIVERY DETAILS */}
              <section className="sn-booking-section">
                <div className="sn-booking-section-title">
                  <span>03</span>
                  <div>
                    <h2>Delivery Details</h2>
                    <p>Enter the receiver's delivery information.</p>
                  </div>
                </div>

                <div className="sn-wizard-grid">
                  <Field
                    {...fieldProps}
                    label="Receiver Full Name"
                    name="deliveryName"
                  />
                  <Field
                    {...fieldProps}
                    label="Contact Number"
                    name="deliveryPhone"
                    type="tel"
                    maxLength={10}
                    inputMode="numeric"
                  />
                  <Area
                    {...fieldProps}
                    label="Delivery Address"
                    name="deliveryAddress"
                  />
                  <Field
                    {...fieldProps}
                    label="City"
                    name="deliveryCity"
                  />
                  <Field
                    {...fieldProps}
                    label="Preferred Delivery Date"
                    name="preferredDeliveryDate"
                    type="date"
                    required={false}
                  />

                  <div className="sn-wizard-full sn-wizard-subsection">
                    <label className="sn-wizard-checkbox">
                      <input
                        type="checkbox"
                        checked={alternateEnabled}
                        onChange={(e) =>
                          setAlternateEnabled(e.target.checked)
                        }
                      />
                      Add alternate receiver (optional)
                    </label>
                  </div>

                  {alternateEnabled && (
                    <>
                      <Field
                        {...fieldProps}
                        label="Alternate Person Name"
                        name="alternateName"
                      />
                      <Field
                        {...fieldProps}
                        label="Alternate Mobile Number"
                        name="alternatePhone"
                        type="tel"
                        maxLength={10}
                      />
                      <Field
                        {...fieldProps}
                        label="Relationship"
                        name="alternateRelation"
                        required={false}
                      />
                    </>
                  )}
                </div>
              </section>

              {/* 4. PAYMENT METHOD */}
              <section className="sn-booking-section">
                <div className="sn-booking-section-title">
                  <span>04</span>
                  <div>
                    <h2>Payment Method</h2>
                    <p>Select the payment mode chosen by your buyer.</p>
                  </div>
                </div>

                <div className="sn-wizard-payment">
                  <label className={`sn-wizard-payment-card ${
                    formData.paymentMode === 'PREPAID' ? 'selected' : ''
                  }`}>
                    <input
                      type="radio"
                      name="paymentMode"
                      value="PREPAID"
                      checked={formData.paymentMode === 'PREPAID'}
                      onChange={handleChange}
                    />
                    <span className="sn-wizard-radio" />
                    <span>
                      <strong>Prepaid</strong>
                      <small>Payment made in advance</small>
                    </span>
                  </label>

                  <label className={`sn-wizard-payment-card ${
                    formData.paymentMode === 'COD' ? 'selected' : ''
                  }`}>
                    <input
                      type="radio"
                      name="paymentMode"
                      value="COD"
                      checked={formData.paymentMode === 'COD'}
                      onChange={handleChange}
                    />
                    <span className="sn-wizard-radio" />
                    <span>
                      <strong>Cash on Delivery (COD)</strong>
                      <small>Receiver pays on delivery</small>
                    </span>
                  </label>

                  {formData.paymentMode === 'COD' && (
                    <div className="sn-wizard-field sn-wizard-cod">
                      <label>COD Collection Amount (₹) *</label>
                      <input
                        type="number"
                        name="codAmount"
                        min="0.01"
                        step="0.01"
                        value={formData.codAmount}
                        onChange={handleChange}
                        placeholder="Enter amount to collect"
                      />
                    </div>
                  )}

                  <div className="sn-wizard-info">
                    COD shipments do not deduct shipping charges from your
                    ShipNext wallet. Prepaid bookings follow the existing
                    ShipNext wallet payment process.
                  </div>
                </div>
              </section>

              {/* 5. PRODUCT DETAILS */}
              <section className="sn-booking-section">
                <div className="sn-booking-section-title">
                  <span>05</span>
                  <div>
                    <h2>Product Details</h2>
                    <p>Enter the details of the item being shipped.</p>
                  </div>
                </div>

                <div className="sn-wizard-grid">
                  <Select {...fieldProps} label="Shipment Type" name="shipmentType">
                    <option value="DOCUMENT">Documents</option>
                    <option value="NON_DOCUMENT">Non-Documents</option>
                  </Select>

                  <Field
                    {...fieldProps}
                    label="Product / Item Name"
                    name="itemName"
                  />

                  {formData.shipmentType === 'NON_DOCUMENT' && (
                    <>
                      <Select
                        {...fieldProps}
                        label="Item Category"
                        name="itemCategory"
                      >
                        <option value="">Select category</option>
                        <option value="Clothes">Clothes</option>
                        <option value="Electronics">Electronics</option>
                        <option value="Accessories">Accessories</option>
                        <option value="Household Items">Household Items</option>
                        <option value="Gifts">Gifts</option>
                        <option value="Other">Other</option>
                      </Select>

                      <div className="sn-wizard-field">
                        <label>Item Description</label>
                        <textarea
                          name="itemDescription"
                          rows={3}
                          value={formData.itemDescription}
                          onChange={handleChange}
                        />
                      </div>
                    </>
                  )}

                  <Field
                    {...fieldProps}
                    label="Quantity"
                    name="quantity"
                    type="number"
                    min="1"
                  />

                  <Field
                    {...fieldProps}
                    label="Declared Value (₹)"
                    name="productValue"
                    type="number"
                    min="1"
                    step="0.01"
                  />
                </div>
              </section>

              {/* 6. PACKAGE DETAILS */}
              <section className="sn-booking-section">
                <div className="sn-booking-section-title">
                  <span>06</span>
                  <div>
                    <h2>Package Details</h2>
                    <p>
                      Enter the physical weight and dimensions of the final
                      packed parcel.
                    </p>
                  </div>
                </div>

                <div className="sn-wizard-grid">
                  <Field
                    {...fieldProps}
                    label="Dead Weight (kg) – Minimum 0.5 kg"
                    name="weight"
                    type="number"
                    min="0.5"
                    step="0.01"
                  />

                  <Field
                    {...fieldProps}
                    label="Length (cm)"
                    name="length"
                    type="number"
                    min="0.01"
                    step="0.01"
                    required={false}
                  />

                  <Field
                    {...fieldProps}
                    label="Width (cm)"
                    name="width"
                    type="number"
                    min="0.01"
                    step="0.01"
                    required={false}
                  />

                  <Field
                    {...fieldProps}
                    label="Height (cm)"
                    name="height"
                    type="number"
                    min="0.01"
                    step="0.01"
                    required={false}
                  />

                  <div className="sn-wizard-full sn-booking-weight-summary">
                    <div>
                      <span>Dead Weight</span>
                      <strong>{deadWeight.toFixed(2)} kg</strong>
                    </div>
                    <div>
                      <span>Volumetric Weight</span>
                      <strong>{volumetricWeight.toFixed(2)} kg</strong>
                    </div>
                    <div>
                      <span>Applicable Weight</span>
                      <strong>{applicableWeight.toFixed(2)} kg</strong>
                    </div>
                    <small>
                      Applicable weight is the higher of dead weight or
                      volumetric weight. The displayed volumetric estimate
                      uses a divisor of 5000; actual courier billing rules
                      may differ.
                    </small>
                  </div>
                </div>
              </section>

              {/* 7. RTO DETAILS */}
              <section className="sn-booking-section">
                <div className="sn-booking-section-title">
                  <span>07</span>
                  <div>
                    <h2>RTO Details</h2>
                    <p>Choose the return-to-origin address for this shipment.</p>
                  </div>
                </div>

                <label className="sn-wizard-checkbox sn-wizard-rto-toggle">
                  <input
                    type="checkbox"
                    checked={sameRto}
                    onChange={(e) => setSameRto(e.target.checked)}
                  />
                  Use pickup address as RTO address
                </label>

                {!sameRto && (
                  <div className="sn-wizard-grid sn-wizard-rto-grid">
                    <Field
                      {...fieldProps}
                      label="RTO Contact Name"
                      name="rtoName"
                    />
                    <Field
                      {...fieldProps}
                      label="RTO Contact Number"
                      name="rtoPhone"
                      type="tel"
                      maxLength={10}
                    />
                    <Area
                      {...fieldProps}
                      label="RTO Address"
                      name="rtoAddress"
                    />
                    <Field
                      {...fieldProps}
                      label="RTO City"
                      name="rtoCity"
                    />
                    <Field
                      {...fieldProps}
                      label="RTO PIN Code"
                      name="rtoPincode"
                      maxLength={6}
                      inputMode="numeric"
                    />
                  </div>
                )}

                {sameRto && (
                  <div className="sn-wizard-info">
                    Your pickup address will be used as the return address.
                  </div>
                )}
              </section>

            

            </div>

                     {/* FINAL ACTION */}
            <div className="sn-wizard-actions">
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
            </div>

                 
        </>
      )}

      {bookingTab === 'bulk' && (
        <>
          <div className="sn-wizard-panel-heading">
            <div>
              <h2>Bulk Booking</h2>
              <p>Upload multiple shipments and create orders together.</p>
            </div>
          </div>

          <div className="sn-wizard-content">
            <div className="sn-booking-section">
              <h2>Bulk Shipment Booking</h2>
              <p>Upload your Excel or CSV file to create multiple shipments.</p>

              <Link to="/bulk-booking" className="sn-wizard-next">
                Open Bulk Booking →
              </Link>
            </div>
          </div>
        </>
      )}

    </section>
  </div>
</main>
</div>
);
}

export default BookShipment;