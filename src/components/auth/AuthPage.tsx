import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

type Mode = 'signin' | 'signup' | 'forgot';

function validate(mode: Mode, email: string, password: string, name: string) {
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Valid email required';
  if (mode === 'forgot') return null;
  if (password.length < 6) return 'Password must be at least 6 characters';
  if (mode === 'signup' && name.trim().length < 2) return 'Display name must be at least 2 characters';
  return null;
}

export function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const err = validate(mode, email, password, name);
    if (err) { toast.error(err); return; }

    setLoading(true);
    try {
      if (mode === 'signin') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success('Signed in successfully');
        navigate({ to: '/dashboard' });
      } else if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { display_name: name.trim() } },
        });
        if (error) throw error;
        toast.success('Account created! You can now sign in.');
        setMode('signin');
        setPassword('');
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/account`,
        });
        if (error) throw error;
        setForgotSent(true);
      }
    } catch (e: any) {
      toast.error(e?.message ?? 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
      {/* Background grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_110%)]" />

      <div className="relative w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-3">
            <div className="w-9 h-9 rounded-lg bg-cyan-500 flex items-center justify-center">
              <svg viewBox="0 0 24 24" className="w-5 h-5 text-white fill-current">
                <path d="M12 2L3 7v10l9 5 9-5V7L12 2zm0 2.18L19 8.5v7l-7 3.82-7-3.82v-7L12 4.18z" />
              </svg>
            </div>
            <span className="text-xl font-bold text-white tracking-tight">Refai</span>
          </div>
          <p className="text-sm text-slate-400">AI-Assisted Sports Officiating Platform</p>
        </div>

        {/* Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl">
          {forgotSent ? (
            <div className="text-center py-4">
              <div className="w-12 h-12 rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center mx-auto mb-4">
                <svg viewBox="0 0 24 24" className="w-6 h-6 text-cyan-400 fill-none stroke-current stroke-2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h2 className="text-lg font-semibold text-white mb-2">Check your email</h2>
              <p className="text-sm text-slate-400 mb-6">We sent a password reset link to<br /><span className="text-cyan-400">{email}</span></p>
              <button
                onClick={() => { setForgotSent(false); setMode('signin'); }}
                className="text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
              >
                Back to sign in
              </button>
            </div>
          ) : (
            <>
              {/* Tab switcher */}
              {mode !== 'forgot' && (
                <div className="flex bg-slate-800/60 rounded-lg p-1 mb-6">
                  {(['signin', 'signup'] as const).map((m) => (
                    <button
                      key={m}
                      onClick={() => { setMode(m); setPassword(''); }}
                      className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${
                        mode === m
                          ? 'bg-slate-700 text-white shadow-sm'
                          : 'text-slate-400 hover:text-slate-300'
                      }`}
                    >
                      {m === 'signin' ? 'Sign in' : 'Create account'}
                    </button>
                  ))}
                </div>
              )}

              {mode === 'forgot' && (
                <div className="mb-6">
                  <h2 className="text-lg font-semibold text-white">Reset password</h2>
                  <p className="text-sm text-slate-400 mt-1">Enter your email and we'll send a reset link.</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Display name (signup only) */}
                {mode === 'signup' && (
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1.5">Display name</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="John Smith"
                      required
                      minLength={2}
                      maxLength={80}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all"
                    />
                  </div>
                )}

                {/* Email */}
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">Email address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    maxLength={255}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all"
                  />
                </div>

                {/* Password */}
                {mode !== 'forgot' && (
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-medium text-slate-400">Password</label>
                      {mode === 'signin' && (
                        <button
                          type="button"
                          onClick={() => setMode('forgot')}
                          className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
                        >
                          Forgot password?
                        </button>
                      )}
                    </div>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      minLength={6}
                      maxLength={72}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all"
                    />
                    {mode === 'signup' && (
                      <p className="text-xs text-slate-500 mt-1.5">Minimum 6 characters</p>
                    )}
                  </div>
                )}

                {/* Submit */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-cyan-500 hover:bg-cyan-400 disabled:opacity-60 disabled:cursor-not-allowed text-slate-950 font-semibold rounded-lg py-2.5 text-sm transition-colors mt-2"
                >
                  {loading
                    ? 'Please wait…'
                    : mode === 'signin'
                    ? 'Sign in'
                    : mode === 'signup'
                    ? 'Create account'
                    : 'Send reset link'}
                </button>
              </form>

              {mode === 'forgot' && (
                <button
                  onClick={() => setMode('signin')}
                  className="w-full text-center mt-4 text-sm text-slate-400 hover:text-slate-300 transition-colors"
                >
                  Back to sign in
                </button>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-slate-600 mt-6">
          By signing in you agree to our{' '}
          <a href="/legal/terms" className="text-slate-500 hover:text-slate-400 transition-colors">Terms</a>
          {' '}and{' '}
          <a href="/legal/privacy" className="text-slate-500 hover:text-slate-400 transition-colors">Privacy Policy</a>
        </p>
      </div>
    </div>
  );
}
