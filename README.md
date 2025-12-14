# SR Compiler

A powerful, intelligent online code compiler that executes code in multiple programming languages.

**[🚀 Live Demo](https://compiler.supanroy.com/)**

## Overview

SR Compiler is a feature-rich web-based code execution platform built with modern web technologies. It provides an interactive environment for writing, executing, and debugging code.

## Features

- **Multi-Language Support** - Execute code in multiple programming languages
- **Real-Time Execution** - Instant code compilation and execution feedback
- **Interactive Console** - Built-in input/output console for interactive programs
- **AI Assistant** - Leverage Gemini AI for code assistance and debugging
- **Code Editor** - Syntax-highlighted editor with language-specific features
- **Responsive Design** - Works seamlessly across desktop and mobile devices
- **Settings Panel** - Customize your coding experience
- **Live Deployment** - Access your compiler from anywhere at [compiler.supanroy.com](https://compiler.supanroy.com/)

## Tech Stack

- **Frontend**: React, TypeScript, Vite
- **Styling**: Modern CSS with responsive design
- **AI Integration**: Google Gemini API
- **Hosting**: Vercel
- **Build Tool**: Vite

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Gemini API key (get one from [Google AI Studio](https://aistudio.google.com/))

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/sr-compiler.git
   cd sr-compiler
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env.local` file and add your Gemini API key:
   ```
   VITE_GEMINI_API_KEY=your_gemini_api_key_here
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Open your browser and navigate to `http://localhost:5173`

## Development

### Available Scripts

- `npm run dev` - Start the development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally

## Deployment

This project is configured for easy deployment on Vercel:

1. Push your code to a Git repository (GitHub, GitLab, or Bitbucket)
2. Import your project on [Vercel](https://vercel.com)
3. Add the environment variable:
   - Key: `VITE_GEMINI_API_KEY`
   - Value: Your Gemini API key
4. Deploy

The `vercel.json` configuration handles SPA routing automatically.

## Project Structure

```
src/
├── components/        # React components
├── services/         # API services
├── types.ts          # TypeScript type definitions
├── constants.ts      # Application constants
├── App.tsx           # Main application component
└── index.tsx         # Entry point
```

## License

This project is open source and available under the MIT License.

## Support

For support, issues, or feature requests, please visit the repository or contact the maintainer.

---

**Made by [Supan Roy](https://supanroy.com)**
