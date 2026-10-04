import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { api } from '../services/api';

export default function OpportunityCard({ opportunity }) {
  const [status, setStatus] = useState('idle'); // idle | loading | applied | error
  const [error, setError] = useState(null);

  const handleApply = async () => {
    setStatus('loading');
    setError(null);
    try {
      await api.registerForOpportunity(opportunity.id);
      setStatus('applied');
    } catch (err) {
      console.error(err);
      setStatus('error');
      setError('Failed to apply. Try again.');
    }
  };

  const getTypeStyle = (type) => {
    switch (type) {
      case 'INTERNSHIP': return 'border-primary text-primary bg-primary/5 group-hover:bg-primary/10';
      case 'HACKATHON': return 'border-[#a855f7] text-[#a855f7] bg-[#a855f7]/5 group-hover:bg-[#a855f7]/10';
      case 'EVENT': return 'border-[#3b82f6] text-[#3b82f6] bg-[#3b82f6]/5 group-hover:bg-[#3b82f6]/10';
      default: return 'border-outline-variant text-on-surface-variant bg-surface-variant/5';
    }
  };

  const typeStyle = getTypeStyle(opportunity.type);
  const colorMatch = typeStyle.match(/bg-\[?(#[a-f0-9]+|primary)/i);
  const bgClass = colorMatch ? `bg-[${colorMatch[1]}]/5 group-hover:bg-[${colorMatch[1]}]/10` : 'bg-primary/5';
  
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0 }
      }}
      whileHover={{ scale: 1.02 }}
      className="group bg-surface-container rounded-xl p-[24px] border border-white/[0.08] hover:-translate-y-1 hover:border-white/[0.2] hover:shadow-[0_0_15px_rgba(72,255,213,0.1)] transition-all duration-300 relative overflow-hidden flex flex-col h-full"
    >
      <div className={`absolute top-0 right-0 w-32 h-32 rounded-bl-full -z-10 transition-colors ${
        opportunity.type === 'INTERNSHIP' ? 'bg-primary/5 group-hover:bg-primary/10' :
        opportunity.type === 'HACKATHON' ? 'bg-[#a855f7]/5 group-hover:bg-[#a855f7]/10' :
        'bg-[#3b82f6]/5 group-hover:bg-[#3b82f6]/10'
      }`}></div>
      
      <div className="flex items-start justify-between mb-4">
        <span className={`inline-flex items-center px-2 py-1 rounded-full border font-mono-sm text-mono-sm ${
          opportunity.type === 'INTERNSHIP' ? 'border-primary text-primary' :
          opportunity.type === 'HACKATHON' ? 'border-[#a855f7] text-[#a855f7]' :
          'border-[#3b82f6] text-[#3b82f6]'
        }`}>
          {opportunity.type}
        </span>
        <button className="text-on-surface-variant hover:text-primary transition-colors">
          <span className="material-symbols-outlined">bookmark_add</span>
        </button>
      </div>
      
      <h3 className="font-headline-lg text-headline-lg-mobile text-on-surface mb-2 line-clamp-2">{opportunity.title}</h3>
      <p className="font-body-md text-body-md text-on-surface-variant mb-6 flex-grow">{opportunity.company}</p>
      
      {error && <span className="text-error text-xs mb-2">{error}</span>}

      <div className="flex items-center justify-between pt-4 border-t border-white/[0.08]">
        <div className="flex items-center gap-2 text-secondary">
          <span className="material-symbols-outlined text-[18px]">{opportunity.icon}</span>
          <span className="font-mono-label text-mono-label">{opportunity.deadline}</span>
        </div>
        
        <button 
          onClick={handleApply}
          disabled={status !== 'idle'}
          className={`h-8 rounded-full flex items-center justify-center transition-all px-4 font-mono-sm ${
            status === 'applied' 
              ? 'bg-surface-variant text-on-surface-variant cursor-not-allowed border border-transparent'
              : 'bg-primary text-on-primary hover:scale-105 cursor-pointer'
          }`}
        >
          {status === 'loading' ? (
            <span className="material-symbols-outlined text-[18px] animate-spin">refresh</span>
          ) : status === 'applied' ? (
            'Applied'
          ) : (
            'Apply'
          )}
        </button>
      </div>
    </motion.div>
  );
}
