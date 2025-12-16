# 🎉 SR Compiler - Now with Local Execution!

## What Changed?

Your SR Compiler now runs code **locally on your machine** instead of using an external API. This means:

### ✅ Benefits:
1. **True Interactive I/O** - Programs with `cin`, `input()`, `scanf()` now work perfectly!
2. **Real-time Input** - Type input when your program asks for it (like a real terminal)
3. **Faster Execution** - No network delay, runs instantly on your machine
4. **Privacy** - Your code never leaves your computer
5. **Offline Capable** - No internet required for code execution

### 🔄 How It Works Now:

```
┌─────────────────┐         ┌──────────────────┐         ┌────────────────┐
│  Frontend       │────────▶│  Backend Server  │────────▶│  Your System   │
│  (React/Vite)   │         │  (Node.js/Express│         │  (g++, python, │
│  localhost:3000 │         │  localhost:3001) │         │   node, etc.)  │
└─────────────────┘         └──────────────────┘         └────────────────┘
```

1. You write code in the browser
2. Frontend sends code to local backend (port 3001)
3. Backend compiles/runs code using your system's compilers
4. Output streams back to your browser in real-time

## 📋 Current Status

### ✅ Running:
- Backend Server: http://localhost:3001 ✓
- Frontend Dev Server: http://localhost:3000 ✓
- g++ compiler: C:\MinGW\bin\g++.exe ✓

### 📁 New Files Added:
1. **server.js** - Backend execution server
2. **start-server.bat** - Easy server startup (double-click to run)
3. **QUICKSTART.md** - Quick reference guide
4. **README-SERVER.md** - Detailed setup instructions
5. **package-server.json** - Server dependencies (reference)

### 🔧 Modified Files:
1. **services/geminiService.ts** - Now uses local API instead of Piston API
2. **App.tsx** - Updated to handle session management
3. **README.md** - Updated with local execution instructions

## 🎮 Usage Guide

### For Your Original C++ Code:

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

**Before (with Piston API):**
❌ Input wasn't working - showed "Enter a positive integer: 0" automatically

**Now (with local execution):**
✅ Works perfectly!
1. Click Run
2. See "Enter a positive integer: " 
3. Type your number (e.g., 42)
4. Press Enter
5. See output: "42"

### Three Modes Explained:

#### 1. 🖥️ Terminal Mode (Interactive)
```
Best for: Programs with cin, scanf, input()
How: Type input when prompted
Example: Your C++ code above
```

#### 2. 📝 Manual Input Mode
```
Best for: Programs that need all input at once
How: Put all inputs in the Input box, separated by newlines
Example: Batch processing, file-like input
```

#### 3. 🏆 Competitive Mode
```
Best for: Competitive programming practice
How: Provide input and expected output, get verdict
Example: LeetCode-style testing
```

## 🚀 Daily Workflow

### Starting Your Day:

**Option 1: Quick Start (Recommended)**
```powershell
# Start backend
node server.js

# In another terminal, start frontend
npm run dev
```

**Option 2: Using Batch File**
```
Double-click start-server.bat
Then run: npm run dev
```

### Stopping:
- Press `Ctrl+C` in each terminal
- Or close the terminal windows

## 🔒 Security Note

The backend server executes code with your user privileges. Only run code you trust. For production:
- Add authentication
- Use Docker containers
- Implement resource limits
- Add input sanitization

## 📚 Additional Resources

- **QUICKSTART.md** - Examples and common use cases
- **README-SERVER.md** - Detailed setup for all languages
- **README.md** - Updated project overview

## 🎯 Next Steps

You're all set! Try:
1. Your original C++ code - it should work perfectly now
2. Python with `input()` - will prompt for input
3. Multiple inputs in a loop - each cin/input will wait for you
4. Complex programs with multiple prompts

## 💡 Tips

- Use **Terminal mode** for interactive programs
- Use **Manual mode** for competitive programming with test cases
- The terminal keeps history - you can see all your previous I/O
- Click the 🗑️ icon to clear terminal and kill the running process

Enjoy your new local compiler! 🎉
