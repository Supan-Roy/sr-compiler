# SR Compiler

A powerful, local code compiler that executes code in multiple programming languages with true interactive I/O support - just like VS Code!

**[🚀 Live Demo](https://compiler.supanroy.com/)** (uses remote execution)
**💻 Local Version** - This repository now supports local execution with interactive stdin/stdout!

## Overview

SR Compiler is a feature-rich code execution platform built with modern web technologies. It provides an interactive environment for writing, executing, and debugging code **locally on your machine** with full support for interactive input/output.

## ✨ Features

- **🖥️ Local Code Execution** - Runs code on your machine (like VS Code) with true interactive I/O
- **💬 Interactive Terminal** - Real-time stdin/stdout interaction with your programs
- **🌍 Multi-Language Support** - C++, C, Python, JavaScript, Java, and more
- **📝 Three Execution Modes**:
  - **Terminal Mode**: Interactive I/O with live input prompts
  - **Manual Input**: Batch execution with predefined input
  - **Competitive Mode**: Compare output with expected results
- **✨ Code Formatting** - Auto-format your code with proper indentation
- **🎨 Modern UI** - Clean, responsive design that works on all devices
- **🌗 Dark/Light Mode** - Choose your preferred theme
- **📦 No External API** - Everything runs locally, fast and secure

## 🚀 Quick Start

### Prerequisites

1. **Node.js** (v16 or higher)
2. **Compilers/Interpreters**:
   - **C++**: MinGW (g++)  ✅ Already installed at `C:\MinGW\bin\g++.exe`
   - **C**: gcc (comes with MinGW)
   - **Python**: [Download here](https://www.python.org/downloads/)
   - **Java**: [Download JDK](https://www.oracle.com/java/technologies/downloads/)

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/yourusername/sr-compiler.git
   cd sr-compiler
   ```

2. **Install dependencies**:
   ```bash
   npm install
   npm install express cors uuid
   ```

3. **Start the backend server**:
   ```bash
   node server.js
   ```
   Should show: `Code execution server running on http://localhost:3001`

4. **Start the frontend** (in a new terminal):
   ```bash
   npm run dev
   ```
   Should show: `Local: http://localhost:3000/`

5. **Open your browser**: http://localhost:3000

### 🎯 Test It Out!

Try this C++ code:
```cpp
#include <iostream>
using namespace std;

int main() {
    int n;
    cout << "Enter a positive integer: ";
    cin >> n;
    cout << n << endl;
    return 0;
}
```

1. Paste the code in the editor
2. Select **"Terminal"** mode from the dropdown
3. Click **Run** (▶ button)
4. When prompted "Enter a positive integer: ", type a number and press Enter
5. See your output! 🎉

## Tech Stack

- **Frontend**: React, TypeScript, Vite
- **Backend**: Node.js, Express
- **Code Execution**: Local child processes (g++, gcc, python, node, java)
- **Styling**: Modern CSS with Tailwind-inspired utilities
- **Build Tool**: Vite

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
