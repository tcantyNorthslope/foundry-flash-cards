import { Box, Card, Flex, Progress, Text } from "@radix-ui/themes";
import React from "react";
import type { CategoryPerformance } from "../types";

interface CategoryPerformanceCardProps {
  performance: CategoryPerformance;
}

export const CategoryPerformanceCard: React.FC<
  CategoryPerformanceCardProps
> = ({ performance }) => {
  const getColor = (percentage: number) => {
    if (percentage >= 80) return "green";
    if (percentage >= 60) return "yellow";
    return "red";
  };

  const hasNoAnswers = performance.total === 0;
  const opacity = hasNoAnswers ? 0.5 : 1;

  return (
    <Card style={{ marginBottom: "12px", opacity }}>
      <Flex direction="column" gap="2">
        <Flex justify="between" align="center">
          <Text size="3" weight="medium" style={{ opacity }}>
            {performance.category}
          </Text>
          <Text size="2" style={{ color: "#666", opacity }}>
            {performance.correct}/{performance.total}
          </Text>
        </Flex>
        <Progress
          value={performance.percentage}
          color={getColor(performance.percentage)}
          size="2"
          style={{ opacity }}
        />
        <Text size="2" style={{ color: "#666", opacity }}>
          {Math.round(performance.percentage)}% correct
        </Text>
      </Flex>
    </Card>
  );
};
