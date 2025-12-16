# 🚀 Quick Start Guide

## ✅ Setup Complete!

Your SR Compiler is now configured to run code locally (like VS Code) with true interactive input/output support!

## 🎯 How to Use

### 1. **Start Both Servers** (if not already running)

**Terminal 1 - Backend Server:**
```powershell
node server.js
```
Should show: `Code execution server running on http://localhost:3001`

**Terminal 2 - Frontend:**
```powershell
npm run dev
```
Should show: `Local: http://localhost:3000/`

### 2. **Open the Application**
- Go to: http://localhost:3000
- You should see your code editor

### 3. **Test Your C++ Code with Interactive Input**

1. **Paste your code** (or use the default):
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

2. **Select "Terminal" mode** from the dropdown (top of right panel)

3. **Click the Run button** (▶ icon)

4. **Wait for the prompt**: You'll see "Enter a positive integer: "

5. **Type your input**: Enter a number (e.g., `42`) and press Enter

6. **See the output**: Your program will display the number you entered!

## 🎮 Three Execution Modes

### 📟 Terminal (Interactive Mode)
- Real-time interaction with your program
- Type input when prompted
- Like using a real terminal
- **Best for testing programs with user input**

### 📝 Manual Input
- Provide all input upfront in the "Input (stdin)" box
- Run once and see output
- Good for batch processing

### 🏆 Competitive Companion
- Compare output with expected output
- Shows "Passed" or "Wrong Answer"
- Perfect for competitive programming practice

## 🔧 Supported Languages

- ✅ **C++** (with MinGW installed at C:\MinGW\bin\g++.exe)
- ✅ **C** (gcc)
- ✅ **Python** (if installed)
- ✅ **JavaScript** (Node.js)
- ✅ **Java** (JDK)

## 🐛 Troubleshooting

### Backend not connecting?
```powershell
# Check if server is running
netstat -an | findstr :3001

# Restart the backend server
node server.js
```

### Compilation errors?
```powershell
# Test your compiler
g++ --version
gcc --version
python --version
node --version
```

### Port already in use?
Edit `server.js` line 14: Change `PORT = 3001` to another port (e.g., 3002)
Edit `geminiService.ts` line 4: Change `LOCAL_API` to match the new port

## 📚 Example Programs to Test

### Test 1: Simple Input/Output
```cpp
#include <iostream>
using namespace std;

int main() {
    int a, b;
    cout << "Enter two numbers: ";
    cin >> a >> b;
    cout << "Sum: " << (a + b) << endl;
    return 0;
}
```

### Test 2: Multiple Inputs
```cpp
#include <iostream>
using namespace std;

int main() {
    string name;
    int age;
    cout << "Enter your name: ";
    cin >> name;
    cout << "Enter your age: ";
    cin >> age;
    cout << "Hello " << name << ", you are " << age << " years old!" << endl;
    return 0;
}
```

### Test 3: Loop with Input
```cpp
#include <iostream>
using namespace std;

int main() {
    int n;
    cout << "How many numbers? ";
    cin >> n;
    
    int sum = 0;
    for(int i = 0; i < n; i++) {
        int x;
        cout << "Enter number " << (i+1) << ": ";
        cin >> x;
        sum += x;
    }
    
    cout << "Total sum: " << sum << endl;
    return 0;
}
```

## 🎉 That's It!

Your compiler now works just like VS Code with true interactive I/O support. Enjoy coding! 🚀
