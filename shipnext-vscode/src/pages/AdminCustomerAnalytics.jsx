
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  Search,
  Users,
  Package,
  PackageCheck,
  Truck,
  MapPin,
  RotateCcw,
  AlertTriangle,
  IndianRupee,
  CalendarDays,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  FileText,
  Clock,
  Download,
} from 'lucide-react';

import API_URL from '../config/api';
import './AdminCustomerAnalytics.css';

const tabs = [
  { id: 'OVERVIEW', label: 'Overview' },
  { id: 'PICKUP', label: 'Pickup' },
  { id: 'TRANSIT', label: 'In Transit' },
  { id: 'NDR', label: 'NDR / NPR' },
  { id: 'RTO', label: 'RTO' },
];

function money(value) {
  return `₹${Number(value || 0).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function dateFormat(value) {
  if (!value) return '—';

  return new Date(value).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function statusLabel(value) {
  return String(value || '').replaceAll('_', ' ');
}

export default function AdminCustomerAnalytics() {
  const token = sessionStorage.getItem('shipnextToken');

  const [search, setSearch] = useState('');
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [analytics, setAnalytics] = useState(null);

  const [activeTab, setActiveTab] = useState('OVERVIEW');
  const [selectedState, setSelectedState] = useState(null);

  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);
  const [error, setError] = useState('');

  const [showCustomerResults, setShowCustomerResults] = useState(false);

  const [historySearch, setHistorySearch] = useState('');
  const [historyStatus, setHistoryStatus] = useState('ALL');

  const headers = useMemo(() => ({
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  }), [token]);

  useEffect(() => {
    const timer = setTimeout(() => {
      searchCustomers();
    }, 350);

    return () => clearTimeout(timer);
  }, [search]);

  async function searchCustomers() {
    try {
      setLoadingCustomers(true);

      const response = await fetch(
        `${API_URL}/api/admin/customer-analytics/customers?search=${encodeURIComponent(search)}`,
        { headers }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Unable to search customers.');
      }

      setCustomers(data.customers || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingCustomers(false);
    }
  }

  async function loadAnalytics(customer, dates = {}) {
    if (!customer?.id) return;

    try {
      setLoadingAnalytics(true);
      setError('');
      setSelectedCustomer(customer);
      setSelectedState(null);

      const from = dates.from ?? fromDate;
      const to = dates.to ?? toDate;

      const params = new URLSearchParams();

      if (from) params.set('from', from);
      if (to) params.set('to', to);

      const query = params.toString();

      const response = await fetch(
        `${API_URL}/api/admin/customer-analytics/${customer.id}${query ? `?${query}` : ''}`,
        { headers }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Unable to load customer analytics.');
      }

      setAnalytics(data);
    } catch (err) {
      setError(err.message);
      setAnalytics(null);
    } finally {
      setLoadingAnalytics(false);
    }
  }

  function applyDateFilter() {
    if (!selectedCustomer) return;

    if (fromDate && toDate && fromDate > toDate) {
      setError('Start date cannot be after end date.');
      return;
    }

    loadAnalytics(selectedCustomer, {
      from: fromDate,
      to: toDate,
    });
  }

  function clearDateFilter() {
    setFromDate('');
    setToDate('');

    if (selectedCustomer) {
      loadAnalytics(selectedCustomer, {
        from: '',
        to: '',
      });
    }
  }

  const summary = analytics?.summary || {};
  const shipments = analytics?.shipments || [];
  const states = analytics?.stateBreakdown || [];

  const filteredShipments = useMemo(() => {
    return shipments.filter((shipment) => {
      const searchText = historySearch.toLowerCase();

      const matchesSearch =
        !searchText ||
        String(shipment.trackingId || '').toLowerCase().includes(searchText) ||
        String(shipment.docketNumber || '').toLowerCase().includes(searchText) ||
        String(shipment.deliveryPincode || '').includes(searchText) ||
        String(shipment.pickupPincode || '').includes(searchText);

      let matchesStatus = true;

      if (historyStatus === 'NDR') {
        matchesStatus = shipment.ndrRecords?.length > 0;
      } else if (historyStatus === 'ALL') {
        matchesStatus = true;
      } else {
        matchesStatus = shipment.status === historyStatus;
      }

      if (activeTab === 'PICKUP') {
        matchesStatus =
          matchesStatus &&
          ['PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED', 'RTO']
            .includes(shipment.status);
      }

      if (activeTab === 'TRANSIT') {
        matchesStatus =
          matchesStatus &&
          ['IN_TRANSIT', 'OUT_FOR_DELIVERY'].includes(shipment.status);
      }

      if (activeTab === 'NDR') {
        matchesStatus =
          matchesStatus && shipment.ndrRecords?.length > 0;
      }

      if (activeTab === 'RTO') {
        matchesStatus =
          matchesStatus && shipment.status === 'RTO';
      }

      return matchesSearch && matchesStatus;
    });
  }, [shipments, historySearch, historyStatus, activeTab]);

  function exportHistory() {
    if (!filteredShipments.length) return;

    const columns = [
      'Tracking ID',
      'Docket Number',
      'Status',
      'Pickup PIN',
      'Delivery PIN',
      'Weight (grams)',
      'Shipping Charge',
      'Payment Mode',
      'COD Amount',
      'Created At',
    ];

    const rows = filteredShipments.map((item) => [
      item.trackingId,
      item.docketNumber || '',
      item.status,
      item.pickupPincode,
      item.deliveryPincode,
      item.weightGrams,
      item.shippingCharge,
      item.recipientPaymentMode,
      item.codAmount || '',
      item.createdAt,
    ]);

    const csv = [columns, ...rows]
      .map((row) =>
        row.map((value) =>
          `"${String(value ?? '').replaceAll('"', '""')}"`
        ).join(',')
      )
      .join('\n');

    const blob = new Blob(['\uFEFF' + csv], {
      type: 'text/csv;charset=utf-8;',
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.download = `shipnext-customer-${selectedCustomer?.id}-history.csv`;
    link.click();

    URL.revokeObjectURL(url);
  }

  const metrics = [
    {
      label: 'Manifested',
      value: summary.manifested || 0,
      icon: Package,
      color: 'orange',
    },
    {
      label: 'Picked',
      value: summary.picked || 0,
      icon: PackageCheck,
      color: 'blue',
    },
    {
      label: 'In Transit',
      value: summary.inTransit || 0,
      icon: Truck,
      color: 'purple',
    },
    {
      label: 'Delivered',
      value: summary.delivered || 0,
      icon: MapPin,
      color: 'green',
    },
    {
      label: 'NDR Shipments',
      value: summary.ndrShipments || 0,
      icon: AlertTriangle,
      color: 'yellow',
    },
    {
      label: 'RTO',
      value: summary.rto || 0,
      icon: RotateCcw,
      color: 'red',
    },
    {
      label: 'Shipping Charges',
      value: money(summary.totalShippingCharges),
      icon: IndianRupee,
      color: 'orange',
    },
    {
      label: 'Delivery Success',
      value: `${summary.deliveredPercentage || 0}%`,
      icon: PackageCheck,
      color: 'green',
    },
  ];

  return (
    <div className="admin-customer-analytics">
      <header className="aca-header">
        <Link to="/admin" className="aca-back">
          <ArrowLeft size={18} />
          Back to Admin Dashboard
        </Link>

        <div className="aca-title-row">
          <div className="aca-title-icon">
            <Users size={27} />
          </div>

          <div>
            <h1>Customer Delivery Analytics</h1>
            <p>Complete customer shipment history and delivery performance</p>
          </div>
        </div>
      </header>

      {error && (
        <div className="aca-error">
          {error}
        </div>
      )}

      <section className="aca-customer-panel">
        <div className="aca-panel-heading">
          <div>
            <h2>Select Customer</h2>
            <p>Search by customer name, company or email address</p>
          </div>
          <Users size={22} />
        </div>

        <div className="aca-search-area">
          <Search size={20} />

          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setShowCustomerResults(true);
            }}
            onFocus={() => setShowCustomerResults(true)}
            placeholder="Search customer name, email or company..."
          />

          {loadingCustomers && <RefreshCw className="aca-spin" size={18} />}

          {showCustomerResults && (
            <div className="aca-customer-results">
              {customers.length > 0 ? (
                customers.map((customer) => (
                  <button
                    type="button"
                    key={customer.id}
                    onClick={() => {
                      setShowCustomerResults(false);
                      setSearch(customer.companyName || customer.name);
                      setFromDate('');
                      setToDate('');
                      setHistorySearch('');
                      setHistoryStatus('ALL');
                      setActiveTab('OVERVIEW');
                      loadAnalytics(customer, {
                        from: '',
                        to: '',
                      });
                    }}
                  >
                    <span className="aca-customer-avatar">
                      {(customer.companyName || customer.name || 'C')
                        .charAt(0).toUpperCase()}
                    </span>

                    <span className="aca-customer-info">
                      <strong>{customer.companyName || customer.name}</strong>
                      <small>{customer.name} · {customer.email}</small>
                    </span>

                    <ChevronRight size={18} />
                  </button>
                ))
              ) : (
                <div className="aca-no-customers">
                  {loadingCustomers ? 'Searching...' : 'No customers found.'}
                </div>
              )}
            </div>
          )}
        </div>

        {selectedCustomer && (
          <div className="aca-selected-customer">
            <div className="aca-customer-avatar large">
              {(selectedCustomer.companyName || selectedCustomer.name || 'C')
                .charAt(0).toUpperCase()}
            </div>

            <div>
              <strong>
                {selectedCustomer.companyName || selectedCustomer.name}
              </strong>
              <span>{selectedCustomer.email}</span>
              <small>{selectedCustomer.phone || 'No phone number'}</small>
            </div>

            <button
              type="button"
              onClick={() => loadAnalytics(selectedCustomer)}
              disabled={loadingAnalytics}
            >
              <RefreshCw size={16} />
              Refresh
            </button>
          </div>
        )}
      </section>

      {selectedCustomer && (
        <>
          <section className="aca-filter-panel">
            <div className="aca-filter-title">
              <CalendarDays size={19} />
              <strong>Report Period</strong>
            </div>

            <div className="aca-date-controls">
              <label>
                From
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                />
              </label>

              <label>
                To
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                />
              </label>

              <button onClick={applyDateFilter} disabled={loadingAnalytics}>
                Apply Filter
              </button>

              <button className="aca-clear-filter" onClick={clearDateFilter}>
                Clear
              </button>
            </div>
          </section>

          {loadingAnalytics ? (
            <div className="aca-loading">
              <RefreshCw className="aca-spin" size={32} />
              <p>Loading customer delivery analytics...</p>
            </div>
          ) : analytics ? (
            <>
              <section className="aca-metrics-grid">
                {metrics.map((metric) => {
                  const Icon = metric.icon;

                  return (
                    <div className="aca-metric-card" key={metric.label}>
                      <div className={`aca-metric-icon ${metric.color}`}>
                        <Icon size={22} />
                      </div>

                      <div>
                        <span>{metric.label}</span>
                        <strong>{metric.value}</strong>
                      </div>
                    </div>
                  );
                })}
              </section>

              <section className="aca-performance-panel">
                <div className="aca-section-heading">
                  <div>
                    <h2>Delivery Performance</h2>
                    <p>Shipment performance for the selected customer</p>
                  </div>
                </div>

                <div className="aca-tabs">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      className={activeTab === tab.id ? 'active' : ''}
                      onClick={() => {
                        setActiveTab(tab.id);
                        setHistoryStatus('ALL');
                      }}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                <div className="aca-performance-summary">
                  <div>
                    <span>Delivery Attempted / Delivered</span>
                    <strong>
                      {summary.delivered || 0} / {summary.manifested || 0}
                    </strong>
                  </div>

                  <div>
                    <span>On-time Delivery</span>
                    <strong>Not available</strong>
                    <small>Requires actual courier event timestamps</small>
                  </div>

                  <div>
                    <span>Total NDR Records</span>
                    <strong>{summary.ndrRecords || 0}</strong>
                  </div>

                  <div>
                    <span>Delivery Attempts Recorded</span>
                    <strong>{summary.totalDeliveryAttempts || 0}</strong>
                  </div>
                </div>
              </section>

              <section className="aca-location-panel">
                <div className="aca-section-heading">
                  <div>
                    <h2>State & City Performance</h2>
                    <p>Select a state to explore its district-wise shipments</p>
                  </div>
                  <MapPin size={23} />
                </div>

                {states.length > 0 ? (
                  <div className="aca-state-layout">
                    <div className="aca-state-table-wrap">
                      <table className="aca-table">
                        <thead>
                          <tr>
                            <th>State Code</th>
                            <th>Manifested</th>
                            <th>Picked</th>
                            <th>Delivered</th>
                            <th>RTO</th>
                            <th>NDR</th>
                          </tr>
                        </thead>

                        <tbody>
                          {states.map((state) => (
                            <tr
                              key={state.stateCode}
                              className={
                                selectedState?.stateCode === state.stateCode
                                  ? 'selected'
                                  : ''
                              }
                              onClick={() => setSelectedState(state)}
                            >
                              <td>
                                <button className="aca-state-select">
                                  {state.stateCode}
                                  <ChevronRight size={15} />
                                </button>
                              </td>
                              <td>{state.manifested}</td>
                              <td>{state.picked}</td>
                              <td>{state.delivered}</td>
                              <td>{state.rto}</td>
                              <td>{state.ndr}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="aca-city-panel">
                      <h3>
                        {selectedState
                          ? `Districts — ${selectedState.stateCode}`
                          : 'Select a state'}
                      </h3>

                      {selectedState ? (
                        selectedState.cities.map((city) => (
                          <div className="aca-city-row" key={city.city}>
                            <strong>{city.city}</strong>
                            <span>{city.manifested} shipments</span>
                            <small>
                              Delivered: {city.delivered} · RTO: {city.rto}
                            </small>
                          </div>
                        ))
                      ) : (
                        <p>Choose a state from the table to view its districts.</p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="aca-empty">
                    No state-level shipment data is available yet.
                  </div>
                )}
              </section>

              <section className="aca-history-panel">
                <div className="aca-section-heading">
                  <div>
                    <h2>Complete Shipment History</h2>
                    <p>
                      {filteredShipments.length} shipments in the current view
                    </p>
                  </div>

                  <button
                    className="aca-export-button"
                    onClick={exportHistory}
                    disabled={!filteredShipments.length}
                  >
                    <Download size={17} />
                    Export CSV
                  </button>
                </div>

                <div className="aca-history-filters">
                  <div className="aca-history-search">
                    <Search size={17} />
                    <input
                      value={historySearch}
                      onChange={(e) => setHistorySearch(e.target.value)}
                      placeholder="Search tracking ID, docket or PIN..."
                    />
                  </div>

                  <select
                    value={historyStatus}
                    onChange={(e) => setHistoryStatus(e.target.value)}
                  >
                    <option value="ALL">All statuses</option>
                    <option value="CONFIRMED">Confirmed</option>
                    <option value="PICKED_UP">Picked up</option>
                    <option value="IN_TRANSIT">In transit</option>
                    <option value="OUT_FOR_DELIVERY">Out for delivery</option>
                    <option value="DELIVERED">Delivered</option>
                    <option value="RTO">RTO</option>
                    <option value="CANCELLED">Cancelled</option>
                    <option value="NDR">With NDR</option>
                  </select>
                </div>

                <div className="aca-history-table-wrap">
                  <table className="aca-table aca-history-table">
                    <thead>
                      <tr>
                        <th>Shipment</th>
                        <th>Route</th>
                        <th>Booked</th>
                        <th>Weight</th>
                        <th>Amount</th>
                        <th>Payment</th>
                        <th>Status</th>
                        <th>NDR</th>
                      </tr>
                    </thead>

                    <tbody>
                      {filteredShipments.map((shipment) => (
                        <tr key={shipment.id}>
                          <td>
                            <strong>{shipment.trackingId}</strong>
                            <small>{shipment.docketNumber || 'No docket'}</small>
                          </td>

                          <td>
                            <span>{shipment.pickupPincode}</span>
                            <small>to {shipment.deliveryPincode}</small>
                          </td>

                          <td>{dateFormat(shipment.createdAt)}</td>

                          <td>
                            {(Number(shipment.weightGrams || 0) / 1000).toFixed(2)} kg
                          </td>

                          <td>{money(shipment.shippingCharge)}</td>

                          <td>
                            {shipment.recipientPaymentMode || 'PREPAID'}
                            {shipment.codAmount && (
                              <small>COD {money(shipment.codAmount)}</small>
                            )}
                          </td>

                          <td>
                            <span className={`aca-status ${String(shipment.status).toLowerCase()}`}>
                              {statusLabel(shipment.status)}
                            </span>
                          </td>

                          <td>{shipment.ndrRecords?.length || 0}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {filteredShipments.length === 0 && (
                    <div className="aca-empty">
                      No shipments match the selected filters.
                    </div>
                  )}
                </div>
              </section>
            </>
          ) : (
            <div className="aca-empty">
              Select a customer to load their delivery history.
            </div>
          )}
        </>
      )}

      {!selectedCustomer && (
        <div className="aca-welcome">
          <div>
            <Package size={42} />
          </div>
          <h2>Explore Customer Delivery History</h2>
          <p>
            Select a customer above to view shipment statistics, delivery
            performance, NDR activity, RTO and complete booking history.
          </p>
        </div>
      )}
    </div>
  );
}
