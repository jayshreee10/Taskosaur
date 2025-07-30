'use client';

import { SignupContent } from "@/components/signup/SignupContent";
import { SignupForm } from "@/components/signup/SignupForm";


export default function SignUpPage() {
  return (
    <div className="min-h-screen flex bg-[var(--background)]">
      {/* Left Content Section - Exactly 50% */}
      <div className="hidden lg:block lg:w-1/2 relative">
        <SignupContent />
      </div>
      
      {/* Right Form Section - Exactly 50% */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md">
          <SignupForm />
        </div>
      </div>
    </div>
  );
}
