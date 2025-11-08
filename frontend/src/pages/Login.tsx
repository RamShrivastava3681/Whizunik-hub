import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useJWTAuth } from "@/hooks/useJWTAuth";
import { WhizUnikLogo } from "@/components/ui/WhizUnikLogo";

import { API_CONFIG } from "../config/api";
const API_BASE_URL = API_CONFIG.BASE_URL;

type AuthStep = 'login' | 'signup' | 'email_verification' | 'pending_approval';

export default function Login() {
  const [currentStep, setCurrentStep] = useState<AuthStep>('login');
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [role, setRole] = useState<'salesman' | 'evaluator'>('salesman');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [otp, setOtp] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);
  
  const { signIn, signUp } = useJWTAuth();
  const navigate = useNavigate();

  // Resend cooldown timer
  const startResendCooldown = () => {
    setResendCooldown(60);
    const timer = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const result = await signIn(email, password);
      if (result.error) {
        setError(result.error.message || "Login failed");
      }
    } catch (err) {
      setError("An error occurred during login");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setMessage("");

    try {
      // First, initiate email verification
      const response = await fetch(`${API_BASE_URL}/auth/request-verification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to send verification email');
      }

      setMessage("Verification email sent! Please check your email for the OTP.");
      setCurrentStep('email_verification');
      startResendCooldown(); // Start cooldown timer
    } catch (err: any) {
      console.error('Signup error:', err);
      setError(err.message || "Failed to send verification email. Please check if the backend server is running.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      // Verify OTP
      const verifyResponse = await fetch(`${API_BASE_URL}/auth/verify-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp })
      });

      const verifyData = await verifyResponse.json();

      if (!verifyResponse.ok) {
        throw new Error(verifyData.message || 'Invalid OTP');
      }

      // Now create the pending registration
      const registerResponse = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, username, role })
      });

      const registerData = await registerResponse.json();

      if (!registerResponse.ok) {
        throw new Error(registerData.message || 'Failed to submit registration');
      }

      setMessage("Registration submitted successfully! Your account is pending admin approval.");
      setCurrentStep('pending_approval');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (resendCooldown > 0) return;
    
    setIsLoading(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch(`${API_BASE_URL}/auth/request-verification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to resend verification email');
      }

      setMessage("Verification email resent! Please check your email.");
      startResendCooldown();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const renderLogin = () => (
    <>
      <div className="flex space-x-2 mb-6">
        <button
          type="button"
          className="flex-1 bg-blue-600 text-white p-2 rounded-md"
        >
          Sign In
        </button>
        <button
          type="button"
          onClick={() => setCurrentStep('signup')}
          className="flex-1 border border-gray-300 text-gray-700 p-2 rounded-md hover:bg-gray-50"
        >
          Sign Up
        </button>
      </div>

      <form onSubmit={handleLogin} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter your email"
            required
          />
        </div>
        
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter your password"
            required
          />
        </div>
        
        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-blue-600 text-white p-3 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? "Signing In..." : "Sign In"}
        </button>
      </form>
    </>
  );

  const renderSignup = () => (
    <>
      <div className="flex space-x-2 mb-6">
        <button
          type="button"
          onClick={() => setCurrentStep('login')}
          className="flex-1 border border-gray-300 text-gray-700 p-2 rounded-md hover:bg-gray-50"
        >
          Sign In
        </button>
        <button
          type="button"
          className="flex-1 bg-blue-600 text-white p-2 rounded-md"
        >
          Sign Up
        </button>
      </div>

      <form onSubmit={handleSignup} className="space-y-4">
        <div>
          <label htmlFor="signup-email" className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <input
            id="signup-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter your email"
            required
          />
        </div>

        <div>
          <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
            Username
          </label>
          <input
            id="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter your username"
            required
          />
        </div>

        <div>
          <label htmlFor="signup-password" className="block text-sm font-medium text-gray-700 mb-1">
            Password
          </label>
          <input
            id="signup-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter your password"
            required
          />
        </div>

        <div>
          <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
            Role
          </label>
          <select
            id="role"
            value={role}
            onChange={(e) => setRole(e.target.value as 'salesman' | 'evaluator')}
            className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="salesman">Salesman</option>
            <option value="evaluator">Evaluator</option>
          </select>
        </div>
        
        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-blue-600 text-white p-3 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? "Sending Verification..." : "Send Verification Email"}
        </button>
      </form>
    </>
  );

  const renderEmailVerification = () => (
    <>
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-center mb-2">Verify Your Email</h2>
        <p className="text-gray-600 text-center text-sm">
          We've sent a verification code to {email}
        </p>
      </div>

      <form onSubmit={handleVerifyEmail} className="space-y-4">
        <div>
          <label htmlFor="otp" className="block text-sm font-medium text-gray-700 mb-1">
            Verification Code
          </label>
          <input
            id="otp"
            type="text"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-center text-lg"
            placeholder="Enter 6-digit code"
            maxLength={6}
            required
          />
        </div>
        
        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-blue-600 text-white p-3 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? "Verifying..." : "Verify Email"}
        </button>
      </form>

      <div className="mt-4 text-center space-y-2">
        <button
          type="button"
          onClick={handleResendOTP}
          disabled={resendCooldown > 0 || isLoading}
          className="text-blue-600 hover:text-blue-800 text-sm disabled:text-gray-400 disabled:cursor-not-allowed"
        >
          {resendCooldown > 0 
            ? `Resend OTP in ${resendCooldown}s` 
            : "Resend Verification Code"
          }
        </button>
        
        <div>
          <button
            type="button"
            onClick={() => setCurrentStep('signup')}
            className="text-blue-600 hover:text-blue-800 text-sm"
          >
            Back to Sign Up
          </button>
        </div>
      </div>
    </>
  );

  const renderPendingApproval = () => (
    <div className="text-center">
      <div className="mb-4">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Registration Submitted!</h2>
        <p className="text-gray-600">
          Your account is pending admin approval. You'll receive an email notification once your account is approved.
        </p>
      </div>

      <button
        type="button"
        onClick={() => {
          setCurrentStep('login');
          setEmail('');
          setPassword('');
          setUsername('');
          setOtp('');
          setError('');
          setMessage('');
          setResendCooldown(0);
        }}
        className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700"
      >
        Back to Login
      </button>
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
        <div className="flex justify-center mb-6">
          <WhizUnikLogo size="lg" />
        </div>
        <h1 className="text-2xl font-bold mb-6 text-center text-gray-900">
          Trade Finance Portal
        </h1>
        
        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        {message && (
          <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
            {message}
          </div>
        )}
        
        {currentStep === 'login' && renderLogin()}
        {currentStep === 'signup' && renderSignup()}
        {currentStep === 'email_verification' && renderEmailVerification()}
        {currentStep === 'pending_approval' && renderPendingApproval()}
        
        {currentStep === 'login' && (
          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => navigate('/admin')}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-blue-600 bg-white border border-blue-300 rounded-md hover:bg-blue-50 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              Admin Login
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
