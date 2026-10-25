import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../services/api';

export default function AskQuestionModal({ isOpen, onClose, onSuccess, skills = [] }) {
  const [title, setTitle] = useState('');
  const [details, setDetails] = useState('');
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [availableSkills, setAvailableSkills] = useState(skills);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Sync available skills from prop or fetch if empty
  useEffect(() => {
    if (Array.isArray(skills) && skills.length > 0) {
      setAvailableSkills(skills);
    } else if (isOpen) {
      api.getSkills()
        .then((data) => {
          if (Array.isArray(data) && data.length > 0) {
            setAvailableSkills(data);
          }
        })
        .catch((err) => console.error('Failed to load skills for question modal:', err));
    }
  }, [skills, isOpen]);

  if (!isOpen) return null;

  const toggleSkill = (skillName) => {
    setSelectedSkills((prev) =>
      prev.includes(skillName) ? prev.filter((s) => s !== skillName) : [...prev, skillName]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setErrorMsg('Question title is required.');
      return;
    }

    if (selectedSkills.length === 0) {
      setErrorMsg('Please select at least one skill tag.');
      return;
    }

    setIsLoading(true);

    try {
      const questionContent = details.trim() ? `${trimmedTitle}\n\n${details.trim()}` : trimmedTitle;
      await api.askQuestion({
        title: trimmedTitle,
        details: details.trim(),
        question: questionContent,
        skillTags: selectedSkills
      });

      if (onSuccess) {
        await onSuccess();
      }

      // Reset form on success
      setTitle('');
      setDetails('');
      setSelectedSkills([]);
      onClose();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to post question. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.15 }}
          className="w-full max-w-lg bg-surface-container border border-white/[0.12] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="p-5 border-b border-white/[0.08] flex items-center justify-between bg-surface-container-high/60">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-primary/20 text-primary flex items-center justify-center">
                <span className="material-symbols-outlined text-[18px]">help_outline</span>
              </div>
              <div>
                <h3 className="font-button-text text-base text-on-surface">Ask the Community</h3>
                <p className="font-body-md text-xs text-on-surface-variant">
                  Get advice, code feedback, and career guidance from peers and mentors
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="text-on-surface-variant hover:text-on-surface p-1 rounded-md transition-colors cursor-pointer"
              aria-label="Close"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 custom-scrollbar">
            {errorMsg && (
              <div role="alert" className="p-3 rounded-lg bg-error/10 border border-error/20 text-error text-xs">
                {errorMsg}
              </div>
            )}

            {/* Question Title */}
            <div>
              <label className="block text-xs font-mono-sm text-on-surface-variant mb-1.5 uppercase">
                Question Title *
              </label>
              <input
                type="text"
                required
                maxLength={200}
                placeholder="e.g. How do I design a rate limiter in Node.js with Redis?"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-surface-container-low border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-sm text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:border-primary transition-colors"
              />
            </div>

            {/* Details (Optional) */}
            <div>
              <label className="block text-xs font-mono-sm text-on-surface-variant mb-1.5 uppercase">
                Details (Optional)
              </label>
              <textarea
                rows={4}
                maxLength={2000}
                placeholder="Provide context, code snippets, or what you have tried so far..."
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                className="w-full bg-surface-container-low border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-sm text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:border-primary transition-colors resize-y min-h-[96px]"
              />
            </div>

            {/* Skill Tags Selection */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-mono-sm text-on-surface-variant uppercase">
                  Skill Tags * (Choose at least one)
                </label>
                <span className="text-[11px] font-mono-sm text-primary">
                  {selectedSkills.length} selected
                </span>
              </div>

              <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto p-2 bg-surface-container-low border border-white/[0.06] rounded-xl custom-scrollbar">
                {availableSkills.map((skill) => {
                  const skillName = skill.name || skill;
                  const isSelected = selectedSkills.includes(skillName);
                  return (
                    <button
                      key={skill.id || skill._id || skillName}
                      type="button"
                      onClick={() => toggleSkill(skillName)}
                      className={`px-3 py-1 rounded-full text-xs font-mono-sm transition-all border cursor-pointer ${
                        isSelected
                          ? 'bg-primary text-on-primary border-primary shadow-sm font-semibold'
                          : 'bg-surface-container border-white/[0.08] text-on-surface-variant hover:text-on-surface hover:bg-white/[0.05]'
                      }`}
                    >
                      {isSelected ? '✓ ' : '+ '}
                      {skillName}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Actions */}
            <div className="pt-2 flex items-center justify-end gap-3 border-t border-white/[0.08]">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-button-text text-on-surface-variant hover:text-on-surface hover:bg-white/[0.05] transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading || !title.trim() || selectedSkills.length === 0}
                className="px-5 py-2 rounded-xl bg-primary text-on-primary text-xs font-button-text hover:opacity-90 disabled:opacity-50 transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                {isLoading ? (
                  <>
                    <span className="material-symbols-outlined text-[15px] animate-spin">refresh</span>
                    <span>Posting...</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[15px]">send</span>
                    <span>Post Question</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
