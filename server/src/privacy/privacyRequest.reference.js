const crypto = require('node:crypto');

const CROCKFORD_ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';

function encodeFirstHundredBits(bytes) {
  let value = BigInt(`0x${bytes.toString('hex')}`) >> 4n;
  let encoded = '';
  for (let index = 0; index < 20; index += 1) {
    encoded = CROCKFORD_ALPHABET[Number(value & 31n)] + encoded;
    value >>= 5n;
  }
  return encoded;
}

function createPrivacyRequestReferenceGenerator({ randomBytes = crypto.randomBytes } = {}) {
  return function generatePrivacyRequestReference() {
    return `CY-PR-${encodeFirstHundredBits(randomBytes(13))}`;
  };
}

module.exports = {
  createPrivacyRequestReferenceGenerator,
};
