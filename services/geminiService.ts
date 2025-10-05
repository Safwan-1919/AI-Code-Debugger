import { GoogleGenAI, Type } from "@google/genai";
import type { AnalysisResult } from '../types';

// This is a placeholder for the API key. In a real application, this should
// be handled securely and not hardcoded.
const API_KEY = process.env.API_KEY;

if (!API_KEY) {
    throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

const analysisSchema = {
    type: Type.OBJECT,
    properties: {
        review: {
            type: Type.OBJECT,
            properties: {
                overallExplanation: { type: Type.STRING },
                errors: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            filePath: { type: Type.STRING, description: "The path or name of the file where the error occurred." },
                            lineNumber: { type: Type.INTEGER },
                            errorDescription: { type: Type.STRING },
                            suggestedFix: { type: Type.STRING, description: "A minimal, concise code snippet for the fix, containing only the changed line(s). It should NOT include the entire function or file, just the specific code to replace the original line(s). This snippet must not have explanations, comments, or markdown fences." },
                            fixExplanation: { type: Type.STRING },
                        },
                        required: ["filePath", "lineNumber", "errorDescription", "suggestedFix", "fixExplanation"],
                    },
                },
                suggestions: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            filePath: { type: Type.STRING, description: "The path or name of the file for the suggestion." },
                            lineNumber: { type: Type.INTEGER },
                            suggestion: { type: Type.STRING, description: "A minimal, concise code snippet for the suggestion, containing only the changed line(s). It should NOT include the entire function or file, just the specific code to replace the original line(s). This snippet must not have explanations, comments, or markdown fences." },
                            explanation: { type: Type.STRING },
                        },
                        required: ["filePath", "lineNumber", "suggestion", "explanation"],
                    },
                },
            },
            required: ["overallExplanation", "errors", "suggestions"],
        },
        debuggerTrace: {
            type: Type.OBJECT,
            properties: {
                steps: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            filePath: { type: Type.STRING, description: "The path of the file for this execution step." },
                            lineNumber: { type: Type.INTEGER },
                            state: {
                                type: Type.OBJECT,
                                properties: {
                                    execution: { type: Type.STRING },
                                    variables: {
                                        type: Type.ARRAY,
                                        description: "An array of objects representing variables in scope. Each object should have a 'name' and a 'value' which is a JSON string representation of the variable's content.",
                                        items: {
                                            type: Type.OBJECT,
                                            properties: {
                                                name: {
                                                    type: Type.STRING,
                                                    description: "The name of the variable."
                                                },
                                                value: {
                                                    type: Type.STRING,
                                                    description: "The JSON string representation of the variable's value (e.g., '4', '\"hello\"', '[1, 2]')."
                                                }
                                            },
                                            required: ["name", "value"]
                                        }
                                    },
                                    callStack: { type: Type.ARRAY, items: { type: Type.STRING } },
                                },
                                required: ["execution", "variables", "callStack"],
                            },
                        },
                        required: ["filePath", "lineNumber", "state"],
                    },
                },
            },
            required: ["steps"],
        },
        performanceProfile: {
            type: Type.OBJECT,
            properties: {
                summary: { type: Type.STRING },
                bottlenecks: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            filePath: { type: Type.STRING, description: "The path or name of the file where the bottleneck occurs." },
                            lineNumber: { type: Type.INTEGER },
                            functionName: { type: Type.STRING },
                            calls: { type: Type.INTEGER },
                            reason: { type: Type.STRING },
                        },
                        required: ["filePath", "lineNumber", "functionName", "calls", "reason"],
                    },
                },
                optimizations: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            title: { type: Type.STRING },
                            description: { type: Type.STRING },
                        },
                        required: ["title", "description"],
                    },
                },
            },
            required: ["summary", "bottlenecks", "optimizations"],
        },
        testCases: {
            type: Type.OBJECT,
            properties: {
                generated: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            input: { type: Type.STRING },
                            expectedOutput: { type: Type.STRING },
                            description: { type: Type.STRING },
                        },
                        required: ["input", "expectedOutput", "description"],
                    },
                },
                edgeCases: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            input: { type: Type.STRING },
                            expectedOutput: { type: Type.STRING },
                            description: { type: Type.STRING },
                        },
                         required: ["input", "expectedOutput", "description"],
                    },
                },
            },
            required: ["generated", "edgeCases"],
        },
        alternativeSolutions: {
            type: Type.OBJECT,
            properties: {
                solutions: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            title: { type: Type.STRING },
                            complexity: {
                                type: Type.OBJECT,
                                properties: {
                                    time: { type: Type.STRING },
                                    space: { type: Type.STRING },
                                },
                                required: ["time", "space"],
                            },
                            explanation: { type: Type.STRING },
                            code: { type: Type.STRING },
                        },
                        required: ["title", "complexity", "explanation", "code"],
                    },
                },
            },
            required: ["solutions"],
        },
    },
    required: ["review", "debuggerTrace", "performanceProfile", "testCases", "alternativeSolutions"],
};

const simpleAnalysisSchema = {
    type: Type.OBJECT,
    properties: {
        output: { 
            type: Type.STRING, 
            description: "The predicted output of the code, as if from console.log. If there are multiple outputs, join them with newlines. If there is no output, return an empty string." 
        },
        timeComplexity: { type: Type.STRING },
        spaceComplexity: { type: Type.STRING },
    },
    required: ["output", "timeComplexity", "spaceComplexity"],
};

export interface SimpleAnalysisResult {
    output: string;
    timeComplexity: string;
    spaceComplexity: string;
}

export const getComplexityAndOutput = async (code: string, language: string, model: string): Promise<SimpleAnalysisResult> => {
    const isAllLanguages = language === 'all';
    
    const languagePrompt = isAllLanguages
        ? 'Analyze the following code, auto-detecting its programming language.'
        : `First, verify that the following code is valid ${language} code. If it is NOT, respond with a JSON object where the 'output' field is an error message explaining the language mismatch, and the 'timeComplexity' and 'spaceComplexity' fields are empty strings (""). Do not try to execute it if the language is wrong. If it IS valid ${language} code, analyze it as described below.`;

    const languageFence = isAllLanguages ? '' : language;

    const prompt = `
        ${languagePrompt}
        
        If the code is valid for the analysis, provide the following:
        1. Predict its final output (e.g., from console.log). If there are multiple outputs, join them with newlines. If an error would occur during execution (like a syntax error), the output should describe the error.
        2. Determine its time complexity (Big O notation).
        3. Determine its space complexity (Big O notation).
        
        Respond ONLY with a valid JSON object that adheres to the provided schema. Do not include any text or markdown formatting outside of the JSON object.

        Code to analyze:
        \`\`\`${languageFence}
        ${code}
        \`\`\`
    `;

    try {
        const response = await ai.models.generateContent({
            model: model,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: simpleAnalysisSchema,
            },
        });
        const jsonText = response.text.trim();
        return JSON.parse(jsonText) as SimpleAnalysisResult;
    } catch (error) {
        console.error("Error getting simple analysis with Gemini API:", error);
        throw new Error("Failed to get a valid analysis from the AI. The response may be malformed or the API call failed.");
    }
}

export const analyzeCode = async (code: string, fileName: string, language: string, model: string): Promise<AnalysisResult> => {
    const languagePrompt = language === 'all'
        ? "The programming language should be auto-detected from the file content and name."
        : `The programming language is ${language}. Before proceeding with the full analysis, first verify that the code provided is valid ${language}. If it is not, your entire response must be a valid JSON object adhering to the schema, but with the 'overallExplanation' in the 'review' object explaining the language mismatch, and all other array fields (errors, suggestions, steps, bottlenecks, etc.) must be empty.`;

    const languageFence = language === 'all' ? '' : language;

    const prompt = `
        As an expert code analysis agent, your task is to perform a comprehensive, multi-faceted review of the following code from the file named '${fileName}'.
        ${languagePrompt}
        Your analysis must cover the following five areas. For any findings (errors, suggestions, bottlenecks, debugger steps), you MUST set the 'filePath' field to '${fileName}'.

        1.  **Code Review**:
            *   Provide a high-level explanation of the code's purpose.
            *   Identify critical bugs and errors. For each, provide the file path, line number, description, suggested fix, and an explanation.
            *   Provide suggestions for improvement. For each, provide the file path, line number, the suggested code, and an explanation.

        2.  **Debugger Trace**:
            *   Generate a detailed, step-by-step execution trace of the code's execution path.
            *   For each step, include the file path ('${fileName}'), line number, a description of the execution action, all relevant variable states, and the current call stack.
            *   **Important**: Variable values must be JSON strings (e.g., a number \`4\` should be the string \`"4"\`).
            *   **Crucially**: If a trace is not possible or applicable (e.g., for non-executable code or syntax errors), you MUST return a valid object containing an empty array for the \`steps\` field, like \`"debuggerTrace": { "steps": [] }\`. Do NOT return \`null\` or omit the \`debuggerTrace\` field.

        3.  **Performance Profile**:
            *   Provide a summary of performance characteristics.
            *   Identify bottlenecks, specifying the file path, line number, function name, and reason.
            *   Suggest concrete optimizations.

        4.  **Test Cases**:
            *   Generate standard and edge test cases with inputs, expected outputs, and descriptions.

        5.  **Alternative Solutions**:
            *   Provide at least two alternative implementations.
            *   For each, include a title, time/space complexity, explanation, and full code.

        Respond ONLY with a valid JSON object that adheres to the provided schema. Do not include any text or markdown formatting outside of the JSON object.

        Code from ${fileName}:
        \`\`\`${languageFence}
        ${code}
        \`\`\`
    `;

    try {
        const response = await ai.models.generateContent({
            model: model,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: analysisSchema,
            },
        });

        const jsonText = response.text.trim();
        return JSON.parse(jsonText) as AnalysisResult;

    } catch (error) {
        console.error("Error analyzing code with Gemini API:", error);
        throw new Error("Failed to get a valid analysis from the AI. The response may be malformed or the API call failed.");
    }
};

export interface CodeFile {
  name: string;
  content: string;
}

export const analyzeProject = async (files: CodeFile[], language: string, model: string): Promise<AnalysisResult> => {
    const languageFence = language === 'all' ? '' : language;

    const formattedFiles = files.map(file => `
--- FILE: ${file.name} ---
\`\`\`${languageFence}
${file.content}
\`\`\`
`).join('\n');

    const languagePrompt = language === 'all'
        ? "This is a multi-language project. Please auto-detect the language for each file based on its extension and content."
        : `The programming language for this project is primarily ${language}. Before analyzing, if you find a file that is clearly not ${language}, note it in the overall explanation. If the entire project seems to be a different language, your entire response must be a valid JSON object adhering to the schema, but with the 'overallExplanation' in the 'review' object explaining the language mismatch, and all other array fields (errors, suggestions, steps, bottlenecks, etc.) must be empty.`;

    const prompt = `
        As an expert code analysis agent, your task is to perform a comprehensive, multi-faceted review of the following multi-file project.
        ${languagePrompt}
        The project files are provided below, separated by "--- FILE: [filename] ---".
        
        Your analysis must cover the following five areas, considering the project as a whole. When identifying issues or suggestions, **you must specify the correct file path in the 'filePath' field**.

        1.  **Code Review**:
            *   Provide a high-level explanation of the entire project's purpose and architecture.
            *   Identify critical bugs, errors, and cross-file inconsistencies. For each, provide the file path, line number, description, suggested fix, and an explanation.
            *   Provide suggestions for improvement (e.g., architecture, performance, readability). For each, provide the file path, line number, suggested code, and explanation.

        2.  **Debugger Trace**:
            *   Pick the main entry point or most significant execution path of the project and generate a detailed, step-by-step execution trace.
            *   For each step, include the correct **file path**, line number, a description of the execution action, all relevant variable states, and the current call stack.
            *   **Important**: Variable values must be JSON strings (e.g., a number \`4\` should be the string \`"4"\`).
            *   **Crucially**: If a trace is not possible or applicable for the project, you MUST return a valid object containing an empty array for the \`steps\` field, like \`"debuggerTrace": { "steps": [] }\`. Do NOT return \`null\` or omit the \`debuggerTrace\` field.

        3.  **Performance Profile**:
            *   Provide a summary of the project's overall performance characteristics.
            *   Identify any performance bottlenecks, specifying the file path, line number, function name, and reason.
            *   Suggest concrete optimizations.

        4.  **Test Cases**:
            *   Generate a set of integration test cases for the project with inputs, expected outputs, and descriptions.
            *   Generate edge cases that test interactions between different parts of the project.

        5.  **Alternative Solutions**:
            *   Provide at least two alternative architectural or implementation patterns for the given project.
            *   For each solution, include a title, its pros and cons (instead of complexity), a clear explanation, and example code snippets for key parts.
            *   The 'code' field for alternative solutions can show the key refactored files.

        Respond ONLY with a valid JSON object that adheres to the provided schema. Do not include any text or markdown formatting outside of the JSON object.

        Project Files:
        ${formattedFiles}
    `;

    try {
        const response = await ai.models.generateContent({
            model: model,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: analysisSchema,
            },
        });

        const jsonText = response.text.trim();
        return JSON.parse(jsonText) as AnalysisResult;

    } catch (error) {
        console.error("Error analyzing project with Gemini API:", error);
        throw new Error("Failed to get a valid analysis from the AI. The response may be malformed or the API call failed.");
    }
};