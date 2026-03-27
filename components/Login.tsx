import React, { useState } from 'react';
import { useAuth } from '../lib/AuthContext';
import { toast } from 'react-toastify';
import { Signup } from './Signup';

export const Login: React.FC = () => {
  const [showSignup, setShowSignup] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();

  // Show signup component if user wants to register
  if (showSignup) {
    return <Signup onSwitchToLogin={() => setShowSignup(false)} />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await signIn(email, password);
      toast.success('Welcome back!');
    } catch (error: any) {
      console.error('Login error:', error);
      toast.error(error.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        {/* Logo/Title */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-[#135bec] to-[#4a90ff] bg-clip-text text-transparent mb-2">
            PX-Flow
          </h1>
          <p className="text-muted-foreground">Project Management for Agencies</p>
        </div>

        {/* Login Card */}
        <div className="bg-muted/40 backdrop-blur-xl border border-border/50 rounded-2xl p-8 shadow-2xl shadow-[#135bec]/10">
          <h2 className="text-2xl font-semibold text-foreground mb-6">Welcome Back</h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email Input */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-foreground/90 mb-2">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 bg-card/50 border border-border/80/50 rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#135bec] focus:border-transparent transition-all"
                placeholder="you@example.com"
              />
            </div>

            {/* Password Input */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label htmlFor="password" className="block text-sm font-medium text-foreground/90">
                  Password
                </label>
              </div>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 bg-card/50 border border-border/80/50 rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#135bec] focus:border-transparent transition-all"
                placeholder="••••••••"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-[#135bec] to-[#4a90ff] text-foreground font-semibold rounded-lg shadow-lg shadow-[#135bec]/30 hover:shadow-[#135bec]/50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing In...' : 'Sign In'}
            </button>
          </form>

          {/* Switch to Signup */}
          <div className="mt-6 text-center">
            <p className="text-muted-foreground text-sm">
              Don't have an account?{' '}
              <button
                onClick={() => setShowSignup(true)}
                className="text-[#135bec] hover:text-[#4a90ff] font-medium transition-colors"
              >
                Sign Up
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
