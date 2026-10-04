import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { api } from '../services/api';

export default function MentorCard({ mentor }) {
  const [status, setStatus] = useState('idle'); // idle | loading | requested | error
  const [error, setError] = useState(null);

  const handleConnect = async () => {
    setStatus('loading');
    setError(null);
    try {
      await api.requestMentorship(mentor.id);
      setStatus('requested');
    } catch (err) {
      console.error(err);
      setStatus('error');
      setError('Failed to connect. Try again.');
    }
  };

  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0 }
      }}
      whileHover={{ scale: 1.02 }}
      className="bg-surface-container rounded-xl p-[24px] border border-white/[0.08] hover:border-white/[0.2] hover:shadow-[0_0_15px_rgba(72,255,213,0.1)] transition-all flex flex-col md:flex-row gap-6 relative"
    >
      <div className="flex flex-col items-center gap-2 md:border-r border-white/[0.08] md:pr-6 md:w-32 shrink-0">
        <div className="w-16 h-16 rounded-full bg-surface-variant overflow-hidden border border-white/[0.08]">
          {mentor.avatar ? (
            <img src={mentor.avatar} alt={mentor.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-on-surface text-xl bg-surface-container-highest">
              {mentor.name.charAt(0)}
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-1 mt-2">
          <span className="material-symbols-outlined text-primary text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
          <span className="font-mono-sm text-mono-sm text-primary uppercase text-[10px] text-center">{mentor.role}</span>
        </div>
      </div>
      
      <div className="flex-grow flex flex-col">
        <div className="flex items-start justify-between flex-wrap gap-2 mb-2">
          <div>
            <h3 className="font-headline-lg text-headline-lg-mobile text-on-surface">{mentor.name}</h3>
            <div className="flex gap-2 mt-2 flex-wrap">
              {mentor.expertise.map((exp, idx) => (
                <span key={idx} className="px-2 py-0.5 rounded-full border border-primary text-primary font-mono-sm text-mono-sm text-[10px]">
                  {exp}
                </span>
              ))}
            </div>
          </div>
          
          <div className="flex flex-col items-end">
            <button 
              onClick={handleConnect}
              disabled={status !== 'idle'}
              className={`px-4 py-1.5 font-button-text text-button-text rounded-md transition-all flex items-center gap-2 ${
                status === 'requested' 
                  ? 'bg-surface-variant text-on-background/50 border border-transparent cursor-not-allowed'
                  : 'border border-primary-fixed-dim text-primary-fixed-dim hover:bg-primary-fixed-dim/10'
              }`}
            >
              {status === 'loading' ? (
                <span className="material-symbols-outlined text-[16px] animate-spin">refresh</span>
              ) : status === 'requested' ? (
                <>
                  <span className="material-symbols-outlined text-[16px]">check</span>
                  Requested
                </>
              ) : (
                'Connect'
              )}
            </button>
            {error && <span className="text-error text-[10px] mt-1">{error}</span>}
          </div>
        </div>
        
        <p className="font-body-md text-body-md text-on-surface-variant mt-4 line-clamp-3">
          {mentor.bio}
        </p>
      </div>
    </motion.div>
  );
}
