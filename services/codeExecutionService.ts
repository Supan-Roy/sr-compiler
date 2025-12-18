import { LANGUAGES } from "../constants";
import prettier from "prettier";

// Use environment variable for server URL.
// Fallback: on non-localhost deployments, default to your Railway server.
// On localhost, default to local server for dev.
const SERVER_URL =
    import.meta.env.VITE_EXECUTION_SERVER_URL ||
    ((typeof window !== 'undefined' && window.location.hostname !== 'localhost')
        ? 'https://sr-compiler-production.up.railway.app'
        : 'http://localhost:3001');
const EXECUTION_API = `${SERVER_URL}/api`;
const PISTON_API = 'https://emkc.org/api/v2/piston';

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
    // Always try execution server first; fallback to Piston on any failure
    try {
        const response = await fetch(`${EXECUTION_API}/execute/once`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code, language, stdin: input }),
        });

        if (response.ok) {
            const result = await response.json();
            return result.stdout || '';
        }
    } catch (error) {
        console.warn("Execution server not reachable, using Piston");
    }
    
    // Fallback to Piston API
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
