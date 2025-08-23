
import { GoogleGenAI, Type } from "@google/genai";
import { LearningResource, Priority, Task, Flashcard } from '../types';

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  // A more user-friendly error could be shown in the UI
  throw new Error("API_KEY environment variable not set.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

async function fileToGenerativePart(file: File): Promise<{ mimeType: string, data: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
        const result = reader.result as string;
        const parts = result.split(';base64,');
        if (parts.length !== 2) {
            return reject(new Error('Malformed data URL.'));
        }
        const mimeType = parts[0].split(':')[1];
        const data = parts[1];
        resolve({ mimeType, data });
    };
    reader.onerror = error => reject(error);
  });
}

export async function getFirstStepForTask(taskTitle: string): Promise<string> {
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `The user is struggling with procrastination on the following task: "${taskTitle}". Generate a single, concrete, and extremely easy first step to help them get started. This step should take less than 5 minutes to complete. The response should be a single sentence. For example: "Open your textbook to page 54 and read the first paragraph." or "Create a new blank document and title it 'Essay Outline'."`,
        });
        return response.text.trim();
    } catch (error) {
        console.error("Error calling Gemini API for first step generation:", error);
        throw new Error("Failed to generate a first step from AI.");
    }
}


export async function breakdownTaskIntoSubtasks(topic: string): Promise<string[]> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Break down the study topic "${topic}" into smaller, actionable sub-tasks. Each sub-task should be a concise to-do item.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            subtasks: {
              type: Type.ARRAY,
              items: {
                type: Type.STRING,
                description: 'A single, concise study sub-task.',
              },
            },
          },
          required: ["subtasks"],
        },
      },
    });

    const jsonText = response.text.trim();
    const result = JSON.parse(jsonText);
    
    if (result && Array.isArray(result.subtasks)) {
      return result.subtasks;
    } else {
      console.error("Unexpected JSON structure:", result);
      return ["Failed to parse subtasks from AI response."];
    }

  } catch (error) {
    console.error("Error calling Gemini API for task breakdown:", error);
    throw new Error("Failed to generate sub-tasks from AI.");
  }
}

export async function getLearningTipsForTopic(topic: string): Promise<string> {
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `As a learning science expert, provide three actionable learning optimization tips for the topic: "${topic}". Focus on techniques like active recall, spaced repetition, or the Feynman technique. Format the response as a markdown bulleted list.`,
            config: {
                temperature: 0.7,
            },
        });

        return response.text;
    } catch (error) {
        console.error("Error calling Gemini API for learning tips:", error);
        throw new Error("Failed to get learning tips from AI.");
    }
}

export async function generateStudySprint(resources: Omit<LearningResource, 'id'>[], days: number): Promise<Omit<Task, 'id' | 'status'>[]> {
  try {
    const fileParts = await Promise.all(
        resources.map(async (resource) => {
            const part = await fileToGenerativePart(resource.file);
            return [
                { text: `Input File: ${resource.file.name} (Category: ${resource.type})` },
                { inlineData: part }
            ];
        })
    ).then(parts => parts.flat());
    
    const prompt = `You are an expert academic coach. Your task is to create a detailed study sprint plan based on the provided learning materials.
The user has ${days} days until their exam.
The provided files are categorized as 'Learning Material' (theory), 'Course Exercises' (practice), and 'Old Test'.

Please generate a study plan with the following structure:
1. For each major topic found in the learning materials, create a sequence of tasks:
   a. A task for a 'Quick Recap' of the theory from the 'Learning Material' files.
   b. A task for solving a few 'Core Exercises' from the 'Course Exercises' files to grasp the main ideas.
   c. A task for practicing with 'Real Test Questions' from older 'Old Test' files related to that topic.
2. After all topics are covered, schedule the remaining days for solving full tests.
   a. Prioritize using newer tests (if discernable from filename or content) for the final days.
   b. Schedule 1-2 full tests per day.
   c. Use older tests for topic-specific practice if needed.
3. For each task, provide a title, a short description, an estimated time in minutes, a priority level, and the suggested day number (from 1 to ${days}).

Analyze the provided files to identify topics, exercises, and test questions. Create a list of tasks in JSON format.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: { parts: [{text: prompt}, ...fileParts] },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            tasks: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  description: { type: Type.STRING },
                  estimatedTime: { type: Type.NUMBER, description: 'Estimated time in minutes' },
                  priority: { type: Type.STRING, enum: Object.values(Priority) },
                  day: { type: Type.NUMBER, description: `Suggested day in the sprint (1-${days}) to perform the task` }
                },
                required: ['title', 'description', 'estimatedTime', 'priority', 'day']
              }
            }
          },
          required: ['tasks']
        },
      },
    });

    const jsonText = response.text.trim();
    const result = JSON.parse(jsonText);

    if (result && Array.isArray(result.tasks)) {
      return result.tasks;
    } else {
      console.error("Unexpected JSON structure from Gemini for sprint plan:", result);
      return [];
    }

  } catch (error) {
    console.error("Error calling Gemini API for study sprint generation:", error);
    throw new Error("Failed to generate study sprint from AI.");
  }
}

export async function generateFlashcards(files: File[], prompt: string): Promise<Flashcard[]> {
    try {
        const fileParts = await Promise.all(
            files.map(async (file) => {
                const part = await fileToGenerativePart(file);
                return [
                    { text: `Input File: ${file.name}` },
                    { inlineData: part }
                ];
            })
        ).then(parts => parts.flat());

        const fullPrompt = `Based on the provided study materials and the user's focus, generate a set of flashcards. Each flashcard should have a clear 'question' on one side and a concise 'answer' on the other.
        User's focus: "${prompt}"
        
        Generate the flashcards in a structured JSON format.`;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: { parts: [{text: fullPrompt}, ...fileParts] },
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        flashcards: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    question: { type: Type.STRING },
                                    answer: { type: Type.STRING }
                                },
                                required: ['question', 'answer']
                            }
                        }
                    },
                    required: ['flashcards']
                },
            },
        });

        const jsonText = response.text.trim();
        const result = JSON.parse(jsonText);

        if (result && Array.isArray(result.flashcards)) {
            return result.flashcards;
        } else {
            console.error("Unexpected JSON structure from Gemini for flashcards:", result);
            return [];
        }

    } catch (error) {
        console.error("Error calling Gemini API for flashcard generation:", error);
        throw new Error("Failed to generate flashcards from AI.");
    }
}
