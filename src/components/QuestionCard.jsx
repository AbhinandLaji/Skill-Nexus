import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../services/api';

export function getRelativeTime(timestamp) {
  if (!timestamp) return 'recently';
  const date = new Date(timestamp);
  if (isNaN(date.getTime())) return 'recently';
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);

  if (diffInSeconds < 60) return 'just now';
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) return `${diffInDays}d ago`;
  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) return `${diffInMonths}mo ago`;
  return `${Math.floor(diffInDays / 365)}y ago`;
}

export default function QuestionCard({ question, onAnswerAdded }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [answers, setAnswers] = useState(Array.isArray(question?.answers) ? question.answers : []);
  const [answerText, setAnswerText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  useEffect(() => {
    if (Array.isArray(question?.answers)) {
      setAnswers(question.answers);
    }
  }, [question?.answers]);

  const questionId = question?.id || question?._id;
  const title = question?.title || question?.question || 'Discussion Question';
  const details = question?.details || (question?.title && question?.title !== question?.question ? question?.question : '');
  const askerName = question?.askedByName || 'Community Member';
  const skillTags = Array.isArray(question?.skillTags) ? question.skillTags : [];
  const answerCount = answers.length;

  const handlePostAnswer = async (e) => {
    e.preventDefault();
    const trimmed = answerText.trim();
    if (!trimmed || isSubmitting || !questionId) return;

    setIsSubmitting(true);
    setSubmitError('');

    try {
      const res = await api.answerQuestion(questionId, { text: trimmed });
      const newAnswer = res.answer || res;
      const updated = [...answers, newAnswer];
      setAnswers(updated);
      setAnswerText('');
      if (onAnswerAdded) {
        onAnswerAdded(questionId, newAnswer);
      }
    } catch (err) {
      setSubmitError(err.message || 'Failed to submit answer. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.article
      layout
      className="bg-surface-container border border-white/[0.08] hover:border-white/[0.14] rounded-2xl p-5 sm:p-6 transition-all duration-200 shadow-md flex flex-col gap-4"
    >
      {/* Top Header: Asker info & relative time */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center font-semibold text-xs shrink-0">
            {askerName.charAt(0).toUpperCase()}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-on-surface-variant font-mono-sm">
            <span className="text-on-surface font-semibold">{askerName}</span>
            <span>•</span>
            <span>{getRelativeTime(question?.createdAt)}</span>
          </div>
        </div>

        {/* Skill Tags */}
        {skillTags.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5">
            {skillTags.map((tag) => (
              <span
                key={tag}
                className="px-2.5 py-0.5 rounded-full text-xs font-mono-sm bg-primary/10 text-primary border border-primary/20"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Question Content */}
      <div className="flex flex-col gap-1.5">
        <h3 className="font-button-text text-base sm:text-lg text-on-surface leading-snug">
          {title}
        </h3>
        {details && (
          <p className="font-body-md text-xs sm:text-sm text-on-surface-variant leading-relaxed whitespace-pre-wrap mt-0.5">
            {details}
          </p>
        )}
      </div>

      {/* Bottom Bar: Answer count & Expand/collapse control */}
      <div className="pt-2 flex items-center justify-between border-t border-white/[0.06]">
        <button
          type="button"
          onClick={() => setIsExpanded((prev) => !prev)}
          className="inline-flex items-center gap-2 text-xs font-mono-sm text-on-surface-variant hover:text-primary transition-colors cursor-pointer py-1"
          aria-expanded={isExpanded}
        >
          <span className="material-symbols-outlined text-[18px]">
            {isExpanded ? 'chat_bubble' : 'chat_bubble_outline'}
          </span>
          <span>
            {answerCount} {answerCount === 1 ? 'answer' : 'answers'}
          </span>
          <span className="material-symbols-outlined text-[16px]">
            {isExpanded ? 'expand_less' : 'expand_more'}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setIsExpanded(true)}
          className="text-xs text-primary hover:underline font-mono-sm cursor-pointer"
        >
          Reply
        </button>
      </div>

      {/* Expanded Answers and Post Answer Form */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden flex flex-col gap-4 pt-2 border-t border-white/[0.06]"
          >
            {/* Answers List */}
            <div className="flex flex-col gap-3">
              <span className="text-xs font-mono-sm uppercase tracking-wider text-on-surface-variant">
                Answers ({answerCount})
              </span>

              {answers.length === 0 ? (
                <div className="p-4 rounded-xl bg-surface-container-low/70 border border-white/[0.04] text-center text-xs text-on-surface-variant">
                  No answers yet. Be the first to share your insights!
                </div>
              ) : (
                answers.map((answer, idx) => (
                  <div
                    key={answer.id || answer._id || idx}
                    className="p-3.5 rounded-xl bg-surface-container-low border border-white/[0.05] flex flex-col gap-1.5"
                  >
                    <div className="flex items-center justify-between text-xs font-mono-sm text-on-surface-variant">
                      <div className="flex items-center gap-2">
                        <span className="text-on-surface font-semibold">
                          {answer.answeredByName || 'Community Member'}
                        </span>
                        {answer.isMentor && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] bg-secondary/15 text-secondary border border-secondary/30">
                            Mentor
                          </span>
                        )}
                      </div>
                      <span>{getRelativeTime(answer.createdAt)}</span>
                    </div>
                    <p className="font-body-md text-xs sm:text-sm text-on-surface whitespace-pre-wrap leading-relaxed">
                      {answer.text}
                    </p>
                  </div>
                ))
              )}
            </div>

            {/* Answer Input Box */}
            <form onSubmit={handlePostAnswer} className="flex flex-col gap-2.5 mt-1">
              {submitError && (
                <div role="alert" className="p-2.5 rounded-lg bg-error/10 border border-error/20 text-error text-xs">
                  {submitError}
                </div>
              )}

              <div className="flex flex-col gap-2">
                <textarea
                  rows={3}
                  value={answerText}
                  onChange={(e) => setAnswerText(e.target.value)}
                  placeholder="Write a clear and helpful answer..."
                  disabled={isSubmitting}
                  className="w-full bg-surface-container-low border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:border-primary transition-colors resize-y min-h-[72px]"
                />

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={!answerText.trim() || isSubmitting}
                    className="px-4 py-2 rounded-xl bg-primary text-on-primary text-xs font-button-text hover:opacity-90 disabled:opacity-40 disabled:hover:scale-100 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    {isSubmitting ? (
                      <>
                        <span className="material-symbols-outlined text-[15px] animate-spin">refresh</span>
                        <span>Posting...</span>
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-[15px]">send</span>
                        <span>Post Answer</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.article>
  );
}
