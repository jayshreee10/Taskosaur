import React from "react";
import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { HiClipboardDocumentList } from "react-icons/hi2";

interface ErrorStateProps {
  error: string;
  onRetry?: () => void;
}

const ErrorState: React.FC<ErrorStateProps> = ({ error, onRetry }) => (
  <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
    <Card className="max-w-md w-full mx-4 border-[var(--border)]">
      <CardContent className="p-8 text-center">
        <div className="w-16 h-16 bg-[var(--destructive)]/10 rounded-lg flex items-center justify-center mx-auto mb-6 text-[var(--destructive)]">
          <HiClipboardDocumentList size={24} />
        </div>
        <CardTitle className="text-lg font-semibold text-[var(--foreground)] mb-2">
          Something went wrong
        </CardTitle>
        <CardDescription className="text-sm text-[var(--muted-foreground)] mb-6">
          {error}
        </CardDescription>
        <Button onClick={onRetry} variant="outline">
          Try Again
        </Button>
      </CardContent>
    </Card>
  </div>
);

export default ErrorState;
