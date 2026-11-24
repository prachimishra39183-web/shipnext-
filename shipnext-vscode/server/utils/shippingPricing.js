
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

// EXISTING SHIPNEXT CALCULATOR — UNCHANGED
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

// DELHIVERY EXPRESS — WORKBOOK RATES
const DELHIVERY_EXPRESS_RATES = {
  A: { first500g: 31, additional500g: 12 },
  B: { first500g: 35, additional500g: 15 },
  C: { first500g: 37, additional500g: 34 },
  D: { first500g: 41, additional500g: 38 },
  E: { first500g: 50, additional500g: 41 },
  F: { first500g: 56, additional500g: 48 },
};

// DELHIVERY STANDARD — WORKBOOK RATES
const DELHIVERY_STANDARD_RATES = {
  A:  { base2kg: 65,  slab2to4: 26,  slab4to5: 100, slab5to6: 20 },
  B:  { base2kg: 75,  slab2to4: 32,  slab4to5: 125, slab5to6: 22 },
  C1: { base2kg: 83,  slab2to4: 39,  slab4to5: 165, slab5to6: 25 },
  C2: { base2kg: 83,  slab2to4: 39,  slab4to5: 165, slab5to6: 25 },
  D1: { base2kg: 95,  slab2to4: 42,  slab4to5: 170, slab5to6: 29 },
  D2: { base2kg: 98,  slab2to4: 43,  slab4to5: 170, slab5to6: 29 },
  E:  { base2kg: 125, slab2to4: 56,  slab4to5: 230, slab5to6: 38 },
  F:  { base2kg: 138, slab2to4: 62,  slab4to5: 260, slab5to6: 45 },
};

function calculateDelhiveryExpress(weightGrams, zone) {
  const weight = Number(weightGrams);
  const rates = DELHIVERY_EXPRESS_RATES[zone];

  if (!Number.isFinite(weight) || weight < 500) {
    throw new Error('Delhivery Express requires at least 500 grams.');
  }

  if (!rates) {
    throw new Error('Invalid Delhivery Express zone.');
  }

  const slabs = Math.ceil(weight / 500);

  const total =
    rates.first500g +
    Math.max(0, slabs - 1) * rates.additional500g;

  return Number(total.toFixed(2));
}

function calculateDelhiveryStandard(weightGrams, zone) {
  const weight = Number(weightGrams);
  const rates = DELHIVERY_STANDARD_RATES[zone];

  if (!Number.isFinite(weight) || weight < 500) {
    throw new Error('Delhivery Standard requires at least 500 grams.');
  }

  if (!rates) {
    throw new Error('Invalid Delhivery Standard zone.');
  }

  // Workbook does not specify the 6–9 kg slab.
  if (weight > 6000) {
    throw new Error(
      'Standard rate unavailable above 6 kg: the workbook does not specify the 6–9 kg slab.'
    );
  }

  let total = rates.base2kg;

  if (weight > 2000) {
    total += Math.min(
      2,
      Math.ceil((weight - 2000) / 1000)
    ) * rates.slab2to4;
  }

  if (weight > 4000) {
    total += rates.slab4to5;
  }

  if (weight > 5000) {
    total += rates.slab5to6;
  }

  return Number(total.toFixed(2));
}

module.exports = {
  SHIPPING_RATES,
  calculateShippingCharge,
  DELHIVERY_EXPRESS_RATES,
  DELHIVERY_STANDARD_RATES,
  calculateDelhiveryExpress,
  calculateDelhiveryStandard,
};
