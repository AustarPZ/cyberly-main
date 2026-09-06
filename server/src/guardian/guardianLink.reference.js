const crypto = require('node:crypto');

const CROCKFORD = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';

function createGuardianLinkReferenceGenerator({ randomBytes = crypto.randomBytes } = {}) {
  return function generateGuardianLinkReference() {
    const bytes = randomBytes(13);
    let value = 0n;
    for (const byte of bytes) value = (value << 8n) | BigInt(byte);
    value &= (1n << 100n) - 1n;
    let suffix = '';
    for (let index = 0; index < 20; index += 1) {
      suffix = CROCKFORD[Number(value & 31n)] + suffix;
      value >>= 5n;
    }
    return `CY-GL-${suffix}`;
  };
}

module.exports = { createGuardianLinkReferenceGenerator };
