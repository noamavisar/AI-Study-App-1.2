
import { GoogleGenAI, GenerateContentResponse, Type } from "@google/genai";
import { Task, ResourceType, Flashcard, ProjectFile } from '../types';

// In a real environment, this is provided externally.
const API_KEY = process.env.API_KEY as string;

const ai = new GoogleGenAI({ apiKey: API_KEY });

const fileToGenerativePart = async (file: File) => {
    const base64EncodedData = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve((reader.result as string).split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });

    return {
        inlineData: {
            mimeType: file.type,
            data: base64EncodedData,
        },
    };
};

export async function generateStudySprint(
    topic: string,
    duration: number,
    resources: ResourceType[],
    files: File[],
    linkFiles: ProjectFile[]
): Promise<Omit<Task, 'id' | 'status' | 'priority' | 'estimatedTime'>[]> {
    const model = 'gemini-2.5-flash';
    const resourceText = resources.length > 0 ? `focusing on these resource types: ${resources.join(', ')}` : '';
    const linkText = linkFiles.length > 0
        ? `The user has also provided the following online resources (do not access them, just use their names for context): ${linkFiles.map(f => `"${f.name}" at ${f.url}`).join(', ')}.`
        : '';

    const textPart = {
        text: `Create a detailed, day-by-day study plan for the topic "${topic}". The plan should span ${duration} days.
The user's goal is to be well-prepared for a test at the end of this period.
${resourceText}
${linkText}
The user has provided file(s) as study material. Use their content to generate a relevant and specific study plan.
For each day, create a list of tasks. Each task must have a "title" and a "description".
The description should be concise and actionable.
IMPORTANT: Respond with ONLY a JSON object in the specified format. Do not include any other text, markdown, or explanation.
`,
    };

    const fileParts = await Promise.all(files.map(fileToGenerativePart));

    const contents = { parts: [textPart, ...fileParts] };

    const response = await ai.models.generateContent({
        model,
        contents: [contents], // Wrap in an array for multipart content
        config: {
            responseMimeType: 'application/json',
            responseSchema: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        day: { type: Type.NUMBER, description: "The day number in the study plan (e.g., 1)." },
                        title: { type: Type.STRING, description: "The specific task title for that day." },
                        description: { type: Type.STRING, description: "A brief description of the task." },
                    },
                    required: ["day", "title", "description"],
                },
            },
        },
    });

    const jsonString = response.text.trim();
    const parsed = JSON.parse(jsonString);
    return parsed;
}

export async function generateFlashcards(
    topic: string,
    files: File[],
    linkFiles: ProjectFile[]
): Promise<Flashcard[]> {
    const model = 'gemini-2.5-flash';
    const linkText = linkFiles.length > 0
        ? `The user has also provided the following online resources (do not access them, just use their names for context): ${linkFiles.map(f => `"${f.name}" at ${f.url}`).join(', ')}.`
        : '';

    const textPart = {
        text: `Generate a set of 20 high-quality flashcards about "${topic}".
Use the provided file(s) as the primary source material.
${linkText}
Each flashcard must have a "question" and an "answer".
The questions should be clear and concise.
The answers should be accurate and detailed enough to be useful for studying.
LANGUAGE: The primary language for all questions and answers MUST be Hebrew.
TECHNICAL NOTATION: Use English and LaTeX ONLY for mathematical formulas, equations, or specific technical terms that do not have a standard Hebrew equivalent.

CRITICAL - LATEX FORMATTING: All LaTeX code MUST be correctly enclosed in '$' delimiters for inline math and '$$' for block math. Ensure all delimiters are balanced and all commands are valid.
- GOOD: $y = \\frac{1}{x}$
- BAD: y = \\frac{1}{x} (Missing delimiters)
- BAD: $y = \\rac{1}{x}$ (Invalid command)

CRITICAL - VALIDITY: Ensure all LaTeX commands are standard and valid (e.g., use '\\frac', not '\\rac'; use '\\text', not '\\ext'). Double-check your output for formatting errors before responding.

Respond with ONLY a JSON array of objects in the specified format. Do not include any other text, markdown, or explanation.
`,
    };

    const fileParts = await Promise.all(files.map(fileToGenerativePart));
    const contents = { parts: [textPart, ...fileParts] };

    const response = await ai.models.generateContent({
        model,
        contents: [contents],
        config: {
            responseMimeType: 'application/json',
            responseSchema: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        question: { type: Type.STRING },
                        answer: { type: Type.STRING },
                    },
                    required: ["question", "answer"],
                },
            },
        },
    });

    const jsonString = response.text.trim();
    const parsed = JSON.parse(jsonString);
    return parsed as Flashcard[];
}

export async function generateTaskBreakdown(taskTitle: string, taskDescription: string): Promise<string[]> {
    const model = 'gemini-2.5-flash';
    const prompt = `Break down the following task into a list of smaller, actionable sub-tasks.
Task Title: "${taskTitle}"
Task Description: "${taskDescription}"
Respond with ONLY a JSON array of strings. Each string is a sub-task.
Do not include any other text, markdown, or explanation.`;

    const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
            responseMimeType: 'application/json',
            responseSchema: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
            },
        },
    });

    const jsonString = response.text.trim();
    const parsed = JSON.parse(jsonString);
    return parsed as string[];
}

export async function generateLearningTips(taskTitle: string): Promise<string> {
    const model = 'gemini-2.5-flash';
    const prompt = `Provide concise, actionable learning tips for the topic "${taskTitle}".
Focus on strategies for better understanding and retention.
Format the response as a simple HTML list (ul/li).
Do not include a full HTML document structure, just the list itself.`;

    const response = await ai.models.generateContent({
        model,
        contents: prompt,
    });
    return response.text;
}
