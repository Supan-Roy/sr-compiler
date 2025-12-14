import { LANGUAGES } from "../constants";
import prettier from "prettier";

// Map language names to Piston runtime identifiers
const PISTON_LANGUAGE_MAP: Record<string, string> = {
    'Python': 'python',
    'JavaScript': 'javascript',
    'TypeScript': 'typescript',
    'C': 'c',
    'C++': 'cpp',
    'Java': 'java',
    'C#': 'csharp',
    'PHP': 'php',
    'Ruby': 'ruby',
    'Go': 'go',
    'Rust': 'rust',
    'SQL': 'sql',
    'HTML': 'html',
};

const PISTON_API = 'https://emkc.org/api/v2/piston';

const getLanguageRuntime = (languageName: string): string => {
    return PISTON_LANGUAGE_MAP[languageName] || 'python';
};

export const runCodeOnce = async (code: string, language: string, input: string): Promise<string> => {
    const runtime = getLanguageRuntime(language);
    
    try {
        const response = await fetch(`${PISTON_API}/execute`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                language: runtime,
                version: '*',
                files: [
                    {
                        name: 'main',
                        content: code,
                    }
                ],
                stdin: input,
            }),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();

        if (result.compile?.stderr) {
            return result.compile.stderr;
        }

        if (result.run?.stderr) {
            return result.run.stderr;
        }

        return result.run?.stdout || '';
    } catch (error) {
        console.error("Error running code:", error);
        throw new Error("Failed to execute code. Make sure your code is valid.");
    }
}

export const startInteractiveRun = async (code: string, language: string): Promise<{ chat: null; responseText: string; }> => {
    // For interactive mode, we'll use the same execution but return empty chat object
    // Piston API doesn't support true interactive mode, so we simulate it
    try {
        const runtime = getLanguageRuntime(language);
        
        const response = await fetch(`${PISTON_API}/execute`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                language: runtime,
                version: '*',
                files: [
                    {
                        name: 'main',
                        content: code,
                    }
                ],
                stdin: '',
            }),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();

        if (result.compile?.stderr) {
            return { chat: null, responseText: result.compile.stderr };
        }

        if (result.run?.stderr) {
            return { chat: null, responseText: result.run.stderr };
        }

        return { chat: null, responseText: result.run?.stdout || '' };
    } catch (error) {
        console.error("Error starting interactive run:", error);
        throw new Error("Failed to start code execution.");
    }
};

export const continueInteractiveRun = async (chat: null, userInput: string): Promise<string> => {
    // Piston API doesn't support true interactive I/O
    throw new Error("Interactive mode requires user input capability. Please use Manual mode instead.");
};

// Proper formatter for C and C++ - recalculates indentation and removes extra spaces
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
        
        // Remove extra spaces around operators and punctuation
        trimmed = trimmed
            .replace(/\s*<<\s*/g, '<<')  // Remove spaces around <<
            .replace(/\s*>>\s*/g, '>>')  // Remove spaces around >>
            .replace(/\s*([+\-*/%&|^<>=!?:;,.])\s*/g, '$1')  // Remove spaces around operators
            .replace(/\s+/g, ' ')  // Collapse multiple spaces to single space
            .trim();
        
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