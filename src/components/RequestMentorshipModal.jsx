import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const TOPIC_PRESETS = [
  'Resume & Portfolio Review',
  'System Design & Architecture',
  'Hackathon Project Ideation',
  'AI / ML Career & Tech Guidance',
  'Full-Stack Web Performance',
  'Open Source & GSoC Prep',
  'Interview Preparation'
];

export default function RequestMentorshipModal({ isOpen, onClose, mentor, onSubmit }) {
  const [topic, setTopic] = useState(TOPIC_PRESETS[0]);
  const [customTopic, setCustomTopic] = useState('');
  const [question, setQuestion] = useState('');
  const [preferredTime, setPreferredTime] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen || !mentor) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    const finalTopic = topic === 'Custom' ? customTopic : topic;
    if (!finalTopic.trim()) {
      setError('Please select or specify a topic.');
      return;
    }

    try {
      setIsLoading(true);
      await onSubmit(mentor.id, {
        topic: finalTopic.trim(),
        question: question.trim(),
        preferredTime: preferredTime.trim()
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to submit mentorship request.');
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
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-surface-variant overflow-hidden border border-white/10 shrink-0">
                {mentor.avatar ? (
                  <img src={mentor.avatar} alt={mentor.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-primary font-headline-lg bg-primary/10">
                    {mentor.name ? mentor.name.charAt(0).toUpperCase() : 'M'}
                  </div>
                )}
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-button-text text-base text-on-surface">{mentor.name}</h3>
                  <span className="material-symbols-outlined text-primary text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                    verified
                  </span>
                </div>
                <p className="font-body-md text-xs text-on-surface-variant">{mentor.role || 'Verified Mentor'}</p>
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
                Session Focus / Topic *
              </label>
              <select
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="w-full bg-surface-container-low border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-sm text-on-surface focus:outline-none focus:border-primary transition-colors cursor-pointer mb-2"
              >
                {TOPIC_PRESETS.map((t) => (
                  <option key={t} value={t} className="bg-surface-container-high text-on-surface">
                    {t}
                  </option>
                ))}
                <option value="Custom" className="bg-surface-container-high text-on-surface">
                  Custom Topic...
                </option>
              </select>

              {topic === 'Custom' && (
                <input
                  type="text"
                  required
                  placeholder="Specify what you'd like to discuss..."
                  value={customTopic}
                  onChange={(e) => setCustomTopic(e.target.value)}
                  className="w-full bg-surface-container-low border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-sm text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:border-primary transition-colors"
                />
              )}
            </div>

            <div>
              <label className="block text-xs font-mono-sm text-on-surface-variant mb-1.5">
                Specific Question or Discussion Details *
              </label>
              <textarea
                rows={4}
                required
                placeholder="Give context so the mentor can prepare: links to your repo, specific bottlenecks, questions about their career or tech decisions..."
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                className="w-full bg-surface-container-low border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-sm text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:border-primary transition-colors resize-none"
              />
            </div>

            <div>
              <label className="block text-xs font-mono-sm text-on-surface-variant mb-1.5">
                Preferred Timeframe / Availability (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Weekday evenings (after 6 PM), or Saturdays"
                value={preferredTime}
                onChange={(e) => setPreferredTime(e.target.value)}
                className="w-full bg-surface-container-low border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-sm text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:border-primary transition-colors"
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
                    <span>Sending Request...</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[15px]">send</span>
                    <span>Send Mentorship Request</span>
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
