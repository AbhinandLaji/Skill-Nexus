import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';

export default function AuthPage() {
  const [mode, setMode] = useState('signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  
  const [isEmailValid, setIsEmailValid] = useState(false);
  const [isEmailTouched, setIsEmailTouched] = useState(false);
  
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  const navigate = useNavigate();

  // Validate email on change
  useEffect(() => {
    if (email.trim() === '') {
      setIsEmailValid(false);
    } else {
      setIsEmailValid(email.trim().endsWith('@tkmce.ac.in') && email.length > 12);
    }
  }, [email]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsEmailTouched(true);
    
    if (!isEmailValid) {
      setErrorMsg('Please use a valid @tkmce.ac.in college email.');
      return;
    }
    
    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters.');
      return;
    }

    if (mode === 'signup' && !name.trim()) {
      setErrorMsg('Name is required for registration.');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');

    try {
      let res;
      if (mode === 'signup') {
        res = await api.register({ name, email, password });
      } else {
        res = await api.login({ email, password });
      }
      
      // Store token and redirect
      if (res.token) {
        localStorage.setItem('auth_token', res.token);
        navigate('/onboarding');
      }
    } catch (err) {
      setErrorMsg(err.message || 'An error occurred during authentication.');
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
            onClick={() => { setMode('signup'); setErrorMsg(''); }}
          >
            Sign Up
          </button>
          <button 
            type="button"
            className={`flex-1 py-2 font-mono-label z-10 transition-colors ${mode === 'login' ? 'text-on-surface' : 'text-on-surface-variant'}`}
            onClick={() => { setMode('login'); setErrorMsg(''); }}
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
                className={`w-full bg-surface text-on-surface font-body-md pl-10 pr-10 py-3 rounded-lg border focus:outline-none transition-colors shadow-inner placeholder:text-outline-variant ${
                  isEmailTouched && !isEmailValid && email.length > 0 
                    ? 'border-error focus:border-error' 
                    : isEmailValid
                      ? 'border-primary-container/50 focus:border-primary-container'
                      : 'border-transparent focus:border-primary-container'
                }`}
                placeholder="username@tkmce.ac.in"
                required
              />
              <span 
                className={`absolute right-3 material-symbols-outlined text-primary-container text-[20px] transition-all duration-200 ${
                  isEmailValid ? 'opacity-100 scale-100' : 'opacity-0 scale-50'
                }`}
              >
                check_circle
              </span>
            </div>
            {isEmailTouched && !isEmailValid && email.length > 0 && (
              <span className="text-error font-mono-sm">Must be a valid @tkmce.ac.in email address.</span>
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
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-surface text-on-surface font-body-md pl-10 py-3 rounded-lg border border-transparent focus:border-primary-container focus:outline-none transition-colors shadow-inner placeholder:text-outline-variant"
                placeholder="••••••••"
                required
              />
            </div>
          </div>
          
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
      </motion.div>
    </main>
  );
}
