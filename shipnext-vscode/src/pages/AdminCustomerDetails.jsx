
import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  UserRound,
  Package,
  MapPin,
  Phone,
  Mail,
  CalendarDays,
  Truck,
  IndianRupee,
  ClipboardList,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Wallet,
  FileText,
  Headphones,
  Building2,
  ShieldCheck
} from 'lucide-react';

import API_URL from '../config/api';
import './AdminCustomerDetails.css';

const money = (value) => {
  if (value === null || value === undefined || value === '') return '—';

  const amount = Number(value);
  if (!Number.isFinite(amount)) return '—';

  return `₹${amount.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
};

const date = (value) => {
  if (!value) return '—';

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '—';

  return parsed.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const value = (item) => {
  if (item === null || item === undefined || item === '') return '—';
  if (typeof item === 'boolean') return item ? 'Yes' : 'No';
  return String(item).replaceAll('_', ' ');
};

const titleCase = (text) => {
  if (!text) return '—';
  return String(text)
    .replaceAll('_', ' ')
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
};

const weight = (grams) => {
  if (grams === null || grams === undefined) return '—';
  return `${(Number(grams) / 1000).toFixed(2)} kg`;
};

function DetailItem({ label, children }) {
  return (
    <div className="acd-detail-item">
      <span>{label}</span>
      <strong>{children ?? '—'}</strong>
    </div>
  );
}

function Section({ title, icon: Icon, children }) {
  return (
    <section className="acd-info-section">
      <h3>
        {Icon && <Icon size={18} />}
        {title}
      </h3>
      {children}
    </section>
  );
}

function Empty({ text = 'No Data' }) {
  return <div className="acd-empty">{text}</div>;
}

function DataGrid({ items }) {
  if (!items?.length) return <Empty />;

  return (
    <div className="acd-shipment-grid">
      {items.map(([label, content]) => (
        <DetailItem key={label} label={label}>
          {content}
        </DetailItem>
      ))}
    </div>
  );
}

function DataTable({ columns, rows, emptyText = 'No Data' }) {
  if (!rows?.length) return <Empty text={emptyText} />;

  return (
    <div className="acd-table-wrap">
      <table className="acd-data-table">
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.key}>{column.label}</th>
            ))}
          </tr>
        </thead>

        <tbody>
          {rows.map((row, index) => (
            <tr key={row.id || row.trackingId || row.ticketNumber || index}>
              {columns.map((column) => (
                <td key={column.key}>
                  {column.render
                    ? column.render(row[column.key], row)
                    : value(row[column.key])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ShipmentCard({ shipment }) {
  const ndrRecords = shipment.ndrRecords || [];

  return (
    <article className="acd-shipment-card">
      <div className="acd-shipment-card-header">
        <div>
          <strong>
            {shipment.docketNumber || shipment.trackingId || 'Shipment'}
          </strong>
          <span>{date(shipment.createdAt)}</span>
        </div>

        <span className="acd-status">
          {titleCase(shipment.status)}
        </span>
      </div>

      <div className="acd-shipment-grid">
        <DetailItem label="Tracking ID">
          {shipment.trackingId}
        </DetailItem>
        <DetailItem label="Docket Number">
          {shipment.docketNumber}
        </DetailItem>
        <DetailItem label="Courier">
          {titleCase(shipment.courierPartner)}
        </DetailItem>
        <DetailItem label="Courier AWB">
          {shipment.courierAwb}
        </DetailItem>
        <DetailItem label="Shipping Mode">
          {titleCase(shipment.shippingMode)}
        </DetailItem>
        <DetailItem label="Weight">
          {weight(shipment.weightGrams)}
        </DetailItem>
        <DetailItem label="Shipping Charge">
          {money(shipment.shippingCharge)}
        </DetailItem>
        <DetailItem label="Payment Mode">
          {titleCase(shipment.paymentMode)}
        </DetailItem>
        <DetailItem label="Recipient Payment">
          {titleCase(shipment.recipientPaymentMode)}
        </DetailItem>
        <DetailItem label="Product Value">
          {money(shipment.productValue)}
        </DetailItem>
        <DetailItem label="Processing Date">
          {date(shipment.processingDate)}
        </DetailItem>
        <DetailItem label="Last Updated">
          {date(shipment.updatedAt)}
        </DetailItem>
      </div>

      <div className="acd-info-section">
        <h4>Pickup Details</h4>
        <div className="acd-shipment-grid">
          <DetailItem label="Name">{shipment.pickupName}</DetailItem>
          <DetailItem label="Phone">{shipment.pickupPhone}</DetailItem>
          <DetailItem label="Address">{shipment.pickupAddress}</DetailItem>
          <DetailItem label="PIN Code">{shipment.pickupPincode}</DetailItem>
        </div>
      </div>

      <div className="acd-info-section">
        <h4>Delivery Details</h4>
        <div className="acd-shipment-grid">
          <DetailItem label="Name">{shipment.deliveryName}</DetailItem>
          <DetailItem label="Phone">{shipment.deliveryPhone}</DetailItem>
          <DetailItem label="Address">{shipment.deliveryAddress}</DetailItem>
          <DetailItem label="PIN Code">{shipment.deliveryPincode}</DetailItem>
        </div>
      </div>

      {shipment.recipientPaymentMode === 'COD' && (
        <div className="acd-info-section">
          <h4>COD Details</h4>
          <div className="acd-shipment-grid">
            <DetailItem label="COD Amount">
              {money(shipment.codAmount)}
            </DetailItem>
            <DetailItem label="COD Charge">
              {money(shipment.codCharge)}
            </DetailItem>
            <DetailItem label="COD Net Amount">
              {money(shipment.codNetAmount)}
            </DetailItem>
            <DetailItem label="Collection Status">
              {titleCase(shipment.codCollectionStatus)}
            </DetailItem>
            <DetailItem label="Collected At">
              {date(shipment.codCollectedAt)}
            </DetailItem>
            <DetailItem label="Remittance Status">
              {titleCase(shipment.codRemittanceStatus)}
            </DetailItem>
            <DetailItem label="Remitted At">
              {date(shipment.codRemittedAt)}
            </DetailItem>
            <DetailItem label="Remittance Reference">
              {shipment.codRemittanceReference}
            </DetailItem>
            <DetailItem label="Customer Settlement">
              {titleCase(shipment.codSettlementStatus)}
            </DetailItem>
            <DetailItem label="Settled At">
              {date(shipment.codSettledAt)}
            </DetailItem>
            <DetailItem label="Settlement Reference">
              {shipment.codSettlementReference}
            </DetailItem>
          </div>
        </div>
      )}

      {ndrRecords.length > 0 && (
        <div className="acd-ndr-section">
          <h4>NDR History</h4>

          {ndrRecords.map((ndr) => (
            <div className="acd-ndr-record" key={ndr.id}>
              <div className="acd-shipment-grid">
                <DetailItem label="Attempt">
                  {ndr.attemptNumber}
                </DetailItem>
                <DetailItem label="Reason">{ndr.reason}</DetailItem>
                <DetailItem label="Status">
                  {titleCase(ndr.status)}
                </DetailItem>
                <DetailItem label="Action Required">
                  {ndr.actionRequired}
                </DetailItem>
                <DetailItem label="Remarks">{ndr.remarks}</DetailItem>
                <DetailItem label="Reported At">
                  {date(ndr.reportedAt)}
                </DetailItem>
                <DetailItem label="Next Attempt">
                  {date(ndr.nextAttemptDate)}
                </DetailItem>
                <DetailItem label="Resolved At">
                  {date(ndr.resolvedAt)}
                </DetailItem>
              </div>
            </div>
          ))}
        </div>
      )}
    </article>
  );
}

export default function AdminCustomerDetails() {
  const { customerId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const [customerResult, setCustomerResult] = useState(
    location.state?.customerResult || null
  );
  const [loading, setLoading] = useState(!location.state?.customerResult);
  const [error, setError] = useState('');

  const [activeTab, setActiveTab] = useState('ALL');

  useEffect(() => {
    let active = true;

    const fetchCustomer = async () => {
      try {
        setLoading(true);
        setError('');

        const token = sessionStorage.getItem('shipnextToken');

        const response = await fetch(
          `${API_URL}/api/shipments/admin/customer-search?q=${encodeURIComponent(customerId)}`,
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Unable to load customer details');
        }

        const results = data.results || [];
        const selected = results.find(
          (item) => item.customer?.id === customerId
        );

        if (!selected) {
          throw new Error('Customer not found');
        }

        if (active) setCustomerResult(selected);
      } catch (err) {
        if (active) setError(err.message || 'Something went wrong');
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchCustomer();

    return () => {
      active = false;
    };
  }, [customerId]);

  const customer = customerResult?.customer;
  const shipments = customerResult?.shipments || [];
  const summary = customerResult?.summary || {};

  const tabs = [
    { id: 'ALL', label: 'All Shipments' },
    { id: 'PICKUP', label: 'Pickup' },
    { id: 'IN_TRANSIT', label: 'In Transit' },
    { id: 'NDR', label: 'NDR' },
    { id: 'RTO', label: 'RTO' },
    { id: 'DELIVERED', label: 'Delivered' },
    { id: 'CANCELLED', label: 'Cancelled' }
  ];

  const filteredShipments = useMemo(() => {
    if (activeTab === 'ALL') return shipments;

    if (activeTab === 'PICKUP') {
      return shipments.filter((shipment) =>
        ['PENDING', 'CONFIRMED', 'PICKED_UP'].includes(shipment.status)
      );
    }

    if (activeTab === 'IN_TRANSIT') {
      return shipments.filter((shipment) =>
        ['IN_TRANSIT', 'OUT_FOR_DELIVERY'].includes(shipment.status)
      );
    }

    if (activeTab === 'NDR') {
      return shipments.filter(
        (shipment) => (shipment.ndrRecords || []).length > 0
      );
    }

    return shipments.filter((shipment) => shipment.status === activeTab);
  }, [shipments, activeTab]);

  const shipmentStats = useMemo(() => {
    const count = (status) =>
      shipments.filter((shipment) => shipment.status === status).length;

    return {
      total: shipments.length,
      pending: count('PENDING'),
      confirmed: count('CONFIRMED'),
      pickedUp: count('PICKED_UP'),
      inTransit: count('IN_TRANSIT'),
      outForDelivery: count('OUT_FOR_DELIVERY'),
      delivered: count('DELIVERED'),
      cancelled: count('CANCELLED'),
      rto: count('RTO'),
      ndr: shipments.filter(
        (shipment) => (shipment.ndrRecords || []).length > 0
      ).length
    };
  }, [shipments]);

  const courierStats = useMemo(() => {
    const couriers = ['DELHIVERY', 'SKYKING', 'BLUEDART', 'SHADOWFAX'];

    return couriers.map((courier) => {
      const records = shipments.filter(
        (shipment) => shipment.courierPartner === courier
      );

      return {
        courier,
        total: records.length,
        delivered: records.filter((s) => s.status === 'DELIVERED').length,
        rto: records.filter((s) => s.status === 'RTO').length,
        ndr: records.filter((s) => (s.ndrRecords || []).length > 0).length
      };
    });
  }, [shipments]);

  const financialStats = useMemo(() => {
    const totalShipping = shipments.reduce(
      (total, shipment) => total + Number(shipment.shippingCharge || 0),
      0
    );

    const codShipments = shipments.filter(
      (shipment) => shipment.recipientPaymentMode === 'COD'
    );

    const codAmount = codShipments.reduce(
      (total, shipment) => total + Number(shipment.codAmount || 0),
      0
    );

    const codCharges = codShipments.reduce(
      (total, shipment) => total + Number(shipment.codCharge || 0),
      0
    );

    return {
      totalShipping,
      codAmount,
      codCharges,
      codShipments: codShipments.length
    };
  }, [shipments]);

  const wallet = customerResult?.wallet;
  const walletTransactions = wallet?.transactions || [];
  const invoices = customerResult?.invoices || [];
  const refunds = customerResult?.refundRequests || [];
  const tickets = customerResult?.supportTickets || [];
  const documents = customerResult?.customerDocuments || [];
  const pickupLocations = customerResult?.pickupLocations || [];
  const childAccounts = customerResult?.childAccounts || [];
  const rechargeRequests = customerResult?.walletRechargeRequests || [];
  const invoiceSettings = customerResult?.invoiceSettings;
  const labelSettings = customerResult?.shippingLabelSettings;
  const taxSettings = customerResult?.taxSettings;
  const apiKeys = customerResult?.apiKeys || [];

  if (loading) {
    return (
      <div className="acd-page">
        <div className="acd-message">
          <RefreshCw size={18} /> Loading customer details...
        </div>
      </div>
    );
  }

  if (error || !customer) {
    return (
      <div className="acd-page">
        <button className="acd-back-button" onClick={() => navigate(-1)}>
          <ArrowLeft size={18} /> Back
        </button>

        <div className="acd-message">
          <AlertCircle size={18} />
          {error || 'Customer details not available'}
        </div>
      </div>
    );
  }

  return (
    <div className="acd-page">
      <div className="acd-page-header">
        <button className="acd-back-button" onClick={() => navigate(-1)}>
          <ArrowLeft size={18} /> Back
        </button>

        <div>
          <span className="acd-eyebrow">ADMIN CUSTOMER DETAILS</span>
          <h1>Customer Analytics</h1>
          <p>Customer profile, shipments and account performance</p>
        </div>
      </div>

      {/* CUSTOMER PROFILE */}
      <section className="acd-profile-card">
        <div className="acd-profile-main">
          <div className="acd-profile-avatar">
            <UserRound size={30} />
          </div>

          <div>
            <h2>{customer.name}</h2>
            <p>{customer.companyName || 'Individual Customer'}</p>
            <span className="acd-status">
              {customer.isActive ? 'Active Account' : 'Inactive Account'}
            </span>
          </div>
        </div>

        <div className="acd-shipment-grid">
          <DetailItem label="Customer ID">{customer.id}</DetailItem>
          <DetailItem label="Email">
            <Mail size={14} /> {customer.email}
          </DetailItem>
          <DetailItem label="Phone">
            <Phone size={14} /> {customer.phone}
          </DetailItem>
          <DetailItem label="Registered">
            {date(customer.createdAt)}
          </DetailItem>
          <DetailItem label="Company">
            {customer.companyName}
          </DetailItem>
          <DetailItem label="GST Number">
            {customer.gstNumber ? 'Available' : 'Not Provided'}
          </DetailItem>
          <DetailItem label="City">{customer.city}</DetailItem>
          <DetailItem label="State">{customer.state}</DetailItem>
          <DetailItem label="PIN Code">{customer.pincode}</DetailItem>
          <DetailItem label="Address">{customer.address}</DetailItem>
        </div>
      </section>

      {/* SHIPMENT OVERVIEW */}
      <Section title="Shipment Overview" icon={Package}>
        <div className="acd-summary-grid">
          {[
            ['Total Loaded', shipmentStats.total],
            ['Pickup Pending', shipmentStats.pending + shipmentStats.confirmed],
            ['Picked Up', shipmentStats.pickedUp],
            ['In Transit', shipmentStats.inTransit],
            ['Out for Delivery', shipmentStats.outForDelivery],
            ['NDR Shipments', shipmentStats.ndr],
            ['Delivered', shipmentStats.delivered],
            ['RTO', shipmentStats.rto],
            ['Cancelled', shipmentStats.cancelled]
          ].map(([label, count]) => (
            <div className="acd-summary-card" key={label}>
              <span>{label}</span>
              <strong>{count}</strong>
            </div>
          ))}
        </div>
        <p className="acd-note">
          Shipment counts above are based on the records returned by the
          customer-search API.
        </p>
      </Section>

      {/* SHIPMENT PERFORMANCE */}
      <Section title="Shipment Performance" icon={ClipboardList}>
        <DataGrid
          items={[
            ['Total Loaded Shipments', shipmentStats.total],
            ['Delivered', shipmentStats.delivered],
            ['Delivery Rate', shipmentStats.total
              ? `${((shipmentStats.delivered / shipmentStats.total) * 100).toFixed(1)}%`
              : '—'],
            ['RTO', shipmentStats.rto],
            ['RTO Rate', shipmentStats.total
              ? `${((shipmentStats.rto / shipmentStats.total) * 100).toFixed(1)}%`
              : '—'],
            ['NDR Shipments', shipmentStats.ndr],
            ['Total Shipment Weight', weight(
              shipments.reduce((total, shipment) => total + Number(shipment.weightGrams || 0), 0)
            )],
            ['Average Shipment Weight', shipments.length
              ? weight(
                  shipments.reduce((total, shipment) => total + Number(shipment.weightGrams || 0), 0) /
                  shipments.length
                )
              : '—']
          ]}
        />
      </Section>

      {/* COURIER PERFORMANCE */}
      <Section title="Courier and Shipment Statistics" icon={Truck}>
        <DataTable
          columns={[
            { key: 'courier', label: 'Courier', render: (v) => titleCase(v) },
            { key: 'total', label: 'Shipments' },
            { key: 'delivered', label: 'Delivered' },
            { key: 'ndr', label: 'NDR' },
            { key: 'rto', label: 'RTO' }
          ]}
          rows={courierStats}
        />
      </Section>

      {/* REVENUE AND COD */}
      <Section title="Revenue and COD Summary" icon={IndianRupee}>
        <DataGrid
          items={[
            ['Total Shipping Charges', money(financialStats.totalShipping)],
            ['COD Shipments', financialStats.codShipments],
            ['Total COD Amount', money(financialStats.codAmount)],
            ['Total COD Charges', money(financialStats.codCharges)]
          ]}
        />

        <h4>COD Shipment Records</h4>
        <DataTable
          columns={[
            { key: 'docketNumber', label: 'Docket' },
            { key: 'codAmount', label: 'COD Amount', render: money },
            { key: 'codCharge', label: 'COD Charge', render: money },
            { key: 'codCollectionStatus', label: 'Collection', render: titleCase },
            { key: 'codRemittanceStatus', label: 'Courier Remittance', render: titleCase },
            { key: 'codSettlementStatus', label: 'Customer Settlement', render: titleCase }
          ]}
          rows={shipments.filter((s) => s.recipientPaymentMode === 'COD')}
        />
      </Section>

      {/* WALLET */}
      <Section title="Wallet and Transactions" icon={Wallet}>
        <DataGrid
          items={[
            ['Current Wallet Balance', money(wallet?.balance)],
            ['Total Transactions', walletTransactions.length],
            ['Recharge Requests', rechargeRequests.length]
          ]}
        />

        <h4>Wallet Transaction History</h4>
        <DataTable
          columns={[
            { key: 'createdAt', label: 'Date', render: date },
            { key: 'type', label: 'Type', render: titleCase },
            { key: 'amount', label: 'Amount', render: money },
            { key: 'description', label: 'Description' },
            { key: 'reference', label: 'Reference' },
            { key: 'reason', label: 'Admin Reason' }
          ]}
          rows={walletTransactions}
        />

        <h4>Wallet Recharge Requests</h4>
        <DataTable
          columns={[
            { key: 'createdAt', label: 'Date', render: date },
            { key: 'amount', label: 'Amount', render: money },
            { key: 'paymentMethod', label: 'Payment Method' },
            { key: 'status', label: 'Status', render: titleCase },
            { key: 'upiReference', label: 'UPI Reference' },
            { key: 'razorpayPaymentId', label: 'Payment ID' }
          ]}
          rows={rechargeRequests}
        />
      </Section>

      {/* INVOICES */}
      <Section title="Invoice History" icon={FileText}>
        <DataTable
          columns={[
            { key: 'invoiceNumber', label: 'Invoice Number' },
            { key: 'invoiceDate', label: 'Date', render: date },
            { key: 'shippingCharge', label: 'Shipping', render: money },
            { key: 'codCharge', label: 'COD Charge', render: money },
            { key: 'taxableAmount', label: 'Taxable Amount', render: money },
            { key: 'totalTax', label: 'Tax', render: money },
            { key: 'totalAmount', label: 'Total', render: money },
            { key: 'paymentStatus', label: 'Payment', render: titleCase }
          ]}
          rows={invoices}
        />
      </Section>

      {/* REFUNDS */}
      <Section title="Refund History" icon={RefreshCw}>
        <DataTable
          columns={[
            { key: 'createdAt', label: 'Request Date', render: date },
            { key: 'shipmentId', label: 'Shipment ID' },
            { key: 'amount', label: 'Amount', render: money },
            { key: 'reason', label: 'Reason' },
            { key: 'status', label: 'Status', render: titleCase },
            { key: 'adminNote', label: 'Admin Note' },
            { key: 'processedAt', label: 'Processed Date', render: date }
          ]}
          rows={refunds}
        />
      </Section>

      {/* SUPPORT */}
      <Section title="Customer Support History" icon={Headphones}>
        <DataGrid
          items={[
            ['Total Tickets', tickets.length],
            ['Open', tickets.filter((t) => t.status === 'OPEN').length],
            ['In Progress', tickets.filter((t) => t.status === 'IN_PROGRESS').length],
            ['Resolved', tickets.filter((t) => t.status === 'RESOLVED').length],
            ['Closed', tickets.filter((t) => t.status === 'CLOSED').length]
          ]}
        />

        <DataTable
          columns={[
            { key: 'ticketNumber', label: 'Ticket Number' },
            { key: 'category', label: 'Category', render: titleCase },
            { key: 'subject', label: 'Subject' },
            { key: 'status', label: 'Status', render: titleCase },
            { key: 'shipmentId', label: 'Shipment ID' },
            { key: 'createdAt', label: 'Created', render: date },
            { key: 'updatedAt', label: 'Updated', render: date }
          ]}
          rows={tickets}
        />
      </Section>

      {/* PICKUP LOCATIONS */}
      <Section title="Saved Pickup Locations" icon={MapPin}>
        <DataTable
          columns={[
            { key: 'locationName', label: 'Location' },
            { key: 'contactName', label: 'Contact' },
            { key: 'phone', label: 'Phone' },
            { key: 'address', label: 'Address' },
            { key: 'city', label: 'City' },
            { key: 'state', label: 'State' },
            { key: 'pincode', label: 'PIN Code' },
            { key: 'isDefault', label: 'Default', render: value },
            { key: 'isActive', label: 'Active', render: value }
          ]}
          rows={pickupLocations}
        />
      </Section>

      {/* CHILD ACCOUNTS */}
      <Section title="Child Accounts and Branches" icon={Building2}>
        <DataTable
          columns={[
            { key: 'accountName', label: 'Account Name' },
            { key: 'branchName', label: 'Branch' },
            { key: 'branchCode', label: 'Branch Code' },
            { key: 'contactPerson', label: 'Contact Person' },
            { key: 'email', label: 'Email' },
            { key: 'phone', label: 'Phone' },
            { key: 'city', label: 'City' },
            { key: 'state', label: 'State' },
            { key: 'pincode', label: 'PIN Code' },
            { key: 'status', label: 'Status', render: titleCase },
            { key: 'dailyShipmentLimit', label: 'Daily Shipment Limit' },
            { key: 'dailyWalletLimit', label: 'Daily Wallet Limit', render: money }
          ]}
          rows={childAccounts}
        />
      </Section>

      {/* DOCUMENTS */}
      <Section title="Customer Documents" icon={ShieldCheck}>
        <DataTable
          columns={[
            { key: 'documentType', label: 'Document Type', render: titleCase },
            { key: 'originalName', label: 'File Name' },
            { key: 'mimeType', label: 'File Type' },
            { key: 'fileSize', label: 'File Size', render: (v) => v ? `${(v / 1024).toFixed(1)} KB` : '—' },
            { key: 'createdAt', label: 'Uploaded', render: date }
          ]}
          rows={documents}
        />
      </Section>

      {/* CUSTOMER SETTINGS */}
      <Section title="Customer Account Settings" icon={ShieldCheck}>
        <h4>Invoice Settings</h4>
        <DataGrid
          items={[
            ['Invoice Title', invoiceSettings?.invoiceTitle],
            ['Template', titleCase(invoiceSettings?.templateStyle)],
            ['Show Logo', value(invoiceSettings?.showLogo)],
            ['Show GST', value(invoiceSettings?.showGst)],
            ['Show PAN', value(invoiceSettings?.showPan)],
            ['Footer Note', invoiceSettings?.footerNote],
            ['Terms and Conditions', invoiceSettings?.termsAndConditions]
          ]}
        />

        <h4>Shipping Label Settings</h4>
        <DataGrid
          items={[
            ['Label Size', labelSettings?.labelSize],
            ['Orientation', labelSettings?.orientation],
            ['Show Logo', value(labelSettings?.showLogo)],
            ['Show Company Name', value(labelSettings?.showCompanyName)],
            ['Show Sender Phone', value(labelSettings?.showSenderPhone)],
            ['Show Receiver Phone', value(labelSettings?.showReceiverPhone)],
            ['Show Order ID', value(labelSettings?.showOrderId)],
            ['Show Payment Mode', value(labelSettings?.showPaymentMode)],
            ['Barcode Format', labelSettings?.barcodeFormat]
          ]}
        />

        <h4>Tax Settings</h4>
        <DataGrid
          items={[
            ['Default GST Rate', taxSettings?.defaultGstRate != null ? `${taxSettings.defaultGstRate}%` : '—'],
            ['Tax Inclusive', value(taxSettings?.taxInclusive)],
            ['Reverse Charge', value(taxSettings?.reverseCharge)],
            ['Place of Supply', taxSettings?.placeOfSupply],
            ['GST Invoice Enabled', value(taxSettings?.enableGstInvoice)]
          ]}
        />

        <h4>API Keys</h4>
        <DataTable
          columns={[
            { key: 'name', label: 'Key Name' },
            { key: 'keyPrefix', label: 'Key Prefix' },
            { key: 'lastFour', label: 'Last Four' },
            { key: 'isActive', label: 'Active', render: value },
            { key: 'lastUsedAt', label: 'Last Used', render: date },
            { key: 'expiresAt', label: 'Expires', render: date },
            { key: 'revokedAt', label: 'Revoked', render: date }
          ]}
          rows={apiKeys}
        />
      </Section>

      {/* SHIPMENT HISTORY */}
      <Section title="Shipment History" icon={Package}>
        <div className="acd-tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={activeTab === tab.id ? 'active' : ''}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {filteredShipments.length ? (
          <div className="acd-shipment-list">
            {filteredShipments.map((shipment) => (
              <ShipmentCard key={shipment.id} shipment={shipment} />
            ))}
          </div>
        ) : (
          <Empty text="No shipments found in this category" />
        )}
      </Section>

      <div className="acd-footer">
        <CheckCircle2 size={16} />
        Customer data is displayed from the available ShipNext records.
      </div>
    </div>
  );
}
