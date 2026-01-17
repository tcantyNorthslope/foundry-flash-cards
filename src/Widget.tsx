import {
  Box,
  Flex,
  Grid,
} from "@radix-ui/themes";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { CategoryPerformanceList } from "./components/CategoryPerformanceList";
import { FilterBar } from "./components/FilterBar";
import { FlashCard } from "./components/FlashCard";
import { Header } from "./components/Header";
import { Toast } from "./components/Toast";
import { loadQuestions } from "./dataLoader";
import { useWidgetContext } from "./context.js";
import type { AnswerRecord, Question } from "./types";
import { calculateCategoryPerformance } from "./utils/performance";

export const Widget: React.FC = () => {
  const { parameters } = useWidgetContext();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<AnswerRecord[]>([]);
  const [liveMode, setLiveMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState<{
    message: string;
    explanation?: string;
  } | null>(null);
  const [toastExiting, setToastExiting] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedDifficulties, setSelectedDifficulties] = useState<string[]>([]);

  // Load questions on mount
  useEffect(() => {
    loadQuestions()
      .then((loadedQuestions) => {
        // Shuffle questions for variety
        const shuffled = [...loadedQuestions].sort(() => Math.random() - 0.5);
        setQuestions(shuffled);
        setIsLoading(false);
      })
      .catch((error) => {
        console.error("Failed to load questions:", error);
        setIsLoading(false);
      });
  }, []);

  // Filter questions based on selected filters
  const filteredQuestions = useMemo(() => {
    return questions.filter((q) => {
      const categoryMatch =
        selectedCategories.length === 0 || selectedCategories.includes(q.category);
      const difficultyMatch =
        selectedDifficulties.length === 0 || selectedDifficulties.includes(q.difficulty);
      return categoryMatch && difficultyMatch;
    });
  }, [questions, selectedCategories, selectedDifficulties]);

  // Get current question from filtered questions
  const currentQuestion = useMemo(() => {
    if (filteredQuestions.length === 0) return null;
    return filteredQuestions[currentQuestionIndex % filteredQuestions.length];
  }, [filteredQuestions, currentQuestionIndex]);

  // Calculate category performance (using filtered questions to show only active categories)
  const categoryPerformance = useMemo(() => {
    return calculateCategoryPerformance(filteredQuestions, answers, true);
  }, [filteredQuestions, answers]);

  // Reset question index when filters change
  useEffect(() => {
    setCurrentQuestionIndex(0);
  }, [selectedCategories, selectedDifficulties]);

  // Handle answer submission
  const handleAnswer = useCallback(
    (questionId: number, selectedAnswer: number) => {
      const question = questions.find((q) => q.id === questionId);
      if (!question) return;

      const isCorrect = selectedAnswer === question.correct_answer;
      const newAnswer: AnswerRecord = {
        questionId,
        selectedAnswer,
        isCorrect,
        timestamp: Date.now(),
      };

      setAnswers((prev) => {
        // In live mode, update immediately; otherwise just add to history
        const existingIndex = prev.findIndex((a) => a.questionId === questionId);
        if (existingIndex >= 0) {
          // Update existing answer
          const updated = [...prev];
          updated[existingIndex] = newAnswer;
          return updated;
        }
        return [...prev, newAnswer];
      });

      // Show toast for correct answers and auto-advance
      if (isCorrect) {
        setToastExiting(false);
        setToast({
          message: "✓ Correct!",
          explanation: question.explanation,
        });
        // Auto-advance to next question immediately
        if (filteredQuestions.length > 0) {
          setCurrentQuestionIndex((prev) => (prev + 1) % filteredQuestions.length);
        }
      }
    },
    [questions, liveMode, filteredQuestions.length]
  );

  // Handle next question (called from FlashCard when user clicks "Next")
  const handleNextQuestion = useCallback(() => {
    if (filteredQuestions.length > 0) {
      setCurrentQuestionIndex((prev) => (prev + 1) % filteredQuestions.length);
    }
  }, [filteredQuestions.length]);

  const handleToastClose = useCallback(() => {
    setToastExiting(true);
    setTimeout(() => {
      setToast(null);
      setToastExiting(false);
    }, 300); // Match animation duration
  }, []);

  if (isLoading) {
    return (
      <Box
        p="4"
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Flex align="center" justify="center">
          Loading questions...
        </Flex>
      </Box>
    );
  }

  if (questions.length === 0) {
    return (
      <Box
        p="4"
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Flex align="center" justify="center">
          No questions available. Please check the data file.
        </Flex>
      </Box>
    );
  }

  // Check if filtered questions exist (but show filters even if no matches)
  const hasFilteredQuestions = filteredQuestions.length > 0;

  return (
    <Box
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      {toast && (
        <Box
          className={toastExiting ? "toast-exit" : "toast-enter"}
          style={{
            position: "fixed",
            top: "20px",
            right: "20px",
            zIndex: 1000,
            minWidth: "300px",
            maxWidth: "500px",
            backgroundColor: "#10b981",
            color: "white",
            padding: "16px",
            borderRadius: "8px",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
          }}
        >
          <Toast
            message={toast.message}
            explanation={toast.explanation}
            onClose={handleToastClose}
          />
        </Box>
      )}
      <Header
        appName="Foundry Flash Cards"
        liveMode={liveMode}
        onLiveModeChange={setLiveMode}
      />
      <FilterBar
        questions={questions}
        selectedCategories={selectedCategories}
        selectedDifficulties={selectedDifficulties}
        onCategoriesChange={setSelectedCategories}
        onDifficultiesChange={setSelectedDifficulties}
      />
      <Grid
        columns="2"
        style={{
          flex: 1,
          overflow: "hidden",
          minHeight: 0,
          width: "100%",
          height: "100%",
          display: "grid",
          gridTemplateColumns: "minmax(300px, 400px) 1fr",
        }}
      >
        {/* Left Column: Category Performance */}
        <Box
          style={{
            minWidth: "300px",
            maxWidth: "400px",
            height: "100%",
            overflow: "hidden",
          }}
        >
          <CategoryPerformanceList performances={categoryPerformance} />
        </Box>

        {/* Right Column: Flash Card Display */}
        <Box
          style={{
            width: "100%",
            height: "100%",
            padding: "24px",
            overflow: "auto",
            backgroundColor: "#ffffff",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            minHeight: 0,
            minWidth: 0,
            gridColumn: "2",
          }}
        >
          {hasFilteredQuestions && currentQuestion ? (
            <Box
              style={{
                width: "100%",
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <FlashCard
                key={currentQuestion.id}
                question={currentQuestion}
                onAnswer={handleAnswer}
                onNext={handleNextQuestion}
                showAnswer={true}
              />
            </Box>
          ) : (
            <Box
              style={{
                width: "100%",
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "24px",
              }}
            >
              <Text size="3" style={{ color: "#666", textAlign: "center" }}>
                No questions match the selected filters. Please adjust your filters.
              </Text>
            </Box>
          )}
        </Box>
      </Grid>
    </Box>
  );
};
