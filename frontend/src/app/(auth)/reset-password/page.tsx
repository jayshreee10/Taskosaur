'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { HiEye, HiEyeSlash, HiExclamationCircle, HiCheckCircle } from 'react-icons/hi2';
import { validateResetToken, resetPassword, ResetPasswordData } from '@/utils/apiUtils';
import { LoginContent } from "@/components/login/LoginContent";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isValidToken, setIsValidToken] = useState(true);

  // Password validation helpers
  const isPasswordLongEnough = formData.password.length >= 8;
  const hasUpperCase = /[A-Z]/.test(formData.password);
  const hasLowerCase = /[a-z]/.test(formData.password);
  const hasNumber = /\d/.test(formData.password);
  const passwordsMatch = formData.password === formData.confirmPassword && formData.confirmPassword.length > 0;
  const isPasswordValid = isPasswordLongEnough && hasUpperCase && hasLowerCase && hasNumber;

  useEffect(() => {
    // Validate token on component mount
    const checkToken = async () => {
      if (!token) {
        setIsValidToken(false);
        setError('Invalid or missing reset token');
        return;
      }

      try {
        const response = await validateResetToken(token);
        if (response.success && response.data?.valid) {
          setIsValidToken(true);
        } else {
          setIsValidToken(false);
          setError(response.message || 'Invalid or expired reset token');
        }
      } catch (err: any) {
        setIsValidToken(false);
        setError(err.message || 'Failed to validate reset token');
      }
    };

    checkToken();
  }, [token]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    if (error) setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    if (!isPasswordValid) {
      setError('Password must meet all requirements');
      setIsLoading(false);
      return;
    }

    if (!passwordsMatch) {
      setError('Passwords do not match');
      setIsLoading(false);
      return;
    }

    if (!token) {
      setError('Invalid reset token');
      setIsLoading(false);
      return;
    }

    try {
      const resetData: ResetPasswordData = {
        token,
        password: formData.password,
        confirmPassword: formData.confirmPassword,
      };

      const response = await resetPassword(resetData);
      
      if (response.success) {
        setIsSuccess(true);
      } else {
        setError(response.message || 'Failed to reset password. Please try again.');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to reset password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isValidToken) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-full max-w-md mx-auto"
      >
        {/* Header Section */}
        <div className="text-center mb-10">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-red-600 to-pink-600 rounded-2xl flex items-center justify-center shadow-lg shadow-red-500/25">
              <HiExclamationCircle className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Invalid Reset Link
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-base">
            This password reset link is invalid or has expired
          </p>
        </div>

        {/* Error Message */}
        <div className="mb-8 p-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 rounded-xl">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-2">
              Reset Link Expired
            </h3>
            <p className="text-sm text-red-700 dark:text-red-300 mb-4">
              This link may have expired or been used already. Password reset links are only valid for 24 hours.
            </p>
            <p className="text-xs text-red-600 dark:text-red-400">
              Please request a new password reset link to continue.
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-4">
          <Link
            href="/forgot-password"
            className="inline-flex items-center justify-center w-full h-12 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40"
          >
            Request New Reset Link
          </Link>
          
          <Link
            href="/login"
            className="inline-flex items-center justify-center w-full h-12 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 shadow-sm"
          >
            Back to Sign In
          </Link>
        </div>
      </motion.div>
    );
  }

  if (isSuccess) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-full max-w-md mx-auto"
      >
        {/* Header Section */}
        <div className="text-center mb-10">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-green-600 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg shadow-green-500/25">
              <HiCheckCircle className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Password Reset Successful
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-base">
            Your password has been successfully updated
          </p>
        </div>

        {/* Success Message */}
        <div className="mb-8 p-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/30 rounded-xl">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-green-800 dark:text-green-200 mb-2">
              All Set!
            </h3>
            <p className="text-sm text-green-700 dark:text-green-300 mb-4">
              Your password has been successfully reset. You can now sign in with your new password.
            </p>
            <p className="text-xs text-green-600 dark:text-green-400">
              For security reasons, you'll need to sign in again with your new credentials.
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-4">
          <Link
            href="/login"
            className="inline-flex items-center justify-center w-full h-12 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40"
          >
            Sign In Now
          </Link>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Having trouble signing in?{' '}
            <Link href="/support" className="text-indigo-600 hover:text-indigo-500 dark:text-indigo-400">
              Contact support
            </Link>
          </p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="w-full max-w-md mx-auto"
    >
      {/* Header Section */}
      <div className="text-center mb-10">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/25">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
          </div>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Set New Password
        </h1>
        <p className="text-gray-600 dark:text-gray-400 text-base">
          Create a strong password for your account
        </p>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 rounded-xl">
          <div className="flex items-center space-x-3">
            <HiExclamationCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-red-800 dark:text-red-200">
                Password Reset Failed
              </p>
              <p className="text-sm text-red-600 dark:text-red-300 mt-0.5">
                {error}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Reset Password Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Password Field */}
        <div className="space-y-2">
          <label htmlFor="password" className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
            New Password
          </label>
          <div className="relative">
            <input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              required
              value={formData.password}
              onChange={handleChange}
              className="w-full h-12 px-4 pr-12 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 shadow-sm"
              placeholder="Create a strong password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-200"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <HiEyeSlash size={20} /> : <HiEye size={20} />}
            </button>
          </div>

          {/* Password Requirements */}
          {formData.password && (
            <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
              <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                Password Requirements:
              </p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className={`flex items-center space-x-2 ${isPasswordLongEnough ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}`}>
                  <HiCheckCircle size={14} className={isPasswordLongEnough ? 'text-green-500' : 'text-gray-400'} />
                  <span>8+ characters</span>
                </div>
                <div className={`flex items-center space-x-2 ${hasUpperCase ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}`}>
                  <HiCheckCircle size={14} className={hasUpperCase ? 'text-green-500' : 'text-gray-400'} />
                  <span>Uppercase letter</span>
                </div>
                <div className={`flex items-center space-x-2 ${hasLowerCase ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}`}>
                  <HiCheckCircle size={14} className={hasLowerCase ? 'text-green-500' : 'text-gray-400'} />
                  <span>Lowercase letter</span>
                </div>
                <div className={`flex items-center space-x-2 ${hasNumber ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}`}>
                  <HiCheckCircle size={14} className={hasNumber ? 'text-green-500' : 'text-gray-400'} />
                  <span>Number</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Confirm Password Field */}
        <div className="space-y-2">
          <label htmlFor="confirmPassword" className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
            Confirm New Password
          </label>
          <div className="relative">
            <input
              id="confirmPassword"
              name="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              autoComplete="new-password"
              required
              value={formData.confirmPassword}
              onChange={handleChange}
              className="w-full h-12 px-4 pr-12 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 shadow-sm"
              placeholder="Confirm your new password"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-200"
              aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
            >
              {showConfirmPassword ? <HiEyeSlash size={20} /> : <HiEye size={20} />}
            </button>
          </div>
          {formData.confirmPassword && (
            <div className={`mt-2 flex items-center space-x-2 text-sm ${passwordsMatch ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              <HiCheckCircle size={16} className={passwordsMatch ? 'text-green-500' : 'text-red-500'} />
              <span>{passwordsMatch ? 'Passwords match' : 'Passwords do not match'}</span>
            </div>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading || !isPasswordValid || !passwordsMatch}
          className="w-full h-12 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 disabled:shadow-none transform hover:translate-y-[-1px] disabled:transform-none"
        >
          {isLoading ? (
            <div className="flex items-center justify-center space-x-2">
              <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
              <span>Updating password...</span>
            </div>
          ) : (
            'Reset Password'
          )}
        </button>
      </form>

      {/* Footer */}
      <div className="mt-8 text-center">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Remember your password?{' '}
          <Link href="/login" className="text-indigo-600 hover:text-indigo-500 dark:text-indigo-400">
            Back to Sign In
          </Link>
        </p>
      </div>
    </motion.div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex bg-[var(--background)]">
      <div className="lg:w-1/2 relative">
        <LoginContent />
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md">
          <Suspense fallback={
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="w-full max-w-md mx-auto text-center"
            >
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--primary)] mx-auto"></div>
              <p className="mt-4 text-[var(--muted-foreground)]">Loading...</p>
            </motion.div>
          }>
            <ResetPasswordForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}