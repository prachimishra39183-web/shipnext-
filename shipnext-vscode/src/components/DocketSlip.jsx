
import { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import JsBarcode from 'jsbarcode';

function DocketSlip({ shipment, documentType = 'label' }) {
  const [qrCode, setQrCode] = useState('');
  const barcodeRef = useRef(null);
  const awbNumber = shipment?.trackingId || '';
console.log('SHIPMENT DATA:', shipment);
const courierName = (
  shipment?.courierPartner ||
  shipment?.selectedCourier ||
  shipment?.courier ||
  'SHIPNEXT'
).toUpperCase();
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

   const barcodeValue = awbNumber;
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
}, [awbNumber, documentType]);

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
             
      {/* ORIGINAL SHIPNEXT DOCKET DESIGN */}
      {documentType === 'docket' && (
        <>
          <div
            id="shipnext-docket"
            style={{
              maxWidth: '550px',
              margin: '25px auto',
              padding: '30px',
              background: '#fff',
              color: '#172033',
              border: '2px solid #172033',
              borderRadius: '10px',
              fontFamily: 'Arial, sans-serif',
            }}
          >
            {/* HEADER */}
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

              <strong style={{
                fontSize: '16px',
                background: '#ffe1d8',
                padding: '3px 6px',
              }}>
                SHIPPING DOCKET
              </strong>
            </div>

            {/* DOCKET NUMBER AND QR CODE */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '20px',
              marginTop: '22px',
            }}>
              <div>
                <p style={{ margin: '3px 0' }}>
                  <strong>Docket Number</strong>
                </p>

                <h2 style={{
                  color: '#ff3b1f',
                  margin: '0 0 4px',
                  fontSize: '21px',
                }}>
                  {shipment.docketNumber}
                </h2>

                <p style={{ margin: '3px 0' }}>
                  <strong>Tracking ID:</strong> {shipment.trackingId}
                </p>

                <p style={{ margin: '3px 0' }}>
                  <strong>Status:</strong> {shipment.status}
                </p>
              </div>

              {qrCode && (
                <img
                  src={qrCode}
                  alt="Shipment tracking QR code"
                  style={{
                    width: '130px',
                    height: '130px',
                    flexShrink: 0,
                  }}
                />
              )}
            </div>

            <hr />

           {/* PICKUP & DELIVERY DETAILS - SIDE BY SIDE */}
<div
  style={{
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '12px',
    margin: '12px 0',
  }}
>
  {/* PICKUP DETAILS */}
  <div
    style={{
      border: '1px solid #ddd',
      borderRadius: '6px',
      padding: '10px',
      minWidth: 0,
    }}
  >
    <h3 style={{ margin: '0 0 8px', fontSize: '14px' }}>
      Pickup Details
    </h3>
    <p style={{ margin: '4px 0', fontSize: '12px' }}>
      <strong>Sender:</strong> {shipment.pickupName}
    </p>
    <p style={{ margin: '4px 0', fontSize: '12px' }}>
      <strong>Mobile:</strong> {shipment.pickupPhone}
    </p>
    <p style={{ margin: '4px 0', fontSize: '12px' }}>
      <strong>Address:</strong> {shipment.pickupAddress}
    </p>
    <p style={{ margin: '4px 0', fontSize: '12px' }}>
      <strong>PIN Code:</strong> {shipment.pickupPincode}
    </p>
  </div>

  {/* DELIVERY DETAILS */}
  <div
    style={{
      border: '1px solid #ddd',
      borderRadius: '6px',
      padding: '10px',
      minWidth: 0,
    }}
  >
    <h3 style={{ margin: '0 0 8px', fontSize: '14px' }}>
      Delivery Details
    </h3>
    <p style={{ margin: '4px 0', fontSize: '12px' }}>
      <strong>Receiver:</strong> {shipment.deliveryName}
    </p>
    <p style={{ margin: '4px 0', fontSize: '12px' }}>
      <strong>Mobile:</strong> {shipment.deliveryPhone}
    </p>
    <p style={{ margin: '4px 0', fontSize: '12px' }}>
      <strong>Address:</strong> {shipment.deliveryAddress}
    </p>
    <p style={{ margin: '4px 0', fontSize: '12px' }}>
      <strong>PIN Code:</strong> {shipment.deliveryPincode}
    </p>
  </div>
</div>

<hr />
            {/* PARCEL DETAILS */}
            <h3 style={{ margin: '5px 0' }}>Parcel Details</h3>
            <p><strong>Weight:</strong> {weight} kg</p>
            <p><strong>Shipping Mode:</strong> {shipment.shippingMode}</p>
            <p>
              <strong>Shipping Charge:</strong>{' '}
              ₹{Number(shipment.shippingCharge || 0).toFixed(2)}
            </p>

            <hr />

            {/* FOOTER */}
            <p style={{
              textAlign: 'center',
              fontSize: '12px',
              marginTop: '18px',
            }}>
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
              Download Docket Slip (PDF)
            </button>
          </div>
        </>
      )}

      {/* NEW SHIPNEXT SHIPPING LABEL */}
           {documentType === 'label' && (
              <>
      <div
        id="shipnext-label"
        style={{
  width: '100%',
  maxWidth: '550px',
  minHeight: 'auto',
  margin: '15px auto',
padding: '12px 22px',
  background: '#fff',
  color: '#111',
  border: '1.5px solid #111',
  fontFamily: 'Arial, sans-serif',
  boxSizing: 'border-box',
  fontSize: '11px',
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
            {courierName}
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
            <strong>Tracking ID:</strong> {shipment.trackingId}
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
      </>
)}

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
