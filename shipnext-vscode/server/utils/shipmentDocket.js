
const crypto = require('crypto');

const TIME_ZONE = 'Asia/Kolkata';
const CUTOFF_HOUR = 16;

function getProcessingDate(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(now);

  const values = Object.fromEntries(
    parts.map((part) => [part.type, part.value])
  );

  // Store the scheduled date as UTC midnight.
  const processingDate = new Date(
    Date.UTC(
      Number(values.year),
      Number(values.month) - 1,
      Number(values.day)
    )
  );

  // At or after 4 PM IST, move to the next day.
  if (Number(values.hour) >= CUTOFF_HOUR) {
    processingDate.setUTCDate(processingDate.getUTCDate() + 1);
  }

  return processingDate;
}

function generateDocketNumber(now = new Date()) {
  const date = new Intl.DateTimeFormat('en-CA', {
    timeZone: TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now).replace(/-/g, '');

  const uniqueCode = crypto.randomBytes(4)
    .toString('hex')
    .toUpperCase();

  return `SN-${date}-${uniqueCode}`;
}

module.exports = {
  getProcessingDate,
  generateDocketNumber,
};
