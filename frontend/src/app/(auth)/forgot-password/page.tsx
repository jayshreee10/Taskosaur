'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { HiExclamationCircle, HiCheckCircle, HiArrowLeft } from 'react-icons/hi2';
import { sendForgotPasswordRequest, ForgotPasswordData } from '@/utils/apiUtils';
import { LoginContent } from "@/components/login/LoginContent";

function ForgotPasswordForm() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const requestData: ForgotPasswordData = {
        email: email.trim(),
      };

      const response = await sendForgotPasswordRequest(requestData);
      
      if (response.success) {
        setIsSuccess(true);
      } else {
        setError(response.message || 'Failed to send reset email. Please try again.');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to send reset email. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    if (error) setError('');
  };

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
            Check Your Email
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-base">
            We've sent password reset instructions to your email
          </p>
        </div>

        {/* Success Message */}
        <div className="mb-8 p-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/30 rounded-xl">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-green-800 dark:text-green-200 mb-2">
              Email Sent Successfully!
            </h3>
            <p className="text-sm text-green-700 dark:text-green-300 mb-4">
              We've sent a password reset link to{' '}
              <span className="font-medium">{email}</span>
            </p>
            <p className="text-xs text-green-600 dark:text-green-400">
              If you don't see the email, check your spam folder or try again with a different email address.
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-4">
          <Link
            href="/login"
            className="inline-flex items-center justify-center w-full h-12 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40"
          >
            Back to Sign In
          </Link>
          
          <button
            onClick={() => {
              setIsSuccess(false);
              setEmail('');
              setError('');
            }}
            className="inline-flex items-center justify-center w-full h-12 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 shadow-sm"
          >
            Try Different Email
          </button>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Still having trouble?{' '}
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
          Forgot Password?
        </h1>
        <p className="text-gray-600 dark:text-gray-400 text-base">
          No worries, we'll send you reset instructions
        </p>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 rounded-xl">
          <div className="flex items-center space-x-3">
            <HiExclamationCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-red-800 dark:text-red-200">
                Reset Failed
              </p>
              <p className="text-sm text-red-600 dark:text-red-300 mt-0.5">
                {error}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Reset Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Email Field */}
        <div className="space-y-2">
          <label htmlFor="email" className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
            Email Address
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={handleChange}
            className="w-full h-12 px-4 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 shadow-sm"
            placeholder="Enter your email address"
          />
          <p className="text-xs text-gray-600 dark:text-gray-400">
            Enter the email address associated with your account and we'll send you a link to reset your password.
          </p>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading || !email.trim()}
          className="w-full h-12 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 disabled:shadow-none transform hover:translate-y-[-1px] disabled:transform-none"
        >
          {isLoading ? (
            <div className="flex items-center justify-center space-x-2">
              <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
              <span>Sending reset email...</span>
            </div>
          ) : (
            'Send Reset Email'
          )}
        </button>
      </form>

      {/* Divider */}
      <div className="my-8">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 bg-gray-50 dark:bg-gray-900 text-gray-500 dark:text-gray-400">
              Remember your password?
            </span>
          </div>
        </div>
      </div>

      {/* Sign In Link */}
      <div className="text-center">
        <Link 
          href="/login" 
          className="inline-flex items-center justify-center w-full h-12 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 shadow-sm"
        >
          Back to Sign In
        </Link>
      </div>

      {/* Footer */}
      <div className="mt-8 text-center">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Need help?{' '}
          <Link href="/support" className="text-indigo-600 hover:text-indigo-500 dark:text-indigo-400">
            Contact our support team
          </Link>
        </p>
      </div>
    </motion.div>
  );
}

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen flex bg-[var(--background)]">
      <div className="lg:w-1/2 relative">
        <LoginContent />
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md">
          <ForgotPasswordForm />
        </div>
      </div>
    </div>
  );
}