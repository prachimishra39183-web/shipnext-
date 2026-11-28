
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

   const response = await shadowfaxRequest(
    `/v1/clients/serviceability/?${query.toString()}`
  );

console.log('SHADOWFAX LIVE SERVICEABILITY:', {
  pincode: pin,
  service,
  response: JSON.stringify(response, null, 2),
});

  return response;
}


function getAvailableServices(response, pincode) {
  const result = Array.isArray(response)
    ? response.find(
        item => String(item.code) === String(pincode)
      )
    : null;

  const services = Array.isArray(result?.services)
    ? result.services
    : [];

  return {
    serviceable: Boolean(result),
    services,
    regular: services.includes('Regular'),
    surface: services.includes('Surface'),
    marketplace: services.includes('Marketplace'),
    surfaceMarketplace: services.includes('Surface_Mkt'),
    rts: services.includes('RTS'),
    surfaceRts: services.includes('Surface_RTS'),
    large: services.includes('Large'),
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
async function cancelShipment(awbNumber, remarks = 'ShipNext test order cancellation') {
  const awb = String(awbNumber || '').trim();

  if (!awb) {
    throw new Error('Shadowfax AWB number is required.');
  }

  const result = await shadowfaxRequest(
    '/v3/clients/orders/cancel/',
    {
      method: 'POST',
      body: JSON.stringify({
        request_id: awb,
        cancel_remarks: remarks,
      }),
    }
  );

  if (Number(result.responseCode) !== 200) {
    throw new Error(
      result.responseMsg || 'Shadowfax cancellation was not confirmed.'
    );
  }

  console.log('SHADOWFAX CANCELLATION CONFIRMED:', result);

  return result;
}
module.exports = {
  checkServiceability,
  getAvailableServices,
  createShipment,
  trackShipment,
  cancelShipment,
};
