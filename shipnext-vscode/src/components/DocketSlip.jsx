
import { useEffect, useState } from 'react';
import QRCode from 'qrcode';

function DocketSlip({ shipment }) {
  const [qrCode, setQrCode] = useState('');

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
      .catch((error) => console.error('QR generation failed:', error));
  }, [shipment]);

  if (!shipment) return null;

  const printDocket = () => window.print();

  return (
    <div>
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
          <h1 style={{ margin: 0, fontSize: '28px' }}>
            SHIP<span style={{ color: '#ff3b1f' }}>NEXT</span>
          </h1>

          <strong>SHIPPING DOCKET</strong>
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
        <p>
          <strong>Weight:</strong>{' '}
          {(Number(shipment.weightGrams) / 1000).toFixed(2)} kg
        </p>
        <p><strong>Shipping Mode:</strong> {shipment.shippingMode}</p>
        <p>
          <strong>Shipping Charge:</strong>{' '}
          ₹{Number(shipment.shippingCharge).toFixed(2)}
        </p>

        <hr />

        <p style={{ textAlign: 'center', fontSize: '12px' }}>
          Thank you for choosing ShipNext.
          <br />
          Scan the QR code to track your shipment.
        </p>
      </div>

      <div className="no-print" style={{ textAlign: 'center' }}>
        <button
          type="button"
          onClick={printDocket}
          className="booking-submit"
        >
          Print / Download Docket
        </button>
      </div>

      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }

          #shipnext-docket,
          #shipnext-docket * {
            visibility: visible !important;
          }

          #shipnext-docket {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
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
