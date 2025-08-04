'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Eye, 
  EyeOff, 
  AlertCircle, 
  UserPlus, 
  Loader2, 
  Mail, 
  Lock, 
  User, 
  CheckCircle2,
  ArrowRight,
  Shield 
} from 'lucide-react';

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  acceptTerms: boolean;
}

export function SignupForm() {
  const router = useRouter();
  const { register } = useAuth();
  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    acceptTerms: false,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    if (error) setError('');
  }, [error]);

  // Password validation helpers
  const isPasswordLongEnough = formData.password.length >= 8;
  const hasUpperCase = /[A-Z]/.test(formData.password);
  const hasLowerCase = /[a-z]/.test(formData.password);
  const hasNumber = /\d/.test(formData.password);
  const passwordsMatch = formData.password === formData.confirmPassword && formData.confirmPassword.length > 0;
  const isPasswordValid = isPasswordLongEnough && hasUpperCase && hasLowerCase && hasNumber;

  // All required fields check
  const allFieldsFilled = [
    formData.firstName,
    formData.lastName,
    formData.email,
    formData.password,
    formData.confirmPassword
  ].every((field) => typeof field === 'string' && field.trim().length > 0);

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

    if (!formData.acceptTerms) {
      setError('You must accept the terms and conditions');
      setIsLoading(false);
      return;
    }

    try {
      const userData = {
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
        username: formData.firstName + formData.lastName 
      };

      const response = await register(userData);

      if (response.access_token) {
        router.push('/dashboard');
      } else {
        router.push('/login?message=Registration successful! Please log in.');
      }
    } catch (err: any) {
      if (err.message) {
        setError(err.message);
      } else {
        setError('An error occurred during registration. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="w-full"
    >
      {/* Header */}
      <div className="text-center mb-8">
        {/* Mobile Logo */}
        <div className="flex justify-center mb-6 lg:hidden">
          <div className="w-16 h-16 bg-gradient-to-br from-[var(--accent)] to-[var(--primary)] rounded-2xl flex items-center justify-center shadow-xl shadow-[var(--accent)]/20">
            <UserPlus className="w-8 h-8 text-[var(--primary-foreground)]" />
          </div>
        </div>
        
        <h1 className="text-3xl lg:text-4xl font-bold text-[var(--foreground)] mb-3 tracking-tight">
          Create Account
        </h1>
        <p className="text-[var(--muted-foreground)] text-base lg:text-lg leading-relaxed">
          Join thousands of teams using Taskosaur
        </p>
      </div>

      {/* Error Alert */}
      {error && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: -10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="mb-6"
        >
          <Alert variant="destructive" className="border-[var(--destructive)]/30 bg-[var(--destructive)]/5 backdrop-blur-sm">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="font-medium">
              <span className="block font-semibold">Registration Failed</span>
              <span className="text-sm opacity-90 mt-1">{error}</span>
            </AlertDescription>
          </Alert>
        </motion.div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Name Fields */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="grid grid-cols-2 gap-4"
        >
          <div className="space-y-3">
            <Label htmlFor="firstName" className="text-sm font-semibold text-[var(--foreground)] flex items-center space-x-2">
              <User className="w-4 h-4" />
              <span>First Name</span>
            </Label>
            <Input
              id="firstName"
              name="firstName"
              type="text"
              autoComplete="given-name"
              required
              value={formData.firstName}
              onChange={handleChange}
              placeholder="John"
              className="h-12 bg-[var(--card)] border-[var(--border)] focus:ring-2 focus:ring-[var(--ring)] focus:border-transparent transition-all duration-200 rounded-xl shadow-sm hover:shadow-md"
            />
          </div>
          <div className="space-y-3">
            <Label htmlFor="lastName" className="text-sm font-semibold text-[var(--foreground)]">
              Last Name
            </Label>
            <Input
              id="lastName"
              name="lastName"
              type="text"
              autoComplete="family-name"
              required
              value={formData.lastName}
              onChange={handleChange}
              placeholder="Doe"
              className="h-12 bg-[var(--card)] border-[var(--border)] focus:ring-2 focus:ring-[var(--ring)] focus:border-transparent transition-all duration-200 rounded-xl shadow-sm hover:shadow-md"
            />
          </div>
        </motion.div>

        {/* Email Field */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="space-y-3"
        >
          <Label htmlFor="email" className="text-sm font-semibold text-[var(--foreground)] flex items-center space-x-2">
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
            placeholder="john.doe@company.com"
            className="h-12 bg-[var(--card)] border-[var(--border)] focus:ring-2 focus:ring-[var(--ring)] focus:border-transparent transition-all duration-200 rounded-xl shadow-sm hover:shadow-md"
          />
        </motion.div>

        {/* Password Field */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="space-y-3"
        >
          <Label htmlFor="password" className="text-sm font-semibold text-[var(--foreground)] flex items-center space-x-2">
            <Lock className="w-4 h-4" />
            <span>Password</span>
          </Label>
          <div className="relative">
            <Input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              required
              value={formData.password}
              onChange={handleChange}
              placeholder="Create a strong password"
              className="h-12 pr-12 bg-[var(--card)] border-[var(--border)] focus:ring-2 focus:ring-[var(--ring)] focus:border-transparent transition-all duration-200 rounded-xl shadow-sm hover:shadow-md"
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0 hover:bg-[var(--muted)]/50 rounded-lg"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </div>

          {/* Password Requirements */}
          {formData.password && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="p-4 bg-[var(--muted)]/30 rounded-xl border border-[var(--border)]/50"
            >
              <p className="text-xs font-medium text-[var(--foreground)] mb-3 flex items-center space-x-2">
                <Shield className="w-4 h-4" />
                <span>Password Requirements:</span>
              </p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className={`flex items-center space-x-2 ${isPasswordLongEnough ? 'text-[var(--green-600)] dark:text-[var(--green-400)]' : 'text-[var(--muted-foreground)]'}`}>
                  <CheckCircle2 className={`w-3 h-3 ${isPasswordLongEnough ? 'text-[var(--green-500)]' : 'text-[var(--muted-foreground)]'}`} />
                  <span>8+ characters</span>
                </div>
                <div className={`flex items-center space-x-2 ${hasUpperCase ? 'text-[var(--green-600)] dark:text-[var(--green-400)]' : 'text-[var(--muted-foreground)]'}`}>
                  <CheckCircle2 className={`w-3 h-3 ${hasUpperCase ? 'text-[var(--green-500)]' : 'text-[var(--muted-foreground)]'}`} />
                  <span>Uppercase letter</span>
                </div>
                <div className={`flex items-center space-x-2 ${hasLowerCase ? 'text-[var(--green-600)] dark:text-[var(--green-400)]' : 'text-[var(--muted-foreground)]'}`}>
                  <CheckCircle2 className={`w-3 h-3 ${hasLowerCase ? 'text-[var(--green-500)]' : 'text-[var(--muted-foreground)]'}`} />
                  <span>Lowercase letter</span>
                </div>
                <div className={`flex items-center space-x-2 ${hasNumber ? 'text-[var(--green-600)] dark:text-[var(--green-400)]' : 'text-[var(--muted-foreground)]'}`}>
                  <CheckCircle2 className={`w-3 h-3 ${hasNumber ? 'text-[var(--green-500)]' : 'text-[var(--muted-foreground)]'}`} />
                  <span>Number</span>
                </div>
              </div>
            </motion.div>
          )}
        </motion.div>

        {/* Confirm Password Field */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="space-y-3"
        >
          <Label htmlFor="confirmPassword" className="text-sm font-semibold text-[var(--foreground)] flex items-center space-x-2">
            <Lock className="w-4 h-4" />
            <span>Confirm Password</span>
          </Label>
          <div className="relative">
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              autoComplete="new-password"
              required
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Confirm your password"
              className="h-12 pr-12 bg-[var(--card)] border-[var(--border)] focus:ring-2 focus:ring-[var(--ring)] focus:border-transparent transition-all duration-200 rounded-xl shadow-sm hover:shadow-md"
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0 hover:bg-[var(--muted)]/50 rounded-lg"
              aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
            >
              {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </div>
          {formData.confirmPassword && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex items-center space-x-2 text-sm ${passwordsMatch ? 'text-[var(--green-600)] dark:text-[var(--green-400)]' : 'text-[var(--destructive)]'}`}
            >
              <CheckCircle2 className={`w-4 h-4 ${passwordsMatch ? 'text-[var(--green-500)]' : 'text-[var(--destructive)]'}`} />
              <span>{passwordsMatch ? 'Passwords match' : 'Passwords do not match'}</span>
            </motion.div>
          )}
        </motion.div>

        {/* Terms Checkbox */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="flex items-start space-x-3 pt-2"
        >
          <Checkbox
            id="acceptTerms"
            name="acceptTerms"
            checked={formData.acceptTerms}
            onCheckedChange={(checked) => 
              setFormData(prev => ({ ...prev, acceptTerms: Boolean(checked) }))
            }
            required
            className="mt-1 rounded-md"
          />
          <Label htmlFor="acceptTerms" className="text-sm text-[var(--muted-foreground)] cursor-pointer leading-relaxed hover:text-[var(--foreground)] transition-colors">
            I agree to the{' '}
            <Link href="/terms" className="text-[var(--primary)] hover:text-[var(--primary)]/80 font-medium hover:underline">
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link href="/privacy" className="text-[var(--primary)] hover:text-[var(--primary)]/80 font-medium hover:underline">
              Privacy Policy
            </Link>
          </Label>
        </motion.div>

        {/* Submit Button */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <Button
            type="submit"
            disabled={
              isLoading ||
              !allFieldsFilled ||
              !isPasswordValid ||
              !passwordsMatch ||
              !formData.acceptTerms
            }
            className="w-full h-12 bg-[var(--primary)] hover:bg-[var(--primary)]/90 disabled:bg-[var(--muted)] disabled:text-[var(--muted-foreground)] text-[var(--primary-foreground)] font-semibold shadow-lg hover:shadow-xl transition-all duration-200 rounded-xl group"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating account...
              </>
            ) : (
              <>
                Create Account
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
        transition={{ duration: 0.5, delay: 0.7 }}
        className="my-8"
      >
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-[var(--border)]" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 bg-[var(--background)] text-[var(--muted-foreground)] font-medium">
              Already have an account?
            </span>
          </div>
        </div>
      </motion.div>

      {/* Sign In Link */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.8 }}
      >
        <Link href="/login">
          <Button 
            variant="outline" 
            className="w-full h-12 border-[var(--border)] hover:bg-[var(--accent)] hover:border-[var(--accent)]/50 font-semibold rounded-xl transition-all duration-200 group"
          >
            Sign In to Existing Account
            <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform duration-200" />
          </Button>
        </Link>
      </motion.div>

      {/* Footer */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.9 }}
        className="mt-8 text-center"
      >
        <p className="text-xs text-[var(--muted-foreground)] leading-relaxed">
          Need help? Contact our{' '}
          <Link href="/support" className="text-[var(--primary)] hover:text-[var(--primary)]/80 hover:underline font-medium">
            support team
          </Link>
        </p>
      </motion.div>
    </motion.div>
  );
}
