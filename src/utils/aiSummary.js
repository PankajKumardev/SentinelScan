require('dotenv').config();

const Groq = require('groq-sdk');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

async function generateSummary(results) {
  try {
    const prompt = `Analyze this web security scan report and provide a structured response in JSON format with the following fields:
- summary: A brief overall assessment (2-3 sentences)
- rating: A letter grade (A, B, C, D, F) based on security posture
- recommendations: An array of 3-5 specific actionable recommendations to improve security

Report data:
URL: ${results.url}
Timestamp: ${results.timestamp}
Results: ${JSON.stringify(results.results, null, 2)}

Respond only with valid JSON, no additional text.`;

    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
      temperature: 0.3,
      max_tokens: 500,
    });

    const content = chatCompletion.choices[0]?.message?.content || '{}';

    // Extract JSON from markdown code blocks if present
    let jsonContent = content.trim();
    if (jsonContent.includes('```')) {
      // Find the JSON object between the first { and last }
      const start = jsonContent.indexOf('{');
      const end = jsonContent.lastIndexOf('}');
      if (start !== -1 && end !== -1 && end > start) {
        jsonContent = jsonContent.substring(start, end + 1);
      }
    }

    const parsed = JSON.parse(jsonContent);

    return {
      summary: parsed.summary || 'Analysis unavailable',
      rating: parsed.rating || 'N/A',
      recommendations: Array.isArray(parsed.recommendations)
        ? parsed.recommendations
        : ['Unable to generate recommendations'],
    };
  } catch (error) {
    console.warn('AI summary generation failed:', error.message);
    return {
      summary: 'AI analysis failed - manual review recommended',
      rating: 'N/A',
      recommendations: ['Review scan results manually'],
    };
  }
}

module.exports = { generateSummary };
