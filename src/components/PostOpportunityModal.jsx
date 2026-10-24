import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const CATEGORIES = [
  { value: 'internship', label: 'Internship', icon: 'work' },
  { value: 'hackathon', label: 'Hackathon', icon: 'terminal' },
  { value: 'workshop', label: 'Workshop', icon: 'code' },
  { value: 'open_source', label: 'Open Source', icon: 'diversity_3' }
];

export default function PostOpportunityModal({ isOpen, onClose, onCreated }) {
  const [formData, setFormData] = useState({
    title: '',
    organization: '',
    category: 'internship',
    deadline: '',
    tags: '',
    link: '',
    description: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!formData.title.trim() || !formData.organization.trim()) {
      setError('Title and organization are required.');
      return;
    }

    try {
      setIsLoading(true);
      await onCreated(formData);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to post opportunity.');
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
                <span className="material-symbols-outlined text-[18px]">add_circle</span>
              </div>
              <div>
                <h3 className="font-button-text text-base text-on-surface">Post New Opportunity</h3>
                <p className="font-body-md text-xs text-on-surface-variant">Share internships, hackathons, and tech events</p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="text-on-surface-variant hover:text-on-surface p-1 rounded-md transition-colors cursor-pointer"
              aria-label="Close"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 custom-scrollbar">
            {error && (
              <div className="p-3 rounded-lg bg-error/10 border border-error/20 text-error text-xs">
                {error}
              </div>
            )}

            <div>
              <label className="block text-xs font-mono-sm text-on-surface-variant mb-1.5">
                Opportunity Title *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Frontend Engineering Intern - Summer 2025"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full bg-surface-container-low border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-sm text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:border-primary transition-colors"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono-sm text-on-surface-variant mb-1.5">
                  Organization / Host *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Vercel, Google, AWS"
                  value={formData.organization}
                  onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                  className="w-full bg-surface-container-low border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-sm text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:border-primary transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-mono-sm text-on-surface-variant mb-1.5">
                  Category *
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full bg-surface-container-low border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-sm text-on-surface focus:outline-none focus:border-primary transition-colors cursor-pointer"
                >
                  {CATEGORIES.map(cat => (
                    <option key={cat.value} value={cat.value} className="bg-surface-container-high text-on-surface">
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono-sm text-on-surface-variant mb-1.5">
                  Deadline or Timeframe
                </label>
                <input
                  type="text"
                  placeholder="e.g. Ends in 5 days, Nov 30"
                  value={formData.deadline}
                  onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                  className="w-full bg-surface-container-low border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-sm text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:border-primary transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-mono-sm text-on-surface-variant mb-1.5">
                  Application / Registration Link
                </label>
                <input
                  type="url"
                  placeholder="https://company.com/apply"
                  value={formData.link}
                  onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                  className="w-full bg-surface-container-low border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-sm text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:border-primary transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono-sm text-on-surface-variant mb-1.5">
                Skills / Tags (comma separated)
              </label>
              <input
                type="text"
                placeholder="React, Next.js, TypeScript, Open Source"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                className="w-full bg-surface-container-low border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-sm text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:border-primary transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-mono-sm text-on-surface-variant mb-1.5">
                Description / Overview
              </label>
              <textarea
                rows={3}
                placeholder="Briefly describe what this opportunity offers, expectations, and perks..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full bg-surface-container-low border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-sm text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:border-primary transition-colors resize-none"
              />
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
                disabled={isLoading}
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
                    <span>Post Opportunity</span>
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
