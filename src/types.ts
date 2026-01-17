export interface Question {
  id: number;
  category: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  question: string;
  options: string[];
  correct_answer: number;
  explanation?: string;
  url: string;
}

export interface QuestionsData {
  questions: Question[];
}

export interface AnswerRecord {
  questionId: number;
  selectedAnswer: number;
  isCorrect: boolean;
  timestamp: number;
}

export interface CategoryPerformance {
  category: string;
  total: number;
  correct: number;
  percentage: number;
}
