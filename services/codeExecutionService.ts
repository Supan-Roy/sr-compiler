import { LANGUAGES } from "../constants";
import prettier from "prettier";

// Use Piston API for code execution (free, no server needed)
const PISTON_API = 'https://emkc.org/api/v2/piston';

// Store session ID for interactive mode
let currentSessionId: string | null = null;
let interactiveSessions = new Map<string, { output: string; completed: boolean }>();

// Map language IDs to Piston runtime names
const languageMap: Record<string, { language: string; version: string }> = {
    'cpp': { language: 'c++', version: '10.2.0' },
    'c': { language: 'c', version: '10.2.0' },
    'javascript': { language: 'javascript', version: '18.15.0' },
    'python': { language: 'python', version: '3.10.0' },
    'java': { language: 'java', version: '15.0.2' },
    'go': { language: 'go', version: '1.16.2' },
    'typescript': { language: 'typescript', version: '5.0.3' },
};

export const runCodeOnce = async (code: string, language: string, input: string): Promise<string> => {
    try {
        const runtime = languageMap[language];
        if (!runtime) {
            throw new Error(`Unsupported language: ${language}`);
        }

        const response = await fetch(`${PISTON_API}/execute`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                language: runtime.language,
                version: runtime.version,
                files: [
                    {
                        name: `main.${language === 'cpp' ? 'cpp' : language === 'python' ? 'py' : language === 'java' ? 'java' : language === 'go' ? 'go' : language === 'typescript' ? 'ts' : language === 'c' ? 'c' : 'js'}`,
                        content: code,
                    },
                ],
                stdin: input,
                compile_timeout: 10000,
                run_timeout: 3000,
            }),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        
        // Combine stdout and stderr, prioritize stderr if present (for errors)
        let output = '';
        if (result.compile && result.compile.stderr) {
            output += 'Compilation Error:\n' + result.compile.stderr + '\n';
        }
        if (result.run) {
            if (result.run.stderr) {
                output += result.run.stderr;
            }
            if (result.run.stdout) {
                output += result.run.stdout;
            }
        }
        
        return output || 'No output';
    } catch (error) {
        console.error("Error running code:", error);
        throw new Error(`Execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

export const startInteractiveRun = async (code: string, language: string): Promise<{ chat: string; responseText: string; waitingForInput: boolean; }> => {
    try {
        const runtime = languageMap[language];
        if (!runtime) {
            throw new Error(`Unsupported language: ${language}`);
        }

        const sessionId = Date.now().toString() + Math.random().toString(36).substring(7);
        currentSessionId = sessionId;
        
        const response = await fetch(`${PISTON_API}/execute`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                language: runtime.language,
                version: runtime.version,
                files: [
                    {
                        name: `main.${language === 'cpp' ? 'cpp' : language === 'python' ? 'py' : language === 'java' ? 'java' : language === 'go' ? 'go' : language === 'typescript' ? 'ts' : language === 'c' ? 'c' : 'js'}`,
                        content: code,
                    },
                ],
                stdin: '',
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
            if (result.run.stderr) {
                output += result.run.stderr;
            }
            if (result.run.stdout) {
                output += result.run.stdout;
            }
        }
        
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
    try {
        const session = interactiveSessions.get(sessionId);
        if (!session) {
            throw new Error('Session not found');
        }
        
        // For now, interactive input after initial execution isn't supported with Piston
        // Return the stored output
        return {
            output: session.output,
            waitingForInput: false
        };
    } catch (error) {
        console.error("Error continuing interactive run:", error);
        throw error;
    }
};

export const killInteractiveSession = async (sessionId: string): Promise<void> => {
    try {
        // Clean up the session from our map
        interactiveSessions.delete(sessionId);
        if (currentSessionId === sessionId) {
            currentSessionId = null;
        }
    } catch (error) {
        console.error("Error killing session:", error);
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
            // Ensure space after directive name
            trimmed = trimmed.replace(/^(#\w+)\s*/, '$1 ');
            // Remove spaces inside angle brackets for includes
            trimmed = trimmed.replace(/<\s*/g, '<').replace(/\s*>/g, '>');
            trimmed = trimmed.replace(/<([^>]+)>/g, (match, inside) => {
                return '<' + inside.replace(/\s+/g, '') + '>';
            });
        } else {
            // For non-preprocessor lines, apply formatting rules
            
            // First: Combine split operators (e.g., > = becomes >=)
            trimmed = trimmed.replace(/>\s*=/g, '>=');
            trimmed = trimmed.replace(/<\s*=/g, '<=');
            trimmed = trimmed.replace(/=\s*=/g, '==');
            trimmed = trimmed.replace(/!\s*=/g, '!=');
            trimmed = trimmed.replace(/&\s*&/g, '&&');
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

// Proper formatter for Python - recalculates indentation and removes extra spaces
const formatPython = (code: string): string => {
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
        
        // Remove extra spaces but preserve string content
        trimmed = trimmed.replace(/\s+/g, ' ').trim();
        
        // Check for dedent keywords (else, elif, except, finally, etc.)
        const dedentKeywords = /^(else|elif|except|finally|def|class)\b/;
        if (dedentKeywords.test(trimmed) && indentLevel > 0) {
            indentLevel--;
        }
        
        // Apply indentation
        const indentedLine = '    '.repeat(indentLevel) + trimmed;
        result.push(indentedLine);
        
        // Increase indent if line ends with colon
        if (trimmed.endsWith(':')) {
            indentLevel++;
        }
    }
    
    return result.join('\n');
};

export const formatCode = async (code: string, language: string): Promise<string> => {
    // Map language names to Prettier parser names or custom formatters
    const parserMap: Record<string, string | null> = {
        'JavaScript': 'babel',
        'TypeScript': 'typescript',
        'HTML': 'html',
        'CSS': 'css',
        'JSON': 'json',
        'C': null, // Use custom formatter
        'C++': null, // Use custom formatter
        'Python': null, // Use custom formatter
    };

    const parser = parserMap[language];
    
    if (parser === null) {
        // Use custom formatters for C, C++, Python
        if (language === 'C' || language === 'C++') {
            try {
                return formatCCpp(code);
            } catch (error) {
                console.error(`Error formatting ${language}:`, error);
                throw new Error(`Failed to format ${language} code`);
            }
        } else if (language === 'Python') {
            try {
                return formatPython(code);
            } catch (error) {
                console.error(`Error formatting Python:`, error);
                throw new Error(`Failed to format Python code`);
            }
        }
    }
    
    if (!parser) {
        // If language is not supported, return code as-is with a helpful message
        console.warn(`Formatting is not available for ${language}.`);
        return code;
    }

    try {
        const formatted = await prettier.format(code, {
            parser: parser,
            semi: true,
            singleQuote: false,
            trailingComma: 'es5',
            tabWidth: 4,
            useTabs: false,
        });
        return formatted;
    } catch (error) {
        // If formatting fails, return original code with error logged
        console.error(`Error formatting code with Prettier:`, error);
        throw new Error(`Failed to format ${language} code: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
};
