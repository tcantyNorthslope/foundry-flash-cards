import {
  Badge,
  Box,
  Button,
  Card,
  Flex,
  Heading,
  Text,
} from "@radix-ui/themes";
import React, { useEffect, useMemo, useState } from "react";
import type { Question } from "../types";

interface FlashCardProps {
  question: Question;
  onAnswer: (questionId: number, selectedAnswer: number) => void;
  onNext?: () => void;
  showAnswer: boolean;
}

const categoryColors: Record<string, string> = {
  "Platform Overview": "blue",
  Ontology: "purple",
  "Pipeline Builder": "green",
  Workshop: "orange",
  AIP: "cyan",
  "Data Integration": "indigo",
  Actions: "red",
  Functions: "pink",
  Security: "amber",
  Models: "teal",
  DevOps: "lime",
  Analytics: "violet",
  "Object Storage": "bronze",
  Scenarios: "gold",
  Automation: "mint",
  "Ontology SDK": "sky",
  "Data Expectations": "plum",
  "Media Sets": "grass",
  "Workflow Management": "brown",
  "Platform Administration": "crimson",
  "Platform Versions": "iris",
  Carbon: "jade",
  Interfaces: "ruby",
  "Best Practices": "sage",
};

export const FlashCard: React.FC<FlashCardProps> = ({
  question,
  onAnswer,
  onNext,
}) => {
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [hasAnswered, setHasAnswered] = useState(false);

  // Reset state when question changes
  useEffect(() => {
    setSelectedAnswer(null);
    setHasAnswered(false);
  }, [question.id]);

  const handleSelectAnswer = (index: number) => {
    if (hasAnswered) return;
    setSelectedAnswer(index);
  };

  const handleSubmit = () => {
    if (selectedAnswer === null) return;
    setHasAnswered(true);
    onAnswer(question.id, selectedAnswer);
  };

  const handleNext = () => {
    setSelectedAnswer(null);
    setHasAnswered(false);
    onNext?.();
  };

  const isCorrect = useMemo(() => {
    return selectedAnswer !== null && selectedAnswer === question.correct_answer;
  }, [selectedAnswer, question.correct_answer]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      const currentIsCorrect = selectedAnswer !== null && selectedAnswer === question.correct_answer;

      if (!hasAnswered) {
        // Handle A, B, C, D keys to select options (only when not answered)
        if (key === "a" || key === "b" || key === "c" || key === "d") {
          const optionIndex = key.charCodeAt(0) - 97; // a=0, b=1, c=2, d=3
          if (optionIndex >= 0 && optionIndex < question.options.length) {
            event.preventDefault();
            setSelectedAnswer(optionIndex);
          }
        }

        // Handle Enter key to submit answer
        if (key === "enter" && selectedAnswer !== null) {
          event.preventDefault();
          setHasAnswered(true);
          onAnswer(question.id, selectedAnswer);
        }
      } else {
        // Handle Enter key to go to next question (when answered)
        if (key === "enter" && !currentIsCorrect) {
          event.preventDefault();
          handleNext();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [hasAnswered, selectedAnswer, question.options.length, question.id, question.correct_answer, onAnswer, handleNext]);

  const categoryColor =
    categoryColors[question.category] || "gray";

  return (
    <Card
      style={{
        width: "100%",
        maxWidth: "800px",
        margin: "0 auto",
        padding: "24px",
        minHeight: "400px",
        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
      }}
    >
      <Box
        style={{
          width: "100%",
          height: "100%",
        }}
      >
        <Flex direction="column" gap="4" style={{ height: "100%" }}>
        <Flex align="center" gap="2" wrap="wrap">
          <Badge color={categoryColor as any} size="2">
            {question.category}
          </Badge>
          <Badge variant="soft" size="1">
            {question.difficulty.charAt(0).toUpperCase() + question.difficulty.slice(1)}
          </Badge>
          {question.isLiveMode && (
            <Box
              style={{
                display: "inline-flex",
                alignItems: "center",
                padding: "2px 8px",
                borderRadius: "9999px",
                fontSize: "11px",
                fontWeight: "500",
                lineHeight: "16px",
                background: "linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)",
                color: "white",
                border: "none",
              }}
            >
              Live Mode
            </Box>
          )}
        </Flex>

        <Heading size="5" style={{ marginTop: "8px" }}>
          {question.question}
        </Heading>

        <Flex direction="column" gap="2" style={{ flex: 1 }}>
          {question.options.map((option, index) => {
            const optionLetter = String.fromCharCode(65 + index); // A, B, C, D
            let buttonVariant: "solid" | "outline" | "soft" | "surface" =
              "outline";
            let buttonColor: "blue" | "green" | "red" | "gray" = "gray";

            if (hasAnswered) {
              if (index === question.correct_answer) {
                buttonVariant = "solid";
                buttonColor = "green";
              } else if (index === selectedAnswer && !isCorrect) {
                buttonVariant = "solid";
                buttonColor = "red";
              } else {
                buttonVariant = "outline";
              }
            } else if (selectedAnswer === index) {
              buttonVariant = "soft";
              buttonColor = "blue";
            }

            return (
              <Button
                key={index}
                variant={buttonVariant}
                color={buttonColor}
                size="3"
                style={{
                  justifyContent: "flex-start",
                  textAlign: "left",
                  padding: "12px 16px",
                  minHeight: "48px",
                }}
                onClick={() => handleSelectAnswer(index)}
                disabled={hasAnswered}
              >
                <Flex align="center" gap="2" style={{ width: "100%" }}>
                  <Text
                    size="3"
                    weight="bold"
                    style={{
                      minWidth: "24px",
                      color: hasAnswered && index === question.correct_answer
                        ? "white"
                        : hasAnswered && index === selectedAnswer && !isCorrect
                        ? "white"
                        : selectedAnswer === index
                        ? "var(--accent-9)"
                        : "inherit",
                    }}
                  >
                    {optionLetter}.
                  </Text>
                  <Text size="3">{option}</Text>
                </Flex>
              </Button>
            );
          })}
        </Flex>

        {!hasAnswered ? (
          <Button
            size="3"
            onClick={handleSubmit}
            disabled={selectedAnswer === null}
            style={{ width: "100%" }}
          >
            Submit Answer
          </Button>
        ) : isCorrect ? (
          // Correct answers auto-transition, no feedback box needed
          <Box style={{ height: "48px" }} />
        ) : (
          <Flex direction="column" gap="2">
            <Box
              style={{
                padding: "12px",
                borderRadius: "6px",
                backgroundColor: "#f8d7da",
                border: "1px solid #f5c6cb",
              }}
            >
              <Text
                size="3"
                weight="medium"
                style={{ color: "#721c24", marginBottom: question.explanation ? "8px" : "0" }}
              >
                {`✗ Incorrect. The correct answer is: ${question.options[question.correct_answer]}`}
              </Text>
              {question.explanation && (
                <Text
                  size="2"
                  style={{
                    color: "#721c24",
                    marginTop: "8px",
                    display: "block",
                    lineHeight: "1.5",
                  }}
                >
                  {question.explanation}
                </Text>
              )}
            </Box>
            <Button
              size="3"
              onClick={handleNext}
              style={{ width: "100%" }}
            >
              Next Question
            </Button>
          </Flex>
        )}
        </Flex>
      </Box>
    </Card>
  );
};
