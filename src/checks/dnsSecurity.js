import dns from 'dns';

async function check(url) {
  const parsedUrl = new URL(url);
  const domain = parsedUrl.hostname;

  const results = {
    domain,
    dnssec: false,
    caaRecords: [],
    spfRecord: null,
    dkimRecords: [],
  };

  try {
    // Check for DNSSEC (DS records)
    try {
      const dsRecords = await dns.promises.resolveDs(domain);
      results.dnssec = dsRecords.length > 0;
    } catch (e) {
      // DNSSEC not configured
    }

    // Check for CAA records
    try {
      const caaRecords = await dns.promises.resolveCaa(domain);
      results.caaRecords = caaRecords;
    } catch (e) {
      // CAA not configured
    }

    // Check for SPF record (TXT records)
    try {
      const txtRecords = await dns.promises.resolveTxt(domain);
      for (const record of txtRecords) {
        const txt = record.join('');
        if (txt.startsWith('v=spf1')) {
          results.spfRecord = txt;
          break;
        }
      }
    } catch (e) {
      // TXT records not found
    }

    // Check for DKIM records (common selectors)
    const dkimSelectors = ['default', 'google', 'mail'];
    for (const selector of dkimSelectors) {
      try {
        const dkimRecord = await dns.promises.resolveTxt(
          `${selector}._domainkey.${domain}`
        );
        results.dkimRecords.push({
          selector,
          record: dkimRecord.flat().join(''),
        });
      } catch (e) {
        // DKIM record not found for this selector
      }
    }
  } catch (error) {
    results.error = error.message;
  }

  return results;
}

export { check };
