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
            stdio: ['pipe', 'pipe', 'pipe'],
            shell: process.platform !== 'win32'
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
