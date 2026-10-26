import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { api } from '../services/api';

export default function TeamCard({ team, currentUser, onDelete }) {
  const [requestStatus, setRequestStatus] = useState('idle'); // 'idle' | 'loading' | 'requested' | 'error'

  const currentUserId = currentUser?.id || currentUser?._id;
  const isOwner = Boolean(
    currentUser && (
      (team.authorId && currentUserId && String(team.authorId) === String(currentUserId)) ||
      (team.authorName && currentUser.name && team.authorName.trim().toLowerCase() === currentUser.name.trim().toLowerCase())
    )
  );

  const isMember = Boolean(
    isOwner ||
    (currentUser && currentUserId && team.members && team.members.some(m => String(m) === String(currentUserId)))
  );

  const isFilled = team.status === 'filled' || (team.memberCount >= (team.maxMembers || 4));

  const handleRequest = async () => {
    if (isOwner || isMember || isFilled) return;
    setRequestStatus('loading');
    try {
      await api.requestToJoinTeam(team.id || team._id);
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
          {isOwner && onDelete ? (
            <button 
              onClick={() => onDelete(team.id || team._id)}
              className="text-on-surface-variant hover:text-error transition-colors p-1 rounded hover:bg-error/10"
              title="Delete Listing"
            >
              <span className="material-symbols-outlined text-[18px]">delete</span>
            </button>
          ) : (
            <button className="text-on-surface-variant hover:text-on-surface transition-colors">
              <span className="material-symbols-outlined text-[20px]">more_horiz</span>
            </button>
          )}
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
      
      <div className="pt-4 mt-4 border-t border-white/[0.08] flex flex-row flex-wrap items-center justify-between gap-3 w-full">
        <div className="flex flex-row items-center gap-3 min-w-0">
          {team.authorAvatar ? (
            <img className="w-8 h-8 rounded-full object-cover border border-white/10 shrink-0" src={team.authorAvatar.startsWith('/uploads') ? `${import.meta.env.VITE_BACKEND_URL}${team.authorAvatar}` : team.authorAvatar} alt={team.authorName} />
          ) : (
            <div className="w-8 h-8 rounded-full bg-surface-variant border border-white/10 flex items-center justify-center shrink-0">
              <span className="font-mono-label text-mono-label text-on-surface">{team.authorName ? team.authorName.charAt(0) : '?'}</span>
            </div>
          )}
          <div className="flex flex-col min-w-0">
            <p className="font-mono-label text-mono-label text-on-surface truncate">{team.authorName}</p>
            <p className="font-mono-sm text-mono-sm text-on-surface-variant flex items-center gap-1.5 truncate">
              <span className="truncate">{team.memberCount || 1}/{team.maxMembers || 4} members</span>
              {isFilled && (
                <span className="px-1.5 py-0.2 rounded text-[10px] bg-error-container/20 text-error shrink-0">
                  Full
                </span>
              )}
            </p>
          </div>
        </div>
        
        <div className="flex flex-row items-center gap-2 shrink-0">
          {team.channelId && (isOwner || isMember) && (
            <Link
              to={`/dashboard/channels/${team.channelId}`}
              className="px-3 py-1.5 font-button-text text-xs rounded-md bg-primary/20 text-primary border border-primary/30 hover:bg-primary/30 transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
              title="Open Community Channel"
            >
              <span className="material-symbols-outlined text-[15px]">forum</span>
              Channel
            </Link>
          )}

          {isOwner ? (
            <span className="px-2.5 py-1.5 font-mono-sm text-xs rounded-md bg-primary-fixed-dim/15 border border-primary-fixed-dim/30 text-primary-fixed-dim flex items-center gap-1">
              <span className="material-symbols-outlined text-[13px]">person</span>
              Yours
            </span>
          ) : isMember ? (
            <span className="px-2.5 py-1.5 font-mono-sm text-xs rounded-md bg-secondary-container/20 border border-secondary-container/30 text-secondary flex items-center gap-1">
              <span className="material-symbols-outlined text-[13px]">check</span>
              Joined
            </span>
          ) : isFilled ? (
            <span className="px-3 py-1.5 font-mono-sm text-xs rounded-md bg-surface-variant text-on-surface-variant/60 border border-white/5 cursor-not-allowed">
              Filled
            </span>
          ) : (
            <button 
              onClick={handleRequest}
              disabled={requestStatus !== 'idle'}
              className={`px-3 py-1.5 font-button-text text-xs rounded-md transition-all flex items-center gap-1.5 ${
                requestStatus === 'requested' 
                  ? 'bg-surface-variant text-on-background/50 border border-transparent cursor-not-allowed'
                  : 'border border-primary-fixed-dim text-primary-fixed-dim hover:bg-primary-fixed-dim/10'
              }`}
            >
              {requestStatus === 'loading' ? (
                <span className="material-symbols-outlined text-[14px] animate-spin">refresh</span>
              ) : requestStatus === 'requested' ? (
                <>
                  <span className="material-symbols-outlined text-[14px]">check</span>
                  Requested
                </>
              ) : (
                'Join Team'
              )}
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
