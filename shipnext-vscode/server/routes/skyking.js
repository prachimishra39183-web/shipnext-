
const express = require('express');
const router = express.Router();

const { authenticateToken } = require('../middleware/auth');

const SKYKING_TRACKING_URL = process.env.SKYKING_TRACKING_URL;
const SKYKING_EMAIL = process.env.SKYKING_EMAIL;
const SKYKING_API_KEY = process.env.SKYKING_API_KEY;

// GET /api/skyking/track/:cnote
router.get('/track/:cnote', authenticateToken, async (req, res) => {
  try {
    const cnote = String(req.params.cnote || '').trim();

    if (!cnote || !/^[a-zA-Z0-9-]+$/.test(cnote)) {
      return res.status(400).json({
        success: false,
        message: 'A valid Skyking consignment number is required.',
      });
    }

    if (!SKYKING_TRACKING_URL || !SKYKING_EMAIL || !SKYKING_API_KEY) {
      console.error('Skyking tracking configuration is missing.');

      return res.status(500).json({
        success: false,
        message: 'Skyking tracking is not configured.',
      });
    }

    const url = new URL(SKYKING_TRACKING_URL);

    url.searchParams.set('cnote', cnote);
    url.searchParams.set('key', SKYKING_API_KEY);
    url.searchParams.set('email', SKYKING_EMAIL);

    const skykingResponse = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
      signal: AbortSignal.timeout(20000),
    });

    const responseText = await skykingResponse.text();

    let trackingData;

    try {
      trackingData = JSON.parse(responseText);
    } catch {
      console.error('Skyking returned a non-JSON response.');

      return res.status(502).json({
        success: false,
        message: 'Skyking returned an invalid tracking response.',
      });
    }

    if (!skykingResponse.ok) {
      return res.status(502).json({
        success: false,
        message: 'Unable to retrieve tracking from Skyking.',
      });
    }

    return res.json({
      success: true,
      courier: 'SKYKING',
      consignmentNumber: cnote,
      tracking: trackingData,
    });

  } catch (error) {
    console.error('Skyking tracking error:', error.message);

    return res.status(
      error.name === 'TimeoutError' ? 504 : 502
    ).json({
      success: false,
      message:
        error.name === 'TimeoutError'
          ? 'Skyking tracking request timed out.'
          : 'Unable to connect to Skyking tracking service.',
    });
  }
});

module.exports = router;
