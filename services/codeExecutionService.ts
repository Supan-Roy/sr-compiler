import { LANGUAGES } from "../constants";
import prettier from "prettier";

// Use Piston API - works anywhere, no server needed
const PISTON_API = 'https://emkc.org/api/v2/piston';

// Store session ID for interactive mode
let currentSessionId: string | null = null;

// Map language IDs to Piston runtime names
const languageMap: Record<string, { language: string; version: string }> = {
    'cpp': { language: 'c++', version: '10.2.0' },
    'c++': { language: 'c++', version: '10.2.0' },
    'c': { language: 'c', version: '10.2.0' },
    'javascript': { language: 'javascript', version: '18.15.0' },
    'js': { language: 'javascript', version: '18.15.0' },
    'python': { language: 'python', version: '3.10.0' },
    'py': { language: 'python', version: '3.10.0' },
    'java': { language: 'java', version: '15.0.2' },
    'go': { language: 'go', version: '1.16.2' },
    'typescript': { language: 'typescript', version: '5.0.3' },
    'ts': { language: 'typescript', version: '5.0.3' },
};

export const runCodeOnce = async (code: string, language: string, input: string): Promise<string> => {
    try {
        const langKey = language.toLowerCase();
        const runtime = languageMap[langKey];
        if (!runtime) {
            throw new Error(`Unsupported language: ${language}`);
        }

        const response = await fetch(`${PISTON_API}/execute`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                language: runtime.language,
                version: runtime.version,
                files: [{
                    name: `main.${langKey.includes('c++') || langKey === 'cpp' ? 'cpp' : langKey.includes('py') || langKey === 'python' ? 'py' : langKey === 'java' ? 'java' : langKey === 'go' ? 'go' : langKey.includes('ts') || langKey === 'typescript' ? 'ts' : langKey === 'c' ? 'c' : 'js'}`,
                    content: code,
                }],
                stdin: input,
                compile_timeout: 10000,
                run_timeout: 3000,
            }),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        
        let output = '';
        if (result.compile && result.compile.stderr) {
            output += 'Compilation Error:\n' + result.compile.stderr + '\n';
        }
        if (result.run) {
            if (result.run.stderr) output += result.run.stderr;
            if (result.run.stdout) output += result.run.stdout;
        }
        
        return output || 'No output';
    } catch (error) {
        console.error("Error running code:", error);
        throw new Error(`Execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

export const startInteractiveRun = async (code: string, language: string, stdin: string = ''): Promise<{ chat: string; responseText: string; waitingForInput: boolean; }> => {
    const hasLocalServer = await checkLocalServer();
    
    if (hasLocalServer) {
        // Use local server for TRUE interactive execution (like VS Code)
        try {
            const response = await fetch(`${LOCAL_API}/execute/start`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code, language }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || `HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            currentSessionId = result.sessionId;
            
            return { 
                chat: result.sessionId, 
                responseText: result.output,
                waitingForInput: result.waitingForInput ?? false
            }),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        
        let output = '';
        if (result.compile && result.compile.stderr) {
            output += 'Compilation Error:\n' + result.compile.stderr + '\n';
        }
        if (result.run) {
    const sessionId = Date.now().toString() + Math.random().toString(36).substring(7);
    currentSessionId = sessionId;
    
    
        interactiveSessions.set(sessionId, { 
            output: output || 'No output', 
            completed: true 
        });
        
        return { 
            chat: sessionId, 
            responseText: output || 'No output',
            waitingForInput: false
        };
    } catch (error) {
        console.error("Error starting interactive run:", error);
        throw new Error(`Execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
};

export const continueInteractiveRun = async (sessionId: string, userInput: string): Promise<{ output: string; waitingForInput: boolean; }> => {
    // Piston API doesn't support interactive continuation
    // All input must be provided upfront
    return {
        output: '',
        waitingForInput: falserver = await checkLocalServer();
    
    if (hasLocalServer) {
        try {
            await fetch(`${LOCAL_API}/execute/kill`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sessionId }),
            });
        } catch (error) {
            console.error("Error killing session:", error);
        }
    }
    
    // Clean up local session tracking
    interactiveSessions.delete(sessionId);
    if (currentSessionId === sessionId) {
        currentSessionId = null;
    }
};

// Proper formatter for C and C++ - recalculates indentation and normalizes spaces
const formatCCpp = (code: string): string => {
    const lines = code.split('\n');
    let indentLevel = 0;
    const result: string[] = [];
    
    for (const line of lines) {
        let trimmed = line.trim();
        
        // Keep empty lines as-is
        if (trimmed.length === 0) {
            result.push('');
            continue;
        }
        
        // Collapse multiple spaces to single space
        trimmed = trimmed.replace(/\s+/g, ' ');
        
        // Fix #include and other preprocessor directives
        if (trimmed.startsWith('#')) {
            trimmed = trimmed.replace(/\|\s*\|/g, '||');
            trimmed = trimmed.replace(/\+\s*\+/g, '++');
            trimmed = trimmed.replace(/-\s*-/g, '--');
            
            // Comparison operators - keep together with spaces around
            trimmed = trimmed.replace(/\s*(<=|>=|==|!=)\s*/g, ' $1 ');
            
            // Stream operators - add spaces around
            trimmed = trimmed.replace(/([^<>])\s*<<\s*/g, '$1 << ');
            trimmed = trimmed.replace(/\s*>>\s*([^>])/g, ' >> $1');
            
            // Assignment operators
            trimmed = trimmed.replace(/([^!<>=+\-*/%])\s*=\s*([^=])/g, '$1 = $2');
            
            // Logical operators
            trimmed = trimmed.replace(/\s*(&&|\|\|)\s*/g, ' $1 ');
            
            // Binary operators (between words/numbers)
            trimmed = trimmed.replace(/(\w)\s*([+\-*/%])\s*(\w)/g, '$1 $2 $3');
            
            // Semicolons and commas
            trimmed = trimmed.replace(/\s*;/g, ';');
            trimmed = trimmed.replace(/\s*,\s*/g, ', ');
            
            // Parentheses
            trimmed = trimmed.replace(/\(\s+/g, '(');
            trimmed = trimmed.replace(/\s+\)/g, ')');
        }
        
        // Final cleanup - remove multiple spaces
        trimmed = trimmed.replace(/\s+/g, ' ').trim();
        
        // Decrease indent for closing braces at the start of the line
        if (trimmed.startsWith('}') || trimmed.startsWith(']') || trimmed.startsWith(')')) {
            indentLevel = Math.max(0, indentLevel - 1);
        }
        
        // Apply indentation
        const indentedLine = '    '.repeat(indentLevel) + trimmed;
        result.push(indentedLine);
        
        // Count opening and closing braces to adjust indent for next line
        const openCount = (trimmed.match(/{/g) || []).length;
        const closeCount = (trimmed.match(/}/g) || []).length;
        const bracketDiff = openCount - closeCount;
        indentLevel += bracketDiff;
        indentLevel = Math.max(0, indentLevel);
    }
    
    return result.join('\n');
};

export const formatCode = async (code: string, language: string): Promise<string> => {
    try {
        const langLower = language.toLowerCase();
        
        if (langLower === 'c++' || langLower === 'cpp' || langLower === 'c') {
            return formatCCpp(code);
        }
        
        if (langLower === 'javascript' || langLower === 'js') {
            return await prettier.format(code, {
                parser: 'babel',
                semi: true,
                singleQuote: true,
                tabWidth: 2,
            });
        }
        
        if (langLower === 'typescript' || langLower === 'ts') {
            return await prettier.format(code, {
                parser: 'typescript',
                semi: true,
                singleQuote: true,
                tabWidth: 2,
            });
        }
        
        if (langLower === 'python' || langLower === 'py') {
            return code;
        }
        
        return code;
    } catch (error) {
        console.error("Formatting error:", error);
        throw new Error(`Failed to format code: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
};
