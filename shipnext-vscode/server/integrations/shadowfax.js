
const BASE_URL =
  process.env.SHADOWFAX_BASE_URL ||
  'https://dale.shadowfax.in/api';

function getHeaders() {
  const token = process.env.SHADOWFAX_API_TOKEN;

  if (!token) {
    throw new Error('Shadowfax API token is not configured.');
  }

  return {
    Authorization: `Token ${token}`,
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };
}

async function shadowfaxRequest(path, options = {}) {
  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      ...getHeaders(),
      ...(options.headers || {}),
    },
  });

  const text = await response.text();

  let data;

  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    throw new Error('Shadowfax returned an invalid response.');
  }

  if (!response.ok) {
  console.error('Shadowfax API response:', {
    status: response.status,
    data,
  });

  throw new Error(
    data.message ||
    data.detail ||
    JSON.stringify(data) ||
    `Shadowfax API error: ${response.status}`
  );
}

  return data;
}


async function checkServiceability(pincode, service = 'marketplace') {
  const allowedServices = [
    'marketplace',
    'regular',
    'seller_pickup',
    'seller_delivery',
    'customer_delivery',
    'warehouse_pickup',
    'warehouse_return',
    'customer_pickup',
  ];

  if (!allowedServices.includes(service)) {
    throw new Error('Invalid Shadowfax service type.');
  }

  const pin = String(pincode).trim();

  if (!/^\d{6}$/.test(pin)) {
    throw new Error('Enter a valid 6-digit PIN code.');
  }

  const query = new URLSearchParams({
    service,
    pincodes: pin,
  });

  return shadowfaxRequest(
    `/v1/clients/serviceability/?${query.toString()}`
  );
}

function getAvailableServices(response, pincode) {
  const result = Array.isArray(response)
    ? response.find(item => String(item.code) === String(pincode))
    : null;

  return {
    serviceable: Boolean(result),
    services: result?.services || [],
    regular: result?.services?.includes('Regular') || false,
    surface: result?.services?.includes('Surface') || false,
    marketplace: result?.services?.includes('Marketplace') || false,
    surfaceMarketplace:
      result?.services?.includes('Surface_Mkt') || false,
    rts: result?.services?.includes('RTS') || false,
    surfaceRts:
      result?.services?.includes('Surface_RTS') || false,
  };
}

// 2. Create forward shipment
async function createShipment(payload) {
  const result = await shadowfaxRequest(
    '/v3/clients/orders/',
    {
      method: 'POST',
      body: JSON.stringify(payload),
    }
  );

  if (result.message !== 'Success' || !result.data?.awb_number) {
    throw new Error(
      result.errors?.message ||
      result.message ||
      'Shadowfax rejected the shipment.'
    );
  }

  return result.data;
}

// 3. Track shipment
async function trackShipment(awbNumber) {
  return shadowfaxRequest(
    `/v4/clients/orders/${encodeURIComponent(awbNumber)}/track/`
  );
}

// 4. Cancel shipment
async function cancelShipment(awbNumber, remarks = '') {
  return shadowfaxRequest(
    '/v3/clients/orders/cancel/',
    {
      method: 'POST',
      body: JSON.stringify({
        request_id: awbNumber,
        cancel_remarks: remarks,
      }),
    }
  );
}
module.exports = {
  checkServiceability,
  getAvailableServices,
  createShipment,
  trackShipment,
  cancelShipment,
};
