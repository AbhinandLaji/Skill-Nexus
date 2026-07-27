import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../services/api';

export default function EditProfileModal({ isOpen, onClose, user, onSuccess }) {
  const [bio, setBio] = useState('');
  const [skillsStr, setSkillsStr] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (user && isOpen) {
      setBio(user.bio || '');
      setSkillsStr(user.skills ? user.skills.join(', ') : '');
      setErrorMsg('');
    }
  }, [user, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');

    const skillsArray = skillsStr.split(',').map(s => s.trim()).filter(Boolean);

    try {
      await api.updateUserProfile({
        bio,
        skills: skillsArray
      });
      onSuccess({ ...user, bio, skills: skillsArray });
      onClose();
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50"
            onClick={onClose}
          />
          <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none p-4">
            <motion.div 
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
              className="bg-surface-container rounded-xl border border-white/[0.08] p-6 w-full max-w-lg pointer-events-auto flex flex-col shadow-2xl"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="font-headline-lg-mobile text-on-surface">Edit Profile</h2>
                <button onClick={onClose} className="text-on-surface-variant hover:text-on-surface">
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              {errorMsg && (
                <div className="bg-error-container/20 text-error p-3 rounded-md mb-4 text-sm font-body-md border border-error-container/30">
                  {errorMsg}
                </div>
              )}

              <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                <div>
                  <label className="font-mono-sm text-on-surface-variant block mb-2 uppercase tracking-wider">Terminal Log (Bio)</label>
                  <textarea 
                    required
                    rows="4"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    className="w-full bg-surface-container-low border border-white/[0.08] rounded-lg py-3 px-4 focus:outline-none focus:border-primary transition-colors text-on-surface resize-none font-body-md"
                    placeholder="Tell us about yourself..."
                  />
                </div>
                
                <div>
                  <label className="font-mono-sm text-on-surface-variant block mb-2 uppercase tracking-wider">Skills (Comma separated)</label>
                  <input 
                    type="text"
                    required
                    value={skillsStr}
                    onChange={(e) => setSkillsStr(e.target.value)}
                    className="w-full bg-surface-container-low border border-white/[0.08] rounded-lg py-2 px-4 focus:outline-none focus:border-primary transition-colors text-on-surface font-body-md"
                    placeholder="e.g. Python, AI/ML, Rust"
                  />
                </div>

                <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-white/[0.08]">
                  <button 
                    type="button" 
                    onClick={onClose}
                    className="px-6 py-2.5 font-button-text text-on-surface-variant hover:text-on-surface hover:bg-surface-variant rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    disabled={isLoading}
                    className="bg-primary text-on-primary font-button-text px-6 py-2.5 rounded-lg hover:scale-[1.02] active:scale-[0.98] transition-transform duration-150 flex items-center justify-center gap-2 disabled:opacity-50 disabled:hover:scale-100"
                  >
                    {isLoading ? <span className="material-symbols-outlined animate-spin text-[20px]">refresh</span> : 'Save Changes'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
