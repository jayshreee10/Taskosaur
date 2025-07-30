"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Mail,
  Lock,
  ArrowRight,
} from "lucide-react";
import { ModeToggle } from "../layout/ModeToggle";

interface FormData {
  email: string;
  password: string;
  rememberMe: boolean;
}

export function LoginForm() {
  const { login } = useAuth();
  const router = useRouter();
  const [formData, setFormData] = useState<FormData>({
    email: "",
    password: "",
    rememberMe: false,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const { name, value, type, checked } = e.target;
      setFormData((prev) => ({
        ...prev,
        [name]: type === "checkbox" ? checked : value,
      }));
      if (error) setError("");
    },
    [error]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      await login({ email: formData.email, password: formData.password });
      router.push("/dashboard");
    } catch (err) {
      setError("Invalid email or password. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="w-full space-y-6"
    >
      {/* Header */}
      <div className="text-center space-y-4">
        {/* Mobile Logo */}
        <div className="absolute top-0 right-0 z-10">
          <ModeToggle />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[var(--foreground)] tracking-tight">
            Welcome back
          </h1>
          <p className="text-[var(--muted-foreground)] text-sm sm:text-base lg:text-lg leading-relaxed max-w-sm mx-auto">
            Sign in to continue your productive journey
          </p>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: -10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
        >
          <Alert
            variant="destructive"
            className="border-[var(--destructive)]/30 bg-[var(--destructive)]/5 backdrop-blur-sm"
          >
            <AlertDescription className="font-medium">
              <span className="block font-semibold text-sm">
                Authentication Failed
              </span>
              <span className="text-xs opacity-90 mt-1">{error}</span>
            </AlertDescription>
          </Alert>
        </motion.div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Email Field */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="space-y-2"
        >
          <Label
            htmlFor="email"
            className="text-sm font-semibold text-[var(--foreground)] flex items-center space-x-2"
          >
            <Mail className="w-4 h-4" />
            <span>Email Address</span>
          </Label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={formData.email}
            onChange={handleChange}
            placeholder="Enter your email address"
            className="h-11 sm:h-12 px-4 bg-[var(--card)] border-[var(--border)] focus:ring-2 focus:ring-[var(--ring)] focus:border-transparent transition-all duration-200 rounded-xl shadow-sm hover:shadow-md"
          />
        </motion.div>

        {/* Password Field */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="space-y-2"
        >
          <Label
            htmlFor="password"
            className="text-sm font-semibold text-[var(--foreground)] flex items-center space-x-2"
          >
            <Lock className="w-4 h-4" />
            <span>Password</span>
          </Label>
          <div className="relative">
            <Input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              required
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter your password"
              className="h-11 sm:h-12 pl-4 pr-12 bg-[var(--card)] border-[var(--border)] focus:ring-2 focus:ring-[var(--ring)] focus:border-transparent transition-all duration-200 rounded-xl shadow-sm hover:shadow-md"
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0 hover:bg-[var(--muted)]/50 rounded-lg"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </Button>
          </div>
        </motion.div>

        {/* Options Row */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex items-center justify-between flex-wrap gap-2"
        >
          <div className="flex items-center space-x-3">
            <Checkbox
              id="rememberMe"
              name="rememberMe"
              checked={formData.rememberMe}
              onCheckedChange={(checked) =>
                setFormData((prev) => ({
                  ...prev,
                  rememberMe: Boolean(checked),
                }))
              }
              className="rounded-md"
            />
            <Label
              htmlFor="rememberMe"
              className="text-sm text-[var(--muted-foreground)] cursor-pointer hover:text-[var(--foreground)] transition-colors"
            >
              Remember me
            </Label>
          </div>
          <Link
            href="/forgot-password"
            className="text-sm font-medium text-[var(--primary)] hover:text-[var(--primary)]/80 transition-colors duration-200 hover:underline"
          >
            Forgot password?
          </Link>
        </motion.div>

        {/* Submit Button */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <Button
            type="submit"
            disabled={isLoading}
            className="w-full h-11 sm:h-12 bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-[var(--primary-foreground)] font-semibold shadow-lg hover:shadow-xl transition-all duration-200 rounded-xl group"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Signing you in...
              </>
            ) : (
              <>
                Sign In
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform duration-200" />
              </>
            )}
          </Button>
        </motion.div>
      </form>

      {/* Divider */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.5 }}
        className="relative"
      >
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-[var(--border)]" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-4 bg-[var(--background)] text-[var(--muted-foreground)] font-medium">
            New to Taskosaur?
          </span>
        </div>
      </motion.div>

      {/* Sign Up Link */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.6 }}
      >
        <Link href="/signup">
          <Button
            variant="outline"
            className="w-full h-11 sm:h-12 border-[var(--border)] hover:bg-[var(--accent)] hover:border-[var(--accent)]/50 font-semibold rounded-xl transition-all duration-200 group"
          >
            Create New Account
            <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform duration-200" />
          </Button>
        </Link>
      </motion.div>

      {/* Footer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.7 }}
        className="text-center"
      >
        <p className="text-xs text-[var(--muted-foreground)] leading-relaxed max-w-xs mx-auto">
          By signing in, you agree to our{" "}
          <Link
            href="/terms"
            className="text-[var(--primary)] hover:text-[var(--primary)]/80 hover:underline font-medium"
          >
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link
            href="/privacy"
            className="text-[var(--primary)] hover:text-[var(--primary)]/80 hover:underline font-medium"
          >
            Privacy Policy
          </Link>
        </p>
      </motion.div>
    </motion.div>
  );
}
