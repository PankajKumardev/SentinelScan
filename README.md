# SentinelScan

A powerful, modular terminal-focused website security scanner built with Node.js. Perform comprehensive security audits of websites through an interactive CLI interface with clean progress indicators and detailed reporting.

## 🚀 Why This Project?

In today's digital landscape, web security is paramount. SentinelScan helps developers, security professionals, and website owners quickly identify common security vulnerabilities and misconfigurations. Unlike complex enterprise tools, SentinelScan is:

- **Free and Open Source**: No licensing fees or subscriptions
- **Easy to Use**: Simple CLI interface with interactive prompts
- **Comprehensive**: Covers 11 critical security checks
- **Modular**: Easily extensible with new security checks
- **Fast**: Runs checks sequentially with progress indicators
- **Multiple Outputs**: Generate reports in PDF, CSV, or JSON formats
- **Privacy-Focused**: Runs locally, no data sent to external servers

## 🛡️ Security Checks Performed

### 1. SSL/TLS Certificate Validation

- Certificate validity and expiry date
- Issuer and subject information
- Detects expired or invalid certificates

### 2. HTTP Security Headers

- Content Security Policy (CSP)
- HTTP Strict Transport Security (HSTS)
- X-Frame-Options (clickjacking protection)
- X-Content-Type-Options (MIME sniffing protection)
- Referrer-Policy
- Permissions-Policy

### 3. HTTP Methods Analysis

- Tests allowed HTTP methods (GET, POST, PUT, DELETE, PATCH, OPTIONS)
- Identifies overly permissive configurations

### 4. Mixed Content Detection

- Scans for HTTP resources loaded on HTTPS pages
- Critical for maintaining secure connections

### 5. Robots.txt & Sitemap Presence

- Checks for robots.txt file
- Verifies sitemap.xml availability
- Important for SEO and crawler management

### 6. Cookie Security Analysis

- Secure flag presence
- HttpOnly flag presence
- SameSite attribute configuration
- Provides ratios for each flag

### 7. XSS Reflection Test

- Basic reflected XSS vulnerability detection
- Tests for script injection via query parameters

### 8. Open Redirect Vulnerability Test

- Tests for open redirect vulnerabilities
- Attempts parameter-based redirects to malicious domains

### 9. CORS Misconfiguration Check

- Checks Cross-Origin Resource Sharing headers
- Detects overly permissive CORS policies that could lead to data theft

### 10. Server Information Disclosure

- Analyzes Server header for information leakage
- Identifies web server software and version disclosure

### 11. Directory Listing Vulnerability

- Tests common directories for directory listing enabled
- Checks for exposed sensitive directories like /admin/, /backup/

## 📦 Installation

### Prerequisites

- Node.js 14+ and npm
- Windows, macOS, or Linux

### Install Dependencies

```bash
git clone <repository-url>
cd sentinelscan
npm install
```

## 🎯 Usage

### Interactive Mode (Recommended for beginners)

```bash
npm start
# or
node src/cli.js
```

Follow the interactive prompts:

1. Enter website URL (e.g., `https://example.com`)
2. Select security checks using spacebar and arrow keys
3. Choose output format (PDF/CSV/JSON)
4. Specify output directory (defaults to `./reports`)

### Command Line Mode (For automation/scripts)

```bash
node src/cli.js <url> <checks> <format> <outputDir>
```

#### Examples:

```bash
# Full scan with all checks
node src/cli.js https://example.com tls,headers,methods,mixedContent,robots,cookies,xss,openRedirect,cors,serverInfo,directoryListing JSON ./reports

# Quick SSL check only
node src/cli.js https://github.com tls JSON ./reports

# Security headers audit
node src/cli.js https://example.com headers PDF ./reports
```

## 🤖 AI-Powered Analysis

Every report includes an intelligent AI summary generated using Groq API:

- **Security Rating**: A-F grade based on overall posture
- **Executive Summary**: 2-3 sentence assessment
- **Actionable Recommendations**: 3-5 specific improvement steps

### Setup AI Analysis

1. Get a Groq API key from [groq.com](https://groq.com)
2. Create `.env` file in project root:
   ```
   GROQ_API_KEY=your_api_key_here
   GROQ_MODEL=llama-3.3-70b-versatile
   ```
3. Install dependencies: `npm install`

The AI analysis runs automatically with each scan and enhances all report formats.

## 🏗️ Project Structure

```
sentinelscan/
├── src/
│   ├── cli.js              # Entry point with banner
│   ├── scanner.js          # Main scanner logic
│   ├── checks/             # Modular security checks
│   │   ├── tls.js          # SSL/TLS validation
│   │   ├── headers.js      # Security headers
│   │   ├── methods.js      # HTTP methods
│   │   ├── mixedContent.js # Mixed content detection
│   │   ├── robots.js       # Robots.txt & sitemap
│   │   ├── cookies.js      # Cookie security
│   │   ├── xss.js          # XSS testing
│   │   ├── openRedirect.js # Open redirect testing
│   │   ├── cors.js         # CORS misconfiguration
│   │   ├── serverInfo.js   # Server info disclosure
│   │   └── directoryListing.js # Directory listing vuln
│   └── utils/
│       ├── fetchPage.js    # HTTP request utilities
│       └── reportGenerator.js # Report generation
├── reports/                # Default output directory
├── package.json            # Dependencies and scripts
└── README.md              # This file
```

## 🔧 Adding New Security Checks

The scanner is designed to be easily extensible. To add a new check:

1. Create a new file in `src/checks/`
2. Export an async `check(url)` function
3. Return a result object with relevant data
4. Add the check to the `checks` array in `scanner.js`

Example:

```javascript
// src/checks/newCheck.js
async function check(url) {
  try {
    // Your security check logic here
    return {
      status: 'passed',
      details: 'Additional information',
    };
  } catch (error) {
    throw new Error(`New check failed: ${error.message}`);
  }
}

module.exports = { check };
```

## 🐛 Error Handling

The scanner includes comprehensive error handling for:

- Invalid URLs
- Network timeouts (10-second timeout)
- Server errors (4xx/5xx responses)
- SSL/TLS connection issues
- File system errors

All errors are caught and reported in the results, ensuring the scanner completes all possible checks.

## 📈 Performance

- **Sequential Execution**: Checks run one after another to avoid overwhelming target servers
- **Timeouts**: 5-10 second timeouts prevent hanging
- **Lightweight**: Minimal dependencies, fast startup
- **Memory Efficient**: Processes one check at a time

## 🔒 Security Considerations

- **Ethical Use**: Only scan websites you own or have permission to test
- **Rate Limiting**: Built-in delays prevent overwhelming servers
- **No Data Storage**: Results are only saved locally
- **Safe Testing**: XSS and redirect tests use harmless payloads

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Ensure all checks pass
5. Submit a pull request

### Development Setup

```bash
npm install
npm test  # Run tests (if implemented)
npm run lint  # Check code style
```

## 📄 License

MIT License - see LICENSE file for details.

## 🙏 Acknowledgments

- Built with [Node.js](https://nodejs.org/)
- Uses [Inquirer.js](https://github.com/SBoudrias/Inquirer.js/) for CLI prompts
- PDF generation with [PDFKit](https://pdfkit.org/)
- HTTP requests with [Axios](https://axios-http.com/)

## 📞 Support

If you encounter issues or have questions:

- Check the [Issues](https://github.com/your-repo/issues) page
- Create a new issue with detailed information
- Include your Node.js version and OS

---

**Happy Scanning! 🔍** Keep your websites secure and your users safe with SentinelScan.</content>
<parameter name="filePath">c:\Users\Panka\Desktop\web-security\README.md
