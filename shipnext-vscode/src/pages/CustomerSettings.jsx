
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft, Building2, MapPin, Landmark, FileText,
  Printer, Code, Receipt, Users, ChevronRight,
  Settings, Save, Upload, LoaderCircle
} from 'lucide-react';
import API_URL from '../config/api';
import './CustomerSettings.css';

const settingsItems = [
  { id: 'company', title: 'Company Details', description: 'Manage company name, GST, PAN, address and contact details.', icon: Building2 },
  { id: 'pickup', title: 'Pickup Locations', description: 'Manage warehouses and pickup addresses.', icon: MapPin },
  { id: 'bank', title: 'Bank Details', description: 'Manage bank details for COD remittances.', icon: Landmark },
  { id: 'invoices', title: 'Invoice Templates', description: 'Configure your invoice format and branding.', icon: FileText },
  { id: 'labels', title: 'Shipping Label Configuration', description: 'Customize shipping labels and printing preferences.', icon: Printer },
  { id: 'api', title: 'API & Integrations', description: 'Manage API access and integrations.', icon: Code },
  { id: 'tax', title: 'Tax Configuration', description: 'Manage GST and tax preferences.', icon: Receipt },
  { id: 'users', title: 'Users', description: 'Manage team members and their permissions.', icon: Users },
];

const initialForm = {
  companyName: '',
  gstNumber: '',
  panNumber: '',
  address: '',
  city: '',
  state: '',
  pincode: '',
  fullName: '',
  phone: '',
  email: '',
  companyLogoUrl: '',
  bankName: '',
accountHolderName: '',
accountNumber: '',
branchName: '',
ifscCode: '',
};

export default function CustomerSettings() {
  const [activeSection, setActiveSection] = useState('company');
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
const [pickupLocations, setPickupLocations] = useState([]);
const [pickupLoading, setPickupLoading] = useState(false);
const [showPickupForm, setShowPickupForm] = useState(false);
const [editingPickupId, setEditingPickupId] = useState(null);
const [pickupSaving, setPickupSaving] = useState(false);
const [apiKeys, setApiKeys] = useState([]);
const [apiLoading, setApiLoading] = useState(false);
const [apiSaving, setApiSaving] = useState(false);
const [apiKeyName, setApiKeyName] = useState('');
const [newApiKey, setNewApiKey] = useState('');
const [apiMessage, setApiMessage] = useState('');
const [taxSettings, setTaxSettings] = useState({
  defaultGstRate: 18,
  taxInclusive: false,
  reverseCharge: false,
  placeOfSupply: '',
  enableGstInvoice: true,
});

const [taxLoading, setTaxLoading] = useState(false);
const [taxSaving, setTaxSaving] = useState(false);
const [taxMessage, setTaxMessage] = useState('');
const defaultInvoiceSettings = {
  invoiceTitle: 'TAX INVOICE',
  templateStyle: 'STANDARD',
  showLogo: true,
  showGst: true,
  showPan: false,
  footerNote: '',
  termsAndConditions: '',
};

const [invoiceSettings, setInvoiceSettings] = useState(defaultInvoiceSettings);
const [invoiceLoading, setInvoiceLoading] = useState(false);
const [invoiceSaving, setInvoiceSaving] = useState(false);
const [invoiceMessage, setInvoiceMessage] = useState('');
const defaultLabelSettings = {
  labelSize: '4X6',
  orientation: 'PORTRAIT',
  showLogo: true,
  showCompanyName: true,
  showSenderPhone: true,
  showReceiverPhone: true,
  showOrderId: true,
  showPaymentMode: true,
  barcodeFormat: 'CODE128',
};

const [labelSettings, setLabelSettings] = useState(defaultLabelSettings);
const [labelLoading, setLabelLoading] = useState(false);
const [labelSaving, setLabelSaving] = useState(false);
const [labelMessage, setLabelMessage] = useState('');
const emptyPickupForm = {
  locationName: '',
  contactName: '',
  phone: '',
  address: '',
  landmark: '',
  city: '',
  state: '',
  pincode: '',
  isDefault: false,
};

const [pickupForm, setPickupForm] = useState(emptyPickupForm);
  const activeItem = settingsItems.find(
    item => item.id === activeSection
  );

  const ActiveIcon = activeItem.icon;

  useEffect(() => {
    loadCompanyDetails();
  }, []);
  const getInvoiceSettings = async () => {
  setInvoiceLoading(true);

  try {
    const token = sessionStorage.getItem('shipnextToken');

    const response = await fetch(`${API_URL}/api/invoice-settings/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to load invoice settings');
    }

    setInvoiceSettings({
      ...defaultInvoiceSettings,
      ...data.settings,
    });
  } catch (error) {
    setInvoiceMessage(error.message);
  } finally {
    setInvoiceLoading(false);
  }
};

const handleInvoiceChange = (e) => {
  const { name, value, type, checked } = e.target;

  setInvoiceSettings((prev) => ({
    ...prev,
    [name]: type === 'checkbox' ? checked : value,
  }));
};
const getLabelSettings = async () => {
  setLabelLoading(true);

  try {
    const token = sessionStorage.getItem('shipnextToken');

    const response = await fetch(`${API_URL}/api/shipping-label-settings/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to load label settings');
    }

    setLabelSettings({
      ...defaultLabelSettings,
      ...data.settings,
    });
  } catch (error) {
    setLabelMessage(error.message);
  } finally {
    setLabelLoading(false);
  }
};

const handleLabelChange = (e) => {
  const { name, value, type, checked } = e.target;

  setLabelSettings((prev) => ({
    ...prev,
    [name]: type === 'checkbox' ? checked : value,
  }));
};

const saveLabelSettings = async () => {
  setLabelSaving(true);
  setLabelMessage('');

  try {
    const token = sessionStorage.getItem('shipnextToken');

    const response = await fetch(`${API_URL}/api/shipping-label-settings/me`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(labelSettings),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to save label settings');
    }

    setLabelSettings({
      ...defaultLabelSettings,
      ...data.settings,
    });

    setLabelMessage('Shipping label settings saved successfully.');
  } catch (error) {
    setLabelMessage(error.message);
  } finally {
    setLabelSaving(false);
  }
};
const getApiKeys = async () => {
  setApiLoading(true);

  try {
    const token = sessionStorage.getItem('shipnextToken');

    const response = await fetch(`${API_URL}/api/customer-api-keys`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to load API keys');
    }

    setApiKeys(data.keys || []);
  } catch (error) {
    setApiMessage(error.message);
  } finally {
    setApiLoading(false);
  }
};

const generateApiKey = async () => {
  if (!apiKeyName.trim()) {
    setApiMessage('Please enter an API key name.');
    return;
  }

  setApiSaving(true);
  setApiMessage('');
  setNewApiKey('');

  try {
    const token = sessionStorage.getItem('shipnextToken');

    const response = await fetch(`${API_URL}/api/customer-api-keys`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ name: apiKeyName.trim() }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to generate API key');
    }

    setNewApiKey(data.apiKey);
    setApiKeyName('');
    setApiMessage('Copy your new key now. It will not be displayed again.');

    await getApiKeys();
  } catch (error) {
    setApiMessage(error.message);
  } finally {
    setApiSaving(false);
  }
};
const getTaxSettings = async () => {
  setTaxLoading(true);

  try {
    const token = sessionStorage.getItem('shipnextToken');

    const response = await fetch(`${API_URL}/api/customer-tax-settings`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (data.success) {
      setTaxSettings(data.settings);
    }
  } catch (error) {
    console.error('Tax settings error:', error);
  } finally {
    setTaxLoading(false);
  }
};

const saveTaxSettings = async () => {
  setTaxSaving(true);
  setTaxMessage('');

  try {
    const token = sessionStorage.getItem('shipnextToken');

    const response = await fetch(`${API_URL}/api/customer-tax-settings`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(taxSettings),
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.message || 'Unable to save tax settings.');
    }

    setTaxSettings(data.settings);
    setTaxMessage('Tax settings saved successfully.');
  } catch (error) {
    setTaxMessage(error.message);
  } finally {
    setTaxSaving(false);
  }
};

const handleTaxChange = (e) => {
  const { name, value, type, checked } = e.target;

  setTaxSettings((prev) => ({
    ...prev,
    [name]: type === 'checkbox' ? checked : value,
  }));
};
const revokeApiKey = async (id) => {
  if (!window.confirm('Are you sure you want to revoke this API key?')) return;

  try {
    const token = sessionStorage.getItem('shipnextToken');

    const response = await fetch(`${API_URL}/api/customer-api-keys/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to revoke API key');
    }

    setApiMessage('API key revoked successfully.');
    await getApiKeys();
  } catch (error) {
    setApiMessage(error.message);
  }
};

const copyApiKey = async () => {
  try {
    await navigator.clipboard.writeText(newApiKey);
    setApiMessage('API key copied successfully.');
  } catch {
    setApiMessage('Copy failed. Please select and copy the key manually.');
  }
};
const saveInvoiceSettings = async () => {
  setInvoiceSaving(true);
  setInvoiceMessage('');

  try {
    const token = sessionStorage.getItem('shipnextToken');

    const response = await fetch(`${API_URL}/api/invoice-settings/me`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(invoiceSettings),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to save invoice settings');
    }

    setInvoiceSettings({
      ...defaultInvoiceSettings,
      ...data.settings,
    });

    setInvoiceMessage('Invoice settings saved successfully.');
  } catch (error) {
    setInvoiceMessage(error.message);
  } finally {
    setInvoiceSaving(false);
  }
};
  const loadCompanyDetails = async () => {
    try {
      setLoading(true);
      setError('');

      const token = sessionStorage.getItem('shipnextToken');

      const response = await fetch(`${API_URL}/api/profile/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Unable to load company details.');
      }

      const profile = data.profile || {};

      setForm({
        companyName: profile.companyName || '',
        gstNumber: profile.gstNumber || '',
        panNumber: profile.panNumber || '',
        address: profile.address || '',
        city: profile.city || '',
        state: profile.state || '',
        pincode: profile.pincode || '',
        fullName: profile.fullName || '',
        phone: profile.phone || '',
        email: profile.email || '',
        companyLogoUrl: profile.companyLogoUrl || '',
        bankName: profile.bankName || '',
accountHolderName: profile.accountHolderName || '',
accountNumber: profile.accountNumber || '',
branchName: profile.branchName || '',
ifscCode: profile.ifscCode || '',
      });
    } catch (err) {
      setError(err.message || 'Unable to load company details.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

const formattedValue = name === 'ifscCode'
  ? value.toUpperCase()
  : value;

    setForm(prev => ({
      ...prev,
      [name]: formattedValue,
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();

    try {
      setSaving(true);
      setMessage('');
      setError('');

      const token = sessionStorage.getItem('shipnextToken');

      const response = await fetch(`${API_URL}/api/profile/me`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...form,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Unable to save company details.');
      }

      const profile = data.profile || {};

      setForm(prev => ({
        ...prev,
        companyName: profile.companyName || '',
        gstNumber: profile.gstNumber || '',
        panNumber: profile.panNumber || '',
        address: profile.address || '',
        city: profile.city || '',
        state: profile.state || '',
        pincode: profile.pincode || '',
        fullName: profile.fullName || '',
        phone: profile.phone || '',
        email: profile.email || '',
        companyLogoUrl: profile.companyLogoUrl || '',
        bankName: profile.bankName || '',
accountHolderName: profile.accountHolderName || '',
accountNumber: profile.accountNumber || '',
branchName: profile.branchName || '',
ifscCode: profile.ifscCode || '',
      }));

      setMessage('Company details saved successfully.');
    } catch (err) {
      setError(err.message || 'Unable to save company details.');
    } finally {
      setSaving(false);
    }
  };

  const renderField = (label, name, placeholder, required = false) => (
    <label className="company-form-field">
      <span>
        {label} {required && <b>*</b>}
      </span>
      <input
        type="text"
        name={name}
        value={form[name]}
        onChange={handleChange}
        placeholder={placeholder}
        required={required}
      />
    </label>
  );
const getPickupLocations = async () => {
  try {
    setPickupLoading(true);
    const token = sessionStorage.getItem('shipnextToken');

    const response = await fetch(`${API_URL}/api/pickup-locations`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const data = await response.json();
    if (!response.ok || !data.success) {
      throw new Error(data.message || 'Unable to load pickup locations.');
    }

    setPickupLocations(data.locations || []);
  } catch (err) {
    setError(err.message);
  } finally {
    setPickupLoading(false);
  }
};
useEffect(() => {
  if (activeSection === 'invoices') {
    getInvoiceSettings();
  }
}, [activeSection]);
useEffect(() => {
  if (activeSection === 'tax') {
    getTaxSettings();
  }
}, [activeSection]);

useEffect(() => {
  if (activeSection === 'pickup') {
    getPickupLocations();
  }
}, [activeSection]);
useEffect(() => {
  if (activeSection === 'labels') {
    getLabelSettings();
  }
}, [activeSection]);
useEffect(() => {
  if (activeSection === 'api') {
    getApiKeys();
  }
}, [activeSection]);

const openPickupForm = (location = null) => {
  setError('');
  setMessage('');

  if (location) {
    setEditingPickupId(location.id);
    setPickupForm({
      locationName: location.locationName || '',
      contactName: location.contactName || '',
      phone: location.phone || '',
      address: location.address || '',
      landmark: location.landmark || '',
      city: location.city || '',
      state: location.state || '',
      pincode: location.pincode || '',
      isDefault: location.isDefault || false,
    });
  } else {
    setEditingPickupId(null);
    setPickupForm({
      ...emptyPickupForm,
      isDefault: pickupLocations.length === 0,
    });
  }

  setShowPickupForm(true);
};

const handlePickupChange = (e) => {
  const { name, value, checked, type } = e.target;

  setPickupForm(prev => ({
    ...prev,
    [name]: type === 'checkbox' ? checked : value,
  }));
};

const savePickupLocation = async (e) => {
  e.preventDefault();

  try {
    setPickupSaving(true);
    setError('');
    setMessage('');

    const token = sessionStorage.getItem('shipnextToken');
    const url = editingPickupId
      ? `${API_URL}/api/pickup-locations/${editingPickupId}`
      : `${API_URL}/api/pickup-locations`;

    const response = await fetch(url, {
      method: editingPickupId ? 'PUT' : 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(pickupForm),
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.message || 'Unable to save pickup location.');
    }

    setShowPickupForm(false);
    setEditingPickupId(null);
    setPickupForm(emptyPickupForm);
    setMessage(data.message);
    await getPickupLocations();
  } catch (err) {
    setError(err.message);
  } finally {
    setPickupSaving(false);
  }
};

const setDefaultPickup = async (id) => {
  try {
    setError('');
    const token = sessionStorage.getItem('shipnextToken');

    const response = await fetch(
      `${API_URL}/api/pickup-locations/${id}/default`,
      {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.message || 'Unable to update default location.');
    }

    setMessage(data.message);
    await getPickupLocations();
  } catch (err) {
    setError(err.message);
  }
};

const deletePickup = async (id) => {
  if (!window.confirm('Are you sure you want to delete this pickup location?')) {
    return;
  }

  try {
    setError('');
    const token = sessionStorage.getItem('shipnextToken');

    const response = await fetch(
      `${API_URL}/api/pickup-locations/${id}`,
      {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.message || 'Unable to delete location.');
    }

    setMessage(data.message);
    await getPickupLocations();
  } catch (err) {
    setError(err.message);
  }
};
  return (
    <div className="customer-settings">
      <header className="customer-settings-topbar">
        <Link to="/dashboard" className="settings-back">
          <ArrowLeft size={18} /> Back to Dashboard
        </Link>
       <img
  src="/logo.jpeg"
  alt="ShipNext"
 className="label-preview-logo"
/>
      </header>

      <div className="settings-page-heading">
        <div className="settings-heading-icon">
          <Settings size={24} />
        </div>
        <div>
          <span>ACCOUNT MANAGEMENT</span>
          <h1>Settings</h1>
          <p>Manage your ShipNext account and business preferences.</p>
        </div>
      </div>

      <div className="settings-layout">
        <aside className="settings-sidebar">
          <span className="settings-sidebar-label">SETTINGS MENU</span>

          {settingsItems.map(item => {
            const Icon = item.icon;

            return (
              <button
                key={item.id}
                className={`settings-menu-item ${
                  activeSection === item.id ? 'active' : ''
                }`}
                onClick={() => setActiveSection(item.id)}
              >
                <Icon size={17} />
                <span>{item.title}</span>
                <ChevronRight size={15} className="settings-chevron" />
              </button>
            );
          })}
        </aside>

        <main className="settings-content">
          <div className="settings-content-heading">
            <div>
              <span>ACCOUNT SETTINGS</span>
              <h2>{activeItem.title}</h2>
              <p>{activeItem.description}</p>
            </div>
            <div className="settings-content-icon">
              <ActiveIcon size={25} />
            </div>
          </div>

         
 {activeSection === 'company' ? (
  <div className="company-details-form-wrapper">
    <div className="company-settings-intro">
      <h3>Company Details</h3>
      <p>Manage your business information and registered address.</p>
    </div>

    {error && <div className="company-form-message error">{error}</div>}
    {message && <div className="company-form-message success">{message}</div>}

    <form className="company-details-form" onSubmit={handleSave}>
      <div className="company-form-grid">
        {renderField('Company Name', 'companyName')}
        {renderField('Contact Person', 'fullName')}
        {renderField('Email Address', 'email')}
        {renderField('Phone Number', 'phone')}
        {renderField('GST Number', 'gstNumber')}
        {renderField('PAN Number', 'panNumber')}
        {renderField('Address', 'address')}
        {renderField('City', 'city')}
        {renderField('State', 'state')}
        {renderField('PIN Code', 'pincode')}
      </div>

      <button type="submit" disabled={saving}>
        {saving ? 'Saving...' : 'Save Company Details'}
      </button>
    </form>
  </div>
) : activeSection === 'pickup' ? (
  <div className="pickup-manager">

    <div className="pickup-toolbar">
      <div>
        <h3>Your Pickup Addresses</h3>
        <p>Manage your warehouses and shipment collection locations.</p>
      </div>

      <button onClick={() => openPickupForm()}>
        + Add Pickup Location
      </button>
    </div>

    {error && <div className="company-form-message error">{error}</div>}
    {message && <div className="company-form-message success">{message}</div>}

    {showPickupForm && (
      <form className="pickup-form" onSubmit={savePickupLocation}>
        <h3>{editingPickupId ? 'Edit Pickup Location' : 'Add New Pickup Location'}</h3>

        <div className="company-form-grid">
          {[
            ['Location Name', 'locationName', 'Warehouse / Office'],
            ['Contact Person', 'contactName', 'Contact name'],
            ['Mobile Number', 'phone', '10-digit mobile number'],
            ['City', 'city', 'City'],
            ['State', 'state', 'State'],
            ['PIN Code', 'pincode', '6-digit PIN code'],
            ['Landmark', 'landmark', 'Nearby landmark'],
          ].map(([label, name, placeholder]) => (
            <label className="company-form-field" key={name}>
              <span>{label}{name !== 'landmark' && <b> *</b>}</span>
              <input
                name={name}
                value={pickupForm[name]}
                onChange={handlePickupChange}
                placeholder={placeholder}
                required={name !== 'landmark'}
                maxLength={name === 'phone' || name === 'pincode' ? 10 : undefined}
              />
            </label>
          ))}

          <label className="company-form-field full">
            <span>Complete Address <b>*</b></span>
            <textarea
              name="address"
              value={pickupForm.address}
              onChange={handlePickupChange}
              placeholder="House / building, street, area"
              required
              rows={3}
            />
          </label>
        </div>

        <label className="pickup-default-checkbox">
          <input
            type="checkbox"
            name="isDefault"
            checked={pickupForm.isDefault}
            onChange={handlePickupChange}
          />
          Set as default pickup location
        </label>

        <div className="pickup-form-actions">
          <button type="button" className="pickup-cancel" onClick={() => setShowPickupForm(false)}>
            Cancel
          </button>
          <button type="submit" disabled={pickupSaving}>
            {pickupSaving ? 'Saving...' : editingPickupId ? 'Update Location' : 'Save Location'}
          </button>
        </div>
      </form>
    )}

    {pickupLoading ? (
      <div className="settings-loading">Loading pickup locations...</div>
    ) : pickupLocations.length === 0 ? (
      <div className="pickup-empty">
        <MapPin size={35} />
        <h3>No pickup locations yet</h3>
        <p>Add your first warehouse or pickup address to get started.</p>
        <button onClick={() => openPickupForm()}>Add First Location</button>
      </div>
    ) : (
      <div className="pickup-location-grid">
        {pickupLocations.map(location => (
          <div className="pickup-location-card" key={location.id}>
            <div className="pickup-card-top">
              <div className="pickup-card-icon"><MapPin size={20} /></div>
              {location.isDefault && <span className="pickup-default-badge">DEFAULT</span>}
            </div>

            <h3>{location.locationName}</h3>
            <p className="pickup-contact">{location.contactName} · {location.phone}</p>
            <p className="pickup-address">
              {location.address}
              {location.landmark ? `, ${location.landmark}` : ''}
              <br />
              {location.city}, {location.state} - {location.pincode}
            </p>

            <div className="pickup-card-actions">
              <button onClick={() => openPickupForm(location)}>Edit</button>
              {!location.isDefault && (
                <button onClick={() => setDefaultPickup(location.id)}>Set Default</button>
              )}
              <button className="pickup-delete" onClick={() => deletePickup(location.id)}>Delete</button>
            </div>
          </div>
        ))}
      </div>
    )}
  </div>
  ) : activeSection === 'bank' ? (
  <div className="company-details-form-wrapper">
    <form onSubmit={handleSave} className="company-details-form">

      {error && (
        <div className="company-form-message error">{error}</div>
      )}

      {message && (
        <div className="company-form-message success">{message}</div>
      )}

      <div className="company-form-section">
        <div className="company-form-section-heading">
          <Landmark size={19} />
          <div>
            <h3>Bank Account Information</h3>
            <p>Bank account details for COD remittances and settlements</p>
          </div>
        </div>

        <div className="company-form-grid">
          {renderField('Account Holder Name', 'accountHolderName', 'Name as registered with bank', true)}
          {renderField('Bank Name', 'bankName', 'Enter bank name', true)}
          {renderField('Account Number', 'accountNumber', 'Enter bank account number', true)}
          {renderField('Confirm Branch Name', 'branchName', 'Enter branch name')}
          {renderField('IFSC Code', 'ifscCode', 'Enter 11-character IFSC code', true)}
        </div>
      </div>

      <div className="company-form-actions">
        <button type="submit" disabled={saving}>
          {saving ? 'Saving...' : (
            <>
              <Save size={17} />
              Save Bank Details
            </>
          )}
        </button>
      </div>
    </form>
  </div>
  ) : activeSection === 'invoices' ? (
  <div className="invoice-settings-wrapper">
    {invoiceLoading ? (
      <p>Loading invoice settings...</p>
    ) : (
      <>
        <div className="invoice-settings-grid">
          <div className="invoice-settings-form">
            <h3>Invoice Configuration</h3>

            <label>Invoice Title</label>
            <input
              name="invoiceTitle"
              value={invoiceSettings.invoiceTitle}
              onChange={handleInvoiceChange}
              placeholder="TAX INVOICE"
            />

            <label>Template Style</label>
            <select
              name="templateStyle"
              value={invoiceSettings.templateStyle}
              onChange={handleInvoiceChange}
            >
              <option value="STANDARD">Standard</option>
              <option value="MODERN">Modern</option>
              <option value="MINIMAL">Minimal</option>
            </select>

            <h3>Display Options</h3>

            <label className="invoice-toggle">
              <input
                type="checkbox"
                name="showLogo"
                checked={invoiceSettings.showLogo}
                onChange={handleInvoiceChange}
              />
              Show company logo
            </label>

            <label className="invoice-toggle">
              <input
                type="checkbox"
                name="showGst"
                checked={invoiceSettings.showGst}
                onChange={handleInvoiceChange}
              />
              Show GST number
            </label>

            <label className="invoice-toggle">
              <input
                type="checkbox"
                name="showPan"
                checked={invoiceSettings.showPan}
                onChange={handleInvoiceChange}
              />
              Show PAN number
            </label>

            <label>Invoice Footer Note</label>
            <textarea
              name="footerNote"
              value={invoiceSettings.footerNote}
              onChange={handleInvoiceChange}
              placeholder="Thank you for choosing ShipNext."
            />

            <label>Terms & Conditions</label>
            <textarea
              name="termsAndConditions"
              value={invoiceSettings.termsAndConditions}
              onChange={handleInvoiceChange}
              placeholder="Enter invoice terms and conditions..."
            />

            <button
              type="button"
              onClick={saveInvoiceSettings}
              disabled={invoiceSaving}
            >
              {invoiceSaving ? 'Saving...' : 'Save Invoice Settings'}
            </button>

            {invoiceMessage && <p>{invoiceMessage}</p>}
          </div>

          <div className={`invoice-live-preview invoice-${invoiceSettings.templateStyle.toLowerCase()}`}>
            <div className="invoice-preview-header">
              {invoiceSettings.showLogo && form.companyLogoUrl && (
                <img src={form.companyLogoUrl} alt="Company logo" />
              )}
              <h2>{invoiceSettings.invoiceTitle || 'TAX INVOICE'}</h2>
             <img
  src="/logo.jpeg"
  alt="ShipNext"
  className="settings-brand-logo"
/> 
            </div>

            <hr />

            <h4>{form.companyName || 'Your Company Name'}</h4>

            <p>{form.address || 'Company address'}</p>
            <p>{form.city} {form.state} {form.pincode}</p>

            {invoiceSettings.showGst && (
              <p>GSTIN: {form.gstNumber || 'Not provided'}</p>
            )}

            {invoiceSettings.showPan && (
              <p>PAN: {form.panNumber || 'Not provided'}</p>
            )}

            <hr />

            <p><strong>Invoice No:</strong> SN-XXXXXXXX</p>
            <p><strong>Invoice Date:</strong> DD/MM/YYYY</p>

            <table className="invoice-preview-table">
              <thead>
                <tr>
                  <th>Description</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Shipping Charges</td>
                  <td>₹0.00</td>
                </tr>
                <tr>
                  <td>GST</td>
                  <td>₹0.00</td>
                </tr>
              </tbody>
            </table>

            <h3 className="invoice-preview-total">Total: ₹0.00</h3>

            {invoiceSettings.footerNote && (
              <p className="invoice-preview-footer">{invoiceSettings.footerNote}</p>
            )}

            {invoiceSettings.termsAndConditions && (
              <div className="invoice-preview-terms">
                <strong>Terms & Conditions</strong>
                <p>{invoiceSettings.termsAndConditions}</p>
              </div>
            )}
          </div>
        </div>
      </>
    )}
  </div>
  ) : activeSection === 'labels' ? (
  <div className="label-settings-wrapper">
    {labelLoading ? (
      <p>Loading shipping label settings...</p>
    ) : (
      <>
        <div className="label-settings-grid">
          <div className="label-settings-form">
            <h3>Label Format</h3>

            <label>Label Size</label>
            <select
              name="labelSize"
              value={labelSettings.labelSize}
              onChange={handleLabelChange}
            >
              <option value="4X6">4 × 6 inches</option>
              <option value="4X4">4 × 4 inches</option>
              <option value="A4">A4 Paper</option>
            </select>

            <label>Orientation</label>
            <select
              name="orientation"
              value={labelSettings.orientation}
              onChange={handleLabelChange}
            >
              <option value="PORTRAIT">Portrait</option>
              <option value="LANDSCAPE">Landscape</option>
            </select>

            <h3>Label Information</h3>

            {[
              ['showLogo', 'Show company logo'],
              ['showCompanyName', 'Show company name'],
              ['showSenderPhone', 'Show sender phone'],
              ['showReceiverPhone', 'Show receiver phone'],
              ['showOrderId', 'Show order ID'],
              ['showPaymentMode', 'Show payment mode (COD / Prepaid)'],
            ].map(([name, label]) => (
              <label className="label-toggle" key={name}>
                <input
                  type="checkbox"
                  name={name}
                  checked={labelSettings[name]}
                  onChange={handleLabelChange}
                />
                {label}
              </label>
            ))}

            <h3>Barcode Settings</h3>

            <label>Barcode Format</label>
            <select
              name="barcodeFormat"
              value={labelSettings.barcodeFormat}
              onChange={handleLabelChange}
            >
              <option value="CODE128">Code 128</option>
              <option value="QR">QR Code</option>
            </select>

            <button
              type="button"
              onClick={saveLabelSettings}
              disabled={labelSaving}
            >
              {labelSaving ? 'Saving...' : 'Save Label Settings'}
            </button>

            {labelMessage && <p>{labelMessage}</p>}
          </div>

          <div className={`label-live-preview label-${labelSettings.orientation.toLowerCase()}`}>
            <div className="label-preview-brand">
              {labelSettings.showLogo && form.companyLogoUrl && (
                <img src={form.companyLogoUrl} alt="Company logo" />
              )}
              {labelSettings.showCompanyName && (
                <strong>{form.companyName || 'YOUR COMPANY'}</strong>
              )}
            </div>

            <div className="label-preview-heading">
              <strong>SHIPMENT LABEL</strong>
              {labelSettings.showPaymentMode && <span>PREPAID</span>}
            </div>

            <div className="label-preview-address">
              <small>SHIP FROM</small>
              <strong>{form.fullName || 'Sender Name'}</strong>
              <p>{form.address || 'Sender Address'}</p>
              <p>{form.city} {form.state} {form.pincode}</p>
              {labelSettings.showSenderPhone && (
                <p>Phone: {form.phone || 'Sender Phone'}</p>
              )}
            </div>

            <div className="label-preview-address">
              <small>SHIP TO</small>
              <strong>Receiver Name</strong>
              <p>Receiver Address</p>
              <p>City, State - PIN</p>
              {labelSettings.showReceiverPhone && <p>Phone: Receiver Phone</p>}
            </div>

            {labelSettings.showOrderId && (
              <p className="label-preview-order">ORDER ID: SN-XXXXXXXX</p>
            )}

            <div className="label-preview-barcode">
              {labelSettings.barcodeFormat === 'QR' ? '▦ QR CODE' : '|||| ||| |||||| |||'}
              <small>{labelSettings.barcodeFormat}</small>
            </div>

            <img
  src="/logo.jpeg"
  alt="ShipNext"
className="label-preview-logo"
/>
          </div>
        </div>
      </>
    )}
  </div>
  ) : activeSection === 'api' ? (
  <div className="api-settings-wrapper">
    <div className="api-settings-intro">
      <h3>ShipNext API Access</h3>
      <p>
        Connect your store, ERP or order management system with ShipNext.
        Manage your private API credentials below.
      </p>
    </div>

    <div className="api-create-card">
      <h3>Generate New API Key</h3>

      <input
        type="text"
        value={apiKeyName}
        onChange={(e) => setApiKeyName(e.target.value)}
        placeholder="Example: Shopify Integration"
        maxLength={60}
      />

      <button
        type="button"
        onClick={generateApiKey}
        disabled={apiSaving}
      >
        {apiSaving ? 'Generating...' : 'Generate API Key'}
      </button>

      {newApiKey && (
        <div className="api-new-key">
          <strong>Your new API key</strong>
          <p>Copy it now. You cannot view the full key again.</p>

          <code>{newApiKey}</code>

          <button type="button" onClick={copyApiKey}>
            Copy API Key
          </button>
        </div>
      )}

      {apiMessage && <p className="api-message">{apiMessage}</p>}
    </div>

    <div className="api-keys-card">
      <div className="api-keys-heading">
        <h3>Your API Keys</h3>
        <span>{apiKeys.filter((key) => key.isActive).length} active</span>
      </div>

      {apiLoading ? (
        <p>Loading API keys...</p>
      ) : apiKeys.length === 0 ? (
        <p>No API keys generated yet.</p>
      ) : (
        <div className="api-keys-list">
          {apiKeys.map((key) => (
            <div className="api-key-row" key={key.id}>
              <div>
                <strong>{key.name}</strong>
                <p>
                  {key.keyPrefix}••••{key.lastFour}
                </p>
                <small>
                  Created: {new Date(key.createdAt).toLocaleDateString()}
                </small>
                <span className={key.isActive ? 'api-active' : 'api-revoked'}>
                  {key.isActive ? 'Active' : 'Revoked'}
                </span>
              </div>

              {key.isActive && (
                <button
                  type="button"
                  className="api-revoke-button"
                  onClick={() => revokeApiKey(key.id)}
                >
                  Revoke
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>

    <div className="api-documentation-card">
      <h3>API Documentation</h3>
      <p>Base URL</p>
      <code>{API_URL}/api</code>
      <p>
        API authentication and endpoint documentation will be available
        when the external API integration is enabled.
      </p>
    </div>
  </div>
  

) : activeSection === 'tax' ? (
  <div className="tax-settings-wrapper">
    <div className="tax-settings-intro">
      <h3>Tax Configuration</h3>
      <p>Manage GST defaults and tax preferences for your invoices.</p>
    </div>

    {taxLoading ? (
      <p>Loading tax settings...</p>
    ) : (
      <div className="tax-settings-card">
        <div className="tax-form-group">
          <label>Default GST Rate</label>
          <select
            name="defaultGstRate"
            value={taxSettings.defaultGstRate}
            onChange={handleTaxChange}
          >
            {[0, 5, 12, 18, 28].map((rate) => (
              <option key={rate} value={rate}>{rate}%</option>
            ))}
          </select>
        </div>

        <div className="tax-form-group">
          <label>Place of Supply</label>
          <input
            name="placeOfSupply"
            value={taxSettings.placeOfSupply || ''}
            onChange={handleTaxChange}
            placeholder="Example: Maharashtra"
          />
        </div>

        <label className="tax-checkbox">
          <input
            type="checkbox"
            name="taxInclusive"
            checked={taxSettings.taxInclusive}
            onChange={handleTaxChange}
          />
          Prices are inclusive of GST
        </label>

        <label className="tax-checkbox">
          <input
            type="checkbox"
            name="reverseCharge"
            checked={taxSettings.reverseCharge}
            onChange={handleTaxChange}
          />
          Enable Reverse Charge Mechanism
        </label>

        <label className="tax-checkbox">
          <input
            type="checkbox"
            name="enableGstInvoice"
            checked={taxSettings.enableGstInvoice}
            onChange={handleTaxChange}
          />
          Enable GST invoices
        </label>

        {taxMessage && <p className="tax-message">{taxMessage}</p>}

        <button
          type="button"
          onClick={saveTaxSettings}
          disabled={taxSaving || taxLoading}
        >
          {taxSaving ? 'Saving...' : 'Save Tax Settings'}
        </button>
      </div>
    )}
  </div>

) : activeSection === 'users' ? (
  <div className="users-settings-wrapper">
    <div className="users-settings-intro">
      <h3>Team Members & Child Accounts</h3>
      <p>
        Manage your branches, team members and account-level
        shipping permissions from one place.
      </p>
    </div>

    <div className="users-settings-card">
      <div className="users-settings-icon">
        <Users size={30} />
      </div>

      <div>
        <h3>Manage Child Accounts</h3>
        <p>
          Create and manage branch accounts, assign contact
          details and configure account limits.
        </p>
      </div>

      <Link to="/child-accounts" className="users-manage-button">
        Manage Accounts <ChevronRight size={18} />
      </Link>
    </div>
  </div>

) : (
  <div className="settings-placeholder">
    <div className="settings-placeholder-icon">
      <ActiveIcon size={30} />
    </div>
    <h3>{activeItem.title}</h3>
    <p>
      This section is ready for configuration.
      We will connect its forms and backend functionality next.
    </p>
  </div>
)

    }
    <div className="settings-footer">
  <img
    src="/logo.jpeg"
    alt="ShipNext Logo"
    className="settings-footer-logo"
  />
  <span>Manage your business. Ship smarter.</span>
</div>
        </main>
      </div>
    </div>
  );
}
