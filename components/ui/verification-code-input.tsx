"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

interface VerificationCodeInputProps {
  length?: number;
  value: string;
  onChange: (value: string) => void;
  onComplete?: (value: string) => void;
  disabled?: boolean;
  error?: boolean;
  className?: string;
}

export function VerificationCodeInput({
  length = 6,
  value,
  onChange,
  onComplete,
  disabled = false,
  error = false,
  className,
}: VerificationCodeInputProps) {
  const inputRefs = React.useRef<(HTMLInputElement | null)[]>([]);

  // Split value into array of digits
  const digits = React.useMemo(() => {
    const arr = value.split("").slice(0, length);
    // Pad with empty strings
    while (arr.length < length) {
      arr.push("");
    }
    return arr;
  }, [value, length]);

  const focusInput = (index: number) => {
    const nextIndex = Math.min(Math.max(0, index), length - 1);
    inputRefs.current[nextIndex]?.focus();
  };

  const handleChange = (index: number, digit: string) => {
    // Only allow digits
    if (digit && !/^\d$/.test(digit)) return;

    const newDigits = [...digits];
    newDigits[index] = digit;
    const newValue = newDigits.join("");
    
    onChange(newValue);

    // Move to next input if digit entered
    if (digit && index < length - 1) {
      focusInput(index + 1);
    }

    // Only call onComplete if all digits are filled with valid digits
    // Use a small delay to ensure state is synchronized
    if (digit && newValue.length === length && /^\d{6}$/.test(newValue) && onComplete) {
      // Delay to prevent premature submission during fast typing
      setTimeout(() => {
        onComplete(newValue);
      }, 100);
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      if (digits[index]) {
        // Clear current digit
        handleChange(index, "");
      } else if (index > 0) {
        // Move to previous input
        focusInput(index - 1);
        handleChange(index - 1, "");
      }
      e.preventDefault();
    } else if (e.key === "ArrowLeft" && index > 0) {
      focusInput(index - 1);
      e.preventDefault();
    } else if (e.key === "ArrowRight" && index < length - 1) {
      focusInput(index + 1);
      e.preventDefault();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, length);
    if (pastedData) {
      onChange(pastedData);
      focusInput(Math.min(pastedData.length, length - 1));
      if (pastedData.length === length && onComplete) {
        onComplete(pastedData);
      }
    }
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.select();
  };

  return (
    <div 
      className={cn(
        "flex justify-center gap-2 sm:gap-3",
        className
      )}
    >
      {digits.map((digit, index) => (
        <Input
          key={index}
          ref={(el) => {
            inputRefs.current[index] = el;
          }}
          type="text"
          inputMode="numeric"
          pattern="\d*"
          maxLength={1}
          value={digit}
          onChange={(e) => handleChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={handlePaste}
          onFocus={handleFocus}
          disabled={disabled}
          className={cn(
            "w-10 h-12 sm:w-12 sm:h-14 text-center text-xl sm:text-2xl font-semibold",
            "focus:ring-2 focus:ring-primary focus:border-primary",
            error && "border-destructive focus:ring-destructive",
            disabled && "opacity-50 cursor-not-allowed"
          )}
          aria-label={`Digit ${index + 1}`}
        />
      ))}
    </div>
  );
}

