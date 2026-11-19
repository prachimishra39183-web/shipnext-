
const SHIPPING_RATES = {
  METRO: {
    standard: 35,
    AIR: { base: 80, perKg: 120 },
    SURFACE: { base: 50, perKg: 70 },
  },
  ROI: {
    standard: 40,
    AIR: { base: 90, perKg: 130 },
    SURFACE: { base: 60, perKg: 90 },
  },
  NE: {
    standard: 60,
    AIR: { base: 120, perKg: 180 },
    SURFACE: { base: 90, perKg: 120 },
  },
};

function calculateShippingCharge(zone, mode, weight) {
  const rates = SHIPPING_RATES[zone]?.[mode];

  if (!rates) {
    throw new Error('Invalid shipping zone or mode.');
  }

  const parcelWeight = Number(weight);

  if (!Number.isFinite(parcelWeight) || parcelWeight < 0.5) {
    throw new Error('Minimum shipment weight is 500 grams.');
  }

  const additionalSlabs = Math.ceil(
    (parcelWeight - 0.5) / 0.5
  );

  const additionalCharge =
    additionalSlabs * (rates.perKg / 2);

  const total = rates.base + additionalCharge;

  return {
    zone,
    mode,
    weight: parcelWeight,
    base: rates.base,
    additionalSlabs,
    additionalCharge,
    total,
    standardRate: SHIPPING_RATES[zone].standard,
  };
}

module.exports = {
  SHIPPING_RATES,
  calculateShippingCharge,
};
