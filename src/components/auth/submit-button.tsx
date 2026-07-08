"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";

import { Button } from "@/components/ui/button";

type SubmitButtonProps = {
  children: React.ReactNode;
  pendingText: string;
};

export function SubmitButton({ children, pendingText }: SubmitButtonProps) {
  const { pending } = useFormStatus();
  const [submitted, setSubmitted] = useState(false);
  const isSubmitting = pending || submitted;

  return (
    <Button
      className="w-full"
      disabled={isSubmitting}
      onClick={(event) => {
        const form = event.currentTarget.form;

        if (form?.checkValidity()) {
          window.setTimeout(() => setSubmitted(true), 0);
        }
      }}
      type="submit"
    >
      {isSubmitting ? pendingText : children}
    </Button>
  );
}
