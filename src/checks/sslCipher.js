import https from 'https';

async function check(url) {
  const parsedUrl = new URL(url);
  if (parsedUrl.protocol !== 'https:') {
    return { supported: false, reason: 'Not HTTPS' };
  }

  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        hostname: parsedUrl.hostname,
        port: 443,
        path: '/',
        method: 'GET',
        rejectUnauthorized: false,
        // Test with different cipher suites
        ciphers: 'ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384',
      },
      (res) => {
        const cipher = res.socket.getCipher();
        const protocol = res.socket.getProtocol();

        // Check for weak ciphers
        const weakCiphers = ['RC4', 'DES', '3DES', 'NULL', 'EXPORT'];
        const isWeakCipher = weakCiphers.some((weak) =>
          cipher.name.includes(weak)
        );

        // Check protocol version
        const protocolVersion = protocol.split('v')[1] || protocol;
        const isOutdated = ['TLSv1', 'TLSv1.1'].includes(protocol);

        resolve({
          cipher: cipher.name,
          protocol,
          keySize: cipher.bits,
          isWeakCipher,
          isOutdatedProtocol: isOutdated,
          recommended: !isWeakCipher && !isOutdated,
        });
      }
    );

    req.on('error', (err) => {
      resolve({ supported: false, reason: err.message });
    });

    req.end();
  });
}

export { check };
