import fs from 'fs';
import path from 'path';
import PDFDocument from 'pdfkit';
import { createObjectCsvWriter } from 'csv-writer';
import AIAnalyzer from './aiSummary.js';

const aiAnalyzer = new AIAnalyzer();

async function generate(results, format, outputDir) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `security-scan-${timestamp}.${format.toLowerCase()}`;
  const filepath = path.join(outputDir, filename);

  // Generate AI summary
  const aiSummary = await aiAnalyzer.generateSummary(results);
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
    doc.text(`Risk Level: ${results.aiSummary.overallRisk}`);
    doc.text(`Severity Score: ${results.aiSummary.severityScore}/100`);
    doc.text(`Summary: ${results.aiSummary.summary}`);
    doc.moveDown();

    // Critical Issues
    if (results.aiSummary.criticalIssues?.length > 0) {
      doc.fontSize(14).text('Critical Issues:', { underline: true });
      doc.fillColor('red');
      results.aiSummary.criticalIssues.forEach((issue) => {
        doc.text(`• ${issue}`);
      });
      doc.fillColor('black');
      doc.moveDown();
    }

    // Recommendations
    doc.fontSize(14).text('Key Recommendations:', { underline: true });
    results.aiSummary.recommendations.forEach((rec) => {
      doc.text(`• ${rec}`);
    });
    doc.moveDown();

    // Immediate Actions
    if (results.aiSummary.immediateActions?.length > 0) {
      doc
        .fontSize(14)
        .text('Immediate Actions (24 hours):', { underline: true });
      doc.fillColor('red');
      results.aiSummary.immediateActions.forEach((action) => {
        doc.text(`• ${action}`);
      });
      doc.fillColor('black');
      doc.moveDown();
    }
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
      key: 'overall_risk',
      value: results.aiSummary.overallRisk,
    });
    records.push({
      check: 'AI Summary',
      key: 'severity_score',
      value: results.aiSummary.severityScore,
    });
    records.push({
      check: 'AI Summary',
      key: 'summary',
      value: results.aiSummary.summary,
    });

    // Add critical issues
    if (results.aiSummary.criticalIssues?.length > 0) {
      records.push({
        check: 'AI Summary',
        key: 'critical_issues',
        value: results.aiSummary.criticalIssues.join('; '),
      });
    }

    // Add recommendations
    results.aiSummary.recommendations.forEach((rec, i) => {
      records.push({
        check: 'AI Summary',
        key: `recommendation_${i + 1}`,
        value: rec,
      });
    });

    // Add immediate actions
    if (results.aiSummary.immediateActions?.length > 0) {
      records.push({
        check: 'AI Summary',
        key: 'immediate_actions',
        value: results.aiSummary.immediateActions.join('; '),
      });
    }
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

  const csvWriter = createObjectCsvWriter({
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

export { generate };
