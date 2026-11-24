
const crypto = require('crypto');

const TIME_ZONE = 'Asia/Kolkata';
const CUTOFF_HOUR = 16;

function getProcessingDate(now = new Date()) {
  const indiaTime = new Date(
    now.toLocaleString('en-US', { timeZone: TIME_ZONE })
  );

  if (indiaTime.getHours() >= CUTOFF_HOUR) {
    indiaTime.setDate(indiaTime.getDate() + 1);
  }

  const year = indiaTime.getFullYear();
  const month = indiaTime.getMonth();
  const day = indiaTime.getDate();

  return new Date(Date.UTC(year, month, day));
}

function generateDocketNumber(now = new Date()) {
  const indiaDate = new Intl.DateTimeFormat('en-CA', {
    timeZone: TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now).replace(/-/g, '');

  const randomCode = crypto.randomBytes(4)
    .toString('hex')
    .toUpperCase();

  return `SN-${indiaDate}-${randomCode}`;
}

module.exports = {
  getProcessingDate,
  generateDocketNumber,
};
