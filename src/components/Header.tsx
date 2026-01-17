import { Box, Flex, Heading, Switch, Text } from "@radix-ui/themes";
import React from "react";

interface HeaderProps {
  appName: string;
  liveMode: boolean;
  onLiveModeChange: (enabled: boolean) => void;
}

export const Header: React.FC<HeaderProps> = ({
  appName,
  liveMode,
  onLiveModeChange,
}) => {
  return (
    <Box
      style={{
        width: "100%",
        backgroundColor: "#2d2d2d",
        padding: "12px 16px",
        borderBottom: "1px solid #404040",
        flexShrink: 0,
      }}
    >
      <Flex align="center" justify="between">
        <Heading size="4" style={{ color: "white", margin: 0 }}>
          {appName}
        </Heading>
        <Flex align="center" gap="2">
          <Text size="2" style={{ color: "white" }}>
            Live Mode
          </Text>
          <Switch
            checked={liveMode}
            onCheckedChange={onLiveModeChange}
            size="2"
          />
        </Flex>
      </Flex>
    </Box>
  );
};
