import { LANGUAGES } from "../constants";
import prettier from "prettier";

const LOCAL_API = 'http://localhost:3001/api';

// Store session ID for interactive mode
let currentSessionId: string | null = null;

export const runCodeOnce = async (code: string, language: string, input: string): Promise<string> => {
    try {
        const response = await fetch(`${LOCAL_API}/execute/once`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                code,
                language,
                stdin: input,
            }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || `HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        return result.stdout || '';
    } catch (error) {
        console.error("Error running code:", error);
        if (error instanceof TypeError && error.message.includes('fetch')) {
            throw new Error("Failed to connect to local execution server. Make sure the server is running on port 3001.");
        }
        throw error;
    }
}

export const startInteractiveRun = async (code: string, language: string): Promise<{ chat: string; responseText: string; waitingForInput: boolean; }> => {
    try {
        const response = await fetch(`${LOCAL_API}/execute/start`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                code,
                language,
            }),
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
        };
    } catch (error) {
        console.error("Error starting interactive run:", error);
        if (error instanceof TypeError && error.message.includes('fetch')) {
            throw new Error("Failed to connect to local execution server. Make sure the server is running on port 3001.");
        }
        throw error;
    }
};

export const continueInteractiveRun = async (sessionId: string, userInput: string): Promise<{ output: string; waitingForInput: boolean; }> => {
    try {
        const response = await fetch(`${LOCAL_API}/execute/input`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                sessionId,
                input: userInput,
            }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || `HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        return {
            output: result.output,
            waitingForInput: result.waitingForInput ?? false
        };
    } catch (error) {
        console.error("Error continuing interactive run:", error);
        throw error;
    }
};

export const killInteractiveSession = async (sessionId: string): Promise<void> => {
    try {
        await fetch(`${LOCAL_API}/execute/kill`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                sessionId,
            }),
        });
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
