import type { Chat } from "@google/genai";
import { LANGUAGES } from "../constants";

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

export const startInteractiveRun = async (code: string, language: string): Promise<{ chat: Chat | null; responseText: string; }> => {
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

export const continueInteractiveRun = async (chat: Chat | null, userInput: string): Promise<string> => {
    // Piston API doesn't support true interactive I/O
    throw new Error("Interactive mode requires user input capability. Please use Manual mode instead.");
};

export const formatCode = async (code: string, language: string): Promise<string> => {
    // Simple formatting without external API - just return the code as-is
    // For proper formatting, users can use their IDE's formatter
    return code;
};