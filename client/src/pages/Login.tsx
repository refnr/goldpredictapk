import { useState, useEffect } from "react";
import { useLocation, useSearch } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useSubscription } from "@/hooks/use-subscription";
import { queryClient } from "@/lib/queryClient";
import { LineChart, Loader2, Eye, EyeOff, AlertCircle } from "lucide-react";

export default function Login() {
  const [, setLocation] = useLocation();
  const searchString = useSearch();
  const params = new URLSearchParams(searchString);
  const redirectUrl = params.get('redirect') || '/dashboard';

  const { login, isAuthenticated, isLoading: authLoading } = useAuth();
  const { isActive, isLoading: subLoading } = useSubscription();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isAuthenticated && !authLoading && !subLoading && isActive) {
      setLocation(redirectUrl);
    }
  }, [isAuthenticated, authLoading, subLoading, isActive, redirectUrl, setLocation]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      await login({ email, password });
      await queryClient.invalidateQueries({ queryKey: ['/api/subscription/status'] });
      await queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      setLocation('/dashboard');
    } catch (err: any) {
      let errorMessage = 'Authentication failed. Please try again.';
      if (err?.message) {
        let msg = err.message.toLowerCase();
        try {
          const jsonMatch = err.message.match(/\{.*\}/);
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            if (parsed.message) msg = parsed.message.toLowerCase();
          }
        } catch { }
        if (msg.includes('too many')) {
          errorMessage = 'Too many attempts. Please wait 15 minutes.';
        } else if (msg.includes('no account found')) {
          errorMessage = 'No account found with this email.';
        } else if (msg.includes('incorrect password')) {
          errorMessage = 'Incorrect password. Please try again.';
        } else if (msg.includes('password') || msg.includes('email')) {
          errorMessage = 'Invalid email or password.';
        }
      }
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#080808] font-body flex flex-col overflow-hidden relative">
      {/* Animated background blobs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute top-[-120px] left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full bg-amber-500/8 blur-[120px] animate-blob" />
        <div className="absolute bottom-[-80px] right-[-80px] w-[300px] h-[300px] rounded-full bg-amber-600/6 blur-[100px] animate-blob animation-delay-2000" />
      </div>

      {/* Header */}
      <header className="relative z-10 px-6 pt-8 flex items-center gap-2.5">
        <div
          className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/30 cursor-pointer"
          onClick={() => setLocation('/')}
        >
          <LineChart className="w-4 h-4 text-black" />
        </div>
        <span
          className="text-base font-display font-bold text-white tracking-tight cursor-pointer"
          onClick={() => setLocation('/')}
        >
          Gold Predict
        </span>
      </header>

      {/* Main content */}
      <main className="relative z-10 flex-1 flex flex-col justify-center px-6 py-10">
        {/* Welcome text */}
        <div className="mb-10 fade-in-up">
          <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 rounded-full px-3 py-1 mb-5">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            <span className="text-[11px] font-semibold text-amber-400 uppercase tracking-widest">Member Access</span>
          </div>
          <h1 className="text-4xl font-display font-bold text-white leading-tight mb-2">
            Welcome<br />
            <span className="text-amber-400">Back</span>
          </h1>
          <p className="text-sm text-white/40 leading-relaxed">
            Sign in to continue to your gold market dashboard.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 fade-in-up fade-in-up-delay-2">
          {error && (
            <div className="flex items-center gap-2.5 bg-red-500/10 border border-red-500/20 rounded-2xl px-4 py-3">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span className="text-sm text-red-400">{error}</span>
            </div>
          )}

          {/* Email */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-white/40 uppercase tracking-wider pl-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className="w-full h-13 bg-white/5 border border-white/10 rounded-2xl px-4 py-3.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-amber-500/50 focus:bg-white/8 transition-all"
              data-testid="input-email"
            />
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-white/40 uppercase tracking-wider pl-1">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
                className="w-full h-13 bg-white/5 border border-white/10 rounded-2xl px-4 py-3.5 pr-12 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-amber-500/50 focus:bg-white/8 transition-all"
                data-testid="input-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full h-14 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 disabled:opacity-60 text-black font-bold text-base shadow-lg shadow-amber-500/25 transition-all flex items-center justify-center gap-2 mt-2"
            data-testid="button-submit-auth"
          >
            {isSubmitting ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        {/* Bottom link */}
        <div className="mt-8 text-center fade-in-up fade-in-up-delay-3">
          <p className="text-sm text-white/30">
            Don't have an account?{' '}
            <button
              onClick={() => setLocation('/')}
              className="text-amber-400 font-semibold hover:text-amber-300 transition-colors"
              data-testid="button-go-subscribe"
            >
              Subscribe to get started
            </button>
          </p>
        </div>
      </main>

      {/* Bottom disclaimer */}
      <div className="relative z-10 px-6 pb-8 text-center">
        <p className="text-[10px] text-white/15 leading-relaxed">
          For analysis purposes only. Not financial advice.
        </p>
      </div>
    </div>
  );
}
