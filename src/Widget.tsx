import {
  Box,
  Flex,
  Grid,
  Spinner,
  Text,
} from "@radix-ui/themes";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CategoryPerformanceList } from "./components/CategoryPerformanceList";
import { FilterBar } from "./components/FilterBar";
import { FlashCard } from "./components/FlashCard";
import { Header } from "./components/Header";
import { Toast } from "./components/Toast";
import { loadQuestions } from "./dataLoader";
import type { AnswerRecord, Question } from "./types";
import { calculateCategoryPerformance } from "./utils/performance";
import PROMPT from "./prompt";
import { client } from "./client";
import { generateFoundryQuestions } from "@custom-widget/sdk";

export const Widget: React.FC = () => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<AnswerRecord[]>([]);
  const [liveMode, setLiveMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState<{
    message: string;
    explanation?: string;
    url?: string;
  } | null>(null);
  const [toastExiting, setToastExiting] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedDifficulties, setSelectedDifficulties] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const nextQuestionIdRef = useRef<number>(1);
  const generationAbortRef = useRef<AbortController | null>(null);
  const isGeneratingRef = useRef<boolean>(false);
  const shouldSwitchToLiveQuestionRef = useRef<boolean>(false);

  // Load questions on mount (only if not in live mode)
  useEffect(() => {
    if (!liveMode) {
      loadQuestions()
        .then((loadedQuestions) => {
          // Shuffle questions for variety
          const shuffled = [...loadedQuestions].sort(() => Math.random() - 0.5);
          setQuestions(shuffled);
          setIsLoading(false);
          // Set next question ID based on loaded questions
          if (loadedQuestions.length > 0) {
            nextQuestionIdRef.current = Math.max(...loadedQuestions.map((q) => q.id)) + 1;
          }
        })
        .catch((error) => {
          console.error("Failed to load questions:", error);
          setIsLoading(false);
        });
    } else {
      // In live mode, keep existing questions visible, just set loading to false
      setIsLoading(false);
    }
  }, [liveMode]);

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

  // Switch to first live question when they're generated after toggling to live mode
  useEffect(() => {
    if (shouldSwitchToLiveQuestionRef.current && filteredQuestions.length > 0) {
      const firstLiveIndex = filteredQuestions.findIndex(q => q.isLiveMode);
      if (firstLiveIndex >= 0) {
        setCurrentQuestionIndex(firstLiveIndex);
        shouldSwitchToLiveQuestionRef.current = false;
      }
    }
  }, [filteredQuestions]);

  // Generate questions in live mode
  useEffect(() => {
    if (!liveMode) {
      // Cancel any ongoing generation when live mode is turned off
      if (generationAbortRef.current) {
        generationAbortRef.current.abort();
        generationAbortRef.current = null;
      }
      isGeneratingRef.current = false;
      setIsGenerating(false);
      setGenerationError(null);
      return;
    }

    // When toggling to live mode, if we already have questions, don't generate immediately
    // Only generate if we have no questions or need more

    // Function to generate a batch of 10 questions
    const generateBatch = async () => {
      // Cancel previous generation if still running
      if (generationAbortRef.current) {
        generationAbortRef.current.abort();
      }

      const abortController = new AbortController();
      generationAbortRef.current = abortController;
      isGeneratingRef.current = true;
      setIsGenerating(true);
      setGenerationError(null);

      try {
        // Build prompt with category and difficulty filters if selected
        let promptText = PROMPT;
        if (selectedCategories.length > 0 || selectedDifficulties.length > 0) {
          const categoryText =
            selectedCategories.length > 0
              ? `focused on these categories: ${selectedCategories.join(", ")}`
              : "";
          const difficultyText =
            selectedDifficulties.length > 0
              ? `with difficulty levels: ${selectedDifficulties.join(", ")}`
              : "";
          const filterText = [categoryText, difficultyText].filter(Boolean).join(" and ");
          if (filterText) {
            promptText = PROMPT.replace(
              "Generate exactly 10 multiple-choice questions from Palantir Foundry documentation.",
              `Generate exactly 10 multiple-choice questions from Palantir Foundry documentation ${filterText}.`
            );
          }
        }

        const response = await client(generateFoundryQuestions).executeFunction({
          prompt: promptText,
        });

        // Check if generation was aborted
        if (abortController.signal.aborted) {
          return;
        }

        // Process the response - it's already a structured object
        let generatedQuestions: Question[] = [];
        try {
          if (response.questions && Array.isArray(response.questions)) {
            generatedQuestions = response.questions.map((q: {
              id: number;
              question: string;
              options: string[];
              correct_answer: string;
              explanation: string;
              category?: string;
              url?: string;
            }) => {
              // Convert correct_answer from letter to index
              // correct_answer is a string (letter format: "A", "B", "C", or "D")
              const letter = q.correct_answer.toUpperCase().trim();
              const correctAnswerIndex = letter.charCodeAt(0) - 65; // A=0, B=1, C=2, D=3

              // Ensure options array is properly formatted
              let options = q.options;
              if (!Array.isArray(options)) {
                options = [];
              }

              // Map options to remove letter prefixes if present
              options = options.map((opt: string) => {
                // Remove "A) ", "B) ", etc. if present
                return opt.replace(/^[A-D]\)\s*/, "");
              });

              return {
                id: nextQuestionIdRef.current++,
                category: q.category || "General",
                difficulty: "intermediate" as const, // Default difficulty since not in response
                question: q.question || "",
                options: options,
                correct_answer: correctAnswerIndex,
                explanation: q.explanation || "",
                url: q.url || "", // Extract URL from response if available
                isLiveMode: true, // Mark as live mode question
              };
            });
          }
        } catch (parseError) {
          console.error("Failed to process generated questions:", parseError);
          throw new Error("Failed to process generated questions. Please try again.");
        }

        // Check if generation was aborted before updating state
        if (abortController.signal.aborted) {
          return;
        }

        // Add generated questions to the questions array
        setQuestions((prev) => {
          // Shuffle and add new questions
          const shuffled = [...generatedQuestions].sort(() => Math.random() - 0.5);
          const newQuestions = [...prev, ...shuffled];
          
          // If we just toggled to live mode and these are the first live questions
          // (previous questions don't have isLiveMode), mark that we should switch to a live question
          if (prev.length > 0 && prev.every(q => !q.isLiveMode) && shuffled.length > 0) {
            shouldSwitchToLiveQuestionRef.current = true;
          } else if (prev.length === 0) {
            // If this is the first batch (no previous questions), reset to show first question
            setCurrentQuestionIndex(0);
          }
          
          return newQuestions;
        });

        isGeneratingRef.current = false;
        setIsGenerating(false);
      } catch (error: any) {
        // Check if error is due to abort
        if (abortController.signal.aborted) {
          return;
        }

        console.error("Failed to generate questions:", error);
        setGenerationError(
          error?.message || "Failed to generate questions. Please try again."
        );
        isGeneratingRef.current = false;
        setIsGenerating(false);
      } finally {
        if (generationAbortRef.current === abortController) {
          generationAbortRef.current = null;
        }
      }
    };

    // Generate initial batch when live mode is enabled
    // Always generate a new batch when toggling to live mode to show live-generated questions
    // Also generate when filters change and we have no matching questions
    if (questions.length === 0) {
      nextQuestionIdRef.current = 1;
      generateBatch();
    } else {
      // Check if we need to generate based on filtered questions
      const hasMatchingQuestions = questions.some((q) => {
        const categoryMatch =
          selectedCategories.length === 0 || selectedCategories.includes(q.category);
        const difficultyMatch =
          selectedDifficulties.length === 0 || selectedDifficulties.includes(q.difficulty);
        return categoryMatch && difficultyMatch;
      });

      // Generate if we have questions but none match the current filters, or if we just toggled to live mode
      if (!isGeneratingRef.current && (!hasMatchingQuestions || !questions.some(q => q.isLiveMode))) {
        generateBatch();
      }
    }

    // Set up interval to generate new batches when questions run low
    const intervalId = setInterval(() => {
      // Generate new batch if we have fewer than 20 questions remaining and not currently generating
      if (!isGeneratingRef.current) {
        setQuestions((prev) => {
          if (prev.length < 20) {
            generateBatch();
          }
          return prev;
        });
      }
    }, 10000); // Check every 10 seconds

    return () => {
      clearInterval(intervalId);
      if (generationAbortRef.current) {
        generationAbortRef.current.abort();
        generationAbortRef.current = null;
      }
    };
  }, [liveMode, selectedCategories, selectedDifficulties]);

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
          url: question.url,
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

  // Only show full-screen loading for initial load when NOT in live mode
  if (isLoading && !liveMode) {
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

  // Only show "No questions available" if not in live mode and no questions loaded
  if (questions.length === 0 && !liveMode && !isLoading) {
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
            url={toast.url}
            onClose={handleToastClose}
          />
        </Box>
      )}
      <Header
        appName="Foundry Flash Cards"
        liveMode={liveMode}
        onLiveModeChange={setLiveMode}
      />
      {generationError && liveMode && (
        <Box
          style={{
            width: "100%",
            padding: "8px 16px",
            backgroundColor: "#fef2f2",
            borderBottom: "1px solid #fecaca",
            textAlign: "center",
          }}
        >
          <Text size="2" style={{ color: "#dc2626" }}>
            {generationError}
          </Text>
        </Box>
      )}
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
          {/* Show loading state when generating live questions and we don't have any live questions yet */}
          {liveMode && isGenerating && !questions.some(q => q.isLiveMode) ? (
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
              <Flex align="center" justify="center" direction="column" gap="4">
                <Spinner size="3" />
                <Flex direction="column" align="center" gap="2">
                  <Text size="4" style={{ color: "#666", textAlign: "center" }}>
                    Generating questions...
                  </Text>
                  <Text size="2" style={{ color: "#999", textAlign: "center" }}>
                    Please wait while we generate your first batch of questions.
                  </Text>
                </Flex>
              </Flex>
            </Box>
          ) : hasFilteredQuestions && currentQuestion ? (
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
              {liveMode ? (
                <Flex align="center" justify="center" direction="column" gap="4">
                  {isGenerating && (
                    <Spinner size="3" />
                  )}
                  <Flex direction="column" align="center" gap="2">
                    <Text size="4" style={{ color: "#666", textAlign: "center" }}>
                      No questions match the selected filters
                    </Text>
                    <Text size="2" style={{ color: "#999", textAlign: "center" }}>
                      {isGenerating
                        ? "Generating new questions..."
                        : "Waiting for questions to be generated..."}
                    </Text>
                  </Flex>
                </Flex>
              ) : (
                <Text size="3" style={{ color: "#666", textAlign: "center" }}>
                  No questions match the selected filters. Please adjust your filters.
                </Text>
              )}
            </Box>
          )}
        </Box>
      </Grid>
    </Box>
  );
};
