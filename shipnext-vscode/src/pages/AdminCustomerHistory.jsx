
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  Search,
  Users,
  Package,
  Truck,
  CheckCircle2,
  Clock3,
  XCircle,
  RotateCcw,
  IndianRupee,
  ChevronDown,
  ChevronUp,
  MapPin,
  FileText,
  RefreshCw,
  AlertCircle,
  CalendarDays,
  Building2,
} from 'lucide-react';

import API_URL from '../config/api';
import './AdminCustomerHistory.css';

const money = (value) =>
  `₹${Number(value || 0).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const date = (value) =>
  value
    ? new Date(value).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    : '—';

const statusClass = (status) =>
  String(status || 'PENDING').toLowerCase().replaceAll('_', '-');

export default function AdminCustomerHistory() {
  const [customers, setCustomers] = useState([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [search, setSearch] = useState('');
  const [history, setHistory] = useState(null);
  const [loadingCustomers, setLoadingCustomers] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [error, setError] = useState('');
  const [expandedShipment, setExpandedShipment] = useState(null);

  const token = sessionStorage.getItem('shipnextToken');

  const headers = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };

  useEffect(() => {
    loadCustomers();
  }, []);

  async function loadCustomers() {
    setLoadingCustomers(true);
    setError('');

    try {
      const response = await fetch(
        `${API_URL}/api/admin/delivery-history/customers`,
        { headers }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Unable to load customers.');
      }

      setCustomers(data.customers || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingCustomers(false);
    }
  }

  async function loadHistory(customerId) {
    if (!customerId) {
      setHistory(null);
      return;
    }

    setLoadingHistory(true);
    setError('');
    setHistory(null);
    setExpandedShipment(null);

    try {
      const response = await fetch(
        `${API_URL}/api/admin/delivery-history/customers/${customerId}/delivery-history`,
        { headers }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Unable to load delivery history.');
      }

      setHistory(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingHistory(false);
    }
  }

  function handleCustomerChange(customerId) {
    setSelectedCustomerId(customerId);
    loadHistory(customerId);
  }

  const filteredCustomers = useMemo(() => {
    const term = search.toLowerCase().trim();

    if (!term) return customers;

    return customers.filter((customer) =>
      [
        customer.name,
        customer.email,
        customer.phone,
        customer.companyName,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term))
    );
  }, [customers, search]);

  const customer = history?.customer;
  const summary = history?.summary;
  const shipments = customer?.shipments || [];

  return (
    <div className="admin-customer-history">
      <header className="ach-header">
        <div>
          <Link to="/admin" className="ach-back-link">
            <ArrowLeft size={17} />
            Back to Admin Dashboard
          </Link>

          <div className="ach-title-row">
            <div className="ach-title-icon">
              <Users size={27} />
            </div>
            <div>
              <h1>Customer Delivery History</h1>
              <p>View complete shipment activity for any customer.</p>
            </div>
          </div>
        </div>

        <button
          className="ach-refresh"
          onClick={() => {
            loadCustomers();
            if (selectedCustomerId) loadHistory(selectedCustomerId);
          }}
          disabled={loadingCustomers || loadingHistory}
        >
          <RefreshCw
            size={16}
            className={
              loadingCustomers || loadingHistory ? 'ach-spin' : ''
            }
          />
          Refresh
        </button>
      </header>

      <section className="ach-selector-card">
        <div className="ach-selector-heading">
          <div className="ach-selector-icon">
            <Search size={21} />
          </div>
          <div>
            <h2>Select Customer</h2>
            <p>Search by customer name, company, email or phone.</p>
          </div>
        </div>

        <div className="ach-selector-controls">
          <div className="ach-search-box">
            <Search size={18} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search customers..."
            />
          </div>

          <select
            value={selectedCustomerId}
            onChange={(e) => handleCustomerChange(e.target.value)}
            disabled={loadingCustomers}
          >
            <option value="">
              {loadingCustomers ? 'Loading customers...' : 'Choose a customer'}
            </option>

            {filteredCustomers.map((item) => (
              <option key={item.id} value={item.id}>
                {item.companyName || item.name} — {item.email}
              </option>
            ))}
          </select>
        </div>

        <div className="ach-customer-count">
          <Users size={15} />
          {filteredCustomers.length} customer(s) found
        </div>
      </section>

      {error && (
        <div className="ach-error">
          <AlertCircle size={18} />
          {error}
        </div>
      )}

      {loadingHistory && (
        <div className="ach-loading">
          <RefreshCw className="ach-spin" size={25} />
          <p>Loading complete customer history...</p>
        </div>
      )}

      {!selectedCustomerId && !loadingCustomers && (
        <div className="ach-empty">
          <div className="ach-empty-icon">
            <Users size={34} />
          </div>
          <h2>Select a customer to begin</h2>
          <p>
            Choose a customer above to view their complete delivery history,
            shipment records, COD details, invoices and NDR activity.
          </p>
        </div>
      )}

      {customer && !loadingHistory && (
        <>
          <section className="ach-customer-profile">
            <div className="ach-profile-avatar">
              {(customer.companyName || customer.name || 'C')
                .charAt(0)
                .toUpperCase()}
            </div>

            <div className="ach-profile-info">
              <span className="ach-eyebrow">SELECTED CUSTOMER</span>
              <h2>{customer.companyName || customer.name}</h2>
              <p>{customer.name}</p>
              <div className="ach-profile-meta">
                <span>{customer.email}</span>
                <span>{customer.phone || 'No phone number'}</span>
                <span>
                  Customer since {date(customer.createdAt)}
                </span>
              </div>
            </div>

            <span
              className={`ach-account-status ${
                customer.isActive ? 'active' : 'inactive'
              }`}
            >
              {customer.isActive ? 'Active Account' : 'Inactive Account'}
            </span>
          </section>

          <section className="ach-summary-grid">
            <SummaryCard
              icon={<Package />}
              label="Total Shipments"
              value={summary.totalShipments}
              tone="blue"
            />
            <SummaryCard
              icon={<CheckCircle2 />}
              label="Delivered"
              value={summary.delivered}
              tone="green"
            />
            <SummaryCard
              icon={<Truck />}
              label="In Transit"
              value={summary.inTransit}
              tone="orange"
            />
            <SummaryCard
              icon={<Clock3 />}
              label="Pending"
              value={summary.pending}
              tone="purple"
            />
            <SummaryCard
              icon={<XCircle />}
              label="Cancelled"
              value={summary.cancelled}
              tone="red"
            />
            <SummaryCard
              icon={<RotateCcw />}
              label="RTO"
              value={summary.rto}
              tone="pink"
            />
          </section>

          <section className="ach-financial-grid">
            <div className="ach-financial-card">
              <div className="ach-financial-icon">
                <IndianRupee size={21} />
              </div>
              <div>
                <span>Total Shipping Charges</span>
                <strong>{money(summary.totalShippingCharges)}</strong>
              </div>
            </div>

            <div className="ach-financial-card">
              <div className="ach-financial-icon cod">
                <IndianRupee size={21} />
              </div>
              <div>
                <span>Total COD Amount</span>
                <strong>{money(summary.totalCodAmount)}</strong>
              </div>
            </div>

            <div className="ach-financial-card">
              <div className="ach-financial-icon invoice">
                <FileText size={21} />
              </div>
              <div>
                <span>Total Invoices</span>
                <strong>{customer.invoices?.length || 0}</strong>
              </div>
            </div>
          </section>

          <section className="ach-history-panel">
            <div className="ach-panel-heading">
              <div>
                <h2>Complete Shipment History</h2>
                <p>
                  {shipments.length} shipment record(s), newest first
                </p>
              </div>
              <span className="ach-record-count">
                {shipments.length} RECORDS
              </span>
            </div>

            {shipments.length === 0 ? (
              <div className="ach-no-records">
                <Package size={35} />
                <h3>No shipments found</h3>
                <p>This customer has not booked any confirmed shipments.</p>
              </div>
            ) : (
              <div className="ach-shipment-list">
                {shipments.map((shipment) => {
                  const expanded = expandedShipment === shipment.id;

                  return (
                    <article
                      className={`ach-shipment-card ${
                        expanded ? 'expanded' : ''
                      }`}
                      key={shipment.id}
                    >
                      <div className="ach-shipment-main">
                        <div className="ach-shipment-identity">
                          <div className="ach-package-icon">
                            <Package size={21} />
                          </div>
                          <div>
                            <strong>{shipment.trackingId}</strong>
                            <span>
                              Docket: {shipment.docketNumber || 'Not assigned'}
                            </span>
                          </div>
                        </div>

                        <div className="ach-shipment-route">
                          <div>
                            <span>FROM</span>
                            <strong>{shipment.pickupPincode}</strong>
                          </div>
                          <div className="ach-route-line">
                            <span />
                            <Truck size={17} />
                            <span />
                          </div>
                          <div>
                            <span>TO</span>
                            <strong>{shipment.deliveryPincode}</strong>
                          </div>
                        </div>

                        <div className="ach-shipment-date">
                          <CalendarDays size={15} />
                          {date(shipment.createdAt)}
                        </div>

                        <div className="ach-shipment-status">
                          <span className={`ach-status ${statusClass(shipment.status)}`}>
                            {String(shipment.status).replaceAll('_', ' ')}
                          </span>
                        </div>

                        <button
                          className="ach-expand-button"
                          onClick={() =>
                            setExpandedShipment(
                              expanded ? null : shipment.id
                            )
                          }
                        >
                          {expanded ? <ChevronUp /> : <ChevronDown />}
                          {expanded ? 'Hide' : 'Details'}
                        </button>
                      </div>

                      {expanded && (
                        <div className="ach-shipment-details">
                          <div className="ach-detail-grid">
                            <Detail
                              label="Pickup Name"
                              value={shipment.pickupName}
                            />
                            <Detail
                              label="Pickup Phone"
                              value={shipment.pickupPhone}
                            />
                            <Detail
                              label="Pickup Address"
                              value={shipment.pickupAddress}
                            />
                            <Detail
                              label="Delivery Name"
                              value={shipment.deliveryName}
                            />
                            <Detail
                              label="Delivery Phone"
                              value={shipment.deliveryPhone}
                            />
                            <Detail
                              label="Delivery Address"
                              value={shipment.deliveryAddress}
                            />
                            <Detail
                              label="Weight"
                              value={`${(shipment.weightGrams / 1000).toFixed(2)} kg`}
                            />
                            <Detail
                              label="Shipping Mode"
                              value={shipment.shippingMode}
                            />
                            <Detail
                              label="Shipping Charge"
                              value={money(shipment.shippingCharge)}
                            />
                            <Detail
                              label="Recipient Payment"
                              value={shipment.recipientPaymentMode}
                            />
                            <Detail
                              label="COD Amount"
                              value={money(shipment.codAmount)}
                            />
                            <Detail
                              label="COD Charge"
                              value={money(shipment.codCharge)}
                            />
                            <Detail
                              label="COD Collection"
                              value={shipment.codCollectionStatus}
                            />
                            <Detail
                              label="COD Remittance"
                              value={shipment.codRemittanceStatus}
                            />
                            <Detail
                              label="COD Settlement"
                              value={shipment.codSettlementStatus}
                            />
                            <Detail
                              label="Invoice Number"
                              value={shipment.invoice?.invoiceNumber}
                            />
                            <Detail
                              label="Child Account"
                              value={
                                shipment.childAccount?.branchName ||
                                shipment.childAccount?.accountName
                              }
                            />
                          </div>

                          <div className="ach-detail-section">
                            <h4>
                              <MapPin size={16} />
                              Delivery & Activity Records
                            </h4>

                            <div className="ach-activity-columns">
                              <ActivityList
                                title="NDR Attempts"
                                items={shipment.ndrRecords}
                                empty="No NDR records."
                                render={(item) => (
                                  <>
                                    <strong>
                                      Attempt {item.attemptNumber}: {item.reason}
                                    </strong>
                                    <span>
                                      {item.status} · {date(item.reportedAt)}
                                    </span>
                                    {item.remarks && <p>{item.remarks}</p>}
                                  </>
                                )}
                              />

                              <ActivityList
                                title="Support Tickets"
                                items={shipment.supportTickets}
                                empty="No linked support tickets."
                                render={(item) => (
                                  <>
                                    <strong>
                                      {item.subject || item.category || 'Support ticket'}
                                    </strong>
                                    <span>
                                      {item.status || 'Status unavailable'} · {date(item.createdAt)}
                                    </span>
                                  </>
                                )}
                              />

                              <ActivityList
                                title="Refund Requests"
                                items={shipment.refundRequests}
                                empty="No refund requests."
                                render={(item) => (
                                  <>
                                    <strong>
                                      {item.reason || 'Refund request'}
                                    </strong>
                                    <span>
                                      {item.status || 'Status unavailable'} · {date(item.createdAt)}
                                    </span>
                                  </>
                                )}
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}

function SummaryCard({ icon, label, value, tone }) {
  return (
    <div className={`ach-summary-card ${tone}`}>
      <div className="ach-summary-icon">{icon}</div>
      <div>
        <span>{label}</span>
        <strong>{value ?? 0}</strong>
      </div>
    </div>
  );
}

function Detail({ label, value }) {
  return (
    <div className="ach-detail-item">
      <span>{label}</span>
      <strong>{value || '—'}</strong>
    </div>
  );
}

function ActivityList({ title, items = [], empty, render }) {
  return (
    <div className="ach-activity-card">
      <h5>{title} ({items.length})</h5>
      {items.length === 0 ? (
        <p className="ach-activity-empty">{empty}</p>
      ) : (
        items.map((item) => (
          <div className="ach-activity-item" key={item.id}>
            {render(item)}
          </div>
        ))
      )}
    </div>
  );
}
