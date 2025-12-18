import express from 'express';
import cors from 'cors';
import { spawn } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Store active processes
const activeProcesses = new Map();

// Session configuration
const SESSION_TIMEOUT = 5 * 60 * 1000; // 5 minutes
const MAX_SESSIONS = 20;
const SESSION_CLEANUP_INTERVAL = 1 * 60 * 1000; // 1 minute
const PROCESS_TIMEOUT = 30 * 1000; // 30 seconds per process

// Auto-cleanup old sessions
const cleanupInterval = setInterval(() => {
    const now = Date.now();
    for (const [sessionId, sessionData] of activeProcesses.entries()) {
        if (now - sessionData.createdAt > SESSION_TIMEOUT) {
            console.log(`Auto-cleaning expired session: ${sessionId}`);
            if (!sessionData.process.killed) {
                sessionData.process.kill();
            }
            activeProcesses.delete(sessionId);
            fs.rm(sessionData.sessionDir, { recursive: true, force: true }).catch(console.error);
        }
    }
    
    // Log active sessions
    console.log(`Active sessions: ${activeProcesses.size}`);
}, SESSION_CLEANUP_INTERVAL);

// Graceful shutdown
process.on('exit', () => {
    clearInterval(cleanupInterval);
    for (const sessionData of activeProcesses.values()) {
        if (!sessionData.process.killed) {
            sessionData.process.kill();
        }
    }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', activeSessions: activeProcesses.size });
});

// Temporary directory for code files
const TEMP_DIR = path.join(__dirname, 'temp');

// Ensure temp directory exists
fs.mkdir(TEMP_DIR, { recursive: true }).catch(console.error);

// Language configuration
const LANGUAGE_CONFIG = {
    'C++': {
        extension: '.cpp',
        compile: (filePath, outputPath) => ({
            command: 'g++',
            args: [filePath, '-o', outputPath, '-std=c++17']
        }),
        run: (outputPath) => ({
            command: outputPath,
            args: []
        }),
        needsCompile: true
    },
    'C': {
        extension: '.c',
        compile: (filePath, outputPath) => ({
            command: 'gcc',
            args: [filePath, '-o', outputPath]
        }),
        run: (outputPath) => ({
            command: outputPath,
            args: []
        }),
        needsCompile: true
    },
    'Python': {
        extension: '.py',
        run: (filePath) => ({
            command: 'python',
            args: [filePath]
        }),
        needsCompile: false
    },
    'JavaScript': {
        extension: '.js',
        run: (filePath) => ({
            command: 'node',
            args: [filePath]
        }),
        needsCompile: false
    },
    'Java': {
        extension: '.java',
        compile: (filePath) => ({
            command: 'javac',
            args: [filePath]
        }),
        run: (className, dirPath) => ({
            command: 'java',
            args: ['-cp', dirPath, className]
        }),
        needsCompile: true,
        getClassName: (code) => {
            const match = code.match(/public\s+class\s+(\w+)/);
            return match ? match[1] : 'Main';
        }
    }
};

// Start interactive session
app.post('/api/execute/start', async (req, res) => {
    const { code, language } = req.body;
    
    // Check session limit
    if (activeProcesses.size >= MAX_SESSIONS) {
        return res.status(429).json({ error: `Server busy. Maximum ${MAX_SESSIONS} concurrent sessions reached. Please try again later.` });
    }
    
    const sessionId = uuidv4();
    
    try {
        const config = LANGUAGE_CONFIG[language];
        if (!config) {
            return res.status(400).json({ error: `Unsupported language: ${language}` });
        }

        const sessionDir = path.join(TEMP_DIR, sessionId);
        await fs.mkdir(sessionDir, { recursive: true });

        const fileName = language === 'Java' && config.getClassName 
            ? config.getClassName(code) 
            : 'main';
        const sourceFile = path.join(sessionDir, fileName + config.extension);
        await fs.writeFile(sourceFile, code);

        let executablePath = sourceFile;
        let runConfig;

        // Compile if needed
        if (config.needsCompile) {
            if (language === 'Java') {
                const compileConfig = config.compile(sourceFile);
                const compileProcess = spawn(compileConfig.command, compileConfig.args);
                
                let compileError = '';
                compileProcess.stderr.on('data', (data) => {
                    compileError += data.toString();
                });

                await new Promise((resolve, reject) => {
                    compileProcess.on('close', (code) => {
                        if (code !== 0) {
                            reject(new Error(compileError || 'Compilation failed'));
                        } else {
                            resolve();
                        }
                    });
                });

                runConfig = config.run(fileName, sessionDir);
            } else {
                executablePath = path.join(sessionDir, 'output' + (process.platform === 'win32' ? '.exe' : ''));
                const compileConfig = config.compile(sourceFile, executablePath);
                const compileProcess = spawn(compileConfig.command, compileConfig.args);
                
                let compileError = '';
                compileProcess.stderr.on('data', (data) => {
                    compileError += data.toString();
                });

                await new Promise((resolve, reject) => {
                    compileProcess.on('close', (code) => {
                        if (code !== 0) {
                            reject(new Error(compileError || 'Compilation failed'));
                        } else {
                            resolve();
                        }
                    });
                });

                runConfig = config.run(executablePath);
            }
        } else {
            runConfig = config.run(sourceFile);
        }

        // Start the process with explicit pipes for interactive I/O
        const childProcess = spawn(runConfig.command, runConfig.args, {
            cwd: sessionDir,
            stdio: ['pipe', 'pipe', 'pipe']
        });

        const sessionData = {
            process: childProcess,
            sessionDir,
            outputBuffer: '',
            // assume program will request input unless it exits
            waitingForInput: true,
            createdAt: Date.now(),
            lastActivityAt: Date.now()
        };

        activeProcesses.set(sessionId, sessionData);

        // Process timeout handler
        const processTimeout = setTimeout(() => {
            if (!childProcess.killed) {
                console.log(`Killing process due to timeout: ${sessionId}`);
                childProcess.kill('SIGTERM');
            }
        }, PROCESS_TIMEOUT);

        // Handle process output
        childProcess.stdout.on('data', (data) => {
            sessionData.outputBuffer += data.toString();
        });

        childProcess.stderr.on('data', (data) => {
            sessionData.outputBuffer += data.toString();
        });

        childProcess.on('close', async (code) => {            clearTimeout(processTimeout);            sessionData.outputBuffer += `\n\n[Program finished with exit code ${code}]`;
            sessionData.waitingForInput = false;
            
            // Cleanup after a delay
            setTimeout(async () => {
                activeProcesses.delete(sessionId);
                try {
                    await fs.rm(sessionDir, { recursive: true, force: true });
                } catch (err) {
                    console.error('Cleanup error:', err);
                }
            }, 5000);
        });

        // Small delay to capture initial output
        await new Promise(resolve => setTimeout(resolve, 100));

        console.log(`[${sessionId}] session started for ${language}`);
        res.json({
            sessionId,
            output: sessionData.outputBuffer,
            waitingForInput: true
        });

    } catch (error) {
        console.error('Execution error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Send input to interactive session
app.post('/api/execute/input', (req, res) => {
    const { sessionId, input } = req.body;
    
    const sessionData = activeProcesses.get(sessionId);
    if (!sessionData) {
        return res.status(404).json({ error: 'Session not found or expired' });
    }

    const { process } = sessionData;
    
    // Update activity timestamp
    sessionData.lastActivityAt = Date.now();
    
    // Check if process is still alive
    if (process.killed) {
        return res.status(410).json({ error: 'Process has terminated' });
    }
    
    // Clear output buffer before sending input
    sessionData.outputBuffer = '';
    
    // Send input to process
    try {
        console.log(`[${sessionId}] stdin ->`, JSON.stringify(input));
        process.stdin.write((input ?? '') + '\n');
    } catch (error) {
        console.error(`[${sessionId}] Failed to send input:`, error.message);
        return res.status(500).json({ error: 'Failed to send input: ' + error.message });
    }
    
    // Wait for output with extended timeout (1000ms for slow responses)
    setTimeout(() => {
        console.log(`[${sessionId}] output captured:`, JSON.stringify(sessionData.outputBuffer.substring(0, 100)));
        res.json({
            output: sessionData.outputBuffer,
            // Consider we are waiting for input until the process exits
            waitingForInput: !process.killed
        });
    }, 1000);
});

// Get session output
app.get('/api/execute/output/:sessionId', (req, res) => {
    const { sessionId } = req.params;
    
    const sessionData = activeProcesses.get(sessionId);
    if (!sessionData) {
        return res.status(404).json({ error: 'Session not found' });
    }

    res.json({
        output: sessionData.outputBuffer,
        waitingForInput: !sessionData.process.killed
    });
});

// Kill session
app.post('/api/execute/kill', async (req, res) => {
    const { sessionId } = req.body;
    
    const sessionData = activeProcesses.get(sessionId);
    if (!sessionData) {
        return res.status(404).json({ error: 'Session not found' });
    }

    const { process, sessionDir } = sessionData;
    
    process.kill();
    activeProcesses.delete(sessionId);
    
    try {
        await fs.rm(sessionDir, { recursive: true, force: true });
    } catch (err) {
        console.error('Cleanup error:', err);
    }

    res.json({ success: true });
});

// Execute with stdin (non-interactive mode)
app.post('/api/execute/once', async (req, res) => {
    const { code, language, stdin } = req.body;
    const sessionId = uuidv4();
    
    try {
        const config = LANGUAGE_CONFIG[language];
        if (!config) {
            return res.status(400).json({ error: `Unsupported language: ${language}` });
        }

        const sessionDir = path.join(TEMP_DIR, sessionId);
        await fs.mkdir(sessionDir, { recursive: true });

        const fileName = language === 'Java' && config.getClassName 
            ? config.getClassName(code) 
            : 'main';
        const sourceFile = path.join(sessionDir, fileName + config.extension);
        await fs.writeFile(sourceFile, code);

        let executablePath = sourceFile;
        let runConfig;

        // Compile if needed
        if (config.needsCompile) {
            if (language === 'Java') {
                const compileConfig = config.compile(sourceFile);
                const compileProcess = spawn(compileConfig.command, compileConfig.args);
                
                let compileError = '';
                compileProcess.stderr.on('data', (data) => {
                    compileError += data.toString();
                });

                await new Promise((resolve, reject) => {
                    compileProcess.on('close', (code) => {
                        if (code !== 0) {
                            reject(new Error(compileError || 'Compilation failed'));
                        } else {
                            resolve();
                        }
                    });
                });

                runConfig = config.run(fileName, sessionDir);
            } else {
                executablePath = path.join(sessionDir, 'output' + (process.platform === 'win32' ? '.exe' : ''));
                const compileConfig = config.compile(sourceFile, executablePath);
                const compileProcess = spawn(compileConfig.command, compileConfig.args);
                
                let compileError = '';
                compileProcess.stderr.on('data', (data) => {
                    compileError += data.toString();
                });

                await new Promise((resolve, reject) => {
                    compileProcess.on('close', (code) => {
                        if (code !== 0) {
                            reject(new Error(compileError || 'Compilation failed'));
                        } else {
                            resolve();
                        }
                    });
                });

                runConfig = config.run(executablePath);
            }
        } else {
            runConfig = config.run(sourceFile);
        }

        // Run the process with explicit pipes for stdin handling
        const childProcess = spawn(runConfig.command, runConfig.args, {
            cwd: sessionDir,
            stdio: ['pipe', 'pipe', 'pipe']
        });

        let stdout = '';
        let stderr = '';

        childProcess.stdout.on('data', (data) => {
            stdout += data.toString();
        });

        childProcess.stderr.on('data', (data) => {
            stderr += data.toString();
        });

        // Send stdin if provided (allow "0" and empty strings)
        if (typeof stdin === 'string') {
            childProcess.stdin.write(stdin);
        }
        childProcess.stdin.end();

        await new Promise((resolve) => {
            childProcess.on('close', resolve);
        });

        // Cleanup
        try {
            await fs.rm(sessionDir, { recursive: true, force: true });
        } catch (err) {
            console.error('Cleanup error:', err);
        }

        res.json({
            stdout: stdout || stderr
        });

    } catch (error) {
        console.error('Execution error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
});

app.listen(PORT, () => {
    console.log(`Code execution server running on http://localhost:${PORT}`);
});
