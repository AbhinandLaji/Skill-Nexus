import React from 'react';
import { motion } from 'framer-motion';

export default function MentorCard({ mentor, onRequestSession, hasRequested = false }) {
  const availability = (mentor.availabilityStatus || 'available').toLowerCase();

  const getStatusBadge = (status) => {
    switch (status) {
      case 'available':
        return {
          label: 'Available',
          dot: 'bg-emerald-400',
          pulse: 'animate-ping bg-emerald-400',
          badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
        };
      case 'busy':
        return {
          label: 'In Session',
          dot: 'bg-amber-400',
          pulse: '',
          badge: 'bg-amber-500/10 text-amber-400 border-amber-500/20'
        };
      case 'away':
        return {
          label: 'Away',
          dot: 'bg-slate-400',
          pulse: '',
          badge: 'bg-slate-500/10 text-slate-400 border-slate-500/20'
        };
      default:
        return {
          label: 'Available',
          dot: 'bg-emerald-400',
          pulse: 'animate-ping bg-emerald-400',
          badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
        };
    }
  };

  const statusMeta = getStatusBadge(availability);

  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 15 },
        show: { opacity: 1, y: 0 }
      }}
      whileHover={{ y: -3 }}
      transition={{ duration: 0.2 }}
      className="bg-surface-container rounded-2xl p-6 border border-white/[0.08] hover:border-white/[0.2] hover:shadow-[0_8px_30px_rgba(0,0,0,0.3)] transition-all duration-300 flex flex-col md:flex-row gap-6 items-start relative overflow-hidden"
    >
      {/* Left Column: Avatar & Availability Indicator */}
      <div className="flex md:flex-col items-center gap-3 shrink-0 md:w-36 md:border-r border-white/[0.08] md:pr-6">
        <div className="relative">
          <div className="w-16 h-16 rounded-2xl bg-surface-variant overflow-hidden border border-white/[0.1] shadow-inner">
            {mentor.avatar ? (
              <img src={mentor.avatar.startsWith('/uploads') ? `${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'}${mentor.avatar}` : mentor.avatar} alt={mentor.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-primary text-xl font-headline-lg bg-primary/10">
                {mentor.name ? mentor.name.charAt(0).toUpperCase() : 'M'}
              </div>
            )}
          </div>

          {/* Status Indicator Dot */}
          <div className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-surface-container p-0.5">
            <span className={`relative flex h-2.5 w-2.5 rounded-full ${statusMeta.dot}`}>
              {statusMeta.pulse && (
                <span className={`absolute inline-flex h-full w-full rounded-full opacity-75 ${statusMeta.pulse}`} />
              )}
            </span>
          </div>
        </div>

        {/* Status Pill on Desktop */}
        <div className={`hidden md:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-[11px] font-mono-sm tracking-tight ${statusMeta.badge}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${statusMeta.dot}`} />
          {statusMeta.label}
        </div>
      </div>

      {/* Center & Right: Mentor Details & Actions */}
      <div className="flex-1 min-w-0 flex flex-col justify-between h-full">
        <div>
          {/* Header row: Name, Verified Badge, Role, and Action button */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-2">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-headline-lg text-lg text-on-surface hover:text-primary transition-colors">
                  {mentor.name}
                </h3>
                <span
                  className="material-symbols-outlined text-primary text-[18px]"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                  title="Verified Senior / Alumni"
                >
                  verified
                </span>
              </div>

              <p className="font-button-text text-xs text-primary/90 mt-0.5">
                {mentor.role || 'Verified Senior Mentor'}
              </p>
            </div>

            {/* Request Mentorship CTA */}
            <div className="shrink-0">
              <button
                onClick={() => onRequestSession && onRequestSession(mentor)}
                disabled={hasRequested}
                className={`px-4 py-2 rounded-xl text-xs font-button-text transition-all flex items-center gap-2 cursor-pointer shadow-sm ${
                  hasRequested
                    ? 'bg-surface-variant text-on-surface-variant border border-white/[0.08] cursor-not-allowed'
                    : 'bg-primary text-on-primary hover:opacity-90 hover:scale-105 active:scale-95'
                }`}
              >
                {hasRequested ? (
                  <>
                    <span className="material-symbols-outlined text-[15px]">done</span>
                    <span>Requested</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[16px]">calendar_today</span>
                    <span>Request Mentorship</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Achievements Snippet if available */}
          {mentor.achievements && (
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface-container-high/60 border border-white/[0.06] text-xs font-mono-sm text-on-surface-variant/90 mb-3">
              <span className="material-symbols-outlined text-[14px] text-secondary">workspace_premium</span>
              <span className="truncate max-w-md">{mentor.achievements}</span>
            </div>
          )}

          {/* Bio Snippet */}
          <p className="font-body-md text-xs text-on-surface-variant leading-relaxed line-clamp-3 mb-4">
            {mentor.bio}
          </p>
        </div>

        {/* Expertise Tags */}
        <div className="flex items-center gap-2 flex-wrap pt-3 border-t border-white/[0.06]">
          <span className="text-[11px] font-mono-sm text-on-surface-variant/60 mr-1">Expertise:</span>
          {Array.isArray(mentor.expertise) && mentor.expertise.map((exp, idx) => (
            <span
              key={idx}
              className="px-2.5 py-0.5 rounded-full border border-primary/30 bg-primary/5 text-primary text-[11px] font-mono-sm tracking-wide"
            >
              {exp}
            </span>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
