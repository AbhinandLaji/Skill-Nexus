import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { api } from '../services/api';

export default function OpportunityCard({ opportunity, onBookmarkToggle, isBookmarked: initialBookmarked = false }) {
  const [status, setStatus] = useState('idle'); // idle | loading | applied | error
  const [error, setError] = useState(null);
  const [isBookmarked, setIsBookmarked] = useState(initialBookmarked);

  const category = (opportunity.category || opportunity.type || 'internship').toLowerCase();

  const handleApply = async (e) => {
    e.stopPropagation();
    setStatus('loading');
    setError(null);
    try {
      if (opportunity.id) {
        await api.registerForOpportunity(opportunity.id);
      }
      setStatus('applied');
      // If external link exists, open in new tab
      if (opportunity.link) {
        window.open(opportunity.link, '_blank', 'noopener,noreferrer');
      }
    } catch (err) {
      console.error(err);
      setStatus('error');
      setError('Registration failed. Try again.');
      // If external link exists, still let user open it
      if (opportunity.link) {
        window.open(opportunity.link, '_blank', 'noopener,noreferrer');
      }
    }
  };

  const handleBookmark = (e) => {
    e.stopPropagation();
    const nextState = !isBookmarked;
    setIsBookmarked(nextState);
    if (onBookmarkToggle) {
      onBookmarkToggle(opportunity.id, nextState);
    }
  };

  const getCategoryMeta = (cat) => {
    switch (cat) {
      case 'internship':
        return {
          label: 'Internship',
          border: 'border-primary/40',
          text: 'text-primary',
          bg: 'bg-primary/10',
          gradient: 'from-primary/10 to-transparent',
          icon: 'work'
        };
      case 'hackathon':
        return {
          label: 'Hackathon',
          border: 'border-[#c084fc]/40',
          text: 'text-[#c084fc]',
          bg: 'bg-[#c084fc]/10',
          gradient: 'from-[#c084fc]/10 to-transparent',
          icon: 'terminal'
        };
      case 'workshop':
        return {
          label: 'Workshop',
          border: 'border-[#60a5fa]/40',
          text: 'text-[#60a5fa]',
          bg: 'bg-[#60a5fa]/10',
          gradient: 'from-[#60a5fa]/10 to-transparent',
          icon: 'code'
        };
      case 'open_source':
        return {
          label: 'Open Source',
          border: 'border-[#34d399]/40',
          text: 'text-[#34d399]',
          bg: 'bg-[#34d399]/10',
          gradient: 'from-[#34d399]/10 to-transparent',
          icon: 'diversity_3'
        };
      default:
        return {
          label: 'Opportunity',
          border: 'border-white/20',
          text: 'text-on-surface',
          bg: 'bg-white/5',
          gradient: 'from-white/5 to-transparent',
          icon: 'star'
        };
    }
  };

  const meta = getCategoryMeta(category);
  const organizationName = opportunity.organization || opportunity.company || 'Tech Org';

  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 15 },
        show: { opacity: 1, y: 0 }
      }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      className="group bg-surface-container rounded-2xl p-6 border border-white/[0.08] hover:border-white/[0.22] hover:shadow-[0_10px_30px_rgba(0,0,0,0.35)] transition-all duration-300 relative overflow-hidden flex flex-col justify-between h-full"
    >
      {/* Top Subtle Ambient Glow */}
      <div className={`absolute top-0 right-0 w-40 h-40 bg-gradient-to-bl ${meta.gradient} rounded-bl-full pointer-events-none -z-0 opacity-70 group-hover:opacity-100 transition-opacity`} />

      <div>
        {/* Card Header: Category Badge & Bookmark */}
        <div className="flex items-center justify-between mb-3 relative z-10">
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-mono-sm tracking-wide ${meta.border} ${meta.text} ${meta.bg}`}>
            <span className="material-symbols-outlined text-[14px]">{meta.icon}</span>
            {meta.label}
          </span>

          <button
            onClick={handleBookmark}
            className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
              isBookmarked
                ? 'bg-secondary/20 text-secondary border-secondary/40 shadow-sm'
                : 'text-on-surface-variant hover:text-on-surface hover:bg-white/[0.06] border-transparent'
            }`}
            title={isBookmarked ? 'Remove bookmark' : 'Bookmark opportunity'}
            aria-label="Bookmark"
          >
            <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: isBookmarked ? "'FILL' 1" : "'FILL' 0" }}>
              {isBookmarked ? 'bookmark' : 'bookmark_border'}
            </span>
          </button>
        </div>

        {/* Title & Host */}
        <h3 className="font-headline-lg text-base md:text-lg text-on-surface mb-1.5 line-clamp-2 group-hover:text-primary transition-colors">
          {opportunity.title}
        </h3>

        <div className="flex items-center gap-1.5 text-xs font-mono-sm text-on-surface-variant mb-3">
          <span className="material-symbols-outlined text-[16px] text-primary">apartment</span>
          <span className="truncate max-w-[240px] font-medium">{organizationName}</span>
        </div>

        {/* Description snippet if available */}
        {opportunity.description && (
          <p className="font-body-md text-xs text-on-surface-variant/80 mb-4 line-clamp-2 leading-relaxed">
            {opportunity.description}
          </p>
        )}

        {/* Tags */}
        {Array.isArray(opportunity.tags) && opportunity.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-5">
            {opportunity.tags.slice(0, 4).map((tag, idx) => (
              <span
                key={idx}
                className="px-2 py-0.5 rounded bg-surface-container-high/80 border border-white/[0.06] text-[11px] font-mono-sm text-on-surface-variant"
              >
                #{tag}
              </span>
            ))}
            {opportunity.tags.length > 4 && (
              <span className="px-1.5 py-0.5 rounded bg-surface-container-high/40 text-[10px] font-mono-sm text-on-surface-variant/70">
                +{opportunity.tags.length - 4}
              </span>
            )}
          </div>
        )}
      </div>

      {error && <span className="text-error text-xs mb-2">{error}</span>}

      {/* Footer: Countdown / Deadline & Action Button */}
      <div className="flex items-center justify-between pt-4 border-t border-white/[0.08] relative z-10 mt-2">
        <div className="flex items-center gap-1.5 text-secondary" title="Application Deadline">
          <span className="material-symbols-outlined text-[17px]">schedule</span>
          <span className="font-mono-sm text-xs font-medium tracking-tight">
            {opportunity.deadline || 'Rolling'}
          </span>
        </div>

        <button
          onClick={handleApply}
          disabled={status === 'applied'}
          className={`h-8 rounded-lg flex items-center justify-center gap-1.5 px-4 font-button-text text-xs transition-all ${
            status === 'applied'
              ? 'bg-surface-variant text-on-surface-variant cursor-not-allowed border border-white/[0.08]'
              : 'bg-primary text-on-primary hover:opacity-90 hover:shadow-md cursor-pointer font-medium'
          }`}
        >
          {status === 'loading' ? (
            <span className="material-symbols-outlined text-[16px] animate-spin">refresh</span>
          ) : status === 'applied' ? (
            <>
              <span className="material-symbols-outlined text-[16px]">check</span>
              Applied
            </>
          ) : (
            <>
              <span>Apply</span>
              <span className="material-symbols-outlined text-[14px]">arrow_outward</span>
            </>
          )}
        </button>
      </div>
    </motion.div>
  );
}
