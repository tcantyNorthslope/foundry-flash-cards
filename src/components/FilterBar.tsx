import { Badge, Box, Flex } from "@radix-ui/themes";
import React from "react";
import type { Question } from "../types";

interface FilterBarProps {
  questions: Question[];
  selectedCategories: string[];
  selectedDifficulties: string[];
  onCategoriesChange: (categories: string[]) => void;
  onDifficultiesChange: (difficulties: string[]) => void;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  questions,
  selectedCategories,
  selectedDifficulties,
  onCategoriesChange,
  onDifficultiesChange,
}) => {
  const allCategories = React.useMemo(() => {
    const categories = new Set<string>();
    questions.forEach((q) => categories.add(q.category));
    return Array.from(categories).sort();
  }, [questions]);

  const allDifficulties = ["beginner", "intermediate", "advanced"];

  const handleCategoryToggle = (category: string) => {
    if (selectedCategories.includes(category)) {
      onCategoriesChange(selectedCategories.filter((c) => c !== category));
    } else {
      onCategoriesChange([...selectedCategories, category]);
    }
  };

  const handleDifficultyToggle = (difficulty: string) => {
    if (selectedDifficulties.includes(difficulty)) {
      onDifficultiesChange(selectedDifficulties.filter((d) => d !== difficulty));
    } else {
      onDifficultiesChange([...selectedDifficulties, difficulty]);
    }
  };

  const clearFilters = () => {
    onCategoriesChange([]);
    onDifficultiesChange([]);
  };

  const hasActiveFilters = selectedCategories.length > 0 || selectedDifficulties.length > 0;

  return (
    <Box
      style={{
        width: "100%",
        backgroundColor: "#f5f5f5",
        padding: "12px 16px",
        borderBottom: "1px solid #e0e0e0",
      }}
    >
      <Flex align="center" style={{ gap: "10px" }} wrap="wrap">
        {/* Category filters - green */}
        {allCategories.map((category) => (
          <Badge
            key={category}
            variant={selectedCategories.includes(category) ? "solid" : "soft"}
            color="green"
            style={{ cursor: "pointer" }}
            onClick={() => handleCategoryToggle(category)}
          >
            {category}
          </Badge>
        ))}
        
        {/* Difficulty filters - blue (always after categories) */}
        {allDifficulties.map((difficulty) => (
          <Badge
            key={difficulty}
            variant={selectedDifficulties.includes(difficulty) ? "solid" : "soft"}
            color="blue"
            style={{ cursor: "pointer", textTransform: "capitalize" }}
            onClick={() => handleDifficultyToggle(difficulty)}
          >
            {difficulty}
          </Badge>
        ))}
        
        {/* Clear Filters button */}
        {hasActiveFilters && (
          <Badge
            variant="outline"
            color="gray"
            style={{ cursor: "pointer", marginLeft: "auto" }}
            onClick={clearFilters}
          >
            Clear Filters
          </Badge>
        )}
      </Flex>
    </Box>
  );
};
