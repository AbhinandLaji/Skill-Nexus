import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../services/api';

export default function CreatePostModal({ isOpen, onClose, onSuccess }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [skillsStr, setSkillsStr] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');

    const requiredSkills = skillsStr.split(',').map(s => s.trim()).filter(Boolean);

    try {
      await api.createTeamPost({ title, description, requiredSkills });
      onSuccess();
      onClose();
      // Reset form
      setTitle('');
      setDescription('');
      setSkillsStr('');
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || 'Failed to post listing');
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
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-surface-container rounded-xl border border-white/[0.08] p-6 w-full max-w-lg pointer-events-auto flex flex-col shadow-xl"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="font-headline-lg-mobile text-on-surface">Post a Listing</h2>
                <button onClick={onClose} className="text-on-surface-variant hover:text-on-surface">
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              {errorMsg && (
                <div className="bg-error-container/20 text-error p-3 rounded-md mb-4 text-sm font-body-md border border-error-container/30">
                  {errorMsg}
                </div>
              )}

              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div>
                  <label className="font-mono-sm text-on-surface-variant block mb-2 uppercase">Project Title</label>
                  <input 
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-surface-container-low border border-white/[0.08] rounded-lg py-2 px-4 focus:outline-none focus:border-primary transition-colors text-on-surface"
                    placeholder="e.g. AI Agent Swarm Platform"
                  />
                </div>
                
                <div>
                  <label className="font-mono-sm text-on-surface-variant block mb-2 uppercase">Description</label>
                  <textarea 
                    required
                    rows="3"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full bg-surface-container-low border border-white/[0.08] rounded-lg py-2 px-4 focus:outline-none focus:border-primary transition-colors text-on-surface resize-none"
                    placeholder="Describe your project and what kind of teammate you are looking for..."
                  />
                </div>
                
                <div>
                  <label className="font-mono-sm text-on-surface-variant block mb-2 uppercase">Required Skills (Comma separated)</label>
                  <input 
                    type="text"
                    required
                    value={skillsStr}
                    onChange={(e) => setSkillsStr(e.target.value)}
                    className="w-full bg-surface-container-low border border-white/[0.08] rounded-lg py-2 px-4 focus:outline-none focus:border-primary transition-colors text-on-surface"
                    placeholder="e.g. Python, AI/ML, FastAPI"
                  />
                </div>

                <div className="flex justify-end gap-3 mt-4">
                  <button 
                    type="button" 
                    onClick={onClose}
                    className="px-4 py-2 font-button-text text-on-surface-variant hover:text-on-surface transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    disabled={isLoading}
                    className="bg-primary text-on-primary font-button-text px-6 py-2 rounded-lg hover:scale-[1.02] transition-transform duration-150 flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isLoading ? <span className="material-symbols-outlined animate-spin text-[20px]">refresh</span> : 'Post'}
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
