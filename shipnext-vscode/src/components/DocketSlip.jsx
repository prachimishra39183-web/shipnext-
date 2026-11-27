
import { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import JsBarcode from 'jsbarcode';

function DocketSlip({ shipment }) {
  const [qrCode, setQrCode] = useState('');
  const barcodeRef = useRef(null);

  useEffect(() => {
    if (!shipment?.trackingId) return;

    QRCode.toDataURL(
      `${window.location.origin}/track/${shipment.trackingId}`,
      {
        width: 180,
        margin: 2,
        errorCorrectionLevel: 'H',
      }
    )
      .then(setQrCode)
      .catch((error) =>
        console.error('QR generation failed:', error)
      );
  }, [shipment?.trackingId]);

  useEffect(() => {
    if (!shipment) return;

    const barcodeValue =
      shipment.docketNumber || shipment.trackingId;

    if (!barcodeValue || !barcodeRef.current) return;

    try {
      JsBarcode(barcodeRef.current, String(barcodeValue), {
        format: 'CODE128',
        lineColor: '#111827',
        width: 1.7,
        height: 55,
        displayValue: true,
        fontSize: 13,
        margin: 5,
      });
    } catch (error) {
      console.error('Barcode generation failed:', error);
    }
  }, [shipment?.docketNumber, shipment?.trackingId]);

  if (!shipment) return null;

  const weight = shipment.weightGrams
    ? (Number(shipment.weightGrams) / 1000).toFixed(2)
    : Number(shipment.weight || 0).toFixed(2);

  const paymentMode = shipment.paymentMode || 'PREPAID';

  const printSection = (section) => {
    const className = `print-${section}`;

    const cleanup = () => {
      document.body.classList.remove(className);
      window.removeEventListener('afterprint', cleanup);
    };

    document.body.classList.add(className);
    window.addEventListener('afterprint', cleanup);

    window.print();
  };

  const headingStyle = {
    background: '#f3f4f6',
    padding: '7px 9px',
    fontWeight: 'bold',
    fontSize: '13px',
    borderBottom: '1px solid #cbd5e1',
    margin: 0,
  };

  const valueStyle = {
    padding: '8px 9px',
    fontSize: '12px',
    lineHeight: 1.5,
    overflowWrap: 'anywhere',
  };

  return (
    <div className="shipnext-document-container">

      {/* EXISTING DOCKET SLIP - PRESERVED */}

      <div
        id="shipnext-docket"
        style={{
          maxWidth: '750px',
          margin: '25px auto',
          padding: '30px',
          background: '#fff',
          color: '#172033',
          border: '2px solid #172033',
          borderRadius: '10px',
          fontFamily: 'Arial, sans-serif',
        }}
      >
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '3px solid #ff3b1f',
          paddingBottom: '18px',
        }}>
          <img
            src="/logo.jpeg"
            alt="ShipNext"
            style={{
              height: '45px',
              width: 'auto',
              objectFit: 'contain',
            }}
          />

          <strong>SHIPNEXT DOCKET SLIP</strong>
        </div>

        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          gap: '20px',
          marginTop: '22px',
        }}>
          <div>
            <p><strong>Docket Number</strong></p>
            <h2 style={{ color: '#ff3b1f', margin: 0 }}>
              {shipment.docketNumber}
            </h2>

            <p><strong>Tracking ID:</strong> {shipment.trackingId}</p>
            <p><strong>Status:</strong> {shipment.status}</p>
          </div>

          {qrCode && (
            <img
              src={qrCode}
              alt="Shipment tracking QR code"
              style={{ width: '130px', height: '130px' }}
            />
          )}
        </div>

        <hr />

        <h3>Pickup Details</h3>
        <p><strong>Sender:</strong> {shipment.pickupName}</p>
        <p><strong>Mobile:</strong> {shipment.pickupPhone}</p>
        <p><strong>Address:</strong> {shipment.pickupAddress}</p>
        <p><strong>PIN Code:</strong> {shipment.pickupPincode}</p>

        <hr />

        <h3>Delivery Details</h3>
        <p><strong>Receiver:</strong> {shipment.deliveryName}</p>
        <p><strong>Mobile:</strong> {shipment.deliveryPhone}</p>
        <p><strong>Address:</strong> {shipment.deliveryAddress}</p>
        <p><strong>PIN Code:</strong> {shipment.deliveryPincode}</p>

        <hr />

        <h3>Parcel Details</h3>
        <p><strong>Weight:</strong> {weight} kg</p>
        <p><strong>Shipping Mode:</strong> {shipment.shippingMode}</p>
        <p>
          <strong>Shipping Charge:</strong>{' '}
          ₹{Number(shipment.shippingCharge || 0).toFixed(2)}
        </p>

        <hr />

        <p style={{ textAlign: 'center', fontSize: '12px' }}>
          Thank you for choosing ShipNext.
          <br />
          Scan the QR code to track your shipment.
        </p>
      </div>

      <div className="no-print" style={{
        textAlign: 'center',
        marginBottom: '35px',
      }}>
        <button
          type="button"
          onClick={() => printSection('docket')}
          className="booking-submit"
        >
          Print / Download Docket
        </button>
      </div>

      {/* NEW SHIPNEXT SHIPPING LABEL */}

      <div
        id="shipnext-label"
        style={{
          width: '380px',
          maxWidth: '100%',
          minHeight: '560px',
          margin: '25px auto',
          padding: '14px',
          background: '#fff',
          color: '#111',
          border: '2px solid #111',
          fontFamily: 'Arial, sans-serif',
          boxSizing: 'border-box',
        }}
      >
        {/* BRAND HEADER */}

        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingBottom: '12px',
          borderBottom: '2px solid #111',
        }}>
          <div>
            <img
              src="/logo.jpeg"
              alt="ShipNext"
              style={{
                width: '125px',
                maxHeight: '48px',
                objectFit: 'contain',
              }}
            />
            <div style={{
              fontSize: '9px',
              letterSpacing: '1px',
              fontWeight: 'bold',
            }}>
              SHIPPING LABEL
            </div>
          </div>

          <div style={{
            textAlign: 'right',
            fontSize: '12px',
            fontWeight: 'bold',
          }}>
            {paymentMode}
            {paymentMode === 'COD' && (
              <div style={{ marginTop: '5px' }}>
                ₹{Number(shipment.codAmount || 0).toFixed(2)}
              </div>
            )}
          </div>
        </div>

        {/* TRACKING BARCODE */}

        <div style={{
          textAlign: 'center',
          padding: '12px 0',
          borderBottom: '1px solid #111',
        }}>
          <div style={{
            fontSize: '10px',
            fontWeight: 'bold',
            marginBottom: '4px',
          }}>
            SHIPNEXT DOCKET / TRACKING NUMBER
          </div>

          <svg
            ref={barcodeRef}
            style={{
              width: '100%',
              maxWidth: '320px',
              height: '75px',
            }}
          />

          <div style={{
            fontSize: '10px',
            fontWeight: 'bold',
          }}>
            {shipment.trackingId}
          </div>
        </div>

        {/* DELIVERY ADDRESS AND PAYMENT */}

        <div style={{
          display: 'grid',
          gridTemplateColumns: '1.5fr 1fr',
          borderBottom: '1px solid #111',
        }}>
          <div style={{ borderRight: '1px solid #111' }}>
            <div style={headingStyle}>SHIP TO / DELIVERY ADDRESS</div>
            <div style={valueStyle}>
              <strong>{shipment.deliveryName}</strong>
              <br />
              {shipment.deliveryPhone}
              <br />
              {shipment.deliveryAddress}
              <br />
              {shipment.deliveryCity}
              <br />
              <strong>PIN: {shipment.deliveryPincode}</strong>
            </div>
          </div>

          <div>
            <div style={headingStyle}>PAYMENT</div>
            <div style={{
              ...valueStyle,
              fontWeight: 'bold',
              fontSize: '15px',
            }}>
              {paymentMode}
              {paymentMode === 'COD' && (
                <>
                  <br />
                  <span style={{ fontSize: '12px' }}>
                    Collect:
                  </span>
                  <br />
                  ₹{Number(shipment.codAmount || 0).toFixed(2)}
                </>
              )}
            </div>
          </div>
        </div>

        {/* PICKUP / SENDER */}

        <div style={{
          borderBottom: '1px solid #111',
        }}>
          <div style={headingStyle}>SHIP FROM / PICKUP ADDRESS</div>
          <div style={valueStyle}>
            <strong>{shipment.pickupName}</strong>
            <br />
            {shipment.pickupPhone}
            <br />
            {shipment.pickupAddress}
            <br />
            {shipment.pickupCity}
            <br />
            <strong>PIN: {shipment.pickupPincode}</strong>
          </div>
        </div>

        {/* ORDER INFORMATION */}

        <div style={{
          borderBottom: '1px solid #111',
        }}>
          <div style={headingStyle}>SHIPMENT INFORMATION</div>
          <div style={valueStyle}>
            <strong>Docket:</strong> {shipment.docketNumber}
            <br />
            <strong>Weight:</strong> {weight} kg
            <br />
            <strong>Mode:</strong> {shipment.shippingMode}
            <br />
            <strong>Courier:</strong>{' '}
            {shipment.selectedCourier || shipment.courier || 'ShipNext'}
          </div>
        </div>

        {/* RETURN ADDRESS */}

        <div style={{
          borderBottom: '1px solid #111',
        }}>
          <div style={headingStyle}>RETURN ADDRESS</div>
          <div style={valueStyle}>
            {shipment.rtoName || shipment.pickupName}
            <br />
            {shipment.rtoAddress || shipment.pickupAddress}
            <br />
            {shipment.rtoCity || shipment.pickupCity}
            <br />
            PIN: {shipment.rtoPincode || shipment.pickupPincode}
          </div>
        </div>

        {/* FOOTER */}

        <div style={{
          padding: '12px 5px 5px',
          textAlign: 'center',
          fontSize: '10px',
          fontWeight: 'bold',
        }}>
          SHIPNEXT
          <div style={{
            fontSize: '9px',
            fontWeight: 'normal',
            marginTop: '5px',
          }}>
            Ship Smart. Deliver Faster.
            <br />
            Please handle this shipment with care.
          </div>
        </div>
      </div>

      {/* NEW DOWNLOAD LABEL BUTTON */}

      <div className="no-print" style={{
        textAlign: 'center',
        marginBottom: '35px',
      }}>
        <button
          type="button"
          onClick={() => printSection('label')}
          className="booking-submit"
        >
          Download Shipping Label (PDF)
        </button>
      </div>

      <style>{`
        @media print {
          body.print-docket * {
            visibility: hidden !important;
          }

          body.print-docket #shipnext-docket,
          body.print-docket #shipnext-docket * {
            visibility: visible !important;
          }

          body.print-docket #shipnext-docket {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            max-width: none !important;
            margin: 0 !important;
            border: 1px solid #000 !important;
            box-sizing: border-box !important;
          }

          body.print-label * {
            visibility: hidden !important;
          }

          body.print-label #shipnext-label,
          body.print-label #shipnext-label * {
            visibility: visible !important;
          }

          body.print-label #shipnext-label {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 4in !important;
            min-height: 6in !important;
            max-width: none !important;
            margin: 0 !important;
            border: 1px solid #000 !important;
            box-sizing: border-box !important;
          }

          .no-print {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}

export default DocketSlip;
