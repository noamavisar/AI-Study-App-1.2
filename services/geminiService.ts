import { GoogleGenAI, Type } from "@google/genai";
import { Task, ResourceType, Flashcard, ProjectFile } from '../types';

// In a real environment, this is provided externally.
const API_KEY = process.env.API_KEY as string;

const ai = new GoogleGenAI({ apiKey: API_KEY });

declare global {
  interface Window {
    MathJax: any;
  }
}

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

export async function generateStudySprint(topic: string, duration: number, resources: ResourceType[], files: File[], linkFiles: ProjectFile[]): Promise<Partial<Task>[]> {
  const fileParts = await Promise.all(files.map(fileToGenerativePart));
  const linkParts = linkFiles.map(f => ({ text: `Web Resource: ${f.name} - ${f.url}` }));

  const prompt = `
    Create a detailed ${duration}-day study plan for the topic: "${topic}".
    The available resources are: ${resources.join(', ')}.
    Break down the topic into a logical sequence of tasks, one or more per day.
    For each task, provide a title, a short description, an estimated time in minutes (e.g., 90), and the day number it should be completed on.
    Use the provided files and links as the primary study material.
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: { parts: [{ text: prompt }, ...fileParts, ...linkParts] },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            day: { type: Type.INTEGER, description: "The day number in the study plan." },
            title: { type: Type.STRING, description: "A concise title for the study task." },
            description: { type: Type.STRING, description: "A brief description of what to study or do." },
            estimatedTime: { type: Type.INTEGER, description: "Estimated time in minutes to complete the task." }
          }
        }
      }
    }
  });

  const text = response.text;
  if (typeof text !== 'string' || !text.trim()) {
    throw new Error("The AI returned an empty response. This might be due to a content safety block or a network issue. Please try a different topic or file.");
  }
  
  try {
    return JSON.parse(text);
  } catch (e) {
    console.error("Failed to parse study sprint JSON:", e);
    throw new Error("The AI returned an invalid format for the study sprint. Please try again.");
  }
}

export async function generateTaskBreakdown(title: string, description: string | undefined): Promise<string[]> {
    const prompt = `Break down the following task into a list of smaller, actionable sub-tasks. Task Title: "${title}". Description: "${description || 'No description provided.'}". Return a JSON array of strings.`;
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
            }
        }
    });

    const text = response.text;
    if (typeof text !== 'string' || !text.trim()) {
        return [];
    }
    return JSON.parse(text);
}

export async function generateLearningTips(topic: string): Promise<string> {
    const prompt = `Provide 2-3 concise, actionable learning tips for the topic "${topic}". Format the response as simple HTML with paragraphs <p> and bold tags <b> for emphasis. Do not include any other HTML tags.`;
    const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
    return response.text || "";
}

export async function generateFlashcards(topic: string, files: File[], linkFiles: ProjectFile[]): Promise<Flashcard[]> {
    const fileParts = await Promise.all(files.map(fileToGenerativePart));
    const linkParts = linkFiles.map(f => ({ text: `Web Resource Reference: ${f.name} at ${f.url}` }));

    const prompt = `
        Generate a comprehensive set of flashcards for the topic: "${topic}" IN HEBREW.
        The entire text of the question and answer should be in Hebrew.
        If study materials (files, links) are provided, they are the primary source.
        Each flashcard must have a 'question' and an 'answer'.
        The response MUST be a valid JSON array of objects, with "question" and "answer" keys.
        
        CRITICAL INSTRUCTIONS FOR MATH/SCIENCE (in Hebrew context):
        - All mathematical notation MUST use LaTeX.
        - All text outside of LaTeX delimiters must be in HEBREW.
        - All LaTeX commands inside delimiters MUST remain in English (e.g., $\\mathbb{R}$ not $\\ממשי{R}$).
        - Use INLINE math for formulas within a sentence. Delimit with single dollar signs: $...$.
          - Correct example: "הנגזרת של $x^2$ היא $2x$."
        - Use DISPLAY math for important formulas that should stand alone on their own line. Delimit with double dollar signs: $$...$$.
          - Correct example: "נוסחת השורשים היא $$x = \\frac{-b \\pm \\sqrt{b^2-4ac}}{2a}$$"
        - Ensure all LaTeX syntax is valid and renderable by MathJax. For example, use \\langle and \\rangle for angle brackets, not "langle".
    `;
    
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: [{ text: prompt }, ...fileParts, ...linkParts] },
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        question: { type: Type.STRING, description: "The question for the flashcard." },
                        answer: { type: Type.STRING, description: "The answer to the question." }
                    },
                    required: ["question", "answer"]
                }
            }
        }
    });

    const text = response.text;
    if (typeof text !== 'string' || !text.trim()) {
        throw new Error("The AI returned an empty response. This might be due to a content safety block or a network issue. Please try a different topic or file.");
    }

    try {
        return JSON.parse(text);
    } catch (e) {
        console.error("Failed to parse flashcards JSON:", e);
        throw new Error("The AI returned an invalid format for the flashcards. Please try again.");
    }
}

export async function generatePromptSuggestions(files: File[], linkFiles: ProjectFile[]): Promise<string[]> {
  const fileParts = await Promise.all(files.map(fileToGenerativePart));
  const linkParts = linkFiles.map(f => ({ text: `Web Resource Reference: ${f.name} at ${f.url}` }));

  if (fileParts.length === 0 && linkParts.length === 0) {
    throw new Error("Please select at least one file or link to get prompt suggestions.");
  }

  const prompt = `
    As a prompt engineering expert, your task is to analyze the provided study materials (text content from files and links) and generate a list of 3-5 high-quality, effective prompts for creating flashcards.

    Instructions:
    1.  **Analyze Content:** Thoroughly review the provided materials to identify core concepts, key themes, important figures, critical vocabulary, and essential relationships between ideas.
    2.  **Generate Prompts:** Create a list of 3 to 5 distinct prompt suggestions.
    3.  **Action-Oriented:** Each prompt must start with an action verb (e.g., "Summarize," "Identify," "Explain," "Compare and contrast," "List the key characteristics of").
    4.  **Concise and Focused:** Each prompt must be a single, clear, and concise sentence. It should guide the user to focus on a specific, meaningful aspect of the material.
    5.  **Directly Relevant:** The generated prompts must be directly and obviously relevant to the analyzed source material.

    Return the list of prompts as a valid JSON array of strings.
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: { parts: [{ text: prompt }, ...fileParts, ...linkParts] },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.STRING,
          description: "A single, concise, action-oriented prompt suggestion."
        }
      }
    }
  });

  const text = response.text;
  if (typeof text !== 'string' || !text.trim()) {
    throw new Error("The AI returned an empty response. This might be due to a content safety block or a network issue.");
  }

  try {
    const suggestions = JSON.parse(text);
    if (Array.isArray(suggestions) && suggestions.every(s => typeof s === 'string')) {
        return suggestions;
    }
    throw new Error("Invalid format received from AI.");
  } catch (e) {
    console.error("Failed to parse prompt suggestions JSON:", e);
    throw new Error("The AI returned an invalid format for the prompt suggestions. Please try again.");
  }
}

const correctLatex = async (brokenExpression: string): Promise<string> => {
    const prompt = `
        The following LaTeX expression failed to render in MathJax, likely due to an invalid command or syntax:
        \`${brokenExpression}\`
        
        Your task is to correct ONLY the LaTeX syntax to make it compatible with MathJax.
        - For example, if you see "langle", it should be "\\langle".
        - The expression is from a text in Hebrew, but the LaTeX commands themselves are standard English (e.g., \\frac, \\sum).
        - Return ONLY the corrected LaTeX code.
        - Do NOT include delimiters like $ or $$.
        - Do NOT include any explanations or surrounding text.
    `;

    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt
    });
    
    const text = response.text;
    if (typeof text !== 'string' || !text.trim()) {
        throw new Error("AI correction service returned an empty response.");
    }
    
    return text.trim().replace(/`/g, '').replace(/\$/g, '');
};

async function processTextForCorrection(text: string): Promise<string> {
    const regex = /(\$\$[\s\S]+?\$\$|\$[\s\S]+?\$)/g;
    const parts = text.split(regex);
    const processedParts = [];

    for (const part of parts) {
        if (part.startsWith('$') && part.endsWith('$')) {
            const isDisplay = part.startsWith('$$');
            const rawExpression = part.slice(isDisplay ? 2 : 1, isDisplay ? -2 : -1).trim();

            if (!rawExpression) {
                processedParts.push(part);
                continue;
            }

            try {
                // Use MathJax's promise-based converter to test the expression. It rejects on error.
                await window.MathJax.tex2svgPromise(rawExpression, { display: isDisplay });
                processedParts.push(part);
            } catch (e) {
                console.warn('Broken LaTeX found, attempting to correct:', rawExpression);
                try {
                    const correctedRaw = await correctLatex(rawExpression);
                    const delimiter = isDisplay ? '$$' : '$';
                    const correctedPart = `${delimiter}${correctedRaw}${delimiter}`;
                    
                    try {
                        // Test the correction
                        await window.MathJax.tex2svgPromise(correctedRaw, { display: isDisplay });
                        console.log('Correction successful:', correctedPart);
                        processedParts.push(correctedPart);
                    } catch (finalError) {
                        console.error('AI correction also failed. Keeping original broken text.', finalError);
                        processedParts.push(part); // Keep original broken one
                    }
                } catch (correctionError) {
                    console.error('AI correction service failed:', correctionError);
                    processedParts.push(part); // Keep original broken one
                }
            }
        } else {
            processedParts.push(part);
        }
    }
    return processedParts.join('');
}

// Helper to wait for MathJax to be loaded and ready.
function ensureMathJaxIsReady(timeout = 7000): Promise<void> {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      if (window.MathJax && window.MathJax.startup?.promise) {
        window.MathJax.startup.promise.then(() => {
          clearInterval(interval);
          resolve();
        });
      } else if (Date.now() - startTime > timeout) {
        clearInterval(interval);
        reject(new Error("MathJax failed to load in time for verification."));
      }
    }, 100);
  });
}


export async function verifyAndCorrectFlashcards(flashcards: Flashcard[]): Promise<Flashcard[]> {
    try {
        await ensureMathJaxIsReady();
    } catch (error: any) {
        const errorMsg = error.message || "MathJax script not loaded! Cannot verify flashcards.";
        console.error(errorMsg);
        alert(errorMsg);
        return flashcards;
    }

    const correctedFlashcards = await Promise.all(
        flashcards.map(async (card) => {
            const correctedQuestion = await processTextForCorrection(card.question);
            const correctedAnswer = await processTextForCorrection(card.answer);
            return { question: correctedQuestion, answer: correctedAnswer };
        })
    );
    
    return correctedFlashcards;
}