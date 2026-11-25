
import { useEffect, useState } from 'react';
import API_URL from '../config/api';
import './AdminRateApprovals.css';
import { Link } from 'react-router-dom';
const RATE_OPTIONS = [
  {
    key: 'SHIPNEXT',
    field: 'shipNextRate',
    label: 'ShipNext Standard',
  },
  {
    key: 'DELHIVERY_EXPRESS',
    field: 'delhiveryExpressRate',
    label: 'Delhivery Express',
  },
  {
    key: 'DELHIVERY_STANDARD',
    field: 'delhiveryStandardRate',
    label: 'Delhivery Standard',
  },
];

const EXPRESS_ZONES = ['A', 'B', 'C', 'D', 'E', 'F'];

const STANDARD_ZONES = [
  'A', 'B', 'C1', 'C2', 'D1', 'D2', 'E', 'F',
];

function formatPrice(value) {
  if (value === null || value === undefined || value === '') {
    return 'Not calculated';
  }

  const amount = Number(value);

  if (!Number.isFinite(amount)) {
    return 'Not calculated';
  }

  return `₹${amount.toFixed(2)}`;
}

function getToken() {
  return sessionStorage.getItem('shipnextToken');
}

export default function AdminRateApprovals() {
  const [drafts, setDrafts] = useState([]);
  const [selections, setSelections] = useState({});
  const [zones, setZones] = useState({});
  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState({});
  const [approving, setApproving] = useState({});
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState('');
  const [pageError, setPageError] = useState('');
const [approvalConfirmation, setApprovalConfirmation] = useState(null);
  const authHeaders = () => ({
    Authorization: `Bearer ${getToken()}`,
    'Content-Type': 'application/json',
  });

  const fetchApprovals = async () => {
    try {
      setLoading(true);
      setPageError('');

      const response = await fetch(
        `${API_URL}/api/admin/rate-approvals`,
        {
          headers: authHeaders(),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || 'Unable to load rate approvals.'
        );
      }

      const pendingDrafts = data.drafts || [];

      setDrafts(pendingDrafts);

      setSelections((previous) => {
        const next = { ...previous };

        pendingDrafts.forEach((draft) => {
          if (!next[draft.id]) {
            next[draft.id] = 'SHIPNEXT';
          }
        });

        return next;
      });

      setZones((previous) => {
        const next = { ...previous };

        pendingDrafts.forEach((draft) => {
          if (!next[draft.id]) {
            next[draft.id] = {
              expressZone: 'A',
              standardZone: 'A',
            };
          }
        });

        return next;
      });
    } catch (error) {
      setPageError(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApprovals();
  }, []);

  const updateZone = (draftId, field, value) => {
    setZones((previous) => ({
      ...previous,
      [draftId]: {
        ...(previous[draftId] || {
          expressZone: 'A',
          standardZone: 'A',
        }),
        [field]: value,
      },
    }));

    setErrors((previous) => ({
      ...previous,
      [draftId]: '',
    }));
  };

  const calculateRates = async (draft) => {
    const draftId = draft.id;
    const selectedZones = zones[draftId] || {
      expressZone: 'A',
      standardZone: 'A',
    };

    try {
      setCalculating((previous) => ({
        ...previous,
        [draftId]: true,
      }));

      setErrors((previous) => ({
        ...previous,
        [draftId]: '',
      }));

      setSuccess('');

      const response = await fetch(
        `${API_URL}/api/admin/rate-approvals/${draftId}/calculate`,
        {
          method: 'POST',
          headers: authHeaders(),
          body: JSON.stringify({
  ...selectedZones,
  mode: draft.shippingMode,
}),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || 'Unable to calculate shipping rates.'
        );
      }

      setDrafts((previous) =>
        previous.map((item) =>
          item.id === draftId
            ? {
                ...item,
                shipNextRate: data.rates.shipNext,
                delhiveryExpressRate:
                  data.rates.delhiveryExpress,
                delhiveryStandardRate:
                  data.rates.delhiveryStandard,
              }
            : item
        )
      );

      setSelections((previous) => ({
        ...previous,
        [draftId]: 'SHIPNEXT',
      }));

      setSuccess(
        `Rates calculated successfully for shipment ${draftId}.`
      );
    } catch (error) {
      setErrors((previous) => ({
        ...previous,
        [draftId]: error.message,
      }));
    } finally {
      setCalculating((previous) => ({
        ...previous,
        [draftId]: false,
      }));
    }
  };

 
  const approveRate = (draft) => {
    const draftId = draft.id;
    const selectedRateOption = selections[draftId];

    const selectedOption = RATE_OPTIONS.find(
      (option) => option.key === selectedRateOption
    );

    const selectedAmount = selectedOption
      ? draft[selectedOption.field]
      : null;

    if (
      selectedAmount === null ||
      selectedAmount === undefined ||
      !Number.isFinite(Number(selectedAmount)) ||
      Number(selectedAmount) <= 0
    ) {
      setErrors((previous) => ({
        ...previous,
        [draftId]: 'Please calculate and select a valid rate first.',
      }));
      return;
    }

    setApprovalConfirmation({
      draftId,
      selectedRateOption,
      label: selectedOption.label,
      amount: selectedAmount,
    });
  };

  const confirmApproval = async () => {
    if (!approvalConfirmation) return;

    const {
      draftId,
      selectedRateOption,
      label,
      amount,
    } = approvalConfirmation;

    try {
      setApproving((previous) => ({
        ...previous,
        [draftId]: true,
      }));

      setErrors((previous) => ({
        ...previous,
        [draftId]: '',
      }));

      setSuccess('');

      const response = await fetch(
        `${API_URL}/api/admin/rate-approvals/${draftId}`,
        {
          method: 'PATCH',
          headers: authHeaders(),
          body: JSON.stringify({ selectedRateOption }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || 'Unable to approve shipping rate.'
        );
      }

      setDrafts((previous) =>
        previous.filter((item) => item.id !== draftId)
      );

      setApprovalConfirmation(null);

      setSuccess(
        `Approved ${label} at ${formatPrice(amount)}.`
      );
    } catch (error) {
      setErrors((previous) => ({
        ...previous,
        [draftId]: error.message,
      }));
    } finally {
      setApproving((previous) => ({
        ...previous,
        [draftId]: false,
      }));
    }
  };


  return (
    <div className="rate-approvals-page">
      <div className="rate-approvals-header">
        <div>
          <h1>Rate Approvals</h1>
          <p>
            Compare ShipNext and Delhivery rates before approving
            the customer's final shipping charge.
          </p>
        </div>
             <Link to="/dashboard" className="sn-track-back">
          Back to Dashboard
        </Link>
        <button
          type="button"
          className="rate-refresh-btn"
          onClick={fetchApprovals}
        >
          Refresh
        </button>
      </div>

      {pageError && (
        <div className="rate-error">{pageError}</div>
      )}

      {success && (
        <div className="rate-success">{success}</div>
      )}

      {drafts.length === 0 ? (
        <div className="rate-empty">
          <h3>No pending rate approvals</h3>
          <p>New customer rate requests will appear here.</p>
        </div>
      ) : (
        <div className="rate-approval-list">
          {drafts.map((draft) => {
            const customerName =
              draft.customer?.name ||
              draft.customer?.fullName ||
              'Customer';

            const selectedKey = selections[draft.id] || 'SHIPNEXT';

            const selectedOption = RATE_OPTIONS.find(
              (option) => option.key === selectedKey
            );

            const selectedAmount = selectedOption
              ? draft[selectedOption.field]
              : null;

            return (
              <section
                className="rate-approval-card"
                key={draft.id}
              >
                <div className="rate-card-heading">
                  <div>
                    <h2>Shipment #{draft.id}</h2>
                    <p>{customerName}</p>
                    {draft.customer?.email && (
                      <small>{draft.customer.email}</small>
                    )}
                  </div>

                  <span className="rate-pending-badge">
                    PENDING
                  </span>
                </div>

                <div className="rate-shipment-details">
                  <div>
                    <small>Pickup PIN</small>
                    <strong>{draft.pickupPincode}</strong>
                  </div>

                  <div>
                    <small>Delivery PIN</small>
                    <strong>{draft.deliveryPincode}</strong>
                  </div>

                  <div>
                    <small>Weight</small>
                    <strong>
                      {(
                        Number(draft.weightGrams) / 1000
                      ).toFixed(2)} kg
                    </strong>
                  </div>

                  <div>
                    <small>Shipping mode</small>
                    <strong>{draft.shippingMode || '—'}</strong>
                  </div>
                </div>

                <div className="delhivery-zone-panel">
                  <h3>Delhivery zone selection</h3>
                  <p>
                    Select the applicable zone for each tariff
                    separately.
                  </p>

                  <div className="rate-zone-grid">
                    <label>
                      <span>Delhivery Express Zone</span>
                      <select
                        value={
                          zones[draft.id]?.expressZone || 'A'
                        }
                        onChange={(event) =>
                          updateZone(
                            draft.id,
                            'expressZone',
                            event.target.value
                          )
                        }
                      >
                        {EXPRESS_ZONES.map((zone) => (
                          <option key={zone} value={zone}>
                            Zone {zone}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label>
                      <span>Delhivery Standard Zone</span>
                      <select
                        value={
                          zones[draft.id]?.standardZone || 'A'
                        }
                        onChange={(event) =>
                          updateZone(
                            draft.id,
                            'standardZone',
                            event.target.value
                          )
                        }
                      >
                        {STANDARD_ZONES.map((zone) => (
                          <option key={zone} value={zone}>
                            Zone {zone}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>

                  <button
                    type="button"
                    className="calculate-rates-btn"
                    disabled={!!calculating[draft.id]}
                    onClick={() => calculateRates(draft)}
                  >
                    {calculating[draft.id]
                      ? 'Calculating...'
                      : 'Calculate All Three Rates'}
                  </button>
                </div>

                <div className="rate-comparison">
                  <h3>Rate comparison</h3>

                  <div className="rate-options-grid">
                    {RATE_OPTIONS.map((option) => {
                      const amount = draft[option.field];

                      const available =
                        amount !== null &&
                        amount !== undefined &&
                        Number.isFinite(Number(amount)) &&
                        Number(amount) > 0;

                      return (
                        <label
                          key={option.key}
                          className={`rate-option ${
                            selectedKey === option.key
                              ? 'selected'
                              : ''
                          } ${!available ? 'unavailable' : ''}`}
                        >
                          <input
                            type="radio"
                            name={`rate-${draft.id}`}
                            value={option.key}
                            checked={selectedKey === option.key}
                            disabled={!available}
                            onChange={() =>
                              setSelections((previous) => ({
                                ...previous,
                                [draft.id]: option.key,
                              }))
                            }
                          />

                          <span className="rate-option-name">
                            {option.label}
                          </span>

                          <strong>
                            {formatPrice(amount)}
                          </strong>

                          {!available && (
                            <small>Not calculated</small>
                          )}
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div className="rate-final-selection">
                  <div>
                    <small>Selected final shipping charge</small>
                    <strong>{formatPrice(selectedAmount)}</strong>
                  </div>

                  <button
                    type="button"
                    className="approve-rate-btn"
                    disabled={
                      !!approving[draft.id] ||
                      !selectedAmount ||
                      Number(selectedAmount) <= 0
                    }
                    onClick={() => approveRate(draft)}
                  >
                    {approving[draft.id]
                      ? 'Approving...'
                      : 'Approve Selected Rate'}
                  </button>
                </div>

                {errors[draft.id] && (
                  <div className="rate-error">
                    {errors[draft.id]}
                  </div>
                )}
              </section>
            );
          })}
        </div>
           )}

      {approvalConfirmation && (
        <div
          className="approval-modal-overlay"
          onClick={() => {
            if (!approving[approvalConfirmation.draftId]) {
              setApprovalConfirmation(null);
            }
          }}
        >
          <div
            className="approval-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="approval-modal-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="approval-modal-icon">
              ✓
            </div>

            <h2 id="approval-modal-title">
              Confirm Rate Approval
            </h2>

            <p className="approval-modal-description">
              Are you sure you want to approve this shipping rate?
              This will become the customer's final shipping charge.
            </p>

            <div className="approval-modal-summary">
              <span>Selected rate</span>
              <strong>{approvalConfirmation.label}</strong>

              <span>Final shipping charge</span>
              <strong className="approval-modal-amount">
                {formatPrice(approvalConfirmation.amount)}
              </strong>
            </div>

            <div className="approval-modal-actions">
              <button
                type="button"
                className="approval-modal-cancel"
                disabled={!!approving[approvalConfirmation.draftId]}
                onClick={() => setApprovalConfirmation(null)}
              >
                Cancel
              </button>

              <button
                type="button"
                className="approval-modal-confirm"
                disabled={!!approving[approvalConfirmation.draftId]}
                onClick={confirmApproval}
              >
                {approving[approvalConfirmation.draftId]
                  ? 'Approving...'
                  : 'Confirm Approval'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}