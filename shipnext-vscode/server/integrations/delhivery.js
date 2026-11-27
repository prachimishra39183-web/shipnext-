require('dotenv').config();
const BASE_URL =
  process.env.DELHIVERY_BASE_URL ||
  'https://ltl-clients-api-dev.delhivery.com';

let cachedToken = null;
let tokenExpiry = 0;

async function getDelhiveryToken() {
  if (cachedToken && Date.now() < tokenExpiry) {
    return cachedToken;
  }

  const username = process.env.DELHIVERY_USERNAME;
  const password = process.env.DELHIVERY_PASSWORD;

  if (!username || !password) {
    throw new Error('Delhivery credentials are not configured.');
  }

  const response = await fetch(`${BASE_URL}/ums/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({ username, password }),
  });

  const data = await response.json();

 if (!response.ok) {
  console.error('Delhivery Login Debug:', {
    status: response.status,
    message: data.message || data.detail || data,
  });

  throw new Error(
    `Delhivery login failed (${response.status}): ${
      data.message || data.detail || 'Unknown error'
    }`
  );
}
  const token =
    data.token ||
    data.access_token ||
    data.data?.token;

  if (!token) {
    throw new Error('Delhivery login response did not contain a token.');
  }

  cachedToken = token;
  // Reuse for 23 hours; Delhivery tokens are valid for 24 hours.
  tokenExpiry = Date.now() + 23 * 60 * 60 * 1000;

  return cachedToken;
}

async function delhiveryRequest(path, options = {}) {
  const token = await getDelhiveryToken();

  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
      ...(options.headers || {}),
    },
  });

  const text = await response.text();

  let data;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    throw new Error('Delhivery returned an invalid response.');
  }

  if (!response.ok) {
    console.error('Delhivery API error:', {
      status: response.status,
      data,
    });

    throw new Error(
      data.message ||
      data.detail ||
      `Delhivery API error: ${response.status}`
    );
  }

  return data;
}

async function checkServiceability(pincode, weight = 1) {
  if (!/^\d{6}$/.test(String(pincode))) {
    throw new Error('Invalid delivery pincode.');
  }

  return delhiveryRequest(
    `/pincode-service/${encodeURIComponent(pincode)}?weight=${encodeURIComponent(weight)}`
  );
}

module.exports = {
  getDelhiveryToken,
  delhiveryRequest,
  checkServiceability,
};
