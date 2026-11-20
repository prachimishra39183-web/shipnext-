
import { useState } from 'react';
import { Link } from 'react-router-dom';
import API_URL from '../config/api';
import '../styles.css';

const MODE_LABELS = {
  EXPRESS_AIR: 'Express Air',
  NORMAL_AIR: 'Normal Air',
  EXPRESS_SURFACE: 'Express Surface',
  NORMAL_SURFACE: 'Normal Surface',
};

const CSV_HEADERS = [
  'pickupName',
  'pickupPhone',
  'pickupAddress',
  'pickupPincode',
  'deliveryName',
  'deliveryPhone',
  'deliveryAddress',
  'deliveryPincode',
  'weight',
  'paymentMode',
  'codAmount',
  'shipmentType',
  'itemCategory',
  'itemName',
  'itemDescription',
];

function parseCSV(text) {
  const rows = [];
  let row = [];
  let value = '';
  let insideQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const next = text[i + 1];

    if (char === '"' && insideQuotes && next === '"') {
      value += '"';
      i++;
    } else if (char === '"') {
      insideQuotes = !insideQuotes;
    } else if (char === ',' && !insideQuotes) {
      row.push(value);
      value = '';
    } else if ((char === '\n' || char === '\r') && !insideQuotes) {
      if (char === '\r' && next === '\n') i++;
      row.push(value);
      if (row.some((cell) => cell.trim() !== '')) rows.push(row);
      row = [];
      value = '';
    } else {
      value += char;
    }
  }

  row.push(value);
  if (row.some((cell) => cell.trim() !== '')) rows.push(row);

  if (rows.length < 2) {
    throw new Error('The CSV file has no shipment rows.');
  }

  const headers = rows[0].map((header) =>
    header.replace(/^\uFEFF/, '').trim()
  );

  const missingHeaders = CSV_HEADERS.filter(
    (header) => !headers.includes(header)
  );

  if (missingHeaders.length) {
    throw new Error(
      `Missing CSV columns: ${missingHeaders.join(', ')}`
    );
  }

  return rows.slice(1).map((cells, index) => {
    const data = {};

    headers.forEach((header, cellIndex) => {
      data[header] = (cells[cellIndex] || '').trim();
    });

    data.rowNumber = index + 2;
    return data;
  });
}

function downloadCSV(filename, rows) {
  const csv = rows
    .map((row) =>
      row
        .map((value) => {
          const text = String(value ?? '');
          return `"${text.replace(/"/g, '""')}"`;
        })
        .join(',')
    )
    .join('\r\n');

  const blob = new Blob([csv], {
    type: 'text/csv;charset=utf-8;',
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.download = filename;
  link.click();

  URL.revokeObjectURL(url);
}

function getToken() {
  return sessionStorage.getItem('shipnextToken');
}

function BulkBooking() {
  const [file, setFile] = useState(null);
  const [drafts, setDrafts] = useState([]);
  const [errors, setErrors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [checkingRates, setCheckingRates] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [walletBalance, setWalletBalance] = useState(null);
  const [bookingResult, setBookingResult] = useState(null);

  const totalCharge = drafts.reduce(
    (sum, draft) => sum + (Number(draft.quote?.total) || 0),
    0
  );

  function downloadTemplate() {
    const example = [
      'Rahul Sharma',
      '9876543210',
      'House 10, Main Road',
      '110001',
      'Amit Verma',
      '9876543211',
      'Flat 20, Market Road',
      '400001',
      '0.5',
      'PREPAID',
      '',
      'DOCUMENT',
      '',
      '',
      '',
    ];

    downloadCSV('shipnext-bulk-booking-template.csv', [
      CSV_HEADERS,
      example,
    ]);
  }

  async function handleUpload() {
    if (!file) {
      setError('Please select a CSV file first.');
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');
    setDrafts([]);
    setErrors([]);
    setBookingResult(null);
    setWalletBalance(null);

    try {
      const text = await file.text();
      const rows = parseCSV(text);

      if (rows.length > 100) {
        throw new Error('Maximum 100 shipment rows are allowed.');
      }

      const response = await fetch(`${API_URL}/api/shipments/bulk-drafts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({ shipments: rows }),
      });

      const data = await response.json();

      const rowErrors = (data.errors || []).map((item) => ({
        ...item,
        data: rows.find(
          (row) => row.rowNumber === item.rowNumber
        ) || {},
      }));

      setErrors(rowErrors);

      if (data.drafts?.length) {
        setDrafts(
          data.drafts.map((draft) => ({
            ...draft,
            availableModes: [],
            selectedMode: '',
            quote: null,
            quoteError: '',
          }))
        );
      }

      if (!response.ok && !data.drafts?.length) {
        throw new Error(
          data.message || 'Unable to process this CSV file.'
        );
      }

      setMessage(
        `${data.successfulRows || 0} valid shipment(s) ready for pricing.`
      );
    } catch (err) {
      setError(err.message || 'CSV upload failed.');
    } finally {
      setLoading(false);
    }
  }

  async function getQuote(draft, mode) {
    const response = await fetch(`${API_URL}/api/serviceability/quote`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${getToken()}`,
      },
      body: JSON.stringify({
        pickupPincode: String(draft.pickupPincode),
        deliveryPincode: String(draft.deliveryPincode),
        weight: Number(draft.weightGrams) / 1000,
        mode,
      }),
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.message || 'Unable to calculate shipping charge.');
    }

    const result = data.quote || data.calculation || data;
    const amount = Number(
      result.total ?? result.amount ?? data.total
    );

    if (!Number.isFinite(amount)) {
      throw new Error('Invalid shipping charge received.');
    }

    return {
      base: result.base,
      additionalCharge: result.additionalCharge,
      total: amount,
    };
  }

  async function checkRates() {
    setCheckingRates(true);
    setError('');
    setMessage('');

    try {
      const updatedDrafts = await Promise.all(
        drafts.map(async (draft) => {
          try {
            const response = await fetch(
              `${API_URL}/api/serviceability/check`,
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${getToken()}`,
                },
                body: JSON.stringify({
                  pickupPincode: String(draft.pickupPincode),
                  deliveryPincode: String(draft.deliveryPincode),
                }),
              }
            );

            const data = await response.json();

            if (!response.ok || !data.success) {
              throw new Error(
                data.message || 'Serviceability check failed.'
              );
            }

            const modes = (data.availableModes || []).map((item) =>
              typeof item === 'string' ? item : item.mode
            ).filter(Boolean);

            if (!modes.length) {
              throw new Error('No shipping mode available for this route.');
            }

            const selectedMode = modes[0];
            const quote = await getQuote(draft, selectedMode);

            return {
              ...draft,
              availableModes: modes,
              selectedMode,
              quote,
              quoteError: '',
            };
          } catch (err) {
            return {
              ...draft,
              availableModes: [],
              selectedMode: '',
              quote: null,
              quoteError: err.message,
            };
          }
        })
      );

      setDrafts(updatedDrafts);

      const failed = updatedDrafts.filter(
        (draft) => !draft.quote
      ).length;

      if (failed) {
        setMessage(
          `Rates checked. ${failed} shipment(s) need attention.`
        );
      } else {
        setMessage('Shipping modes and charges calculated successfully.');
      }
    } catch (err) {
      setError(err.message || 'Unable to check shipping rates.');
    } finally {
      setCheckingRates(false);
    }
  }

  async function handleModeChange(draftId, mode) {
    const draft = drafts.find((item) => item.id === draftId);
    if (!draft) return;

    setDrafts((current) =>
      current.map((item) =>
        item.id === draftId
          ? { ...item, selectedMode: mode, quote: null, quoteError: '' }
          : item
      )
    );

    try {
      const quote = await getQuote(draft, mode);

      setDrafts((current) =>
        current.map((item) =>
          item.id === draftId && item.selectedMode === mode
            ? { ...item, quote, quoteError: '' }
            : item
        )
      );
    } catch (err) {
      setDrafts((current) =>
        current.map((item) =>
          item.id === draftId
            ? { ...item, quote: null, quoteError: err.message }
            : item
        )
      );
    }
  }

  function downloadErrorReport() {
    const headers = [...CSV_HEADERS, 'Error'];

    const rows = errors.map((item) => [
      ...CSV_HEADERS.map((header) => item.data?.[header] || ''),
      `Row ${item.rowNumber}: ${item.message}`,
    ]);

    downloadCSV('shipnext-bulk-booking-errors.csv', [
      headers,
      ...rows,
    ]);
  }

  async function confirmBulkBooking() {
    if (!drafts.length) return;

    const incomplete = drafts.some(
      (draft) => !draft.selectedMode || !draft.quote
    );

    if (incomplete) {
      setError('Please calculate charges for every shipment before booking.');
      return;
    }

    setConfirming(true);
    setError('');
    setMessage('');

    try {
      const walletResponse = await fetch(`${API_URL}/api/wallet/me`, {
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      });

      const walletData = await walletResponse.json();

      if (walletResponse.ok) {
        const balance = Number(
          walletData.wallet?.balance ?? walletData.balance
        );

        if (Number.isFinite(balance)) {
          setWalletBalance(balance);

          if (balance < totalCharge) {
            throw new Error(
              `Insufficient wallet balance. Required ₹${totalCharge.toFixed(2)}; available ₹${balance.toFixed(2)}.`
            );
          }
        }
      }

      const response = await fetch(
        `${API_URL}/api/shipments/bulk-confirm`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${getToken()}`,
          },
          body: JSON.stringify({
            shipments: drafts.map((draft) => ({
              draftId: draft.id,
              mode: draft.selectedMode,
            })),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Bulk booking failed.');
      }

      setBookingResult(data);
      setDrafts([]);
      setFile(null);
    } catch (err) {
      setError(err.message || 'Unable to confirm bulk booking.');
    } finally {
      setConfirming(false);
    }
  }

  if (bookingResult) {
    return (
      <div className="bulk-booking-page">
        <div className="bulk-booking-container">
          <div className="bulk-success-panel">
            <h2>Bulk booking successful</h2>
            <p>{bookingResult.message}</p>

            <div className="bulk-total">
              Total paid: ₹{Number(bookingResult.payment.amount).toFixed(2)}
            </div>

            <p>
              Remaining wallet balance: ₹
              {Number(bookingResult.payment.walletBalance).toFixed(2)}
            </p>

            <div className="bulk-results-table">
              <div className="bulk-result-row bulk-result-heading">
                <span>Tracking ID</span>
                <span>Docket Number</span>
                <span>Shipping Mode</span>
              </div>

              {bookingResult.shipments.map((shipment) => (
                <div className="bulk-result-row" key={shipment.id}>
                  <span>{shipment.trackingId}</span>
                  <span>{shipment.docketNumber}</span>
                  <span>{MODE_LABELS[shipment.shippingMode]}</span>
                </div>
              ))}
            </div>

            <button
              type="button"
              className="bulk-primary-button"
              onClick={() => {
                setBookingResult(null);
                setMessage('');
              }}
            >
              Book More Shipments
            </button>

            <Link to="/shipments" className="bulk-back-link">
              View My Shipments
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bulk-booking-page">
      <div className="bulk-booking-container">
        <div className="bulk-page-header">
          <div>
            <h1>Bulk Shipment Booking</h1>
            <p>Upload a CSV file to book multiple shipments together.</p>
          </div>

          <Link to="/dashboard" className="bulk-back-link">
            Back to Dashboard
          </Link>
        </div>

        <section className="bulk-upload-panel">
          <h2>1. Download CSV template</h2>
          <p>
            Use the ShipNext template and fill in the shipment details.
            Keep the column headings unchanged.
          </p>

          <button
            type="button"
            className="bulk-secondary-button"
            onClick={downloadTemplate}
          >
            Download CSV Template
          </button>

          <div className="bulk-instructions">
            <p><strong>Important:</strong></p>
            <ul>
              <li>Maximum 100 shipments per upload.</li>
              <li>Mobile numbers must contain 10 digits.</li>
              <li>PIN codes must contain 6 digits.</li>
              <li>Payment mode must be PREPAID or COD.</li>
              <li>For COD, enter a positive COD amount.</li>
              <li>For non-documents, select a valid item category.</li>
            </ul>
          </div>
        </section>

        <section className="bulk-upload-panel">
          <h2>2. Upload your CSV file</h2>

          <input
            type="file"
            accept=".csv,text/csv"
            onChange={(event) => {
              setFile(event.target.files?.[0] || null);
              setError('');
              setMessage('');
            }}
          />

          {file && <p className="bulk-selected-file">{file.name}</p>}

          <button
            type="button"
            className="bulk-primary-button"
            onClick={handleUpload}
            disabled={loading || !file}
          >
            {loading ? 'Validating CSV...' : 'Upload and Validate'}
          </button>
        </section>

        {error && <div className="bulk-error-message">{error}</div>}
        {message && <div className="bulk-info-message">{message}</div>}

        {errors.length > 0 && (
          <section className="bulk-upload-panel">
            <div className="bulk-section-heading">
              <h2>Rows requiring correction ({errors.length})</h2>
              <button
                type="button"
                className="bulk-secondary-button"
                onClick={downloadErrorReport}
              >
                Download Error Report
              </button>
            </div>

            {errors.map((item, index) => (
              <div className="bulk-error-row" key={`${item.rowNumber}-${index}`}>
                <strong>CSV row {item.rowNumber}</strong>
                <span>{item.message}</span>
              </div>
            ))}
          </section>
        )}

        {drafts.length > 0 && (
          <section className="bulk-upload-panel">
            <h2>3. Review shipments and calculate charges</h2>
            <p>{drafts.length} valid shipment(s) ready for pricing.</p>

            <button
              type="button"
              className="bulk-secondary-button"
              onClick={checkRates}
              disabled={checkingRates}
            >
              {checkingRates ? 'Checking rates...' : 'Check Serviceability & Rates'}
            </button>

            <div className="bulk-shipment-list">
              {drafts.map((draft) => (
                <div className="bulk-shipment-card" key={draft.id}>
                  <div className="bulk-shipment-card-header">
                    <strong>CSV Row {draft.rowNumber}</strong>
                    <span>{draft.weightGrams / 1000} kg</span>
                  </div>

                  <p>
                    {draft.pickupPincode} → {draft.deliveryPincode}
                  </p>

                  {draft.quoteError && (
                    <p className="bulk-error-text">{draft.quoteError}</p>
                  )}

                  {draft.availableModes.length > 0 && (
                    <div className="bulk-mode-control">
                      <label>Shipping mode</label>
                      <select
                        value={draft.selectedMode}
                        onChange={(event) =>
                          handleModeChange(draft.id, event.target.value)
                        }
                      >
                        {draft.availableModes.map((mode) => (
                          <option key={mode} value={mode}>
                            {MODE_LABELS[mode] || mode}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {draft.quote && (
                    <div className="bulk-charge">
                      Shipping charge: ₹{Number(draft.quote.total).toFixed(2)}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="bulk-payment-summary">
              <div>
                <span>Total shipments</span>
                <strong>{drafts.length}</strong>
              </div>
              <div>
                <span>Combined shipping charges</span>
                <strong>₹{totalCharge.toFixed(2)}</strong>
              </div>
              {walletBalance !== null && (
                <div>
                  <span>Wallet balance</span>
                  <strong>₹{walletBalance.toFixed(2)}</strong>
                </div>
              )}
            </div>

            <button
              type="button"
              className="bulk-primary-button"
              onClick={confirmBulkBooking}
              disabled={
                confirming ||
                drafts.some((draft) => !draft.selectedMode || !draft.quote)
              }
            >
              {confirming
                ? 'Booking shipments...'
                : `Confirm All Shipments · ₹${totalCharge.toFixed(2)}`}
            </button>
          </section>
        )}
      </div>
    </div>
  );
}

export default BulkBooking;
