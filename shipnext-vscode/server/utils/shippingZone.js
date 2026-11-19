
const NORTH_EAST_STATES = [
  'AR', // Arunachal Pradesh
  'AS', // Assam
  'MN', // Manipur
  'ML', // Meghalaya
  'MZ', // Mizoram
  'NL', // Nagaland
  'SK', // Sikkim
  'TR', // Tripura
];

const METRO_DISTRICTS = {
  DL: [
    'Central Delhi',
    'Delhi',
    'Delhi NCR',
    'East Delhi',
    'New Delhi',
    'North Delhi',
    'North West Delhi',
    'South Delhi',
    'South West Delhi',
    'West Delhi',
  ],
  MH: ['Mumbai', 'Thane', 'Pune'],
  KA: ['Bengaluru', 'Bangalore', 'Bangalore Urban'],
  TN: ['Chennai'],
  WB: ['Kolkata'],
  TS: ['Hyderabad'],
  GJ: ['Ahmedabad'],
};

function normalize(value) {
  return String(value || '').trim().toLowerCase();
}

function getShippingZone(pickup, delivery) {
  const pickupState = String(pickup.stateCode || '').toUpperCase();
  const deliveryState = String(delivery.stateCode || '').toUpperCase();

  if (
    NORTH_EAST_STATES.includes(pickupState) ||
    NORTH_EAST_STATES.includes(deliveryState)
  ) {
    return 'NE';
  }

  const deliveryDistrict = normalize(delivery.district);

  const metroDistricts = METRO_DISTRICTS[deliveryState] || [];

  if (
    metroDistricts.some(
      (district) => normalize(district) === deliveryDistrict
    )
  ) {
    return 'METRO';
  }

  return 'ROI';
}

module.exports = { getShippingZone };
