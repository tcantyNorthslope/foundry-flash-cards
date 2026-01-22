import { Flex, Text } from "@radix-ui/themes";
import { CopyIcon, CheckIcon } from "@radix-ui/react-icons";
import React, { useEffect, useState } from "react";

interface ToastProps {
  message: string;
  explanation?: string;
  url?: string;
  onClose: () => void;
  duration?: number;
}

export const Toast: React.FC<ToastProps> = ({
  message,
  explanation,
  url,
  onClose,
  duration = 5000,
}) => {
  const [urlCopied, setUrlCopied] = useState(false);

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
      <Flex
        align="center"
        gap="2"
        style={{
          marginTop: "8px",
          cursor: url ? "pointer" : "not-allowed",
          display: "inline-flex",
          opacity: url ? 1 : 0.5,
        }}
        onClick={async (e) => {
          e.stopPropagation();
          if (!url) return;
          try {
            await navigator.clipboard.writeText(url);
            setUrlCopied(true);
            setTimeout(() => setUrlCopied(false), 2000);
          } catch (err) {
            console.error("Failed to copy URL:", err);
          }
        }}
      >
        {urlCopied ? (
          <>
            <Text size="2" style={{ color: "white" }}>
              Copied!
            </Text>
            <CheckIcon width="14" height="14" />
          </>
        ) : (
          <>
            <Text size="2" style={{ color: "white", textDecoration: url ? "underline" : "none" }}>
              Documentation
            </Text>
            <CopyIcon width="14" height="14" />
          </>
        )}
      </Flex>
    </Flex>
  );
};
