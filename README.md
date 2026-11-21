# EnvCheck

**Compare and validate `.env` files without exposing your secrets.**

[![Live Demo](https://img.shields.io/badge/Live%20Demo-envcheck.bilcodes.com-blue?style=flat-square)](https://envcheck.bilcodes.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg?style=flat-square)](LICENSE)
[![Local Processing](https://img.shields.io/badge/Processing-100%25%20Local-success?style=flat-square)]()

EnvCheck is a free, open-source developer utility by **[Bilcodes](https://bilcodes.com)** for comparing and validating environment configuration files.

Whether you're comparing development and production environments or checking an actual `.env` file against an `.env.example` template, EnvCheck helps you identify configuration issues quickly.

**No uploads. No saved files. No accounts. Just local environment validation.**

🌐 **Live Demo:** [https://envcheck.bilcodes.com/](https://envcheck.bilcodes.com/)

## ✨ Features

### 🔍 Compare Environments

Compare two environment files to understand what differs between configurations.

- Identify missing environment variables.
- Detect extra or unexpected keys.
- Find variables with different values.
- Identify empty environment variables.
- Detect duplicate declarations.
- Highlight syntax errors.

### ✅ Validate Against Template

Check your actual environment configuration against an `.env.example` template.

- Identify missing required variables.
- Detect unexpected variables.
- Find empty configuration values.
- Verify configuration completeness.
- Generate an `.env.example` file from your environment configuration.

### 📊 Detailed Findings

Get an organized overview of configuration issues.

- Clean comparison table.
- Critical, warning, and informational severity indicators.
- Filter findings by issue category.
- View missing, extra, different, empty, duplicate, and syntax issues.
- Review configuration problems without manually inspecting entire files.

### 📄 Export Reports

Generate reports that can be used for debugging, documentation, and team collaboration.

- Export findings as Markdown.
- Export findings as JSON.
- Generate `.env.example` files.

Reports should be sanitized to avoid exposing sensitive environment values.

### 🔒 Privacy First

Environment files often contain sensitive information, including API keys, database credentials, authentication tokens, and private configuration values.

EnvCheck is designed to keep this information on your device.

- All environment file parsing and comparison happen locally in your browser.
- File contents are never uploaded to a server.
- Environment contents are kept in browser memory during use.
- No database or backend is required.
- No authentication or account is required.
- File contents are not saved to local storage or session storage.

**Your environment files stay on your device.**

## 🚀 Getting Started

You can use EnvCheck directly without installing anything:

**[Open EnvCheck](https://envcheck.bilcodes.com/)**

### Run Locally

#### Prerequisites

- Node.js (LTS recommended)
- npm
- Git

#### Installation

Clone the repository:

```bash
git clone <repository-url>
```

Navigate to the project directory:

```bash
cd envcheck
```

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Open the local development URL:

```text
http://localhost:5173
```

### Production Build

Create a production build:

```bash
npm run build
```

Preview the production build:

```bash
npm run preview
```

## 📖 How to Use

### Compare Environments

1. Open EnvCheck.
2. Select **Compare Environments**.
3. Paste or upload your first environment file.
4. Paste or upload your second environment file.
5. Review the detected configuration differences.
6. Filter findings by category or severity.
7. Export the results as Markdown or JSON.

### Validate Against Template

1. Open EnvCheck.
2. Select **Validate Against Template**.
3. Provide your actual `.env` file.
4. Provide your `.env.example` template.
5. Run validation.
6. Review missing, extra, empty, and other configuration issues.
7. Generate an updated `.env.example` if needed.

## 🛠️ Technology Stack

EnvCheck is built using modern frontend technologies.

| Technology | Purpose |
|---|---|
| React | User interface |
| TypeScript | Type safety |
| Vite | Development and build tooling |
| Tailwind CSS | Styling |
| shadcn/ui | UI components |

## 🏗️ Engineering Principles

EnvCheck follows a few important engineering principles:

**Local-first processing**

Environment files should never need to leave the browser to be compared or validated.

**Framework-independent core**

The parsing, comparison, and validation logic should remain independent of React, making it reusable in future CLI tools, GitHub Actions, or other developer utilities.

**Reliable parsing**

The parser should support common dotenv syntax, including comments, quoted values, empty values, and duplicate declarations.

**Security by design**

Never expose raw environment values in logs, error messages, or exported reports.

**Simple developer experience**

The comparison tool should be immediately accessible without unnecessary dashboards, registration, or configuration.

## 🗺️ Roadmap

Potential improvements and future integrations:

- [ ] Expand dotenv syntax compatibility.
- [ ] Add more advanced validation rules.
- [ ] Support custom validation profiles.
- [ ] Improve side-by-side configuration comparison.
- [ ] Add CLI support.
- [ ] Add GitHub Actions integration.
- [ ] Explore a VS Code extension.
- [ ] Support additional configuration formats.

Have an idea? Feel free to open a feature request.

## 🤝 Contributing

Contributions are welcome!

If you find a bug, have an improvement in mind, or want to add a feature, feel free to contribute.

1. Fork this repository.
2. Create a new branch:

```bash
git checkout -b feat/your-feature
```

3. Make your changes.
4. Test your implementation.
5. Commit your changes:

```bash
git commit -m "feat: describe your changes"
```

6. Push your branch:

```bash
git push origin feat/your-feature
```

7. Open a Pull Request.

Please maintain the project's privacy-first approach and keep the core engine independent of the UI framework.

## 📄 License

EnvCheck is open-source software licensed under the **MIT License**.

You are free to use, copy, modify, distribute, and commercially use this software under the terms of the MIT License.

See [LICENSE](LICENSE) for the complete license text.

## 👨‍💻 Author

**Bilcodes**

Building useful tools and software for developers.

- Website: [bilcodes.com](https://bilcodes.com)
- EnvCheck: [envcheck.bilcodes.com](https://envcheck.bilcodes.com)

---

If EnvCheck makes your development workflow a little easier, consider giving the repository a ⭐ and sharing it with other developers.

**Built with ❤️ by Bilcodes.**