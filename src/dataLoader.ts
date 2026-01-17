import type { Question, QuestionsData } from "./types";

// Load questions data - using dynamic import for Vite
let questionsCache: Question[] | null = null;

export async function loadQuestions(): Promise<Question[]> {
  if (questionsCache) {
    return questionsCache;
  }

  try {
    // Vite will handle the ?raw import
    const module = await import("./data.txt?raw");
    const data: QuestionsData = JSON.parse(module.default);
    questionsCache = data.questions;
    return questionsCache;
  } catch (error) {
    console.error("Error loading questions:", error);
    return [];
  }
}

export function getCategories(questions: Question[]): string[] {
  const categories = new Set<string>();
  questions.forEach((q) => categories.add(q.category));
  return Array.from(categories).sort();
}
