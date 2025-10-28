const https = require('https');

async function check(url) {
  const parsedUrl = new URL(url);
  if (parsedUrl.protocol !== 'https:') {
    return { valid: false, reason: 'Not HTTPS' };
  }

  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        hostname: parsedUrl.hostname,
        port: 443,
        path: '/',
        method: 'GET',
        rejectUnauthorized: false,
      },
      (res) => {
        const cert = res.socket.getPeerCertificate();
        if (!cert || !cert.valid_from || !cert.valid_to) {
          resolve({ valid: false, reason: 'No certificate found' });
          return;
        }

        const now = new Date();
        const validFrom = new Date(cert.valid_from);
        const validTo = new Date(cert.valid_to);
        const valid = now >= validFrom && now <= validTo;
        const expiryDays = Math.ceil((validTo - now) / (1000 * 60 * 60 * 24));

        resolve({
          valid,
          expiryDays,
          issuer: cert.issuer?.CN || 'Unknown',
          subject: cert.subject?.CN || 'Unknown',
        });
      }
    );

    req.on('error', (err) => {
      resolve({ valid: false, reason: err.message });
    });

    req.end();
  });
}

module.exports = { check };
