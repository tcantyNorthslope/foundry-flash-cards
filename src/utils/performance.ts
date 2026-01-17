import type { AnswerRecord, CategoryPerformance, Question } from "../types";

export function calculateCategoryPerformance(
  questions: Question[],
  answers: AnswerRecord[],
  showAllCategories: boolean = false
): CategoryPerformance[] {
  const categoryMap = new Map<string, { total: number; correct: number }>();

  // Initialize all categories from questions
  questions.forEach((q) => {
    if (!categoryMap.has(q.category)) {
      categoryMap.set(q.category, { total: 0, correct: 0 });
    }
  });

  // Count answers by category
  answers.forEach((answer) => {
    const question = questions.find((q) => q.id === answer.questionId);
    if (question) {
      const stats = categoryMap.get(question.category)!;
      stats.total++;
      if (answer.isCorrect) {
        stats.correct++;
      }
    }
  });

  // Convert to array and calculate percentages
  const performances = Array.from(categoryMap.entries())
    .map(([category, stats]) => ({
      category,
      total: stats.total,
      correct: stats.correct,
      percentage:
        stats.total > 0 ? (stats.correct / stats.total) * 100 : 0,
    }));

  // If showAllCategories is true, return all categories even with 0 answers
  if (showAllCategories) {
    return performances.sort((a, b) => {
      // Categories with answers come first, sorted by percentage (descending)
      // Categories with no answers go to the bottom, sorted alphabetically
      if (a.total === 0 && b.total === 0) {
        // Both have no answers, sort alphabetically
        return a.category.localeCompare(b.category);
      }
      if (a.total === 0) {
        // a has no answers, put it at the bottom
        return 1;
      }
      if (b.total === 0) {
        // b has no answers, put it at the bottom
        return -1;
      }
      // Both have answers, sort by percentage (descending), then by category name
      if (b.percentage !== a.percentage) {
        return b.percentage - a.percentage;
      }
      return a.category.localeCompare(b.category);
    });
  }

  // Otherwise, only show categories with answers
  return performances
    .filter((p) => p.total > 0)
    .sort((a, b) => b.percentage - a.percentage);
}
