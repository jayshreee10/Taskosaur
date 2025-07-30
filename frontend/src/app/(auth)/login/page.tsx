'use client';

import { LoginContent } from "@/components/login/LoginContent";
import { LoginForm } from "@/components/login/LoginForm";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex bg-[var(--background)]">
      <div className="lg:w-1/2 relative">
        <LoginContent />
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md">
          <LoginForm />
        </div>
      </div>
    </div>
  );
}