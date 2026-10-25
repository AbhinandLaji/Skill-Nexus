import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';

export default function AuthPage() {
  const [mode, setMode] = useState('signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // OTP Verification state
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [otp, setOtp] = useState('');
  const [otpSuccessMsg, setOtpSuccessMsg] = useState('');
  const [resendCountdown, setResendCountdown] = useState(0);

  const [isEmailValid, setIsEmailValid] = useState(false);
  const [isEmailTouched, setIsEmailTouched] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const navigate = useNavigate();

  // Validate email on change (supports college domain or standard email)
  useEffect(() => {
    if (email.trim() === '') {
      setIsEmailValid(false);
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      setIsEmailValid(emailRegex.test(email.trim()));
    }
  }, [email]);

  // Resend countdown timer
  useEffect(() => {
    if (resendCountdown > 0) {
      const timer = setTimeout(() => setResendCountdown((c) => c - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCountdown]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsEmailTouched(true);

    if (!isEmailValid) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters.');
      return;
    }

    if (mode === 'signup') {
      if (!name.trim()) {
        setErrorMsg('Name is required for registration.');
        return;
      }

      if (password !== confirmPassword) {
        setErrorMsg('Passwords do not match. Please re-enter.');
        return;
      }
    }

    setIsLoading(true);
    setErrorMsg('');
    setOtpSuccessMsg('');

    try {
      let res;
      if (mode === 'signup') {
        res = await api.register({ name, email, password });
      } else {
        res = await api.login({ email, password });
      }

      // If server requests email OTP verification
      if (res && res.requireOtp) {
        setIsVerifyingOtp(true);
        setOtpSuccessMsg(res.message || 'Verification code sent to your email.');
        return;
      }

      // Store token and redirect
      if (res.token) {
        localStorage.setItem('auth_token', res.token);

        if (mode === 'login') {
          navigate('/dashboard');
        } else {
          navigate('/onboarding');
        }
      }
    } catch (err) {
      // Check if unverified login triggered OTP
      if (err.message && err.message.toLowerCase().includes('verify your email')) {
        setIsVerifyingOtp(true);
        setOtpSuccessMsg(err.message);
      } else {
        setErrorMsg(err.message || 'An error occurred during authentication.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otp || otp.trim().length < 6) {
      setErrorMsg('Please enter the full 6-digit verification code.');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');

    try {
      const res = await api.verifyOtp({ email: email.trim(), otp: otp.trim() });
      if (res.token) {
        localStorage.setItem('auth_token', res.token);
        if (mode === 'login') {
          navigate('/dashboard');
        } else {
          navigate('/onboarding');
        }
      }
    } catch (err) {
      setErrorMsg(err.message || 'Invalid or expired verification code.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendCountdown > 0 || isLoading) return;
    setIsLoading(true);
    setErrorMsg('');
    try {
      const res = await api.resendOtp({ email: email.trim() });
      setOtpSuccessMsg(res.message || 'A new 6-digit code has been dispatched to your email.');
      setResendCountdown(30);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to resend verification code.');
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <main className="w-full min-h-screen flex justify-center items-center relative overflow-hidden bg-surface-dim px-section-margin">
      {/* Abstract Background Pattern */}
      <div
        className="absolute inset-0 opacity-10 pointer-events-none"
        style={{ backgroundImage: 'radial-gradient(#424938 1px, transparent 1px)', backgroundSize: '24px 24px' }}
      ></div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="bg-surface-container rounded-[12px] w-full max-w-md p-card-padding shadow-xl relative z-10 overflow-hidden flex flex-col gap-8"
      >
        {isVerifyingOtp ? (
          <div className="flex flex-col gap-6">
            <div className="flex flex-col items-center gap-2 text-center">
              <span className="material-symbols-outlined text-primary-container text-4xl mb-2" style={{ fontVariationSettings: "'FILL' 1" }}>
                mark_email_read
              </span>
              <h2 className="font-headline-lg-mobile text-on-surface">Enter Verification Code</h2>
              <p className="font-body-md text-on-surface-variant">
                We sent a 6-digit code to<br />
                <span className="text-on-surface font-semibold">{email}</span>
              </p>
            </div>

            {otpSuccessMsg && (
              <div className="bg-primary-container/20 border border-primary-container/30 text-on-surface font-body-sm p-3 rounded-lg text-center">
                {otpSuccessMsg}
              </div>
            )}

            <form className="flex flex-col gap-4" onSubmit={handleVerifyOtp}>
              <div className="flex flex-col gap-2">
                <label className="font-mono-sm text-on-surface-variant uppercase text-center">6-Digit Code</label>
                <input
                  type="text"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  className="w-full bg-surface text-center tracking-[0.4em] font-mono text-3xl py-3 rounded-lg border border-transparent focus:border-primary-container focus:outline-none transition-colors shadow-inner text-on-surface"
                  placeholder="000000"
                  autoFocus
                  required
                />
              </div>

              {errorMsg && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-error-container/20 text-error font-body-md p-3 rounded-lg text-sm text-center"
                >
                  {errorMsg}
                </motion.div>
              )}

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={isLoading || otp.length < 6}
                className="w-full bg-primary-container text-on-primary-fixed font-button-text py-3 rounded-lg shadow-md transition-transform duration-150 disabled:opacity-60 flex justify-center items-center"
              >
                {isLoading ? (
                  <span className="material-symbols-outlined animate-spin">refresh</span>
                ) : (
                  'Verify & Activate Account'
                )}
              </motion.button>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsVerifyingOtp(false);
                    setOtp('');
                    setErrorMsg('');
                  }}
                  className="font-mono-sm text-on-surface-variant hover:text-on-surface transition-colors flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-[16px]">arrow_back</span>
                  Back
                </button>

                <button
                  type="button"
                  disabled={resendCountdown > 0 || isLoading}
                  onClick={handleResendOtp}
                  className="font-mono-sm text-primary-container hover:underline disabled:opacity-50 disabled:no-underline"
                >
                  {resendCountdown > 0 ? `Resend in ${resendCountdown}s` : 'Resend Code'}
                </button>
              </div>
            </form>
          </div>
        ) : (
          <>
            <div className="flex flex-col items-center gap-2 text-center">
              <span className="material-symbols-outlined text-primary-container text-4xl mb-2" style={{ fontVariationSettings: "'FILL' 1" }}>
                terminal
              </span>
              <h2 className="font-headline-lg-mobile text-on-surface">Terminal Access</h2>
              <p className="font-body-md text-on-surface-variant">Restricted to @tkmce.ac.in domains.</p>
            </div>

            {/* Auth Toggle */}
            <div className="flex bg-surface-container-high rounded-lg p-1 relative shadow-sm">
              <motion.div
                className="absolute top-1 bottom-1 w-[calc(50%-4px)] bg-surface rounded-md shadow-sm"
                initial={false}
                animate={{ left: mode === 'signup' ? '4px' : 'calc(50%)' }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              ></motion.div>
              <button
                type="button"
                className={`flex-1 py-2 font-mono-label z-10 transition-colors ${mode === 'signup' ? 'text-on-surface' : 'text-on-surface-variant'}`}
                onClick={() => { setMode('signup'); setErrorMsg(''); setConfirmPassword(''); }}
              >
                Sign Up
              </button>
              <button
                type="button"
                className={`flex-1 py-2 font-mono-label z-10 transition-colors ${mode === 'login' ? 'text-on-surface' : 'text-on-surface-variant'}`}
                onClick={() => { setMode('login'); setErrorMsg(''); setConfirmPassword(''); }}
              >
                Log In
              </button>
            </div>

            <form className="flex flex-col gap-element-gap" onSubmit={handleSubmit}>

              <AnimatePresence>
                {mode === 'signup' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="flex flex-col gap-2 relative"
                  >
                    <label className="font-mono-sm text-on-surface-variant uppercase">Full Name</label>
                    <div className="relative flex items-center">
                      <span className="absolute left-3 material-symbols-outlined text-outline-variant text-[20px]">person</span>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full bg-surface text-on-surface font-body-md pl-10 pr-4 py-3 rounded-lg border border-transparent focus:border-primary-container focus:outline-none transition-colors shadow-inner placeholder:text-outline-variant"
                        placeholder="John Doe"
                        required={mode === 'signup'}
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex flex-col gap-2 relative">
                <label className="font-mono-sm text-on-surface-variant uppercase">College Email</label>
                <div className="relative flex items-center">
                  <span className="absolute left-3 material-symbols-outlined text-outline-variant text-[20px]">shield</span>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setIsEmailTouched(true);
                    }}
                    className={`w-full bg-surface text-on-surface font-body-md pl-10 pr-10 py-3 rounded-lg border focus:outline-none transition-colors shadow-inner placeholder:text-outline-variant ${isEmailTouched && !isEmailValid && email.length > 0
                        ? 'border-error focus:border-error'
                        : isEmailValid
                          ? 'border-primary-container/50 focus:border-primary-container'
                          : 'border-transparent focus:border-primary-container'
                      }`}
                    placeholder="username@tkmce.ac.in"
                    required
                  />
                  <span
                    className={`absolute right-3 material-symbols-outlined text-primary-container text-[20px] transition-all duration-200 ${isEmailValid ? 'opacity-100 scale-100' : 'opacity-0 scale-50'
                      }`}
                  >
                    check_circle
                  </span>
                </div>
                {isEmailTouched && !isEmailValid && email.length > 0 && (
                  <span className="text-error font-mono-sm">Must be a valid email address.</span>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-end">
                  <label className="font-mono-sm text-on-surface-variant uppercase">Password</label>
                  {mode === 'login' && (
                    <a href="#" className="font-mono-sm text-primary-container hover:underline">Reset?</a>
                  )}
                </div>
                <div className="relative flex items-center">
                  <span className="absolute left-3 material-symbols-outlined text-outline-variant text-[20px]">key</span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-surface text-on-surface font-body-md pl-10 pr-11 py-3 rounded-lg border border-transparent focus:border-primary-container focus:outline-none transition-colors shadow-inner placeholder:text-outline-variant"
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(prev => !prev)}
                    className="absolute right-3 text-outline-variant hover:text-on-surface transition-colors p-1 flex items-center justify-center focus:outline-none"
                    title={showPassword ? 'Hide password' : 'Show password'}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    <span className="material-symbols-outlined text-[20px]">
                      {showPassword ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
              </div>

              <AnimatePresence>
                {mode === 'signup' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="flex flex-col gap-2 relative"
                  >
                    <label className="font-mono-sm text-on-surface-variant uppercase">Confirm Password</label>
                    <div className="relative flex items-center">
                      <span className="absolute left-3 material-symbols-outlined text-outline-variant text-[20px]">lock_reset</span>
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full bg-surface text-on-surface font-body-md pl-10 pr-11 py-3 rounded-lg border border-transparent focus:border-primary-container focus:outline-none transition-colors shadow-inner placeholder:text-outline-variant"
                        placeholder="••••••••"
                        required={mode === 'signup'}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(prev => !prev)}
                        className="absolute right-3 text-outline-variant hover:text-on-surface transition-colors p-1 flex items-center justify-center focus:outline-none"
                        title={showConfirmPassword ? 'Hide password' : 'Show password'}
                        aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                      >
                        <span className="material-symbols-outlined text-[20px]">
                          {showConfirmPassword ? 'visibility_off' : 'visibility'}
                        </span>
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {errorMsg && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-error-container/20 text-error font-body-md p-3 rounded-lg text-sm"
                >
                  {errorMsg}
                </motion.div>
              )}

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={isLoading}
                className="w-full bg-primary-container text-on-primary-fixed font-button-text py-3 mt-4 rounded-lg shadow-md transition-transform duration-150 disabled:opacity-70 flex justify-center items-center"
              >
                {isLoading ? (
                  <span className="material-symbols-outlined animate-spin">refresh</span>
                ) : (
                  mode === 'signup' ? 'Initialize Account' : 'Authenticate Session'
                )}
              </motion.button>
            </form>

            <div className="pt-4 border-t border-outline-variant/30 text-center">
              <p className="font-mono-sm text-on-surface-variant">
                By connecting, you accept the <a href="#" className="text-primary-container hover:underline">Campus Protocol</a>.
              </p>
            </div>
          </>
        )}
      </motion.div>

    </main>
  );
}
