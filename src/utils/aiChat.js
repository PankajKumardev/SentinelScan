import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import Groq from 'groq-sdk';
import dotenv from 'dotenv';

dotenv.config();

class AIChat {
  constructor(scanResults) {
    this.scanResults = scanResults;
    this.groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    this.conversationHistory = [];
  }

  async startInteractiveChat() {
    console.log(chalk.cyan('\n🤖 AI Security Analysis Chat'));
    console.log(
      chalk.gray(
        'Ask me anything about the security scan results. Type "exit" to quit.\n'
      )
    );

    while (true) {
      const { question } = await inquirer.prompt([
        {
          type: 'input',
          name: 'question',
          message: chalk.blue('❓ Your question:'),
          validate: (input) => input.trim() !== '' || 'Please enter a question',
        },
      ]);

      if (question.toLowerCase().trim() === 'exit') {
        console.log(chalk.yellow('👋 Goodbye! Happy scanning!'));
        break;
      }

      await this.askQuestion(question);
    }
  }

  async askQuestion(question) {
    const spinner = ora('Analyzing your question...').start();

    try {
      const context = this.buildContext();
      const prompt = `${context}\n\nUser Question: ${question}\n\nProvide a concise, actionable response (2-3 sentences max). Focus on the most important points.`;

      const chatCompletion = await this.groq.chat.completions.create({
        messages: [
          {
            role: 'system',
            content:
              'You are a cybersecurity expert. Provide concise, actionable advice. Keep responses brief but helpful.',
          },
          ...this.conversationHistory,
          { role: 'user', content: prompt },
        ],
        model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
        temperature: 0.2,
        max_tokens: 300, // Reduced from 800
      });

      const answer =
        chatCompletion.choices[0]?.message?.content ||
        "Sorry, I couldn't generate a response.";

      spinner.succeed('Analysis complete');

      // Add to conversation history
      this.conversationHistory.push(
        { role: 'user', content: question },
        { role: 'assistant', content: answer }
      );

      // Keep only last 6 exchanges to avoid token limits (reduced from 10)
      if (this.conversationHistory.length > 12) {
        this.conversationHistory = this.conversationHistory.slice(-12);
      }

      console.log(chalk.green('\n🤖 AI Response:'));
      console.log(chalk.white(answer));
      console.log('');
    } catch (error) {
      spinner.fail('Failed to get AI response');
      console.error(chalk.red('Error:', error.message));
    }
  }

  buildContext() {
    const summary = this.scanResults.aiSummary;
    return `Security Scan Summary:
URL: ${this.scanResults.url}
Rating: ${summary.rating} (${summary.overallRisk} risk, severity: ${
      summary.severityScore
    }/100)
Critical Issues: ${
      summary.criticalIssues.length > 0
        ? summary.criticalIssues.join(', ')
        : 'None'
    }
Key Recommendations: ${summary.recommendations.join(' | ')}

Scan Results: ${JSON.stringify(this.scanResults.results, null, 2)}

You are a cybersecurity expert. Answer concisely (2-3 sentences max) with actionable advice.`;
  }

  async getQuickAnalysis(query) {
    try {
      const context = this.buildContext();
      const prompt = `${context}\n\nQuick Question: ${query}\n\nAnswer in 1-2 sentences.`;

      const chatCompletion = await this.groq.chat.completions.create({
        messages: [
          {
            role: 'system',
            content:
              'You are a cybersecurity expert. Provide very concise answers (1-2 sentences max).',
          },
          { role: 'user', content: prompt },
        ],
        model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
        temperature: 0.1,
        max_tokens: 150, // Reduced from 400
      });

      return (
        chatCompletion.choices[0]?.message?.content || 'Analysis unavailable'
      );
    } catch (error) {
      return `Error: ${error.message}`;
    }
  }
}

export default AIChat;
