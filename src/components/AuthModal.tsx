import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useAuth } from '../lib/auth';
import toast from 'react-hot-toast';
import { supabase } from '../lib/supabase';
import { AuthError, Session } from '@supabase/supabase-js';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSignUp, setIsSignUp] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [touchedFields, setTouchedFields] = useState({
    email: false,
    password: false,
    confirmPassword: false,
  });

  const { signIn, signUp } = useAuth();
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        onClose();
      }
    });
  
    return () => {
      subscription.unsubscribe();
    };
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) {
      // Reset form state when modal closes
      setFormData({ email: '', password: '', confirmPassword: '' });
      setError(null);
      setLoading(false);
      setTouchedFields({ email: false, password: false, confirmPassword: false });
      setIsSignUp(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };
  
  const validatePassword = (password: string): boolean => {
    return password.length >= 6;
  };

  const validateForm = () => {
    if (!formData.email || !formData.password) {
      setError('Please fill in all fields');
      return false;
    }
    if (!validateEmail(formData.email)) {
      setError('Please enter a valid email address');
      return false;
    }
    if (!validatePassword(formData.password)) {
      setError('Password must be at least 6 characters long');
      return false;
    }
    if (isSignUp && formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    // Set all fields as touched on submit
    setTouchedFields({ 
      email: true, 
      password: true, 
      confirmPassword: isSignUp 
    });

    if (!validateForm()) return;

    try {
      setError(null);
      setLoading(true);

      if (isSignUp) {
        // Sign up and create profile
        await signUp(formData.email, formData.password);

        // Log the attempt for debugging
        console.log('Registration attempt:', {
          email: formData.email,
          profileCreation: true
        });

        toast.success('Account created successfully! Please check your email to verify your account.');
      } else {
        await signIn(formData.email, formData.password);
        toast.success('Successfully signed in!');
      }
      onClose();
    } catch (error: any) {
      console.error('Auth error:', error);
      const errorMessage = error?.message || `Failed to ${isSignUp ? 'create account' : 'sign in'}`;
      
      // Log the error for debugging
      console.error('Registration error:', {
        email: formData.email,
        error: errorMessage
      });
      
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: 'email' | 'password' | 'confirmPassword', value: string) => {
    setError(null);
    setFormData(prev => ({ 
      ...prev, 
      [field]: field === 'email' ? value.trim() : value 
    }));
    setTouchedFields(prev => ({ ...prev, [field]: true }));
  };

  const toggleMode = () => {
    setIsSignUp(!isSignUp);
    setError(null);
    setFormData({ email: '', password: '', confirmPassword: '' });
    setTouchedFields({ email: false, password: false, confirmPassword: false });
  };

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white/90 rounded-3xl max-w-md w-full relative overflow-hidden shadow-xl">
        <div className="p-8">
          <button
            onClick={onClose}
            className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 transition-colors"
            disabled={loading}
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>

          <h2 className="text-2xl font-semibold text-gray-800 mb-8">
            {isSignUp ? 'Create Account' : 'Log in'}
          </h2>

          {error && (
            <div className="mb-6 p-4 bg-red-50/50 text-red-600 rounded-2xl text-sm" role="alert">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <input
                id="email"
                type="email"
                required
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className={`w-full px-4 py-3.5 bg-white rounded-2xl border-2 transition-colors duration-200
                  ${touchedFields.email && !validateEmail(formData.email)
                    ? 'border-red-200 focus:border-red-300'
                    : 'border-gray-100 focus:border-emerald-300'
                  } focus:ring focus:ring-emerald-100 focus:ring-opacity-50`}
                disabled={loading}
                placeholder="E-mail"
                aria-invalid={touchedFields.email && !validateEmail(formData.email)}
              />
              {touchedFields.email && !validateEmail(formData.email) && (
                <p className="mt-2 text-sm text-red-500">Please enter a valid email address</p>
              )}
            </div>

            <div className="relative">
              <input
                id="password"
                type="password"
                required
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                className={`w-full px-4 py-3.5 bg-white rounded-2xl border-2 transition-colors duration-200
                  ${touchedFields.password && !validatePassword(formData.password)
                    ? 'border-red-200 focus:border-red-300'
                    : 'border-gray-100 focus:border-emerald-300'
                  } focus:ring focus:ring-emerald-100 focus:ring-opacity-50`}
                disabled={loading}
                placeholder="Password"
                aria-invalid={touchedFields.password && !validatePassword(formData.password)}
              />
              {touchedFields.password && !validatePassword(formData.password) && (
                <p className="mt-2 text-sm text-red-500">Password must be at least 6 characters</p>
              )}
            </div>

            {isSignUp && (
              <div className="relative">
                <input
                  id="confirmPassword"
                  type="password"
                  required
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                  className={`w-full px-4 py-3.5 bg-white rounded-2xl border-2 transition-colors duration-200
                    ${touchedFields.confirmPassword && formData.password !== formData.confirmPassword
                      ? 'border-red-200 focus:border-red-300'
                      : 'border-gray-100 focus:border-emerald-300'
                    } focus:ring focus:ring-emerald-100 focus:ring-opacity-50`}
                  disabled={loading}
                  placeholder="Confirm Password"
                  aria-invalid={touchedFields.confirmPassword && formData.password !== formData.confirmPassword}
                />
                {touchedFields.confirmPassword && formData.password !== formData.confirmPassword && (
                  <p className="mt-2 text-sm text-red-500">Passwords do not match</p>
                )}
              </div>
            )}

            {!isSignUp && (
              <button
                type="button"
                onClick={() => {/* TODO: Implement forgot password */}}
                className="text-sm text-emerald-600 hover:text-emerald-700 transition-colors"
              >
                Forgot your password?
              </button>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-500 text-white py-3.5 rounded-2xl font-medium
                hover:bg-emerald-600 focus:bg-emerald-600 transition-colors duration-200
                disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-500/20"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Processing...
                </span>
              ) : (
                'Login'
              )}
            </button>

            <div className="text-center text-sm">
              <span className="text-gray-500">
                {isSignUp ? 'Already have an account?' : "Don't have an account?"}
              </span>
              {' '}
              <button
                type="button"
                onClick={toggleMode}
                className="text-emerald-600 hover:text-emerald-700 font-medium transition-colors"
                disabled={loading}
              >
                {isSignUp ? 'Sign in' : 'Sign up'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}