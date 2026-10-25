import React, { useEffect, useState } from 'react';
import { api } from '../services/api';

export default function CommunityQA() {
  const [questions, setQuestions] = useState([]);
  const [questionText, setQuestionText] = useState('');
  const [answerDrafts, setAnswerDrafts] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    api.getQuestions()
      .then((data) => { if (active) setQuestions(Array.isArray(data) ? data : []); })
      .catch((err) => { if (active) setError(err.message || 'Unable to load questions.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const submitQuestion = async (event) => {
    event.preventDefault();
    const question = questionText.trim();
    if (!question || submitting) return;
    setSubmitting(true);
    setError('');
    try {
      const result = await api.askQuestion({ question, skillTags: [] });
      const created = result.question || result;
      setQuestions((current) => [created, ...current]);
      setQuestionText('');
    } catch (err) {
      setError(err.message || 'Unable to post your question.');
    } finally {
      setSubmitting(false);
    }
  };

  const submitAnswer = async (event, question) => {
    event.preventDefault();
    const text = (answerDrafts[question.id] || '').trim();
    if (!text || submitting) return;
    setSubmitting(true);
    setError('');
    try {
      const result = await api.answerQuestion(question.id, { text });
      const answer = result.answer || result;
      setQuestions((current) => current.map((item) => item.id === question.id
        ? { ...item, answers: [...(item.answers || []), answer], answerCount: (item.answerCount || 0) + 1 }
        : item));
      setAnswerDrafts((current) => ({ ...current, [question.id]: '' }));
    } catch (err) {
      setError(err.message || 'Unable to submit your answer.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="mx-auto w-full max-w-4xl space-y-6">
      <form onSubmit={submitQuestion} className="rounded-2xl border border-white/[0.08] bg-surface-container p-5 space-y-3">
        <label htmlFor="community-question" className="block font-button-text text-on-surface">Ask the community</label>
        <textarea id="community-question" value={questionText} onChange={(event) => setQuestionText(event.target.value)}
          maxLength={2000} required rows={3} placeholder="What would you like help with?"
          className="w-full resize-y rounded-xl border border-white/[0.1] bg-surface-container-lowest p-3 text-sm text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:border-primary" />
        <div className="flex justify-end">
          <button type="submit" disabled={!questionText.trim() || submitting}
            className="rounded-xl bg-primary px-4 py-2 text-sm font-button-text text-on-primary disabled:opacity-50">
            {submitting ? 'Posting…' : 'Post question'}
          </button>
        </div>
      </form>

      {error && <p role="alert" className="rounded-lg border border-error/30 bg-error/10 p-3 text-sm text-error">{error}</p>}
      {loading ? <p className="py-8 text-center text-sm text-on-surface-variant">Loading questions…</p> : (
        questions.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/[0.12] p-10 text-center text-sm text-on-surface-variant">No questions yet. Ask the first one.</div>
        ) : questions.map((question) => (
          <article key={question.id} className="rounded-2xl border border-white/[0.08] bg-surface-container p-5 space-y-4">
            <div>
              <p className="whitespace-pre-wrap text-on-surface">{question.question}</p>
              <p className="mt-2 text-xs text-on-surface-variant">Asked by {question.askedByName || 'Community member'} · {question.answerCount || 0} answers</p>
            </div>
            {(question.answers || []).map((answer) => (
              <div key={answer.id} className="ml-3 border-l-2 border-primary/40 pl-4">
                <p className="whitespace-pre-wrap text-sm text-on-surface-variant">{answer.text}</p>
                <p className="mt-1 text-xs text-on-surface-variant">{answer.answeredByName || 'Community member'}{answer.isMentor ? ' · Mentor' : ''}</p>
              </div>
            ))}
            <form onSubmit={(event) => submitAnswer(event, question)} className="flex flex-col sm:flex-row gap-2">
              <input value={answerDrafts[question.id] || ''} onChange={(event) => setAnswerDrafts((current) => ({ ...current, [question.id]: event.target.value }))}
                maxLength={4000} aria-label={`Answer: ${question.question}`} placeholder="Write an answer…"
                className="min-w-0 flex-1 rounded-xl border border-white/[0.1] bg-surface-container-lowest px-3 py-2 text-sm text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:border-primary" />
              <button type="submit" disabled={!(answerDrafts[question.id] || '').trim() || submitting}
                className="rounded-xl border border-white/[0.1] px-4 py-2 text-sm text-on-surface disabled:opacity-50">Answer</button>
            </form>
          </article>
        ))
      )}
    </section>
  );
}
