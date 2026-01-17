import { Box, Flex, Text } from "@radix-ui/themes";
import React, { useEffect } from "react";

interface ToastProps {
  message: string;
  explanation?: string;
  onClose: () => void;
  duration?: number;
}

export const Toast: React.FC<ToastProps> = ({
  message,
  explanation,
  onClose,
  duration = 5000,
}) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  return (
    <Flex direction="column" gap="2">
      <Text size="3" weight="bold" style={{ color: "white" }}>
        {message}
      </Text>
      {explanation && (
        <Text size="2" style={{ color: "white", opacity: 0.95, lineHeight: "1.5" }}>
          {explanation}
        </Text>
      )}
    </Flex>
  );
};
