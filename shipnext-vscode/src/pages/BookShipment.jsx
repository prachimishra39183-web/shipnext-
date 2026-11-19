
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import API_URL from '../config/api';

function BookShipment() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    pickupName: '',
    pickupPhone: '',
    pickupAddress: '',
    pickupPincode: '',
    deliveryName: '',
    deliveryPhone: '',
    deliveryAddress: '',
    deliveryPincode: '',
    weight: '',
    paymentMode: 'PREPAID',
codAmount: '',
    shipmentType: 'DOCUMENT',
    itemCategory: '',
    itemName: '',
    itemDescription: '',
  });

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (Number(formData.weight) < 0.5) {
      alert('Minimum parcel weight is 500 grams (0.5 kg).');
      return;
    }
if (
  formData.paymentMode === 'COD' &&
  (!formData.codAmount ||
    !Number.isFinite(Number(formData.codAmount)) ||
    Number(formData.codAmount) <= 0 ||
    !/^\d+(\.\d{1,2})?$/.test(formData.codAmount))
) {
  alert('Enter a valid COD amount greater than ₹0.');
  return;
}
    if (!/^\d{6}$/.test(formData.pickupPincode)) {
      alert('Enter a valid six-digit pickup PIN code.');
      return;
    }

    if (!/^\d{6}$/.test(formData.deliveryPincode)) {
      alert('Enter a valid six-digit delivery PIN code.');
      return;
    }

    const token = sessionStorage.getItem('shipnextToken');

    if (!token) {
      alert('Please log in before booking a shipment.');
      navigate('/login');
      return;
    }

    try {
      setIsSubmitting(true);

      const response = await fetch(
        `${API_URL}/api/shipments/drafts`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
         body: JSON.stringify({
  ...formData,
  codAmount:
    formData.paymentMode === 'COD'
      ? formData.codAmount
      : null,
}),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || 'Unable to save shipment details.'
        );
      }

      sessionStorage.setItem('shipnextDraftId', data.draft.id);

      navigate('/shipping-charges', {
        state: {
          draftId: data.draft.id,
        },
      });

    } catch (error) {
      alert(error.message || 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="booking-page">

      <header className="booking-header">
        <img
          src="/logo.jpeg"
          alt="ShipNext Logo"
          className="logo-image"
        />

        <Link to="/dashboard" className="booking-back">
          ← Back to Dashboard
        </Link>
      </header>

      <main className="booking-container">

        <div className="booking-heading">
          <span>SHIP WITH SHIPNEXT</span>
          <h1>Book a Shipment</h1>
          <p>Enter your pickup, delivery and parcel details.</p>
        </div>

        <form className="booking-form" onSubmit={handleSubmit}>
           
{/* PAYMENT DETAILS */}
<section className="booking-section">
  <h2>Payment Details</h2>

  <div className="booking-grid">
    <div className="booking-field full-width">
      <label>Choose Payment Mode</label>

      <div className="booking-options">
        <label>
          <input
            type="radio"
            name="paymentMode"
            value="PREPAID"
            checked={formData.paymentMode === 'PREPAID'}
            onChange={handleChange}
          />
          Prepaid
        </label>

        <label>
          <input
            type="radio"
            name="paymentMode"
            value="COD"
            checked={formData.paymentMode === 'COD'}
            onChange={handleChange}
          />
          Cash on Delivery (COD)
        </label>
      </div>
    </div>

    {formData.paymentMode === 'COD' && (
      <>
        <div className="booking-field full-width">
          <label>COD Amount (₹)</label>
          <input
            type="number"
            name="codAmount"
            min="0.01"
            step="0.01"
            value={formData.codAmount}
            onChange={handleChange}
            placeholder="Enter amount to collect from receiver"
            required
          />
          <small>
            Enter the exact amount the delivery recipient must pay.
          </small>
        </div>

        <div className="booking-field full-width">
          <div className="cod-option-a-notice">
            <strong>ShipNext COD — Direct Merchant Settlement</strong>
            <p>
              The courier partner collects the COD amount from the
              recipient and remits it directly to your registered
              merchant bank account. ShipNext tracks the collection
              and remittance status. ShipNext does not hold your COD funds.
            </p>
          </div>
        </div>
      </>
    )}
  </div>
</section>



          {/* PICKUP DETAILS */}
          <section className="booking-section">
            <h2>📍 Pickup Details</h2>

            <div className="booking-grid">

              <div className="booking-field">
                <label>Sender Name</label>
                <input
                  name="pickupName"
                  value={formData.pickupName}
                  onChange={handleChange}
                  placeholder="Enter sender name"
                  required
                />
              </div>

              <div className="booking-field">
                <label>Sender Mobile Number</label>
                <input
                  name="pickupPhone"
                  type="tel"
                  pattern="[0-9]{10}"
                  maxLength={10}
                  value={formData.pickupPhone}
                  onChange={handleChange}
                  placeholder="10-digit mobile number"
                  required
                />
              </div>

              <div className="booking-field full-width">
                <label>Pickup Address</label>
                <textarea
                  name="pickupAddress"
                  value={formData.pickupAddress}
                  onChange={handleChange}
                  placeholder="House number, street, area, landmark"
                  required
                />
              </div>

              <div className="booking-field">
                <label>Pickup PIN Code</label>
                <input
                  name="pickupPincode"
                  inputMode="numeric"
                  pattern="[0-9]{6}"
                  maxLength={6}
                  value={formData.pickupPincode}
                  onChange={handleChange}
                  placeholder="6-digit PIN code"
                  required
                />
              </div>

            </div>
          </section>

          {/* DELIVERY DETAILS */}
          <section className="booking-section">
            <h2>📦 Delivery Details</h2>

            <div className="booking-grid">

              <div className="booking-field">
                <label>Receiver Name</label>
                <input
                  name="deliveryName"
                  value={formData.deliveryName}
                  onChange={handleChange}
                  placeholder="Enter receiver name"
                  required
                />
              </div>

              <div className="booking-field">
                <label>Receiver Mobile Number</label>
                <input
                  name="deliveryPhone"
                  type="tel"
                  pattern="[0-9]{10}"
                  maxLength={10}
                  value={formData.deliveryPhone}
                  onChange={handleChange}
                  placeholder="10-digit mobile number"
                  required
                />
              </div>

              <div className="booking-field full-width">
                <label>Delivery Address</label>
                <textarea
                  name="deliveryAddress"
                  value={formData.deliveryAddress}
                  onChange={handleChange}
                  placeholder="House number, street, area, landmark"
                  required
                />
              </div>

              <div className="booking-field">
                <label>Delivery PIN Code</label>
                <input
                  name="deliveryPincode"
                  inputMode="numeric"
                  pattern="[0-9]{6}"
                  maxLength={6}
                  value={formData.deliveryPincode}
                  onChange={handleChange}
                  placeholder="6-digit PIN code"
                  required
                />
              </div>

            </div>
          </section>

          {/* PARCEL DETAILS */}
          <section className="booking-section">
            <h2>📦 Parcel Details</h2>

            <div className="booking-grid">

              <div className="booking-field">
                <label>Parcel Weight (kg)</label>
                <input
                  name="weight"
                  type="number"
                  min="0.5"
                  step="0.1"
                  value={formData.weight}
                  onChange={handleChange}
                  placeholder="Minimum 0.5 kg"
                  required
                />
                <small>Minimum booking weight: 500 grams.</small>
              </div>

              <div className="booking-field full-width">
                <label>Shipment Type</label>

                <div className="booking-options">

                  <label>
                    <input
                      type="radio"
                      name="shipmentType"
                      value="DOCUMENT"
                      checked={formData.shipmentType === 'DOCUMENT'}
                      onChange={handleChange}
                    />
                    Documents
                  </label>

                  <label>
                    <input
                      type="radio"
                      name="shipmentType"
                      value="NON_DOCUMENT"
                      checked={formData.shipmentType === 'NON_DOCUMENT'}
                      onChange={handleChange}
                    />
                    Non-Documents
                  </label>

                </div>
              </div>

              {formData.shipmentType === 'NON_DOCUMENT' && (
                <>
                  <div className="booking-field full-width">
                    <label>Item Category</label>

                    <select
                      name="itemCategory"
                      value={formData.itemCategory}
                      onChange={handleChange}
                      required
                    >
                      <option value="">Select item category</option>
                      <option value="Clothes">Clothes</option>
                      <option value="Electronics">Electronics</option>
                      <option value="Accessories">Accessories</option>
                      <option value="Household Items">Household Items</option>
                      <option value="Gifts">Gifts</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  {formData.itemCategory === 'Other' && (
                    <>
                      <div className="booking-field full-width">
                        <label>Item Name</label>
                        <input
                          name="itemName"
                          value={formData.itemName}
                          onChange={handleChange}
                          placeholder="Enter your item name"
                          required
                        />
                      </div>

                      <div className="booking-field full-width">
                        <label>Item Description</label>
                        <textarea
                          name="itemDescription"
                          value={formData.itemDescription}
                          onChange={handleChange}
                          placeholder="Describe the item you are shipping"
                          required
                        />
                      </div>
                    </>
                  )}
                </>
              )}

            </div>
          </section>
             <div className="restricted-items-section">
  <h3>⚠️ Restricted & Dangerous Goods</h3>

  <p>
    Please review the following list before booking your shipment.
    These items are restricted or prohibited for transport.
  </p>

  <img
    src="/res.png"
    alt="Dangerous goods and restricted items according to the displayed IATA classification chart"
    className="restricted-items-image"
  />

  <div className="restricted-items-warning">
    Please do not book shipments containing prohibited or restricted
    goods. Additional carrier and applicable transport restrictions may apply.
  </div>
</div>
          <div className="booking-note">
            Shipping charges will be calculated using your PIN codes,
            parcel weight and selected shipping mode.
          </div>

          <button
            type="submit"
            className="booking-submit"
            disabled={isSubmitting}
          >
            {isSubmitting
              ? 'Saving Shipment...'
              : 'Continue to Shipping Charges →'}
          </button>

        </form>
      </main>
    </div>
  );
}

export default BookShipment;
