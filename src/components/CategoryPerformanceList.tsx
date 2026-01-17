import { Box, ScrollArea } from "@radix-ui/themes";
import React from "react";
import { CategoryPerformanceCard } from "./CategoryPerformanceCard";
import type { CategoryPerformance } from "../types";

interface CategoryPerformanceListProps {
  performances: CategoryPerformance[];
}

export const CategoryPerformanceList: React.FC<
  CategoryPerformanceListProps
> = ({ performances }) => {
  return (
    <Box
      style={{
        width: "100%",
        height: "100%",
        padding: "16px",
        backgroundColor: "#fafafa",
        borderRight: "1px solid #e0e0e0",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <ScrollArea style={{ width: "100%", height: "100%", flex: 1 }}>
        {performances.length === 0 ? (
          <Box style={{ padding: "16px", textAlign: "center", color: "#666" }}>
            Answer questions to see performance by category
          </Box>
        ) : (
          performances.map((performance) => (
            <CategoryPerformanceCard
              key={performance.category}
              performance={performance}
            />
          ))
        )}
      </ScrollArea>
    </Box>
  );
};
