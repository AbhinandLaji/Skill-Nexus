import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { api } from '../services/api';

export default function TeamCard({ team }) {
  const [requestStatus, setRequestStatus] = useState('idle'); // 'idle' | 'loading' | 'requested' | 'error'

  const handleRequest = async () => {
    setRequestStatus('loading');
    try {
      await api.requestToJoinTeam(team.id);
      setRequestStatus('requested');
    } catch (err) {
      console.error("Failed to request to join team", err);
      setRequestStatus('error');
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      className="bg-surface-container rounded-xl p-[24px] border border-white/[0.08] hover:border-white/20 transition-all flex flex-col justify-between h-full group"
    >
      <div>
        <div className="flex justify-between items-start mb-4">
          <span 
            className={`inline-flex items-center gap-1.5 px-2 py-1 font-mono-sm text-mono-sm rounded border ${
              team.projectType === 'Hackathon' ? 'bg-error-container/20 text-error border-error-container/30' :
              team.projectType === 'Long-term' ? 'bg-secondary-container/20 text-secondary border-secondary-container/30' :
              'bg-surface-variant text-on-surface-variant border-white/10'
            }`}
          >
            <span className="material-symbols-outlined text-[14px]">
              {team.projectType === 'Hackathon' ? 'timer' : team.projectType === 'Long-term' ? 'calendar_month' : 'menu_book'}
            </span>
            {team.projectType}
          </span>
          <button className="text-on-surface-variant hover:text-on-surface transition-colors">
            <span className="material-symbols-outlined text-[20px]">more_horiz</span>
          </button>
        </div>
        
        <h2 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface mb-2 line-clamp-1">{team.title}</h2>
        <p className="font-body-md text-body-md text-on-surface-variant mb-6 line-clamp-2">{team.description}</p>
        
        <div className="flex flex-wrap gap-2 mb-6">
          {team.requiredSkills.map((skill, index) => (
            <span 
              key={index}
              className={`px-2 py-1 rounded-full font-mono-sm text-mono-sm border ${
                skill.match 
                  ? 'border-primary-fixed-dim text-primary-fixed-dim' 
                  : 'border-outline-variant text-on-surface-variant'
              }`}
            >
              {skill.name}
            </span>
          ))}
        </div>
      </div>
      
      <div className="pt-4 border-t border-white/[0.08] flex items-center justify-between">
        <div className="flex items-center gap-3">
          {team.authorAvatar ? (
            <img className="w-8 h-8 rounded-full object-cover border border-white/10" src={team.authorAvatar} alt={team.authorName} />
          ) : (
            <div className="w-8 h-8 rounded-full bg-surface-variant border border-white/10 flex items-center justify-center">
              <span className="font-mono-label text-mono-label text-on-surface">{team.authorName.charAt(0)}</span>
            </div>
          )}
          <div>
            <p className="font-mono-label text-mono-label text-on-surface">{team.authorName}</p>
            <p className="font-mono-sm text-mono-sm text-on-surface-variant">Looking for {team.lookingForCount}</p>
          </div>
        </div>
        
        <button 
          onClick={handleRequest}
          disabled={requestStatus !== 'idle'}
          className={`px-4 py-2 font-button-text text-button-text rounded-md transition-all flex items-center gap-2 ${
            requestStatus === 'requested' 
              ? 'bg-surface-variant text-on-background/50 border border-transparent cursor-not-allowed'
              : 'border border-primary-fixed-dim text-primary-fixed-dim hover:bg-primary-fixed-dim/10'
          }`}
        >
          {requestStatus === 'loading' ? (
            <span className="material-symbols-outlined text-[16px] animate-spin">refresh</span>
          ) : requestStatus === 'requested' ? (
            <>
              <span className="material-symbols-outlined text-[16px]">check</span>
              Requested
            </>
          ) : (
            'Join Team'
          )}
        </button>
      </div>
    </motion.div>
  );
}
