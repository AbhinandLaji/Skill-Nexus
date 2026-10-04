import React from 'react';

export default function TeammateWidget({ matches }) {
  // `matches` are a list of dummy users/teams looking for teammates
  
  return (
    <div className="bg-surface-container rounded-lg border border-white/[0.08] p-5 relative overflow-hidden group hover:border-white/[0.15] transition-colors">
      <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-secondary via-primary to-transparent opacity-50"></div>
      
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-mono-label text-on-surface uppercase tracking-wider flex items-center gap-2">
          <span className="material-symbols-outlined text-[16px] text-secondary">group_add</span>
          LFG Radar
        </h3>
        <div className="w-2 h-2 rounded-full bg-secondary animate-pulse"></div>
      </div>
      
      <p className="font-mono-sm text-on-surface-variant/70 mb-4 border-b border-white/[0.08] pb-3">
        Users actively seeking collaborators based on your skill graph.
      </p>
      
      <div className="flex flex-col gap-3">
        {matches.map((match, i) => (
          <div key={i} className="flex items-center justify-between p-2 rounded-sm hover:bg-surface-variant/50 transition-colors cursor-pointer border border-transparent hover:border-white/[0.04]">
            <div className="flex items-center gap-3">
              <div className="relative">
                {match.avatar ? (
                  <img src={match.avatar} alt={match.name} className="w-8 h-8 rounded-sm object-cover border border-white/[0.1]" />
                ) : (
                  <div className="w-8 h-8 rounded-sm bg-surface-container-highest border border-white/[0.1] flex items-center justify-center">
                    <span className="font-mono-sm text-on-surface-variant">{match.name.charAt(0)}</span>
                  </div>
                )}
                <div 
                  className="absolute -bottom-1 -right-1 w-2.5 h-2.5 rounded-full border border-background"
                  style={{ backgroundColor: match.colorAccent || '#B4F461' }}
                ></div>
              </div>
              <div className="flex flex-col">
                <span className="font-button-text text-on-surface text-sm">{match.name}</span>
                <span className="font-mono-sm text-on-surface-variant/60 text-[10px]">Need: {match.needs}</span>
              </div>
            </div>
            <button className="w-6 h-6 rounded-sm bg-surface-container-high hover:bg-primary hover:text-background flex items-center justify-center transition-colors border border-white/[0.08]">
              <span className="material-symbols-outlined text-[14px]">add</span>
            </button>
          </div>
        ))}
      </div>
      
      <button className="w-full mt-4 py-2 border border-outline-variant/50 rounded-sm font-mono-sm text-on-surface-variant hover:text-primary hover:border-primary/50 transition-all text-center">
        View Full Radar
      </button>
    </div>
  );
}
