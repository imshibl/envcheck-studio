# EnvCheck Studio

Build EnvCheck, a premium, minimalist, open-source developer tool for comparing and validating .env files.

Users should be able to upload or paste two environment files, compare them instantly, and identify missing variables, extra keys, empty values, duplicate declarations, syntax errors and configuration differences.

Include two modes:

Compare Environments: Compare development, staging and production configurations.

Validate Against Template: Compare an actual .env file against .env.example.

Display results in a clean comparison table with issue categories, severity indicators, filters and helpful suggestions. Allow users to download sanitised Markdown/JSON reports and generate .env.example files.

Design: Create a beautiful, modern developer-focused interface with a dark-first theme, clean typography, subtle borders, monospace code elements and responsive layouts. Put the actual comparison tool prominently on the homepage rather than hiding it behind a dashboard.

Technology: React, TypeScript, Vite, Tailwind CSS and shadcn/ui.

Critical requirement: Process everything locally in the browser. Never upload, transmit, persist or log environment file contents or secrets. No backend, authentication or database.

Make the tool functional, not just a UI mockup. Implement a reliable dotenv-compatible parser, duplicate detection, comparison engine, validation logic, export functionality and proper error handling. Keep the core engine independent of React so it can later be reused in a CLI or GitHub Action.

The final result should feel like a polished, production-ready developer utility that developers can use immediately without signing up.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/e85a3d5a-5f4b-413d-8f34-2d8a72834856).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
