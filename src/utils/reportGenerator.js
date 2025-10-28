const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const { generateSummary } = require('./aiSummary');

async function generate(results, format, outputDir) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `security-scan-${timestamp}.${format.toLowerCase()}`;
  const filepath = path.join(outputDir, filename);

  // Generate AI summary
  const aiSummary = await generateSummary(results);
  results.aiSummary = aiSummary;

  switch (format) {
    case 'PDF':
      await generatePDF(results, filepath);
      break;
    case 'CSV':
      await generateCSV(results, filepath);
      break;
    case 'JSON':
      await generateJSON(results, filepath);
      break;
  }

  return filepath;
}

async function generatePDF(results, filepath) {
  const doc = new PDFDocument();
  doc.pipe(fs.createWriteStream(filepath));

  doc.fontSize(20).text('Web Security Scan Report', { align: 'center' });
  doc.moveDown();
  doc.fontSize(12).text(`URL: ${results.url}`);
  doc.text(`Timestamp: ${results.timestamp}`);
  doc.moveDown();

  // AI Summary
  if (results.aiSummary) {
    doc.fontSize(16).text('AI Security Assessment', { underline: true });
    doc.fontSize(12).text(`Rating: ${results.aiSummary.rating}`);
    doc.text(`Summary: ${results.aiSummary.summary}`);
    doc.text('Recommendations:');
    results.aiSummary.recommendations.forEach((rec) => {
      doc.text(`• ${rec}`);
    });
    doc.moveDown();
  }

  for (const [check, result] of Object.entries(results.results)) {
    doc.fontSize(14).text(`${check.toUpperCase()}:`, { underline: true });
    if (result.error) {
      doc.fillColor('red').text(`Error: ${result.error}`);
    } else {
      doc.fillColor('black').text(JSON.stringify(result, null, 2));
    }
    doc.moveDown();
  }

  doc.end();
}

async function generateCSV(results, filepath) {
  const records = [];

  // Add AI summary
  if (results.aiSummary) {
    records.push({
      check: 'AI Summary',
      key: 'rating',
      value: results.aiSummary.rating,
    });
    records.push({
      check: 'AI Summary',
      key: 'summary',
      value: results.aiSummary.summary,
    });
    results.aiSummary.recommendations.forEach((rec, i) => {
      records.push({
        check: 'AI Summary',
        key: `recommendation_${i + 1}`,
        value: rec,
      });
    });
  }

  for (const [check, result] of Object.entries(results.results)) {
    if (result.error) {
      records.push({ check, key: 'error', value: result.error });
    } else {
      for (const [key, value] of Object.entries(result)) {
        records.push({ check, key, value: JSON.stringify(value) });
      }
    }
  }

  const csvWriter = createCsvWriter({
    path: filepath,
    header: [
      { id: 'check', title: 'Check' },
      { id: 'key', title: 'Key' },
      { id: 'value', title: 'Value' },
    ],
  });

  await csvWriter.writeRecords(records);
}

async function generateJSON(results, filepath) {
  fs.writeFileSync(filepath, JSON.stringify(results, null, 2));
}

module.exports = { generate };
