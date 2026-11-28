
require('dotenv').config();

const { cancelShipment } = require('./integrations/shadowfax');

async function main() {
  const clientOrderId = 'SN1795687385854712F6D';

  try {
    console.log('Sending Shadowfax cancellation request...');
    console.log('Client Order ID:', clientOrderId);

    const result = await cancelShipment(
      clientOrderId,
      'ShipNext live tracking test order cancellation'
    );

    console.log('\nShadowfax response:');
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('\nCancellation failed:');
    console.error(error.message);
    process.exitCode = 1;
  }
}

main();
