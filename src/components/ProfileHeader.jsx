import React from 'react';

export default function ProfileHeader({ user, onEditClick }) {
  return (
    <section className="w-full flex flex-col md:flex-row items-center md:items-start gap-8 mb-[48px]">
      <div className="relative w-32 h-32 rounded-xl flex-shrink-0 bg-surface-container overflow-hidden">
        {user.avatar ? (
          <img className="w-full h-full object-cover" src={user.avatar} alt={user.name} />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-surface-container-high text-on-surface text-4xl">
            {user.name?.charAt(0) || 'U'}
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent"></div>
      </div>
      
      <div className="flex flex-col flex-grow pt-2 items-center md:items-stretch w-full text-center md:text-left">
        <div className="flex flex-col md:flex-row items-center justify-between w-full mb-[16px] gap-4">
          <div className="flex flex-col md:flex-row items-center gap-4">
            <h1 className="font-display text-display text-on-background tracking-tighter">{user.name}</h1>
            {user.isMentor && (
              <div className="px-3 py-1 rounded-full bg-primary-container/20 text-on-primary-container font-mono-sm text-mono-sm uppercase border border-primary-container/30 flex items-center gap-2">
                <span className="material-symbols-outlined text-[14px]">star</span>
                Mentor
              </div>
            )}
          </div>
          <button 
            onClick={onEditClick}
            className="bg-surface-variant hover:bg-surface-container-high text-on-surface font-button-text text-button-text px-6 py-2.5 rounded-lg transition-transform hover:scale-[1.02] active:scale-[0.98] duration-150 flex items-center gap-2 border border-white/[0.08]"
          >
            <span className="material-symbols-outlined text-[18px]">edit</span>
            Edit Profile
          </button>
        </div>
        
        <div className="flex flex-row flex-wrap items-center justify-center md:justify-start gap-6 mb-[24px] text-on-surface-variant font-mono-sm text-mono-sm uppercase tracking-wider">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[16px] text-primary">school</span>
            {user.batch || "Class of '25"}
          </div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[16px] text-primary">verified</span>
            {user.email}
          </div>
          {user.isMentor && (
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
              Available for Mentorship
            </div>
          )}
        </div>
        
        <div className="flex flex-row flex-wrap justify-center md:justify-start gap-3">
          {user.skills?.map((skill, index) => {
            const colors = ['primary', 'secondary', 'tertiary-fixed-dim', 'outline-variant'];
            const colorClass = colors[index % colors.length];
            return (
              <span key={index} className={`px-3 py-1.5 rounded-full border border-${colorClass} text-${colorClass === 'outline-variant' ? 'on-surface-variant' : colorClass} font-mono-sm text-mono-sm`}>
                {skill}
              </span>
            );
          })}
        </div>
      </div>
    </section>
  );
}
