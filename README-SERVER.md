# SR Compiler - Local Execution Setup

This application now runs code locally on your machine instead of using an external API. This enables true interactive input/output like VS Code.

## Prerequisites

Make sure you have the following compilers/interpreters installed:

### For C++:
- **Windows**: Install MinGW-w64 or MSYS2
  - Download from: https://www.msys2.org/
  - After installation, add to PATH: `C:\msys64\mingw64\bin`
  - Test with: `g++ --version`

### For C:
- Same as C++ (gcc comes with MinGW)
- Test with: `gcc --version`

### For Python:
- Download from: https://www.python.org/downloads/
- Test with: `python --version`

### For JavaScript:
- Install Node.js from: https://nodejs.org/
- Test with: `node --version`

### For Java:
- Install JDK from: https://www.oracle.com/java/technologies/downloads/
- Test with: `javac --version` and `java --version`

## Setup Instructions

### 1. Install Server Dependencies

Open PowerShell in the project directory and run:

```powershell
npm install express cors uuid
```

### 2. Start the Execution Server

**Option A: Using the batch file (easiest)**
```
Double-click start-server.bat
```

**Option B: Using PowerShell**
```powershell
node server.js
```

You should see:
```
Code execution server running on http://localhost:3001
```

### 3. Start the Frontend

In a separate terminal:

```powershell
npm run dev
```

### 4. Use the Application

- Open the application in your browser (usually http://localhost:5173)
- Write your C++ code with `cin` for input
- Select **"Terminal"** mode from the dropdown
- Click **Run** - the program will execute and wait for your input
- Type your input and press Enter
- The program will continue executing with your input

## How It Works

### Interactive Mode (Terminal)
- Starts a real process on your machine
- Waits for your input when the program calls `cin`, `input()`, etc.
- You can interact with the program in real-time
- Like using a real terminal

### Manual Input Mode
- You provide all input upfront in the "Input (stdin)" box
- The program runs and outputs results
- Good for competitive programming practice

### Competitive Companion Mode
- Same as Manual Input, but compares output with expected output
- Shows "Passed" or "Wrong Answer" verdict

## Troubleshooting

### "Failed to connect to local execution server"
- Make sure the server is running on port 3001
- Check if another program is using port 3001
- Restart the server

### "g++ is not recognized" or compilation errors
- Make sure g++ is installed and in your PATH
- Open a new terminal after installing to refresh environment variables
- Test manually: `g++ --version`

### Program doesn't wait for input
- Make sure you're in **"Terminal"** mode (not "Manual Input")
- Check that the server is running

### Port 3001 already in use
- Edit `server.js` and change `PORT = 3001` to another port (e.g., 3002)
- Edit `geminiService.ts` and change `LOCAL_API = 'http://localhost:3001/api'` to match

## Security Note

This server executes code locally on your machine with your user privileges. Only run code you trust. For production use, consider:
- Running in a sandboxed environment
- Adding authentication
- Using Docker containers for isolation
