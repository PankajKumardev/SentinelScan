import Groq from 'groq-sdk';
import dotenv from 'dotenv';

dotenv.config();

class AIAnalyzer {
  constructor() {
    this.groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  }

  async generateSummary(results) {
    try {
      const prompt = this.buildPrompt(results);
      const chatCompletion = await this.groq.chat.completions.create({
        messages: [{ role: 'user', content: prompt }],
        model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
        temperature: 0.3,
        max_tokens: 1500, // Increased for more detailed analysis
      });

      const content = chatCompletion.choices[0]?.message?.content || '{}';
      const parsed = this.parseResponse(content);

      return {
        summary: parsed.summary || 'Analysis unavailable',
        rating: parsed.rating || 'N/A',
        recommendations: Array.isArray(parsed.recommendations)
          ? parsed.recommendations
          : ['Unable to generate recommendations'],
        criticalIssues: parsed.criticalIssues || [],
        severityScore: parsed.severityScore || 0,
        overallRisk: parsed.overallRisk || 'Unknown',
        immediateActions: parsed.immediateActions || [],
      };
    } catch (error) {
      console.warn('AI summary generation failed:', error.message);
      return {
        summary: 'AI analysis failed - manual review recommended',
        rating: 'N/A',
        recommendations: ['Review scan results manually'],
        criticalIssues: [],
        severityScore: 0,
        overallRisk: 'Unknown',
        immediateActions: [],
      };
    }
  }

  buildPrompt(results) {
    return `Analyze this web security scan report and provide a concise, actionable summary in JSON format.

Required JSON structure:
{
  "summary": "Brief overall assessment (1-2 sentences)",
  "rating": "Letter grade (A, B, C, D, F) based on security posture",
  "recommendations": ["Array of 3 key actionable recommendations"],
  "criticalIssues": ["List of most critical vulnerabilities found"],
  "severityScore": "Numerical score 0-100 (100 being most severe)",
  "overallRisk": "Critical/High/Medium/Low",
  "immediateActions": ["2-3 urgent actions to take within 24 hours"]
}

Focus on the most important findings. Keep it concise but actionable.

Report data:
URL: ${results.url}
Timestamp: ${results.timestamp}
Results: ${JSON.stringify(results.results, null, 2)}

Respond only with valid JSON, no additional text.`;
  }

  parseResponse(content) {
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

    return JSON.parse(jsonContent);
  }
}

export default AIAnalyzer;
